import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { createPlayback } from "./playback.js";
import { highlightMuscles, muscleLegend, polishSurface } from "./highlight.js";

const STYLE_ID = "exercise-viewer-style";
const CLEAR = 0x10141c;
const MAX_PIXEL_RATIO = 1.75;

function ensureStyle() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = [
    ".exercise-viewer{display:flex;flex-direction:column;width:100%;min-height:360px;height:100%;background:#10141c;border-radius:22px;overflow:hidden;color:#e8eef5;font:14px/1.4 ui-rounded,'Avenir Next','Segoe UI',system-ui,sans-serif}",
    ".ev-stage{position:relative;flex:1;min-height:280px;touch-action:none}",
    ".ev-stage canvas{position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none}",
    ".ev-status{position:absolute;left:12px;right:12px;top:12px;margin:0;font-size:13px;font-weight:700;color:#d5dbe6}",
    ".ev-cue{margin:0;padding:10px 16px 2px;text-align:center;font-size:14px;font-weight:700;color:#e8eef5}",
    ".ev-legend{display:flex;flex-wrap:wrap;gap:6px 16px;justify-content:center;padding:8px 14px 0;color:#d5dbe6;font-size:12px;font-weight:700}",
    ".ev-legend span{display:inline-flex;align-items:center}",
    ".ev-legend i{width:9px;height:9px;margin-right:6px;border-radius:50%}",
    ".ev-bar{display:flex;gap:8px;padding:10px 12px 0}",
    ".ev-bar button{flex:1;border:0;border-radius:999px;padding:10px 12px;font:inherit;font-weight:800;background:#0e9f8a;color:#fff;cursor:pointer}",
    ".ev-bar button:disabled{opacity:.45;cursor:default}",
    ".ev-note{margin:0;padding:8px 14px 12px;color:#b7c3d1;font-size:12px;font-weight:650}"
  ].join("");
  document.head.appendChild(style);
}

function disposeMaterial(material, textures) {
  const list = Array.isArray(material) ? material : [material];
  list.forEach(function (entry) {
    if (!entry) return;
    Object.keys(entry).forEach(function (key) {
      const value = entry[key];
      if (value && value.isTexture && !textures.has(value)) {
        textures.add(value);
        value.dispose();
      }
    });
    entry.dispose();
  });
}

function disposeObject(object) {
  const textures = new Set();
  object.traverse(function (node) {
    if (node.geometry) node.geometry.dispose();
    if (node.material) disposeMaterial(node.material, textures);
  });
}

function groundMaterial() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext("2d");
  const gradient = context.createRadialGradient(128, 128, 24, 128, 128, 122);
  gradient.addColorStop(0, "#2c3546");
  gradient.addColorStop(0.68, "#1a2130");
  gradient.addColorStop(1, "#10141c");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 256, 256);
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshStandardMaterial({ map: map, roughness: 1, metalness: 0 });
}

function frameExercise(model, camera, controls, view) {
  const box = new THREE.Box3().setFromObject(model);
  model.position.y -= box.min.y;
  box.setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const span = Math.max(size.x, size.y, size.z, 0.5);
  camera.near = span / 80;
  camera.far = span * 30;
  if (view === "high") camera.position.set(center.x + span * 0.15, center.y + span * 0.95, center.z + span * 0.85);
  else if (view === "three") camera.position.set(center.x + span * 0.95, center.y + span * 0.78, center.z + span * 0.2);
  else if (view === "bench3") {
    camera.position.set(center.x + span * 1.15, center.y + span * 0.42, center.z - span * 0.02);
    controls.target.set(center.x, center.y + span * 0.02, center.z - span * 0.06);
  }
  else if (view === "press3") {
    camera.position.set(center.x + span * 0.72, center.y + span * 0.38, center.z + span * 1.35);
    controls.target.set(center.x, center.y + span * 0.22, center.z + span * 0.02);
  }
  else camera.position.set(center.x + span * 1.2, center.y + span * 0.42, center.z + span * 0.35);
  camera.updateProjectionMatrix();
  if (view !== "bench3" && view !== "press3") controls.target.copy(center);
  controls.minDistance = span * 0.45;
  controls.maxDistance = span * 4.2;
  controls.update();
  return span;
}

