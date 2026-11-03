import { mk, PI, cos, sin, sqrt, add, sub, mul, ease, ik, TORSO, THIGH, SHIN, FARM, UARM, NECK, HEAD, FOOT, HIPJ, HAND, KNEE, ELB, WRI, ANK } from "../viewer/anatomy-engine.js";

const CYCLE = 5.2;
const POST = mk(1, 10, [[0, 2.4, 2.4, 2.4], [1, 2.4, 2.4, 2.4]], [], null);
const PULLEY = mk(1, 20, [[0, 7, 7, 7], [1, 7, 7, 7]], [], null);
const CABLE = mk(1, 6, [[0, 0.8, 0.8, 0.8], [1, 0.8, 0.8, 0.8]], [], null);
const ROPE = mk(1, 8, [[0, 1.5, 1.5, 1.5], [1, 1.5, 1.5, 1.5]], [], null);

const LEAN = 15 * PI / 180;
const A = [0, cos(LEAN), sin(LEAN)];
const UT = [0, -sin(LEAN), cos(LEAN)];
const P = [0, 92, -6];
const SC = add(P, mul(A, 44));
const PULLEY_AT = [0, 184, 32];

function pushPhase(t) {
  t = ((t % CYCLE) + CYCLE) % CYCLE;
  if (t < 0.5) return { u: 0, p: 0 };
  if (t < 1.7) return { u: ease((t - 0.5) / 1.2), p: 1 };
  if (t < 2.7) return { u: 1, p: 2 };
  if (t < 5.0) return { u: 1 - ease((t - 2.7) / 2.3), p: 3 };
  return { u: 0, p: 0 };
}

function unit(v) {
  const l = sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
}

function cross(a, b) {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

function pushPose(u) {
  const o = [];
  function T(d, from, to, up, col) { o.push({ d: d, A: from, B: to, u: up, col: col || "musc" }); }
  const sg = [1, -1];
  const alpha = (5 + 73 * u) * PI / 180;
  const inward = 0.42 - 0.32 * u;
  T(TORSO, add(P, mul(A, -10)), add(P, mul(A, 50)), UT);
  const NB = add(P, mul(A, 50));
  const hd = [0, cos(LEAN * 0.2), sin(LEAN * 0.2)];
  T(NECK, add(NB, mul(hd, -2)), add(NB, mul(hd, 7)), UT);
  T(HEAD, add(NB, mul(hd, 5)), add(NB, mul(hd, 25)), [0, -sin(LEAN * 0.2), cos(LEAN * 0.2)], "head");
  const grips = [];
  for (let i = 0; i < 2; i++) {
    const s = sg[i];
    const S = add(SC, [s * 22, 0, 0]);
    const E = add(S, mul(unit([-s * 0.08, -1, 0]), 30));
    const f = unit([-s * inward, -sin(alpha), cos(alpha)]);
    const W = add(E, mul(f, 26));
    T(UARM, S, E, [0, 0, 1]);
    T(FARM, E, W, [0, 0, 1]);
    T(ELB, add(E, [0, -4.2, 0]), add(E, [0, 4.2, 0]), [0, 0, 1], "tend");
    T(WRI, add(W, mul(f, -3)), add(W, mul(f, 3)), [0, 1, 0], "tend");
    const grip = add(W, mul(f, 5));
    const n = unit(cross(f, [0, 1, 0]));
    T(HAND, W, add(W, mul(f, 9)), n, "tend");
    grips[i] = grip;
  }
  const J = add(mul(add(grips[0], grips[1]), 0.5), [0, 10, 0]);
  for (let i = 0; i < 2; i++) {
    const dir = unit(sub(grips[i], J));
    T(ROPE, J, add(grips[i], mul(dir, 7)), [1, 0, 0], "hub");
    T(WRI, add(grips[i], mul(dir, 7)), add(grips[i], mul(dir, 12)), [1, 0, 0], "hub");
  }
  T(CABLE, J, PULLEY_AT, [1, 0, 0], "hub");
  o.grips = grips;
  for (let i = 0; i < 2; i++) {
    const s = sg[i];
    T(POST, [s * 46, 2, 36], [s * 46, 194, 36], [0, 0, 1], "rig");
    T(POST, [s * 46, 2, -34], [s * 46, 2, 56], [1, 0, 0], "rig");
  }
  T(POST, [-46, 194, 36], [46, 194, 36], [0, 1, 0], "rig");
  T(POST, [0, 194, 36], [0, 184, 32], [1, 0, 0], "rig");
  T(PULLEY, [0, 184, 29], [0, 184, 35], [0, 1, 0], "hub");
  for (let i = 0; i < 2; i++) {
    const s = sg[i];
    const H = add(P, [s * 9.5, -3, 0]);
    const Ak = [s * 12, 9, 0];
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
    const p = pushPose(i / 16);
    g0.push(p.grips[0]);
    g1.push(p.grips[1]);
  }
  return [g0, g1];
})();

export const PUSHDOWN_ANATOMY = {
  label: "3D rope pushdown demonstration",
  cycle: CYCLE,
  phase: pushPhase,
  pose: pushPose,
  path: PATH,
  role: { tric: 0, fore: 1, lats: 1, abs: 1 },
  group: {
    tric: ["tric"],
    fore: ["fore"],
    lats: ["lats"],
    abs: ["abs"]
  },
  phases: ["Set", "Push", "Squeeze", "Return"],
  cues: [
    "Stand tall with a slight forward lean. Pin your elbows to your sides and hold the rope with your forearms about parallel to the floor.",
    "Push the rope straight down by extending only your elbows. Keep your upper arms still and your shoulders down.",
    "Straighten your arms, spread the rope ends apart and squeeze your triceps for a second.",
    "Let the rope rise slowly until your forearms are parallel to the floor again. Keep your elbows pinned and do not let the weight pull you forward."
  ],
  muscles: [
    ["tric", "Triceps", 0],
    ["fore", "Forearms", 1],
    ["lats", "Lats (hold elbows in)", 1],
    ["abs", "Core", 1]
  ],
  yaw: -38,
  pitch: 10,
  view: { tg: [0, 98, 6], span: 272 }
};
