import { mk, PI, cos, sin, add, mul, ease, ik, TORSO, THIGH, SHIN, FARM, UARM, NECK, HEAD, FOOT, HIPJ, HAND, KNEE, ELB, WRI, ANK, BAR } from "../viewer/anatomy-engine.js";

const CYCLE = 6.6;
const A = [0, 0, -1];
const UT = [0, 1, 0];
const P = [0, 56, 0];
const SC = add(P, [0, 2.5, -44]);
const SHOULDER_X = 22;
const GRIP_X = 3.5;
const R_TOP = 52;
const R_LOW = 49;
const TH_LOW = 100 * PI / 180;
const PAD = mk(1, 18, [[0, 3.5, 3.5, 15], [1, 3.5, 3.5, 15]], [], null);
const POST = mk(1, 10, [[0, 2.2, 2.2, 2.2], [1, 2.2, 2.2, 2.2]], [], null);
const PACK = mk(6, 18, [[0, 0.5, 0.5, 0.5], [0.04, 6.5, 6.5, 12], [0.12, 8, 8, 16.5], [0.88, 8, 8, 16.5], [0.96, 6.5, 6.5, 12], [1, 0.5, 0.5, 0.5]], [], null);
const POCKET = mk(4, 14, [[0, 0.5, 0.5, 0.5], [0.1, 3, 3, 7], [0.9, 3, 3, 7], [1, 0.5, 0.5, 0.5]], [], null);
const STRAP = mk(1, 8, [[0, 1.3, 1.3, 1.3], [1, 1.3, 1.3, 1.3]], [], null);

function overPhase(t) {
  t = ((t % CYCLE) + CYCLE) % CYCLE;
  if (t < 0.6) return { u: 0, p: 0 };
  if (t < 3.0) return { u: ease((t - 0.6) / 2.4), p: 1 };
  if (t < 3.8) return { u: 1, p: 2 };
  if (t < 5.9) return { u: 1 - ease((t - 3.8) / 2.1), p: 3 };
  return { u: 0, p: 0 };
}

function overPose(u) {
  const o = [];
  function T(d, from, to, up, col) { o.push({ d: d, A: from, B: to, u: up, col: col || "musc" }); }
  const sg = [1, -1];
  T(TORSO, add(P, mul(A, -10)), add(P, mul(A, 50)), UT);
  const NB = add(P, mul(A, 50));
  T(NECK, add(NB, mul(A, -2)), add(NB, mul(A, 7)), UT);
  T(HEAD, add(NB, mul(A, 5)), add(NB, mul(A, 25)), UT, "head");
  const th = TH_LOW * u;
  const R = R_TOP + (R_LOW - R_TOP) * u;
  const dir = [0, cos(th), -sin(th)];
  const Wc = add(SC, mul(dir, R));
  o.E = [];
  o.grips = [];
  for (let i = 0; i < 2; i++) {
    const s = sg[i];
    const S = add(SC, [s * SHOULDER_X, 0, 0]);
    const W = [s * GRIP_X, Wc[1], Wc[2]];
    const r = ik(S, W, 30, 26, [s * 1, 0.25 * u, 0.2]);
    o.E[i] = r.E;
    o.grips[i] = r.W;
    T(UARM, S, r.E, mul(r.pole, -1));
    T(FARM, r.E, r.W, mul(r.pole, -1));
    T(ELB, add(r.E, [0, -4.2, 0]), add(r.E, [0, 4.2, 0]), [0, 0, 1], "tend");
    T(WRI, add(r.W, [0, -3, 0]), add(r.W, [0, 3, 0]), [0, 0, 1], "tend");
    T(HAND, add(r.W, [-3.9, 0, 0]), add(r.W, [3.9, 0, 0]), [0, 0, 1], "tend");
  }
  const G = [0, Wc[1], Wc[2]];
  T(STRAP, [-6, G[1] - 1, G[2]], [6, G[1] - 1, G[2]], [0, 1, 0], "rig");
  T(PACK, [0, G[1] - 3, G[2]], [0, G[1] - 35, G[2]], [0, 0, 1], "pad");
  T(POCKET, [0, G[1] - 9, G[2] + 10], [0, G[1] - 23, G[2] + 10], [0, 0, 1], "rig");
  T(PAD, add(P, [0, -13.5, 6]), add(P, [0, -13.5, -82]), UT, "pad");
  T(POST, [0, P[1] - 15, -4], [0, 2, -4], [1, 0, 0], "rig");
  T(POST, [0, P[1] - 15, -62], [0, 2, -62], [1, 0, 0], "rig");
  T(POST, [0, 2, -90], [0, 2, 20], [0, 1, 0], "rig");
  T(POST, [-24, 2, -4], [24, 2, -4], [0, 1, 0], "rig");
  T(POST, [-24, 2, -62], [24, 2, -62], [0, 1, 0], "rig");
  for (let i = 0; i < 2; i++) {
    const s = sg[i];
    const H = add(P, [s * 9.5, -3, 0]);
    const Ak = [s * 20, 9, 38];
    const r2 = ik(H, Ak, 44, 42, [s * 0.3, 1, 0.2]);
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
  const e0 = [];
  const e1 = [];
  const h0 = [];
  for (let i = 0; i <= 16; i++) {
    const p = overPose(i / 16);
    e0.push(p.E[0]);
    e1.push(p.E[1]);
    h0.push(p.grips[0]);
  }
  return [e0, e1, h0];
})();

export const BACKPACK_PULLOVER_ANATOMY = {
  label: "3D backpack pullover demonstration",
  cycle: CYCLE,
  phase: overPhase,
  pose: overPose,
  path: PATH,
  role: { lats: 0, pec: 0, teres: 1, tric: 1, abs: 1 },
  group: {
    lats: ["lats"],
    pec: ["pec"],
    teres: ["teres"],
    tric: ["tric"],
    abs: ["abs"]
  },
  phases: ["Set", "Lower", "Stretch", "Pull"],
  cues: [
    "Lie on your back on the floor or a bench with your feet planted. Hold a loaded backpack by its top handle with both hands and press it up over your chest with soft elbows.",
    "Keep your elbows slightly bent and fixed, and lower the backpack in a wide arc back over your head. Keep your ribs down and your lower back from arching.",
    "Stop when your upper arms are beside your ears and you feel a deep stretch through your lats and chest. Do not let the backpack drop below the bench.",
    "Pull the backpack back along the same arc until your arms are over your chest, driving your upper arms forward with your lats. Do not bend your elbows to pull it."
  ],
  muscles: [
    ["lats", "Lats", 0],
    ["pec", "Chest", 0],
    ["teres", "Teres major", 1],
    ["tric", "Triceps (long head)", 1],
    ["abs", "Abs (bracing)", 1]
  ],
  yaw: 38,
  pitch: 12,
  views: { three: 38 },
  view: { tg: [0, 76, -42], span: 250 }
};
