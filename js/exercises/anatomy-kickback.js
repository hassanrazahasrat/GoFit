import { mk, PI, cos, sin, add, mul, ease, ik, TORSO, THIGH, SHIN, FARM, UARM, NECK, HEAD, FOOT, HIPJ, HAND, KNEE, ELB, WRI, ANK, BAR } from "../viewer/anatomy-engine.js";

const CYCLE = 5.6;
const LEAN = 62 * PI / 180;
const A = [0, cos(LEAN), sin(LEAN)];
const UT = [0, -sin(LEAN), cos(LEAN)];
const P = [0, 86, -22];
const SC = add(P, mul(A, 44));
const BACK = mul(A, -1);
const MAT = mk(1, 18, [[0, 1.8, 1.8, 40], [1, 1.8, 1.8, 40]], [], null);
const BENCH = mk(1, 18, [[0, 3.5, 3.5, 14], [1, 3.5, 3.5, 14]], [], null);
const POST = mk(1, 10, [[0, 2.2, 2.2, 2.2], [1, 2.2, 2.2, 2.2]], [], null);
const DB_HEAD = mk(1, 14, [[0, 6, 6, 6], [1, 6, 6, 6]], [], null);

function kickPhase(t) {
  t = ((t % CYCLE) + CYCLE) % CYCLE;
  if (t < 0.6) return { u: 0, p: 0 };
  if (t < 2.2) return { u: ease((t - 0.6) / 1.6), p: 1 };
  if (t < 3.1) return { u: 1, p: 2 };
  if (t < 5.3) return { u: 1 - ease((t - 3.1) / 2.2), p: 3 };
  return { u: 0, p: 0 };
}

function kickPose(u) {
  const o = [];
  function T(d, from, to, up, col) { o.push({ d: d, A: from, B: to, u: up, col: col || "musc" }); }
  const sg = [1, -1];
  T(TORSO, add(P, mul(A, -10)), add(P, mul(A, 50)), UT);
  const hl = LEAN - 28 * PI / 180;
  const hd = [0, cos(hl), sin(hl)];
  const hu = [0, -sin(hl), cos(hl)];
  const NB = add(P, mul(A, 50));
  T(NECK, add(NB, mul(hd, -2)), add(NB, mul(hd, 7)), UT);
  T(HEAD, add(NB, mul(hd, 5)), add(NB, mul(hd, 25)), hu, "head");
  const S = add(SC, [-22, 0, 0]);
  const rise = 7 * u;
  const E = add(add(S, mul(BACK, 30)), [0, rise, 0]);
  const a0 = Math.atan2(-1, 0);
  const fb = [BACK[1], BACK[2]];
  const a1 = Math.atan2(fb[0] + 0.12, fb[1]);
  const ang = a0 + (a1 - a0) * u;
  const f = [0, sin(ang), cos(ang)];
  const W = add(E, mul(f, 26));
  o.E = E;
  o.grip = W;
  T(UARM, S, E, [1, 0, 0]);
  T(FARM, E, W, [1, 0, 0]);
  T(ELB, add(E, [-4.2, 0, 0]), add(E, [4.2, 0, 0]), [0, 1, 0], "tend");
  T(WRI, add(W, [-3, 0, 0]), add(W, [3, 0, 0]), [0, 1, 0], "tend");
  T(HAND, add(W, [-3.9, 0, 0]), add(W, [3.9, 0, 0]), [0, 1, 0], "tend");
  T(BAR, add(W, [-7.5, 0, 0]), add(W, [7.5, 0, 0]), [0, 1, 0], "bar");
  T(DB_HEAD, add(W, [7.5, 0, 0]), add(W, [13, 0, 0]), [0, 1, 0], "rig");
  T(DB_HEAD, add(W, [-13, 0, 0]), add(W, [-7.5, 0, 0]), [0, 1, 0], "rig");
  const S2 = add(SC, [22, 0, 0]);
  const W2 = [22, 61, SC[2] + 22];
  const r = ik(S2, W2, 30, 26, [0.4, 0.2, -1]);
  T(UARM, S2, r.E, mul(r.pole, -1));
  T(FARM, r.E, r.W, mul(r.pole, -1));
  T(ELB, add(r.E, [0, -4.2, 0]), add(r.E, [0, 4.2, 0]), [0, 0, 1], "tend");
  T(WRI, add(r.W, [-2.6, 0, 0]), add(r.W, [2.6, 0, 0]), [0, 1, 0], "tend");
  T(HAND, add(r.W, [-3.9, -1, 0]), add(r.W, [3.9, -1, 0]), [0, 1, 0], "tend");
  T(BENCH, [24, 55, SC[2] + 8], [24, 55, SC[2] + 62], [0, 1, 0], "pad");
  T(POST, [24, 52, SC[2] + 12], [24, 2, SC[2] + 12], [1, 0, 0], "rig");
  T(POST, [24, 52, SC[2] + 58], [24, 2, SC[2] + 58], [1, 0, 0], "rig");
  for (let i = 0; i < 2; i++) {
    const s = sg[i];
    const H = add(P, [s * 9.5, -3, 0]);
    const Ak = [s * 13, 9, 15 + s * 3];
    const r2 = ik(H, Ak, 44, 42, [0, 0, 1]);
    T(HIPJ, add(H, [0, -8.8, 0]), add(H, [0, 8.8, 0]), [0, 0, 1]);
    T(THIGH, H, r2.E, r2.pole);
    T(SHIN, r2.E, r2.W, r2.pole);
    T(KNEE, add(r2.E, [0, -5.6, 0]), add(r2.E, [0, 5.6, 0]), [0, 0, 1], "tend");
    T(ANK, add(Ak, [0, -3.4, 0]), add(Ak, [0, 3.4, 0]), [0, 0, 1], "tend");
    T(FOOT, add(Ak, [s * 0.5, -5, -7]), add(Ak, [s * 1.5, -5, 17]), [0, 1, 0], "tend");
  }
  T(MAT, [0, 1.8, -90], [0, 1.8, 110], [0, 1, 0], "pad");
  return o;
}

const PATH = (function () {
  const e = [];
  const h = [];
  for (let i = 0; i <= 16; i++) {
    const p = kickPose(i / 16);
    e.push(p.E);
    h.push(p.grip);
  }
  return [e, h];
})();

export const KICKBACK_ANATOMY = {
  label: "3D dumbbell kickback demonstration",
  cycle: CYCLE,
  phase: kickPhase,
  pose: kickPose,
  path: PATH,
  role: { tric: 0, rdelt: 1, fore: 1, erec: 1 },
  group: {
    tric: ["tric"],
    rdelt: ["rdelt"],
    fore: ["fore"],
    erec: ["erec"]
  },
  phases: ["Set", "Kick back", "Squeeze", "Return"],
  cues: [
    "Hinge forward with a flat back and rest your free hand on a bench. Pin your upper arm against your side, parallel to the floor, with your elbow bent to 90°.",
    "Straighten your arm backward by extending only your elbow. Keep your upper arm still and your back flat.",
    "Fully extend your arm and squeeze your triceps for a second without swinging the weight.",
    "Bend your elbow slowly to return to 90° while keeping your upper arm in place."
  ],
  muscles: [
    ["tric", "Triceps", 0],
    ["rdelt", "Rear delts", 1],
    ["fore", "Forearms", 1],
    ["erec", "Lower back (bracing)", 1]
  ],
  yaw: 38,
  pitch: 8,
  view: { tg: [0, 76, 0], span: 285 }
};
