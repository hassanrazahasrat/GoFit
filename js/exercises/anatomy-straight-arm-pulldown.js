import { mk, PI, cos, sin, add, mul, ease, ik, TORSO, THIGH, SHIN, FARM, UARM, NECK, HEAD, FOOT, HIPJ, HAND, KNEE, ELB, WRI, ANK, BAR } from "../viewer/anatomy-engine.js";

const CYCLE = 5.4;
const LAM = 30 * PI / 180;
const A = [0, cos(LAM), sin(LAM)];
const UT = [0, -sin(LAM), cos(LAM)];
const P = [0, 88, -4];
const SC = add(P, mul(A, 44));
const REACH = 55.4;
const B_TOP = 125 * PI / 180;
const B_LOW = -6 * PI / 180;
const GX = 22;
const PULLEY = [0, 222, 64];
const POST = mk(1, 10, [[0, 2.4, 2.4, 2.4], [1, 2.4, 2.4, 2.4]], [], null);
const CABLE = mk(1, 6, [[0, 0.8, 0.8, 0.8], [1, 0.8, 0.8, 0.8]], [], null);
const WHEEL = mk(1, 14, [[0, 5, 5, 5], [1, 5, 5, 5]], [], null);

function pullPhase(t) {
  t = ((t % CYCLE) + CYCLE) % CYCLE;
  if (t < 0.6) return { u: 0, p: 0 };
  if (t < 2.4) return { u: ease((t - 0.6) / 1.8), p: 1 };
  if (t < 3.3) return { u: 1, p: 2 };
  if (t < 5.2) return { u: 1 - ease((t - 3.3) / 1.9), p: 3 };
  return { u: 0, p: 0 };
}

function pullPose(u) {
  const o = [];
  function T(d, from, to, up, col) { o.push({ d: d, A: from, B: to, u: up, col: col || "musc" }); }
  const sg = [1, -1];
  T(TORSO, add(P, mul(A, -10)), add(P, mul(A, 50)), UT);
  const hl = LAM * 0.35;
  const hd = [0, cos(hl), sin(hl)];
  const hu = [0, -sin(hl), cos(hl)];
  const NB = add(P, mul(A, 50));
  T(NECK, add(NB, mul(hd, -2)), add(NB, mul(hd, 7)), UT);
  T(HEAD, add(NB, mul(hd, 5)), add(NB, mul(hd, 25)), hu, "head");
  const b = B_TOP + (B_LOW - B_TOP) * u;
  o.E = [];
  o.grips = [];
  let bar = null;
  for (let i = 0; i < 2; i++) {
    const s = sg[i];
    const S = add(SC, [s * GX, 0, 0]);
    const W = add(S, [0, -REACH * cos(b), REACH * sin(b)]);
    const r = ik(S, W, 30, 26, [s * 0.3, 0, -1]);
    o.E[i] = r.E;
    o.grips[i] = r.W;
    bar = r.W;
    T(UARM, S, r.E, mul(r.pole, -1));
    T(FARM, r.E, r.W, mul(r.pole, -1));
    T(ELB, add(r.E, [0, -4.2, 0]), add(r.E, [0, 4.2, 0]), [0, 0, 1], "tend");
    T(WRI, add(r.W, [-2.6, 0, 0]), add(r.W, [2.6, 0, 0]), [0, 1, 0], "tend");
    T(HAND, add(r.W, [-3.9, 0, 0]), add(r.W, [3.9, 0, 0]), [0, 1, 0], "tend");
  }
  const bc = [0, bar[1], bar[2]];
  T(BAR, [-GX - 14, bc[1], bc[2]], [GX + 14, bc[1], bc[2]], [0, 1, 0], "bar");
  T(CABLE, PULLEY, bc, [1, 0, 0], "rig");
  T(WHEEL, add(PULLEY, [-2.5, 0, 0]), add(PULLEY, [2.5, 0, 0]), [0, 1, 0], "hub");
  T(POST, [0, 2, 110], [0, 230, 110], [1, 0, 0], "rig");
  T(POST, [0, 227, 110], PULLEY, [1, 0, 0], "rig");
  T(POST, [-24, 2, 110], [24, 2, 110], [0, 1, 0], "rig");
  for (let i = 0; i < 2; i++) {
    const s = sg[i];
    const H = add(P, [s * 9.5, -3, 0]);
    const Ak = [s * 13, 9, 0];
    const r2 = ik(H, Ak, 44, 42, [s * 0.15, 0, 1]);
    T(HIPJ, add(H, [0, -8.8, 0]), add(H, [0, 8.8, 0]), [0, 0, 1]);
    T(THIGH, H, r2.E, r2.pole);
    T(SHIN, r2.E, r2.W, r2.pole);
    T(KNEE, add(r2.E, [0, -5.6, 0]), add(r2.E, [0, 5.6, 0]), [0, 0, 1], "tend");
    T(ANK, add(Ak, [0, -3.4, 0]), add(Ak, [0, 3.4, 0]), [0, 0, 1], "tend");
    T(FOOT, add(Ak, [s * 0.5, -5, -7]), add(Ak, [s * 1.5, -5, 17]), [0, 1, 0], "tend");
  }
  o.bar = bc;
  return o;
}

const PATH = (function () {
  const b = [];
  const g0 = [];
  for (let i = 0; i <= 16; i++) {
    const p = pullPose(i / 16);
    b.push(p.bar);
    g0.push(p.E[0]);
  }
  return [b, g0];
})();

export const STRAIGHT_ARM_PULLDOWN_ANATOMY = {
  label: "3D straight-arm pulldown demonstration",
  cycle: CYCLE,
  phase: pullPhase,
  pose: pullPose,
  path: PATH,
  role: { lats: 0, teres: 1, tric: 1, abs: 1 },
  group: {
    lats: ["lats"],
    teres: ["teres"],
    tric: ["tric"],
    abs: ["abs"]
  },
  phases: ["Stretch", "Pull", "Squeeze", "Return"],
  cues: [
    "Stand facing the high pulley with a slight hip hinge and soft knees. Hold the bar with straight arms and let your lats stretch as your arms rise in front of you.",
    "Keep your elbows almost straight and sweep the bar down in a wide arc. Think about pushing your upper arms toward your hips, not curling or pressing the bar.",
    "Finish with the bar at your thighs and squeeze your lats for a second. Keep your ribs down and your torso still.",
    "Let the bar rise slowly along the same arc until you feel a full lat stretch. Do not let your arms bend or your torso rock."
  ],
  muscles: [
    ["lats", "Lats", 0],
    ["teres", "Teres major", 1],
    ["tric", "Triceps (long head)", 1],
    ["abs", "Abs (bracing)", 1]
  ],
  yaw: -38,
  pitch: 8,
  view: { tg: [0, 128, 30], span: 300 }
};
