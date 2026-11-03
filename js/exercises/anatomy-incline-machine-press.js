import { mk, PI, cos, sin, sqrt, add, sub, mul, lv, ease, ik, TORSO, THIGH, SHIN, FARM, UARM, NECK, HEAD, FOOT, HIPJ, HAND, KNEE, ELB, WRI, ANK } from "../viewer/anatomy-engine.js";

const CYCLE = 5.6;
const LAM = -40 * PI / 180;
const A = [0, cos(LAM), sin(LAM)];
const UT = [0, -sin(LAM), cos(LAM)];
const P = [0, 56, -8];
const SC = add(P, mul(A, 44));
const SHOULDER_LIFT = mul(UT, 2.5);
const SEAT = mk(1, 18, [[0, 4, 4, 16], [1, 4, 4, 16]], [], null);
const BACK_PAD = mk(1, 18, [[0, 3.5, 3.5, 15], [1, 3.5, 3.5, 15]], [], null);
const POST = mk(1, 10, [[0, 2.2, 2.2, 2.2], [1, 2.2, 2.2, 2.2]], [], null);
const HANDLE = mk(1, 10, [[0, 1.9, 1.9, 1.9], [1, 1.9, 1.9, 1.9]], [], null);

const HAND_END = add(add(SC, SHOULDER_LIFT), add(mul(UT, 54.5), mul(A, 1)));
const HAND_START = add(add(SC, SHOULDER_LIFT), add(mul(UT, 29.5), mul(A, -5)));
const LEVER_X = 54;

const PRESS_DIR = (function () {
  const d = sub(HAND_END, HAND_START);
  const l = sqrt(d[0] * d[0] + d[1] * d[1] + d[2] * d[2]);
  return [d[0] / l, d[1] / l, d[2] / l];
})();
const RAIL_A = sub(HAND_START, mul(PRESS_DIR, 42));
const RAIL_B = add(HAND_END, mul(PRESS_DIR, 20));

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
  const q = 1 - u;
  const hp = lv(HAND_START, HAND_END, q);
  const hy = hp[1];
  const hz = hp[2];
  const gx = 29 - 5 * q;
  T(TORSO, add(P, mul(A, -10)), add(P, mul(A, 50)), UT);
  const NB = add(P, mul(A, 50));
  T(NECK, add(NB, mul(A, -2)), add(NB, mul(A, 7)), UT);
  T(HEAD, add(NB, mul(A, 5)), add(NB, mul(A, 25)), UT, "head");
  o.E = [];
  o.grips = [];
  for (let i = 0; i < 2; i++) {
    const s = sg[i];
    const S = add(add(SC, [s * (22 - 1.2 * q), 0, 0]), SHOULDER_LIFT);
    const W = [s * gx, hy, hz];
    const r = ik(S, W, 30, 26, [s * 0.5, -1, 0.3]);
    T(UARM, S, r.E, mul(r.pole, -1));
    T(FARM, r.E, r.W, mul(r.pole, -1));
    T(ELB, add(r.E, [0, -4.2, 0]), add(r.E, [0, 4.2, 0]), [0, 0, 1], "tend");
    T(WRI, add(r.W, [0, -3, 0]), add(r.W, [0, 3, 0]), [0, 0, 1], "tend");
    T(HAND, add(r.W, [0, -3.9, 0]), add(r.W, [0, 3.9, 0]), [0, 0, 1], "tend");
    T(HANDLE, add(r.W, [-s * 6, 0, 0]), add(r.W, [s * 9, 0, 0]), [0, 1, 0], "bar");
    T(POST, add(r.W, [s * 9, 0, 0]), [s * LEVER_X, hy, hz], [0, 1, 0], "rig");
    T(POST, [s * LEVER_X, RAIL_A[1], RAIL_A[2]], [s * LEVER_X, RAIL_B[1], RAIL_B[2]], [1, 0, 0], "rig");
    T(POST, [s * LEVER_X, 2, RAIL_A[2]], [s * LEVER_X, RAIL_A[1], RAIL_A[2]], [0, 0, 1], "rig");
    o.E[i] = r.E;
    o.grips[i] = r.W;
  }
  T(BACK_PAD, add(add(P, mul(A, -4)), mul(UT, -13.5)), add(add(P, mul(A, 72)), mul(UT, -13.5)), UT, "pad");
  const seatY = P[1] - 15;
  T(SEAT, [0, seatY, -22], [0, seatY, 12], [0, 1, 0], "pad");
  T(POST, [0, seatY - 4, -4], [0, 2, -4], [1, 0, 0], "rig");
  T(POST, add(add(P, mul(A, 6)), mul(UT, -13.5)), [0, 2, RAIL_A[2] - 6], [1, 0, 0], "rig");
  T(POST, [0, 2, RAIL_A[2] - 6], [0, 2, 44], [0, 1, 0], "rig");
  T(POST, [-LEVER_X, 2, RAIL_A[2]], [LEVER_X, 2, RAIL_A[2]], [0, 1, 0], "rig");
  T(POST, [-24, 2, 40], [24, 2, 40], [0, 1, 0], "rig");
  for (let i = 0; i < 2; i++) {
    const s = sg[i];
    const H = add(P, [s * 9.5, -3, 0]);
    const Ak = [s * 17, 9, 38];
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

export const INCLINE_MACHINE_PRESS_ANATOMY = {
  label: "3D incline machine press demonstration",
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
  phases: ["Set", "Return", "Stretch", "Press"],
  cues: [
    "Adjust the seat so the handles are level with your upper chest. Sit back with your shoulder blades pinched into the pad and your feet flat. Hold the handles with your arms almost straight.",
    "Let the handles come back slowly until your elbows are about 45° from your body and you feel a stretch across your upper chest.",
    "Pause briefly at the stretch. Keep your shoulders down and your back against the pad.",
    "Drive your feet down and press the handles up and forward until your arms are almost straight. Do not lock your elbows."
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
  view: { tg: [0, 80, -10], span: 235 }
};
