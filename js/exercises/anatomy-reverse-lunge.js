import { mk, PI, cos, sin, sqrt, add, mul, ease, ik, TORSO, THIGH, SHIN, FARM, UARM, NECK, HEAD, FOOT, HIPJ, HAND, KNEE, ELB, WRI, ANK } from "../viewer/anatomy-engine.js";

const CYCLE = 8;
const FRONT_Z = 22;
const BACK_Z = -68;
const BACK_REL = 45.5;
const Y_TOP = 88;
const Y_BOT = 55;
const LEAN = 5 * PI / 180;
const MAT = mk(1, 18, [[0, 1.8, 1.8, 40], [1, 1.8, 1.8, 40]], [], null);
const STATE = { tau: 0 };

function lungePhase(t) {
  t = ((t % CYCLE) + CYCLE) % CYCLE;
  const tau = 2 * t / CYCLE;
  STATE.tau = tau;
  const loc = tau % 1;
  const b = sin(PI * loc);
  const p = loc < 0.3 ? 0 : loc < 0.47 ? 1 : loc < 0.56 ? 2 : 3;
  return { u: b * b, p: p };
}

function rearFoot(loc) {
  if (loc < 0.3) {
    const f = loc / 0.3;
    return { z: FRONT_Z + (BACK_Z - FRONT_Z) * ease(f), f: f };
  }
  if (loc < 0.7) return { z: BACK_Z, f: -1 };
  const f = (loc - 0.7) / 0.3;
  return { z: BACK_Z + (FRONT_Z - BACK_Z) * ease(f), f: f };
}

function lungePose() {
  const tau = STATE.tau;
  const rep = Math.floor(tau) % 2;
  const loc = tau - Math.floor(tau);
  const o = [];
  function T(d, from, to, up, col) { o.push({ d: d, A: from, B: to, u: up, col: col || "musc" }); }
  const sg = [1, -1];
  const s0 = sin(PI * loc);
  const sq = s0 * s0;
  const P = [0, Y_TOP - (Y_TOP - Y_BOT) * sq, FRONT_Z - BACK_REL * sq];
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
  o.rear = null;
  for (let i = 0; i < 2; i++) {
    const s = sg[i];
    const isRear = i === (rep === 0 ? 1 : 0);
    let z = FRONT_Z;
    let lift = 0;
    if (isRear) {
      const rf = rearFoot(loc);
      z = rf.z;
      lift = rf.f >= 0 ? 16 * sin(PI * Math.min(1, rf.f)) : 0;
    }
    const rel = z - P[2];
    const w = isRear ? Math.max(0, Math.min(1, (-rel - 10) / 30)) : 0;
    const H = add(P, [s * 9.5, -3, 0]);
    const Ak = [s * 9, 9 + 8 * w + lift, z];
    const r2 = ik(H, Ak, 44, 42, [s * 0.1, -0.2, 1]);
    if (isRear) o.rear = r2.E;
    T(HIPJ, add(H, [0, -8.8, 0]), add(H, [0, 8.8, 0]), [0, 0, 1]);
    T(THIGH, H, r2.E, r2.pole);
    T(SHIN, r2.E, r2.W, r2.pole);
    T(KNEE, add(r2.E, [0, -5.6, 0]), add(r2.E, [0, 5.6, 0]), [0, 0, 1], "tend");
    T(ANK, add(Ak, [0, -3.4, 0]), add(Ak, [0, 3.4, 0]), [0, 0, 1], "tend");
    T(FOOT, add(Ak, [s * 0.5, -5 + 6 * w, -7 + 3 * w]), add(Ak, [s * 1.5, -5 - 8 * w, 17 - 6 * w]), [0, 1, 0], "tend");
  }
  T(MAT, [0, 1.8, -140], [0, 1.8, 110], [0, 1, 0], "pad");
  return o;
}

const PATH = (function () {
  const k = [];
  for (let i = 0; i <= 16; i++) {
    STATE.tau = i / 16;
    k.push(lungePose().rear);
  }
  STATE.tau = 0;
  return [k];
})();

export const REVERSE_LUNGE_ANATOMY = {
  label: "3D reverse lunge demonstration",
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
  phases: ["Step back", "Lower", "Bottom", "Drive"],
  cues: [
    "Stand tall with your feet together and your core tight. Step one foot straight back and land on the ball of your foot while your front foot stays flat.",
    "Lower straight down until both knees are bent to about 90°. Keep your front knee over your ankle and your torso upright.",
    "Pause just above the floor with your back knee hovering. Keep your front heel down and your hips level.",
    "Drive through your whole front foot to stand and bring your back foot in to meet it, then repeat on the other side."
  ],
  muscles: [
    ["quad", "Quads", 0],
    ["glut", "Glutes", 0],
    ["ham", "Hamstrings", 1],
    ["calf", "Calves", 1]
  ],
  yaw: -38,
  pitch: 6,
  view: { tg: [0, 55, -22], span: 240 }
};
