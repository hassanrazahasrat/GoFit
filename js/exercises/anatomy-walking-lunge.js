import { mk, PI, cos, sin, sqrt, add, mul, ease, ik, TORSO, THIGH, SHIN, FARM, UARM, NECK, HEAD, FOOT, HIPJ, HAND, KNEE, ELB, WRI, ANK } from "../viewer/anatomy-engine.js";

const CYCLE = 8;
const STEP = 91;
const Y_TOP = 88;
const Y_BOT = 55;
const LEAN = 4 * PI / 180;
const SWING = 0.75;
const MAT = mk(1, 18, [[0, 1.8, 1.8, 40], [1, 1.8, 1.8, 40]], [], null);
const TICK = mk(1, 8, [[0, 2.2, 2.2, 38], [1, 2.2, 2.2, 38]], [], null);
const STATE = { tau: 0 };

function lungePhase(t) {
  t = ((t % CYCLE) + CYCLE) % CYCLE;
  const tau = 2 * t / CYCLE;
  STATE.tau = tau;
  const loc = tau % 1;
  const b = sin(PI * loc);
  const p = loc < 0.25 ? 0 : loc < 0.45 ? 1 : loc < 0.56 ? 2 : 3;
  return { u: b * b, p: p };
}

function footWorld(tau, k) {
  if (k === 0) {
    if (tau < 0.375) {
      const f = (tau + 0.375) / SWING;
      return { z: -STEP + 2 * STEP * ease(f), f: f };
    }
    if (tau < 1.625) return { z: STEP, f: -1 };
    const f = (tau - 1.625) / SWING;
    return { z: STEP + 2 * STEP * ease(f), f: f };
  }
  if (tau < 0.625) return { z: 0, f: -1 };
  if (tau < 1.375) {
    const f = (tau - 0.625) / SWING;
    return { z: 2 * STEP * ease(f), f: f };
  }
  return { z: 2 * STEP, f: -1 };
}

function lungePose() {
  const tau = STATE.tau;
  const o = [];
  function T(d, from, to, up, col) { o.push({ d: d, A: from, B: to, u: up, col: col || "musc" }); }
  const sg = [1, -1];
  const zh = STEP * tau;
  const s0 = sin(PI * tau);
  const P = [0, Y_TOP - (Y_TOP - Y_BOT) * s0 * s0, 0];
  const a = [0, cos(LEAN), sin(LEAN)];
  const ut = [0, -sin(LEAN), cos(LEAN)];
  const SC = add(P, mul(a, 44));
  T(TORSO, add(P, mul(a, -10)), add(P, mul(a, 50)), ut);
  const hl = LEAN * 0.3;
  const hd = [0, cos(hl), sin(hl)];
  const hu = [0, -sin(hl), cos(hl)];
  const NB = add(P, mul(a, 50));
  T(NECK, add(NB, mul(hd, -2)), add(NB, mul(hd, 7)), ut);
  T(HEAD, add(NB, mul(hd, 5)), add(NB, mul(hd, 25)), hu, "head");
  o.E = [];
  for (let i = 0; i < 2; i++) {
    const s = sg[i];
    const S = add(SC, [s * 22, 0, 0]);
    const W = add(S, [s * 3, -54, 3]);
    const r = ik(S, W, 30, 26, [s * 0.2, 0, -1]);
    o.E[i] = r.E;
    T(UARM, S, r.E, mul(r.pole, -1));
    T(FARM, r.E, r.W, mul(r.pole, -1));
    T(ELB, add(r.E, [0, -4.2, 0]), add(r.E, [0, 4.2, 0]), [0, 0, 1], "tend");
    T(WRI, add(r.W, [-2.6, 0, 0]), add(r.W, [2.6, 0, 0]), [0, 1, 0], "tend");
    T(HAND, add(r.W, [0, -3.9, 0]), add(r.W, [0, 3.9, 0]), [0, 0, 1], "tend");
  }
  for (let i = 0; i < 2; i++) {
    const s = sg[i];
    const fw = footWorld(tau, i);
    const rel = fw.z - zh;
    const w = Math.max(0, Math.min(1, (-rel - 10) / 30));
    const lift = fw.f >= 0 ? 16 * sin(PI * Math.min(1, fw.f)) : 0;
    const H = add(P, [s * 9.5, -3, 0]);
    const Ak = [s * 9, 9 + 8 * w + lift, rel];
    const r2 = ik(H, Ak, 44, 42, [s * 0.1, -0.2, 1]);
    T(HIPJ, add(H, [0, -8.8, 0]), add(H, [0, 8.8, 0]), [0, 0, 1]);
    T(THIGH, H, r2.E, r2.pole);
    T(SHIN, r2.E, r2.W, r2.pole);
    T(KNEE, add(r2.E, [0, -5.6, 0]), add(r2.E, [0, 5.6, 0]), [0, 0, 1], "tend");
    T(ANK, add(Ak, [0, -3.4, 0]), add(Ak, [0, 3.4, 0]), [0, 0, 1], "tend");
    T(FOOT, add(Ak, [s * 0.5, -5 + 6 * w, -7 + 3 * w]), add(Ak, [s * 1.5, -5 - 8 * w, 17 - 6 * w]), [0, 1, 0], "tend");
  }
  T(MAT, [0, 1.8, -200], [0, 1.8, 200], [0, 1, 0], "pad");
  const gap = 45;
  const off = zh % gap;
  for (let k = -5; k <= 5; k++) {
    const z = k * gap - off;
    T(TICK, [0, 2.4, z], [0, 2.4, z + 3], [0, 1, 0], "hub");
  }
  return o;
}

const PATH = (function () {
  const h = [];
  for (let i = 0; i <= 32; i++) {
    const tau = 2 * i / 32;
    const s0 = sin(PI * tau);
    h.push([0, Y_TOP - (Y_TOP - Y_BOT) * s0 * s0 + 44, 0]);
  }
  return [h];
})();

export const WALKING_LUNGE_ANATOMY = {
  label: "3D walking lunge demonstration",
  cycle: CYCLE,
  phase: lungePhase,
  pose: lungePose,
  path: PATH,
  role: { quad: 0, glut: 0, ham: 1, calf: 1 },
  group: {
    quad: ["quad"],
    glut: ["glut"],
    ham: ["ham"],
    calf: ["calf"]
  },
  phases: ["Step", "Lower", "Bottom", "Drive"],
  cues: [
    "Stand tall with your core tight and your chest up. Take a long step forward and land with your whole front foot flat.",
    "Lower straight down until both knees are bent to about 90°. Keep your front knee over your ankle and your torso upright.",
    "Pause just above the floor with your back knee hovering. Keep your front heel down and your hips level.",
    "Drive through your whole front foot to stand up and bring your back leg through into the next step."
  ],
  muscles: [
    ["quad", "Quads", 0],
    ["glut", "Glutes", 0],
    ["ham", "Hamstrings", 1],
    ["calf", "Calves", 1]
  ],
  yaw: -38,
  pitch: 6,
  view: { tg: [0, 58, 0], span: 255 }
};
