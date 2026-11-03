import { mk, cos, sin, sqrt, add, mul, ease, ik, TORSO, THIGH, SHIN, FARM, UARM, NECK, HEAD, FOOT, HIPJ, HAND, KNEE, ELB, WRI, ANK, BAR } from "../viewer/anatomy-engine.js";

const CYCLE = 5.8;
const P = [0, 94.5, 0];
const A = [0, 1, 0];
const UT = [0, 0, 1];
const SC = add(P, [0, 44, 0]);
const GRIP_X = 5;
const MAT = mk(1, 18, [[0, 1.8, 1.8, 40], [1, 1.8, 1.8, 40]], [], null);
const DB_HEAD = mk(1, 14, [[0, 6.5, 6.5, 6.5], [1, 6.5, 6.5, 6.5]], [], null);

function extPhase(t) {
  t = ((t % CYCLE) + CYCLE) % CYCLE;
  if (t < 0.6) return { u: 0, p: 0 };
  if (t < 2.2) return { u: ease((t - 0.6) / 1.6), p: 1 };
  if (t < 3.1) return { u: 1, p: 2 };
  if (t < 5.3) return { u: 1 - ease((t - 3.1) / 2.2), p: 3 };
  return { u: 0, p: 0 };
}

function extPose(u) {
  const o = [];
  function T(d, from, to, up, col) { o.push({ d: d, A: from, B: to, u: up, col: col || "musc" }); }
  const sg = [1, -1];
  T(TORSO, add(P, mul(A, -10)), add(P, mul(A, 50)), UT);
  const NB = add(P, mul(A, 50));
  T(NECK, add(NB, mul(A, -2)), add(NB, mul(A, 7)), UT);
  T(HEAD, add(NB, mul(A, 5)), add(NB, mul(A, 25)), UT, "head");
  const ang = 1.57 + 1.73 * u;
  const fy0 = sin(ang);
  const fz0 = cos(ang);
  o.E = [];
  o.grips = [];
  for (let i = 0; i < 2; i++) {
    const s = sg[i];
    const S = add(SC, [s * 22, 0, 0]);
    const ex = 15 - 2 * u;
    const E = [s * ex, SC[1] + 28.2 + 0.4 * u, SC[2] - 1.5];
    const fx = -s * (ex - GRIP_X) / 26;
    const k = sqrt(1 - fx * fx);
    const f = [fx, k * fy0, k * fz0];
    const W = add(E, mul(f, 26));
    o.E[i] = E;
    o.grips[i] = W;
    T(UARM, S, E, [0, 0, 1]);
    T(FARM, E, W, [0, 0, 1]);
    T(ELB, add(E, [0, 0, -4.2]), add(E, [0, 0, 4.2]), [0, 1, 0], "tend");
    T(WRI, add(W, [-2.6, 0, 0]), add(W, [2.6, 0, 0]), [0, 1, 0], "tend");
    T(HAND, add(W, [-3.9, 0, 0]), add(W, [3.9, 0, 0]), [0, 1, 0], "tend");
  }
  const G = [0, (o.grips[0][1] + o.grips[1][1]) / 2, (o.grips[0][2] + o.grips[1][2]) / 2];
  const up = [0, 1, 0];
  T(BAR, add(G, mul(up, -8)), add(G, mul(up, 3.5)), [1, 0, 0], "bar");
  T(DB_HEAD, add(G, mul(up, 3.5)), add(G, mul(up, 10)), [1, 0, 0], "rig");
  T(DB_HEAD, add(G, mul(up, -14.5)), add(G, mul(up, -8)), [1, 0, 0], "rig");
  for (let i = 0; i < 2; i++) {
    const s = sg[i];
    const H = add(P, [s * 9.5, -3, 0]);
    const Ak = [s * 11, 9, 0];
    const r2 = ik(H, Ak, 44, 42, [0, 0, 1]);
    T(HIPJ, add(H, [0, -8.8, 0]), add(H, [0, 8.8, 0]), [0, 0, 1]);
    T(THIGH, H, r2.E, r2.pole);
    T(SHIN, r2.E, r2.W, r2.pole);
    T(KNEE, add(r2.E, [0, -5.6, 0]), add(r2.E, [0, 5.6, 0]), [0, 0, 1], "tend");
    T(ANK, add(Ak, [0, -3.4, 0]), add(Ak, [0, 3.4, 0]), [0, 0, 1], "tend");
    T(FOOT, add(Ak, [s * 0.5, -5, -7]), add(Ak, [s * 1.5, -5, 17]), [0, 1, 0], "tend");
  }
  T(MAT, [0, 1.8, -70], [0, 1.8, 70], [0, 1, 0], "pad");
  return o;
}

const PATH = (function () {
  const e0 = [];
  const e1 = [];
  const h = [];
  for (let i = 0; i <= 16; i++) {
    const p = extPose(i / 16);
    e0.push(p.E[0]);
    e1.push(p.E[1]);
    h.push(p.grips[0]);
  }
  return [e0, e1, h];
})();

export const OVERHEAD_EXTENSION_ANATOMY = {
  label: "3D overhead triceps extension demonstration",
  cycle: CYCLE,
  phase: extPhase,
  pose: extPose,
  path: PATH,
  role: { tric: 0, fore: 1, abs: 1 },
  group: {
    tric: ["tric"],
    fore: ["fore"],
    abs: ["abs"]
  },
  phases: ["Set", "Lower", "Stretch", "Extend"],
  cues: [
    "Stand tall and hold one weight with both hands overhead, arms straight and elbows pointing forward. Brace your core and keep your ribs down.",
    "Bend your elbows to lower the weight behind your head, keeping your upper arms vertical and your elbows close together.",
    "Lower until your forearms are about parallel to the floor and you feel a stretch in the back of your arms. Do not arch your lower back.",
    "Straighten your arms to press the weight back up over your head, squeezing your triceps at the top."
  ],

  muscles: [
    ["tric", "Triceps (long head)", 0],
    ["fore", "Forearms", 1],
    ["abs", "Core (bracing)", 1]
  ],
  yaw: 38,
  pitch: 8,
  view: { tg: [0, 124, 0], span: 380 }
};
