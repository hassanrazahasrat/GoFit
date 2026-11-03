import { mk, PI, cos, sin, sqrt, add, sub, mul, ease, ik, TORSO, THIGH, SHIN, FARM, UARM, NECK, HEAD, FOOT, HIPJ, HAND, KNEE, ELB, WRI, ANK } from "../viewer/anatomy-engine.js";

const CYCLE = 5.2;
const LEAN_TOP = 6 * PI / 180;
const LEAN_LOW = 72 * PI / 180;
const TUCK = 24 * PI / 180;
const P = [0, 52, 0];
const Q = add(P, [0, 14, 0]);
const POST = mk(1, 10, [[0, 2.4, 2.4, 2.4], [1, 2.4, 2.4, 2.4]], [], null);
const PULLEY = mk(1, 20, [[0, 6, 6, 6], [1, 6, 6, 6]], [], null);
const CABLE = mk(1, 6, [[0, 0.8, 0.8, 0.8], [1, 0.8, 0.8, 0.8]], [], null);
const ROPE = mk(1, 8, [[0, 1.5, 1.5, 1.5], [1, 1.5, 1.5, 1.5]], [], null);
const MAT = mk(1, 18, [[0, 1.8, 1.8, 24], [1, 1.8, 1.8, 24]], [], null);
const PULLEY_AT = [0, 172, 62];

function crunchPhase(t) {
  t = ((t % CYCLE) + CYCLE) % CYCLE;
  if (t < 0.6) return { u: 0, p: 0 };
  if (t < 1.9) return { u: ease((t - 0.6) / 1.3), p: 1 };
  if (t < 2.8) return { u: 1, p: 2 };
  return { u: 1 - ease((t - 2.8) / 2.4), p: 3 };
}

function unit(v) {
  const l = sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
}

function crunchPose(u) {
  const o = [];
  function T(d, from, to, up, col) { o.push({ d: d, A: from, B: to, u: up, col: col || "musc" }); }
  const sg = [1, -1];
  const lam = LEAN_TOP + (LEAN_LOW - LEAN_TOP) * u;
  const a = [0, cos(lam), sin(lam)];
  const ut = [0, -sin(lam), cos(lam)];
  const SC = add(Q, mul(a, 30));
  T(TORSO, add(Q, mul(a, -24)), add(Q, mul(a, 36)), ut);
  const NB = add(Q, mul(a, 36));
  const hl = lam + TUCK * u;
  const hd = [0, cos(hl), sin(hl)];
  const hu = [0, -sin(hl), cos(hl)];
  T(NECK, add(NB, mul(hd, -2)), add(NB, mul(hd, 7)), ut);
  T(HEAD, add(NB, mul(hd, 5)), add(NB, mul(hd, 25)), hu, "head");
  const C = add(NB, mul(hd, 15));
  const grips = [];
  o.E = [];
  for (let i = 0; i < 2; i++) {
    const s = sg[i];
    const S = add(SC, [s * 22, 0, 0]);
    const W = add(add(C, [s * 12.5, 0, 0]), add(mul(hd, -3), mul(hu, 7)));
    const r = ik(S, W, 30, 26, [s * 0.3, -1, 1]);
    const f = unit(sub(r.W, r.E));
    const up = mul(r.pole, -1);
    T(UARM, S, r.E, up);
    T(FARM, r.E, r.W, up);
    T(ELB, add(r.E, [0, -4.2, 0]), add(r.E, [0, 4.2, 0]), [0, 0, 1], "tend");
    T(WRI, add(r.W, mul(f, -3)), add(r.W, mul(f, 3)), [0, 1, 0], "tend");
    T(HAND, r.W, add(r.W, mul(f, 9)), unit(sub(r.pole, mul(f, r.pole[0] * f[0] + r.pole[1] * f[1] + r.pole[2] * f[2]))), "tend");
    grips[i] = add(r.W, mul(f, 5));
    o.E[i] = r.E;
  }
  o.grips = grips;
  const J = add(C, mul(hd, 28));
  for (let i = 0; i < 2; i++) {
    const dir = unit(sub(grips[i], J));
    T(ROPE, J, add(grips[i], mul(dir, 5)), [1, 0, 0], "hub");
    T(WRI, add(grips[i], mul(dir, 5)), add(grips[i], mul(dir, 10)), [1, 0, 0], "hub");
  }
  T(CABLE, J, PULLEY_AT, [1, 0, 0], "hub");
  const bz = PULLEY_AT[2] + 8;
  T(POST, [0, 2, bz], [0, PULLEY_AT[1] + 10, bz], [0, 0, 1], "rig");
  T(POST, [-34, 2, bz], [34, 2, bz], [0, 1, 0], "rig");
  T(POST, [0, PULLEY_AT[1] + 4, bz], [0, PULLEY_AT[1], PULLEY_AT[2] + 2], [1, 0, 0], "rig");
  T(PULLEY, [-3, PULLEY_AT[1], PULLEY_AT[2]], [3, PULLEY_AT[1], PULLEY_AT[2]], [0, 1, 0], "hub");
  T(MAT, [0, 1.8, -52], [0, 1.8, 14], [0, 1, 0], "pad");
  for (let i = 0; i < 2; i++) {
    const s = sg[i];
    const H = add(P, [s * 9.5, -3, 0]);
    const Ak = [s * 12, 8, -42];
    const r2 = ik(H, Ak, 44, 42, [0, 0, 1]);
    T(HIPJ, add(H, [0, -8.8, 0]), add(H, [0, 8.8, 0]), [0, 0, 1]);
    T(THIGH, H, r2.E, r2.pole);
    T(SHIN, r2.E, r2.W, r2.pole);
    T(KNEE, add(r2.E, [0, -5.6, 0]), add(r2.E, [0, 5.6, 0]), [0, 0, 1], "tend");
    T(ANK, add(Ak, [0, -3.4, 0]), add(Ak, [0, 3.4, 0]), [0, 0, 1], "tend");
    T(FOOT, add(Ak, [s * 0.5, -3, 6]), add(Ak, [s * 1.5, -4, -18]), [0, -1, 0], "tend");
  }
  return o;
}

const PATH = (function () {
  const g0 = [];
  const g1 = [];
  for (let i = 0; i <= 16; i++) {
    const p = crunchPose(i / 16);
    g0.push(p.grips[0]);
    g1.push(p.grips[1]);
  }
  return [g0, g1];
})();

export const CABLE_CRUNCH_ANATOMY = {
  label: "3D cable crunch demonstration",
  cycle: CYCLE,
  phase: crunchPhase,
  pose: crunchPose,
  path: PATH,
  role: { abs: 0, lats: 1, quad: 1 },
  group: {
    abs: ["abs"],
    lats: ["lats"],
    quad: ["quad"]
  },
  phases: ["Set", "Crunch", "Squeeze", "Return"],
  cues: [
    "Kneel facing the cable with the rope held beside your head and your hips stacked over your knees. Keep your elbows pointing down.",
    "Curl your ribs toward your hips and tuck your chin as you crunch down. Keep your hips still and do not sit back on your heels.",
    "Squeeze your abs hard at the bottom for a second with your back rounded and your elbows near your knees.",
    "Uncurl slowly back to the start, keeping the rope against your head and your hips still."
  ],
  muscles: [
    ["abs", "Abs", 0],
    ["lats", "Lats (hold elbows down)", 1],
    ["quad", "Hip flexors & quads", 1]
  ],
  yaw: 50,
  pitch: 8,
  views: { three: 50 },
  view: { tg: [0, 88, 14], span: 235 }
};
