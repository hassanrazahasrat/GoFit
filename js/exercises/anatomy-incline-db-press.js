import { mk, PI, cos, sin, add, mul, lv, ease, ik, TORSO, THIGH, SHIN, FARM, UARM, NECK, HEAD, FOOT, HIPJ, HAND, KNEE, ELB, WRI, ANK, BAR } from "../viewer/anatomy-engine.js";

const CYCLE = 5.6;
const INCLINE = 30 * PI / 180;
const LAM = -(PI / 2 - INCLINE);
const A = [0, cos(LAM), sin(LAM)];
const UT = [0, -sin(LAM), cos(LAM)];
const P = [0, 57, -10];
const SC = add(P, mul(A, 44));
const LIFT = mul(UT, 2.5);
const SHOULDER_X = 22;
const GRIP_LOW = add(add(P, mul(A, 35)), mul(UT, 15));
const HAND_LOW = [33, GRIP_LOW[1], GRIP_LOW[2]];
const HAND_TOP = [18, SC[1] + LIFT[1] + 55, SC[2] + LIFT[2] + 1];
const SEAT = mk(1, 18, [[0, 4, 4, 14], [1, 4, 4, 14]], [], null);
const BACK_PAD = mk(1, 18, [[0, 3.5, 3.5, 15], [1, 3.5, 3.5, 15]], [], null);
const POST = mk(1, 10, [[0, 2.2, 2.2, 2.2], [1, 2.2, 2.2, 2.2]], [], null);
const DB_HEAD = mk(1, 14, [[0, 6.5, 6.5, 6.5], [1, 6.5, 6.5, 6.5]], [], null);

function pressPhase(t) {
  t = ((t % CYCLE) + CYCLE) % CYCLE;
  if (t < 0.6) return { u: 0, p: 0 };
  if (t < 2.6) return { u: ease((t - 0.6) / 2.0), p: 1 };
  if (t < 3.4) return { u: 1, p: 2 };
  if (t < 4.9) return { u: 1 - ease((t - 3.4) / 1.5), p: 3 };
  return { u: 0, p: 0 };
}

function pressPose(u) {
  const o = [];
  function T(d, from, to, up, col) { o.push({ d: d, A: from, B: to, u: up, col: col || "musc" }); }
  const sg = [1, -1];
  T(TORSO, add(P, mul(A, -10)), add(P, mul(A, 50)), UT);
  const NB = add(P, mul(A, 50));
  T(NECK, add(NB, mul(A, -2)), add(NB, mul(A, 7)), UT);
  T(HEAD, add(NB, mul(A, 5)), add(NB, mul(A, 25)), UT, "head");
  const g = lv(HAND_LOW, HAND_TOP, 1 - u);
  o.E = [];
  o.grips = [];
  for (let i = 0; i < 2; i++) {
    const s = sg[i];
    const S = add(add(SC, [s * SHOULDER_X, 0, 0]), LIFT);
    const W = [s * g[0], g[1], g[2]];
    const r = ik(S, W, 30, 26, [s * 0.4, -1, 0.5]);
    o.E[i] = r.E;
    o.grips[i] = W;
    T(UARM, S, r.E, mul(r.pole, -1));
    T(FARM, r.E, r.W, mul(r.pole, -1));
    T(ELB, add(r.E, [0, -4.2, 0]), add(r.E, [0, 4.2, 0]), [0, 0, 1], "tend");
    T(WRI, add(W, [0, -2.9, 0]), add(W, [0, 2.9, 0]), [0, 0, 1], "tend");
    T(HAND, add(W, [0, -3.9, 0]), add(W, [0, 3.9, 0]), [0, 0, 1], "tend");
    T(BAR, add(W, [-7.5, 0, 0]), add(W, [7.5, 0, 0]), [0, 1, 0], "bar");
    T(DB_HEAD, add(W, [7.5, 0, 0]), add(W, [14, 0, 0]), [0, 1, 0], "rig");
    T(DB_HEAD, add(W, [-14, 0, 0]), add(W, [-7.5, 0, 0]), [0, 1, 0], "rig");
  }
  T(BACK_PAD, add(add(P, mul(A, -4)), mul(UT, -13.5)), add(add(P, mul(A, 72)), mul(UT, -13.5)), UT, "pad");
  T(SEAT, [-14, 43, -2], [14, 43, -2], [0, 1, 0], "pad");
  T(POST, [0, 41, -2], [0, 2, -2], [1, 0, 0], "rig");
  T(POST, [0, 66, -60], [0, 2, -60], [1, 0, 0], "rig");
  T(POST, [0, 2, -88], [0, 2, 40], [0, 1, 0], "rig");
  T(POST, [-24, 2, -60], [24, 2, -60], [0, 1, 0], "rig");
  T(POST, [-24, 2, 6], [24, 2, 6], [0, 1, 0], "rig");
  for (let i = 0; i < 2; i++) {
    const s = sg[i];
    const H = add(P, [s * 9.5, -3, 0]);
    const Ak = [s * 17, 9, 34];
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
  const h1 = [];
  for (let i = 0; i <= 16; i++) {
    const p = pressPose(i / 16);
    e0.push(p.E[0]);
    e1.push(p.E[1]);
    h0.push(p.grips[0]);
    h1.push(p.grips[1]);
  }
  return [e0, e1, h0, h1];
})();

export const INCLINE_DB_PRESS_ANATOMY = {
  label: "3D incline dumbbell press demonstration",
  cycle: CYCLE,
  phase: pressPhase,
  pose: pressPose,
  path: PATH,
  role: { pec: 0, adelt: 1, tric: 1, fore: 1 },
  group: {
    pec: ["pec"],
    adelt: ["adelt"],
    tric: ["tric"],
    fore: ["fore"]
  },
  phases: ["Set", "Lower", "Stretch", "Press"],
  cues: [
    "Set the bench to about 30°. Lie back with your feet flat and shoulder blades pinched into the pad, holding a dumbbell over each shoulder on nearly straight arms.",
    "Lower the dumbbells slowly to the sides of your upper chest with your elbows about 45° from your body. Keep your wrists stacked over your elbows.",
    "Pause at the bottom with a deep stretch across your upper chest. Keep your shoulder blades tight and your feet planted.",
    "Press the dumbbells up and slightly together until your arms are almost straight over your shoulders. Do not slam the dumbbells together."
  ],
  muscles: [
    ["pec", "Upper chest", 0],
    ["adelt", "Front delts", 1],
    ["tric", "Triceps", 1],
    ["fore", "Forearms", 1]
  ],
  yaw: 38,
  pitch: 12,
  views: { three: 38 },
  view: { tg: [0, 76, -18], span: 215 }
};
