import { mk, PI, cos, sin, sqrt, add, sub, mul, ease, ik, TORSO, THIGH, SHIN, FARM, UARM, NECK, HEAD, FOOT, HIPJ, HAND, KNEE, ELB, WRI, ANK, BAR } from "../viewer/anatomy-engine.js";

const CYCLE = 5.4;
const POST = mk(1, 10, [[0, 2.4, 2.4, 2.4], [1, 2.4, 2.4, 2.4]], [], null);
const PULLEY = mk(1, 20, [[0, 7, 7, 7], [1, 7, 7, 7]], [], null);
const CABLE = mk(1, 6, [[0, 0.8, 0.8, 0.8], [1, 0.8, 0.8, 0.8]], [], null);

const LEAN = 10 * PI / 180;
const A = [0, cos(LEAN), sin(LEAN)];
const UT = [0, -sin(LEAN), cos(LEAN)];
const P = [0, 92, -4];
const SC = add(P, mul(A, 44));
const TOWER_X = 104;
const PULLEY_X = 98;
const PULLEY_Y = 182;

function flyPhase(t) {
  t = ((t % CYCLE) + CYCLE) % CYCLE;
  if (t < 0.6) return { u: 0, p: 0 };
  if (t < 2.0) return { u: ease((t - 0.6) / 1.4), p: 1 };
  if (t < 3.0) return { u: 1, p: 2 };
  if (t < 5.4) return { u: 1 - ease((t - 3.0) / 2.4), p: 3 };
  return { u: 0, p: 0 };
}

function unit(v) {
  const l = sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
}

function cross(a, b) {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

function flyPose(u) {
  const o = [];
  function T(d, from, to, up, col) { o.push({ d: d, A: from, B: to, u: up, col: col || "musc" }); }
  const sx = 23 - 0.8 * u;
  const sg = [1, -1];
  const theta = (-5 + 112 * u) * PI / 180;
  const reach = 54 + (47.1 - 54) * u;
  const drop = 7 + 15 * u;
  T(TORSO, add(P, mul(A, -10)), add(P, mul(A, 50)), UT);
  const NB = add(P, mul(A, 50));
  const hd = [0, cos(LEAN * 0.2), sin(LEAN * 0.2)];
  T(NECK, add(NB, mul(hd, -2)), add(NB, mul(hd, 7)), UT);
  T(HEAD, add(NB, mul(hd, 5)), add(NB, mul(hd, 25)), [0, -sin(LEAN * 0.2), cos(LEAN * 0.2)], "head");
  o.grips = [];
  for (let i = 0; i < 2; i++) {
    const s = sg[i];
    const S = add(SC, [s * sx, 0, 0]);
    const target = add(S, [s * reach * cos(theta), -drop, reach * sin(theta)]);
    const r = ik(S, target, 30, 26, [s * 0.8, -1, -0.2]);
    T(UARM, S, r.E, mul(r.pole, -1));
    T(FARM, r.E, r.W, mul(r.pole, -1));
    T(ELB, add(r.E, [0, -4.2, 0]), add(r.E, [0, 4.2, 0]), [0, 0, 1], "tend");
    T(WRI, add(r.W, [0, -3, 0]), add(r.W, [0, 3, 0]), [0, 0, 1], "tend");
    const d = unit(sub(r.W, r.E));
    const grip = add(r.W, mul(d, 5));
    const n = unit(cross(d, [0, 1, 0]));
    T(HAND, r.W, add(r.W, mul(d, 9)), n, "tend");
    T(BAR, add(grip, mul(n, -6)), add(grip, mul(n, 6)), d, "bar");
    T(CABLE, grip, [s * PULLEY_X, PULLEY_Y - 7, -5], [0, 0, 1], "hub");
    o.grips[i] = grip;
  }
  for (let i = 0; i < 2; i++) {
    const s = sg[i];
    T(POST, [s * TOWER_X, 2, -5], [s * TOWER_X, 192, -5], [0, 0, 1], "rig");
    T(POST, [s * TOWER_X, 2, -50], [s * TOWER_X, 2, 44], [1, 0, 0], "rig");
    T(POST, [s * PULLEY_X, PULLEY_Y, -5], [s * TOWER_X, PULLEY_Y, -5], [0, 0, 1], "rig");
    T(PULLEY, [s * PULLEY_X, PULLEY_Y, -8], [s * PULLEY_X, PULLEY_Y, -2], [0, 1, 0], "hub");
  }
  for (let i = 0; i < 2; i++) {
    const s = sg[i];
    const H = add(P, [s * 9.5, -3, 0]);
    const Ak = [s * 11, 9, i === 0 ? 17 : -15];
    const r2 = ik(H, Ak, 44, 42, [s * 0.2, 0, 1]);
    T(HIPJ, add(H, [0, -8.8, 0]), add(H, [0, 8.8, 0]), [0, 0, 1]);
    T(THIGH, H, r2.E, r2.pole);
    T(SHIN, r2.E, r2.W, r2.pole);
    T(KNEE, add(r2.E, [0, -5.6, 0]), add(r2.E, [0, 5.6, 0]), [0, 0, 1], "tend");
    T(ANK, add(Ak, [0, -3.4, 0]), add(Ak, [0, 3.4, 0]), [0, 0, 1], "tend");
    T(FOOT, add(Ak, [s * 0.5, -5, -7]), add(Ak, [s * 1.5, -5, 17]), [0, 1, 0], "tend");
  }
  return o;
}

const PATH = (function () {
  const g0 = [];
  const g1 = [];
  for (let i = 0; i <= 16; i++) {
    const p = flyPose(i / 16);
    g0.push(p.grips[0]);
    g1.push(p.grips[1]);
  }
  return [g0, g1];
})();

export const CABLE_FLY_ANATOMY = {
  label: "3D cable fly demonstration",
  cycle: CYCLE,
  phase: flyPhase,
  pose: flyPose,
  path: PATH,
  role: { pec: 0, adelt: 1, bic: 1, brach: 1 },
  group: {
    pec: ["pec"],
    adelt: ["adelt"],
    bic: ["bic", "brach"]
  },
  phases: ["Set", "Fly", "Squeeze", "Return"],
  cues: [
    "Stand in a split stance with a slight forward lean, chest up and shoulder blades back. Hold the handles out wide with soft elbows and feel your chest stretch.",
    "Sweep your hands in a wide arc toward the middle, as if hugging a tree. Keep the same elbow bend and lead with your chest, not your hands.",
    "Bring the handles together in front of your lower chest and squeeze for a second. Do not shrug or roll your shoulders forward.",
    "Open your arms slowly along the same arc until you feel a stretch across your chest. Keep your elbows soft and your torso still."
  ],
  muscles: [
    ["pec", "Chest", 0],
    ["adelt", "Front delts", 1],
    ["bic", "Biceps", 1]
  ],
  yaw: 38,
  pitch: 10,
  views: { three: 38 },
  view: { tg: [0, 98, 0], span: 272 }
};