function frameCharacter(model, camera, controls) {
  const box = new THREE.Box3().setFromObject(model);
  model.position.y -= box.min.y;
  box.setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const height = Math.max(size.y, 0.5);
  camera.near = height / 80;
  camera.far = height * 20;
  camera.position.set(center.x + height * 0.72, height * 0.62, center.z + height * 1.45);
  camera.updateProjectionMatrix();
  controls.target.set(center.x, height * 0.56, center.z);
  controls.minDistance = height * 0.7;
  controls.maxDistance = height * 4.2;
  controls.update();
  return height;
}

export function mountExerciseViewer(container, options) {
  if (!container) throw new Error("mountExerciseViewer requires a container");
  const settings = options || {};
  if (!settings.modelUrl) throw new Error("mountExerciseViewer requires modelUrl");
  if (!settings.clip) throw new Error("mountExerciseViewer requires clip");

  ensureStyle();
  container.classList.add("exercise-viewer");
  container.replaceChildren();

  const stage = document.createElement("div");
  stage.className = "ev-stage";
  stage.setAttribute("role", "application");
  stage.setAttribute("aria-label", "3D character. Drag to rotate. Pinch or scroll to zoom.");
  const status = document.createElement("p");
  status.className = "ev-status";
  status.textContent = "Loading character…";
  const cue = document.createElement("p");
  cue.className = "ev-cue";
  cue.hidden = true;
  const legend = document.createElement("div");
  legend.className = "ev-legend";
  legend.hidden = true;
  const bar = document.createElement("div");
  bar.className = "ev-bar";
  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.textContent = "Pause";
  toggle.disabled = true;
  const restart = document.createElement("button");
  restart.type = "button";
  restart.textContent = "Restart";
  restart.disabled = true;
  const note = document.createElement("p");
  note.className = "ev-note";
  note.textContent = settings.credit || "";
  bar.append(toggle, restart);
  stage.append(status);
  container.append(stage, cue, legend, bar, note);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(CLEAR);
  const camera = new THREE.PerspectiveCamera(32, 1, 0.05, 50);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(CLEAR, 1);
  stage.appendChild(renderer.domElement);

  const hemi = new THREE.HemisphereLight(0xf4f7fb, 0x241e22, 1.45);
  const key = new THREE.DirectionalLight(0xfff3e6, 3.15);
  key.position.set(1.7, 4.1, 2.5);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.bias = -0.0004;
  const fill = new THREE.DirectionalLight(0xc9d7f2, 0.95);
  fill.position.set(-2.5, 2.5, 1.7);
  const rim = new THREE.DirectionalLight(0xffffff, 1.85);
  rim.position.set(-0.4, 3.1, -3.5);
  scene.add(hemi, key, fill, rim);

  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(1.6, 64),
    groundMaterial()
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = 0;
  ground.receiveShadow = true;
  scene.add(ground);

  const controls = new OrbitControls(camera, stage);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enablePan = false;
  controls.minPolarAngle = 0.25;
  controls.maxPolarAngle = Math.PI / 2 - 0.04;
  controls.target.set(0, 0.9, 0);
  camera.position.set(1.2, 1.15, 2.6);

  let disposed = false;
  let playing = true;
  let playback = null;

  function setPlaying(next) {
    playing = next;
    toggle.textContent = playing ? "Pause" : "Play";
    if (typeof settings.onPlayState === "function") settings.onPlayState(playing);
  }
  let model = null;
  let raf = 0;
  const clock = new THREE.Clock();

  function resize() {
    const width = stage.clientWidth;
    const height = stage.clientHeight;
    if (!width || !height) return;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO));
    renderer.setSize(width, height, false);
  }

  function fail(error) {
    status.hidden = false;
    status.textContent = error && error.message ? error.message : "The character could not be loaded.";
    toggle.disabled = true;
    restart.disabled = true;
  }

  const api = {
    play: function () {
      if (!playback || disposed) return;
      playback.play();
      setPlaying(true);
    },
    pause: function () {
      if (!playback || disposed) return;
      playback.pause();
      setPlaying(false);
    },
    restart: function () {
      if (!playback || disposed) return;
      playback.restart();
      setPlaying(true);
    },
    setClip: function (name) {
      if (!playback || disposed) return "";
      return playback.setClip(name);
    },
    getView: function () {
      return {
        playing: playing,
        time: playback ? playback.mixer.time : 0,
        camera: {
          x: camera.position.x,
          y: camera.position.y,
          z: camera.position.z
        }
      };
    },
    dispose: function () {
      if (disposed) return;
      disposed = true;
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVisibility);
      observer.disconnect();
      controls.dispose();
      if (playback) playback.dispose();
      scene.remove(ground);
      ground.geometry.dispose();
      ground.material.dispose();
      if (model && model.userData.extraGear) {
        model.userData.extraGear.forEach(function (item) {
          if (item.parent) item.parent.remove(item);
          if (item.geometry) item.geometry.dispose();
          if (item.material) item.material.dispose();
        });
      }
      if (model) disposeObject(model);
      hemi.dispose();
      key.dispose();
      fill.dispose();
      rim.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      container.replaceChildren();
      container.classList.remove("exercise-viewer");
    }
  };

  toggle.addEventListener("click", function () {
    if (playing) api.pause();
    else api.play();
  });
  restart.addEventListener("click", function () { api.restart(); });

  const observer = new ResizeObserver(resize);
  observer.observe(stage);
  function onVisibility() {
    if (!document.hidden) clock.getDelta();
  }
  document.addEventListener("visibilitychange", onVisibility);
  resize();

  function frame() {
    if (disposed) return;
    raf = requestAnimationFrame(frame);
    const delta = clock.getDelta();
    if (playing && playback) playback.mixer.update(delta);
    try {
      if (model && model.userData.updateGear) model.userData.updateGear();
    } catch (error) {
      model.userData.updateGear = null;
    }
    try {
      if (model && model.userData.updateMuscles) model.userData.updateMuscles();
    } catch (error) {
      model.userData.updateMuscles = null;
    }
    if (document.hidden) return;
    if (playback && settings.cues && settings.cues.length) {
      const time = playback.time;
      let line = "";
      settings.cues.forEach(function (item) {
        if (time >= item.from) line = item.text;
      });
      if (cue.textContent !== line) cue.textContent = line;
    }
    controls.update();
    renderer.render(scene, camera);
  }
  frame();

  const loader = new GLTFLoader();
  loader.load(settings.modelUrl, function (gltf) {
    if (disposed) {
      disposeObject(gltf.scene);
      return;
    }
    try {
      if (typeof settings.prepare === "function") settings.prepare(gltf);
      playback = createPlayback(gltf.scene, gltf.animations, settings.clip);
    } catch (error) {
      fail(error);
      return;
    }
    model = gltf.scene;
    model.traverse(function (node) {
      if (!node.isMesh) return;
      node.castShadow = true;
      node.receiveShadow = true;
    });
    scene.add(model);
    polishSurface(model);
    if (settings.muscles) {
      highlightMuscles(model, settings.muscles);
      muscleLegend(legend, settings.muscles);
    }
    if (model.userData.demoOrient) {
      const orient = model.userData.demoOrient;
      if (orient.x) model.rotation.x = orient.x;
      if (orient.y) model.rotation.y = orient.y;
      if (orient.z) model.rotation.z = orient.z;
      model.updateMatrixWorld(true);
    }
    if (model.userData.updateGear) model.userData.updateGear();
    const height = model.userData.demoView
      ? frameExercise(model, camera, controls, model.userData.demoView)
      : frameCharacter(model, camera, controls);
    ground.scale.setScalar(Math.max(height * 0.85, 1));
    const shadow = key.shadow.camera;
    const span = height * 1.2;
    shadow.left = -span;
    shadow.right = span;
    shadow.top = span;
    shadow.bottom = -span;
    shadow.near = 0.1;
    shadow.far = height * 8;
    shadow.updateProjectionMatrix();
    status.remove();
    if (settings.cues && settings.cues.length) cue.hidden = false;
    toggle.disabled = false;
    restart.disabled = false;
    if (typeof settings.onReady === "function") {
      settings.onReady({
        clip: playback.clipName,
        clips: gltf.animations.map(function (clip) { return clip.name; })
      });
    }
  }, undefined, function () {
    if (!disposed) fail(new Error("The character file could not be loaded."));
  });

  return api;
}
