import { mk, PI, cos, sin, add, mul, lv, ease, ik, TORSO, THIGH, SHIN, FARM, UARM, NECK, HEAD, FOOT, HIPJ, HAND, KNEE, ELB, WRI, ANK, BAR } from "../viewer/anatomy-engine.js";

const CYCLE = 5;
const LEAN = -10 * PI / 180;
const A = [0, cos(LEAN), sin(LEAN)];
const UT = [0, -sin(LEAN), cos(LEAN)];
const P = [0, 52, 0];
const SC = add(P, mul(A, 44));
const HIP_Y = P[1] - 3;
const SEAT = mk(1, 18, [[0, 4, 4, 17], [1, 4, 4, 17]], [], null);
const BACK_PAD = mk(1, 18, [[0, 3.5, 3.5, 15], [1, 3.5, 3.5, 15]], [], null);
const POST = mk(1, 10, [[0, 2.2, 2.2, 2.2], [1, 2.2, 2.2, 2.2]], [], null);
const DB_HEAD = mk(1, 14, [[0, 6.5, 6.5, 6.5], [1, 6.5, 6.5, 6.5]], [], null);

const HAND_LOW = [39, SC[1] + 16, SC[2] + 27];
const HAND_TOP = [24, SC[1] + 54.5, SC[2] + 5];

function pressPhase(t) {
  t = ((t % CYCLE) + CYCLE) % CYCLE;
  if (t < 0.6) return { u: 0, p: 0 };
  if (t < 2.1) return { u: ease((t - 0.6) / 1.5), p: 1 };
  if (t < 2.9) return { u: 1, p: 2 };
  return { u: 1 - ease((t - 2.9) / 2.1), p: 3 };
}

function pressPose(u) {
  const o = [];
  function T(d, from, to, up, col) { o.push({ d: d, A: from, B: to, u: up, col: col || "musc" }); }
  const sg = [1, -1];
  T(TORSO, add(P, mul(A, -10)), add(P, mul(A, 50)), UT);
  const hl = LEAN * 0.5;
  const hd = [0, cos(hl), sin(hl)];
  const hu = [0, -sin(hl), cos(hl)];
  const NB = add(P, mul(A, 50));
  T(NECK, add(NB, mul(hd, -2)), add(NB, mul(hd, 7)), UT);
  T(HEAD, add(NB, mul(hd, 5)), add(NB, mul(hd, 25)), hu, "head");
  const g = lv(HAND_LOW, HAND_TOP, u);
  o.E = [];
  o.grips = [];
  for (let i = 0; i < 2; i++) {
    const s = sg[i];
    const S = add(SC, [s * 22, 0, 0]);
    const W = [s * g[0], g[1], g[2]];
    const r = ik(S, W, 30, 26, [s * 0.8, -0.8, 0.3]);
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
  const seatY = HIP_Y - 13;
  T(SEAT, [0, seatY, -14], [0, seatY, 30], [0, 1, 0], "pad");
  T(POST, [0, seatY - 4, 8], [0, 2, 8], [1, 0, 0], "rig");
  const bp = add(add(P, mul(A, -4)), mul(UT, -13.5));
  T(BACK_PAD, bp, add(add(P, mul(A, 72)), mul(UT, -13.5)), UT, "pad");
  T(POST, bp, [0, 2, -40], [1, 0, 0], "rig");
  T(POST, [0, 2, -40], [0, 2, 62], [1, 0, 0], "rig");
  T(POST, [-24, 2, -40], [24, 2, -40], [0, 1, 0], "rig");
  T(POST, [-22, 2, 56], [22, 2, 56], [0, 1, 0], "rig");
  for (let i = 0; i < 2; i++) {
    const s = sg[i];
    const H = add(P, [s * 9.5, -3, 0]);
    const Ak = [s * 17, 9, 40];
    const r2 = ik(H, Ak, 44, 42, [s * 0.1, 1, 0.2]);
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

export const DB_PRESS_ANATOMY = {
  label: "3D seated dumbbell shoulder press demonstration",
  cycle: CYCLE,
  phase: pressPhase,
  pose: pressPose,
  path: PATH,
  role: { adelt: 0, ldelt: 0, tric: 1, utrap: 1, pec: 1 },
  group: {
    adelt: ["adelt"],
    ldelt: ["ldelt"],
    tric: ["tric"],
    utrap: ["utrap"],
    pec: ["pec"]
  },
  phases: ["Set", "Press", "Lockout", "Lower"],
  cues: [
    "Sit tall with your back against the pad and your feet flat. Hold the dumbbells at shoulder height with your elbows slightly in front of your body and your ribs down.",
    "Press the dumbbells straight up and slightly together until your arms are almost straight. Keep your back on the pad and do not arch.",
    "Pause with the dumbbells over your shoulders and your arms almost straight. Do not slam your elbows into lockout.",
    "Lower the dumbbells slowly back to shoulder height with your forearms vertical."
  ],
  muscles: [
    ["adelt", "Front delts", 0],
    ["ldelt", "Side delts", 0],
    ["tric", "Triceps", 1],
    ["utrap", "Upper traps", 1],
    ["pec", "Upper chest", 1]
  ],
  yaw: 38,
  pitch: 10,
  views: { three: 38 },
  view: { tg: [0, 94, 8], span: 225 }
};
