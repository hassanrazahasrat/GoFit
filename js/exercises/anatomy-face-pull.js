import { mk, PI, cos, sin, sqrt, add, sub, mul, lv, ease, ik, TORSO, THIGH, SHIN, FARM, UARM, NECK, HEAD, FOOT, HIPJ, HAND, KNEE, ELB, WRI, ANK } from "../viewer/anatomy-engine.js";

const CYCLE = 5.4;
const LEAN = -6 * PI / 180;
const A = [0, cos(LEAN), sin(LEAN)];
const UT = [0, -sin(LEAN), cos(LEAN)];
const P = [0, 92, -2];
const SC = add(P, mul(A, 44));
const POST = mk(1, 10, [[0, 2.4, 2.4, 2.4], [1, 2.4, 2.4, 2.4]], [], null);
const PULLEY = mk(1, 20, [[0, 6, 6, 6], [1, 6, 6, 6]], [], null);
const CABLE = mk(1, 6, [[0, 0.8, 0.8, 0.8], [1, 0.8, 0.8, 0.8]], [], null);
const ROPE = mk(1, 8, [[0, 1.5, 1.5, 1.5], [1, 1.5, 1.5, 1.5]], [], null);

const HAND_FAR = [9, SC[1] + 2, SC[2] + 52];
const HAND_NEAR = [21, SC[1] + 14, SC[2] + 12];
const PULLEY_AT = [0, SC[1] + 22, SC[2] + 112];

function pullPhase(t) {
  t = ((t % CYCLE) + CYCLE) % CYCLE;
  if (t < 0.6) return { u: 0, p: 0 };
  if (t < 2.0) return { u: ease((t - 0.6) / 1.4), p: 1 };
  if (t < 3.0) return { u: 1, p: 2 };
  return { u: 1 - ease((t - 3.0) / 2.4), p: 3 };
}

function unit(v) {
  const l = sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
}

function cross(a, b) {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

function pullPose(u) {
  const o = [];
  function T(d, from, to, up, col) { o.push({ d: d, A: from, B: to, u: up, col: col || "musc" }); }
  const sg = [1, -1];
  T(TORSO, add(P, mul(A, -10)), add(P, mul(A, 50)), UT);
  const NB = add(P, mul(A, 50));
  const hl = LEAN * 0.3;
  const hd = [0, cos(hl), sin(hl)];
  T(NECK, add(NB, mul(hd, -2)), add(NB, mul(hd, 7)), UT);
  T(HEAD, add(NB, mul(hd, 5)), add(NB, mul(hd, 25)), [0, -sin(hl), cos(hl)], "head");
  const g = lv(HAND_FAR, HAND_NEAR, u);
  const grips = [];
  o.E = [];
  for (let i = 0; i < 2; i++) {
    const s = sg[i];
    const S = add(SC, [s * 22, 0, 0]);
    const W = [s * g[0], g[1], g[2]];
    const r = ik(S, W, 30, 26, [s * 1, -0.15, -0.2]);
    const f = unit(sub(r.W, r.E));
    const up = mul(r.pole, -1);
    T(UARM, S, r.E, up);
    T(FARM, r.E, r.W, up);
    T(ELB, add(r.E, [0, -4.2, 0]), add(r.E, [0, 4.2, 0]), [0, 0, 1], "tend");
    T(WRI, add(r.W, mul(f, -3)), add(r.W, mul(f, 3)), [0, 1, 0], "tend");
    const n = unit(cross(f, [0, 1, 0]));
    T(HAND, r.W, add(r.W, mul(f, 9)), n, "tend");
    grips[i] = add(r.W, mul(f, 5));
    o.E[i] = r.E;
  }
  const J = add(mul(add(grips[0], grips[1]), 0.5), mul(unit(sub(PULLEY_AT, mul(add(grips[0], grips[1]), 0.5))), 9));
  for (let i = 0; i < 2; i++) {
    const dir = unit(sub(grips[i], J));
    T(ROPE, J, add(grips[i], mul(dir, 7)), [1, 0, 0], "hub");
    T(WRI, add(grips[i], mul(dir, 7)), add(grips[i], mul(dir, 12)), [1, 0, 0], "hub");
  }
  T(CABLE, J, PULLEY_AT, [1, 0, 0], "hub");
  o.grips = grips;
  const top = PULLEY_AT[1] + 40;
  const bz = PULLEY_AT[2] + 8;
  for (let i = 0; i < 2; i++) {
    const s = sg[i];
    T(POST, [s * 46, 2, bz], [s * 46, top, bz], [0, 0, 1], "rig");
    T(POST, [s * 46, 2, bz - 90], [s * 46, 2, bz + 12], [1, 0, 0], "rig");
  }
  T(POST, [-46, top, bz], [46, top, bz], [0, 1, 0], "rig");
  T(POST, [-46, PULLEY_AT[1], bz], [46, PULLEY_AT[1], bz], [0, 1, 0], "rig");
  T(POST, [0, PULLEY_AT[1], bz], [0, PULLEY_AT[1], PULLEY_AT[2] + 2], [1, 0, 0], "rig");
  T(PULLEY, [-3, PULLEY_AT[1], PULLEY_AT[2]], [3, PULLEY_AT[1], PULLEY_AT[2]], [0, 1, 0], "hub");
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
  const e0 = [];
  const e1 = [];
  for (let i = 0; i <= 16; i++) {
    const p = pullPose(i / 16);
    g0.push(p.grips[0]);
    g1.push(p.grips[1]);
    e0.push(p.E[0]);
    e1.push(p.E[1]);
  }
  return [g0, g1, e0, e1];
})();

export const FACE_PULL_ANATOMY = {
  label: "3D face pull demonstration",
  cycle: CYCLE,
  phase: pullPhase,
  pose: pullPose,
  path: PATH,
  role: { rdelt: 0, rhomb: 0, infra: 0, teres: 0, trap: 1, utrap: 1 },
  group: {
    rdelt: ["rdelt"],
    scap: ["infra", "teres"],
    rhomb: ["rhomb"],
    trap: ["trap"],
    utrap: ["utrap"]
  },
  phases: ["Set", "Pull", "Squeeze", "Return"],
  cues: [
    "Set the rope at about face height. Stand tall with your arms straight toward the cable and your ribs down.",
    "Pull the rope toward your face with your elbows high and wide. Squeeze your shoulder blades together as your hands pass your ears.",
    "Finish with your hands beside your ears and your elbows level with your shoulders. Rotate your knuckles back and up for a second.",
    "Let the rope go forward slowly until your arms are straight. Do not lean back to pull."
  ],
  muscles: [
    ["rdelt", "Rear delts", 0],
    ["scap", "Rotator cuff (back of the shoulder)", 0],
    ["rhomb", "Rhomboids", 0],
    ["trap", "Mid traps", 1],
    ["utrap", "Upper traps", 1]
  ],
  yaw: -38,
  pitch: 8,
  view: { tg: [0, 100, 40], span: 285 }
};
