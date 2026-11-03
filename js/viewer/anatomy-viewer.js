import { frame } from "./anatomy-engine.js";

const STYLE_ID = "anatomy-viewer-style";
const VIEWS = { side: 0, three: -38, back: -90, front: 90 };
const VIEW_BUTTONS = [["side", "Side"], ["three", "3/4"], ["back", "Back"], ["front", "Front"]];

function ensureStyle() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = [
    ".anatomy-viewer{display:flex;flex-direction:column;width:100%;background:#10141c;border-radius:22px;overflow:hidden;color:#e8eef5;font:14px/1.4 ui-rounded,'Avenir Next','Segoe UI',system-ui,sans-serif}",
    ".av-stage{position:relative;flex:none;height:clamp(300px,58vh,480px);touch-action:pan-y;cursor:grab}",
    ".av-stage canvas{position:absolute;inset:0;width:100%;height:100%;display:block}",
    ".av-tag{position:absolute;left:12px;top:12px;margin:0;font-size:12px;font-weight:700;color:#9aa3b2;pointer-events:none}",
    ".av-phases{display:flex;gap:6px;padding:10px 12px 0}",
    ".av-phases span{flex:1;display:flex;align-items:center;justify-content:center;gap:6px;padding:7px 4px;border-radius:999px;background:rgba(255,255,255,.07);color:#9aa3b2;font-size:12px;font-weight:800}",
    ".av-phases b{display:inline-grid;place-items:center;width:18px;height:18px;border-radius:50%;background:rgba(255,255,255,.12);font-size:11px}",
    ".av-phases span.on{background:#0e9f8a;color:#fff}",
    ".av-phases span.on b{background:rgba(255,255,255,.28)}",
    ".av-cue{margin:0;padding:10px 16px 2px;min-height:3.4em;text-align:center;font-size:14px;font-weight:700;color:#e8eef5}",
    ".av-row{display:flex;flex-wrap:wrap;gap:6px;padding:8px 12px 0}",
    ".av-row button{flex:1 1 0;min-width:0;border:0;border-radius:999px;padding:9px 8px;font:inherit;font-size:13px;font-weight:800;background:rgba(255,255,255,.09);color:#d5dbe6;cursor:pointer;white-space:nowrap}",
    ".av-row button.on{background:#0e9f8a;color:#fff}",
    ".av-legend{padding:12px 12px 0}",
    ".av-legend h4{margin:0 0 6px;font-size:12px;font-weight:800;color:#d5dbe6}",
    ".av-legend h4 small{font-weight:650;color:#9aa3b2}",
    ".av-chips{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin-bottom:6px}",
    ".av-chips em{flex:none;min-width:58px;font-style:normal;font-size:11px;font-weight:800;color:#9aa3b2}",
    ".av-chips button{display:inline-flex;align-items:center;gap:6px;border:1px solid rgba(255,255,255,.14);border-radius:999px;padding:5px 10px;font:inherit;font-size:12px;font-weight:700;background:transparent;color:#d5dbe6;cursor:pointer}",
    ".av-chips button i{width:9px;height:9px;border-radius:50%}",
    ".av-chips button.r i{background:#e23a32}",
    ".av-chips button.o i{background:#fa963a}",
    ".av-chips button.on{background:rgba(255,255,255,.14);border-color:#e8eef5;color:#fff}",
    ".av-note{margin:0;padding:6px 14px 14px;color:#b7c3d1;font-size:12px;font-weight:650}"
  ].join("");
  document.head.appendChild(style);
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function button(label, onClick) {
  const node = el("button", "", label);
  node.type = "button";
  node.addEventListener("click", onClick);
  return node;
}

function nearestView(views, yaw) {
  let best = "three";
  let gap = 999;
  Object.keys(views).forEach(function (key) {
    const diff = Math.abs((((yaw - views[key]) % 360) + 540) % 360 - 180);
    if (diff < gap) {
      gap = diff;
      best = key;
    }
  });
  return best;
}

export function mountAnatomyViewer(container, settings) {
  ensureStyle();
  const def = settings.anatomy;
  const views = Object.assign({}, VIEWS, def.views);
  const state = {
    t: 0,
    yaw: def.yaw,
    targetYaw: def.yaw,
    pitch: def.pitch,
    play: true,
    slow: false,
    path: true,
    orbit: false,
    focus: null,
    phase: -1
  };

  container.replaceChildren();
  container.classList.add("anatomy-viewer");
  container.style.height = "auto";
  container.style.minHeight = "0";

  const stage = el("div", "av-stage");
  const canvas = el("canvas");
  canvas.setAttribute("role", "img");
  canvas.setAttribute("aria-label", def.label);
  stage.appendChild(canvas);
  stage.appendChild(el("p", "av-tag", "Drag to rotate"));

  const phases = el("div", "av-phases");
  const phaseNodes = def.phases.map(function (name, index) {
    const node = el("span");
    node.appendChild(el("b", "", String(index + 1)));
    node.appendChild(document.createTextNode(name));
    phases.appendChild(node);
    return node;
  });
  const cue = el("p", "av-cue");

  const viewRow = el("div", "av-row");
  const viewButtons = {};
  VIEW_BUTTONS.forEach(function (entry) {
    const node = button(entry[1], function () {
      state.orbit = false;
      state.targetYaw = views[entry[0]];
      sync();
    });
    viewButtons[entry[0]] = node;
    viewRow.appendChild(node);
  });
  const orbitButton = button("Orbit", function () {
    state.orbit = !state.orbit;
    sync();
  });
  viewRow.appendChild(orbitButton);

  const controlRow = el("div", "av-row");
  const playButton = button("Pause", function () {
    if (state.play) api.pause();
    else api.play();
  });
  const restartButton = button("Restart", function () { api.restart(); });
  const slowButton = button("Slow motion", function () {
    state.slow = !state.slow;
    sync();
  });
  const pathButton = button("Hide path", function () {
    state.path = !state.path;
    sync();
  });
  [playButton, restartButton, slowButton, pathButton].forEach(function (node) { controlRow.appendChild(node); });

  const legend = el("div", "av-legend");
  const title = el("h4", "", "Muscles worked ");
  title.appendChild(el("small", "", "(tap one to focus)"));
  legend.appendChild(title);
  const chipButtons = [];
  [["Main", 0, "r"], ["Helping", 1, "o"]].forEach(function (group) {
    const row = el("div", "av-chips");
    row.appendChild(el("em", "", group[0]));
    def.muscles.filter(function (muscle) { return muscle[2] === group[1]; }).forEach(function (muscle) {
      const chip = button("", function () {
        state.focus = state.focus === muscle[0] ? null : muscle[0];
        sync();
      });
      chip.className = group[2];
      chip.appendChild(el("i"));
      chip.appendChild(document.createTextNode(muscle[1]));
      chip.dataset.id = muscle[0];
      chipButtons.push(chip);
      row.appendChild(chip);
    });
    legend.appendChild(row);
  });

  const note = el("p", "av-note", "New to this lift? Start light, move slowly (about 2 s up, 2 s down) and copy the animation.");

  container.appendChild(stage);
  container.appendChild(phases);
  container.appendChild(cue);
  container.appendChild(viewRow);
  container.appendChild(controlRow);
  container.appendChild(legend);
  container.appendChild(note);

  function sync() {
    phaseNodes.forEach(function (node, index) { node.className = index === state.phase ? "on" : ""; });
    if (state.phase >= 0) cue.textContent = def.cues[state.phase];
    const near = nearestView(views, state.targetYaw);
    Object.keys(viewButtons).forEach(function (key) {
      viewButtons[key].className = key === near && !state.orbit ? "on" : "";
    });
    orbitButton.className = state.orbit ? "on" : "";
    playButton.textContent = state.play ? "Pause" : "Play";
    slowButton.textContent = state.slow ? "Normal speed" : "Slow motion";
    slowButton.className = state.slow ? "on" : "";
    pathButton.textContent = state.path ? "Hide path" : "Show path";
    chipButtons.forEach(function (chip) {
      chip.classList.toggle("on", chip.dataset.id === state.focus);
    });
  }

  const context = canvas.getContext("2d");
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  let disposed = false;
  let visible = true;
  let raf = 0;
  let last = 0;
  let skip = false;
  let strain = 0;
  let degraded = false;
  let drag = null;

  function resize() {
    const width = Math.round(stage.clientWidth * dpr);
    const height = Math.round(stage.clientHeight * dpr);
    if (width && height && (canvas.width !== width || canvas.height !== height)) {
      canvas.width = width;
      canvas.height = height;
    }
  }

  function draw() {
    const started = performance.now();
    const data = frame({
      t: state.t,
      yaw: state.yaw,
      pitch: state.pitch,
      W: canvas.width,
      H: canvas.height,
      dark: true,
      focus: state.focus,
      path: state.path
    }, def);
    const pts = data.pts;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.lineJoin = "round";
    context.lineCap = "round";
    for (let i = 0; i < data.under.length; i++) {
      const shape = data.under[i];
      const p = shape.p;
      context.fillStyle = shape.c;
      context.beginPath();
      context.moveTo(p[0], p[1]);
      for (let j = 2; j < p.length; j += 2) context.lineTo(p[j], p[j + 1]);
      context.closePath();
      context.fill();
    }
    for (let i = 0; i < data.n; i++) {
      const q = data.ord[i];
      const offset = data.off[q];
      const count = data.cnt[q];
      context.beginPath();
      context.moveTo(pts[offset], pts[offset + 1]);
      for (let j = 1; j < count; j++) context.lineTo(pts[offset + j * 2], pts[offset + j * 2 + 1]);
      if (data.kind[q]) {
        context.lineWidth = dpr * data.lw[q];
        context.strokeStyle = data.col[q];
        context.stroke();
      } else {
        context.fillStyle = data.col[q];
        context.fill();
      }
    }
    if (performance.now() - started > 20) {
      strain += 1;
      if (strain > 8) degraded = true;
    } else {
      strain = 0;
    }
    if (data.phase !== state.phase) {
      state.phase = data.phase;
      sync();
    }
  }

  function loop(now) {
    if (disposed) return;
    raf = requestAnimationFrame(loop);
    if (document.hidden || !visible) {
      last = now;
      return;
    }
    if (last && now - last < 30) return;
    const dt = last ? Math.min(0.1, (now - last) / 1000) : 0;
    last = now;
    if (degraded) {
      skip = !skip;
      if (skip) return;
    }
    const pace = degraded ? 2 : 1;
    if (state.play) state.t += dt * (state.slow ? 0.5 : 1) * pace;
    if (state.orbit) state.targetYaw += 24 * dt * pace;
    const diff = (((state.targetYaw - state.yaw) % 360) + 540) % 360 - 180;
    state.yaw += diff * Math.min(1, dt * (degraded ? 14 : 7));
    resize();
    if (canvas.width && canvas.height) draw();
  }

  function onDown(event) {
    drag = { x: event.clientX, y: event.clientY };
    state.orbit = false;
    try { stage.setPointerCapture(event.pointerId); } catch (error) { return; }
    sync();
  }

  function onMove(event) {
    if (!drag) return;
    state.targetYaw += (event.clientX - drag.x) * 0.45;
    state.yaw = state.targetYaw;
    state.pitch = Math.max(-4, Math.min(40, state.pitch + (event.clientY - drag.y) * 0.2));
    drag.x = event.clientX;
    drag.y = event.clientY;
    sync();
  }

  function onUp() { drag = null; }

  stage.addEventListener("pointerdown", onDown);
  stage.addEventListener("pointermove", onMove);
  stage.addEventListener("pointerup", onUp);
  stage.addEventListener("pointercancel", onUp);

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(stage);
  const visibilityObserver = new IntersectionObserver(function (entries) {
    visible = entries[entries.length - 1].isIntersecting;
  });
  visibilityObserver.observe(stage);

  const api = {
    play: function () {
      if (disposed) return;
      state.play = true;
      sync();
    },
    pause: function () {
      if (disposed) return;
      state.play = false;
      sync();
    },
    restart: function () {
      if (disposed) return;
      state.t = 0;
      state.play = true;
      sync();
    },
    getView: function () {
      return { playing: state.play, time: state.t, yaw: state.yaw, pitch: state.pitch, focus: state.focus };
    },
    dispose: function () {
      if (disposed) return;
      disposed = true;
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      container.replaceChildren();
      container.classList.remove("anatomy-viewer");
      container.style.height = "";
      container.style.minHeight = "";
    }
  };

  if (!context) {
    container.replaceChildren(el("p", "av-note", "This device cannot draw the 3D demo."));
    return api;
  }

  sync();
  resize();
  raf = requestAnimationFrame(loop);
  return api;
}
