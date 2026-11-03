import { mk, cos, sin, add, mul, lv, ease, ik, TORSO, THIGH, SHIN, FARM, UARM, NECK, HEAD, FOOT, HIPJ, HAND, KNEE, ELB, WRI, ANK, BAR } from "../viewer/anatomy-engine.js";

const CYCLE = 5.6;
const A = [0, 0, -1];
const UT = [0, 1, 0];
const P = [0, 56, 0];
const SC = add(P, [0, 2.5, -44]);
const SHOULDER_X = 22;
const TOP_X = 18;
const BOT_X = 31;
const TOP_Y = SC[1] + 54.5;
const BOT_Y = 69;
const BOT_Z = -34;
const PAD = mk(1, 18, [[0, 3.5, 3.5, 15], [1, 3.5, 3.5, 15]], [], null);
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
  const top = [TOP_X, TOP_Y, SC[2] - 1];
  const low = [BOT_X, BOT_Y, BOT_Z];
  const c = lv(top, low, u);
  o.E = [];
  o.grips = [];
  for (let i = 0; i < 2; i++) {
    const s = sg[i];
    const S = add(SC, [s * SHOULDER_X, 0, 0]);
    const W = [s * c[0], c[1], c[2]];
    const r = ik(S, W, 30, 26, [s * 0.4, -1, 0.5]);
    o.E[i] = r.E;
    o.grips[i] = r.W;
    T(UARM, S, r.E, mul(r.pole, -1));
    T(FARM, r.E, r.W, mul(r.pole, -1));
    T(ELB, add(r.E, [0, -4.2, 0]), add(r.E, [0, 4.2, 0]), [0, 0, 1], "tend");
    T(WRI, add(r.W, [0, -3, 0]), add(r.W, [0, 3, 0]), [0, 0, 1], "tend");
    T(HAND, add(r.W, [-3.9, 0, 0]), add(r.W, [3.9, 0, 0]), [0, 0, 1], "tend");
    T(BAR, add(r.W, [-7.5, 0, 0]), add(r.W, [7.5, 0, 0]), [0, 1, 0], "bar");
    T(DB_HEAD, add(r.W, [7.5, 0, 0]), add(r.W, [14, 0, 0]), [0, 1, 0], "rig");
    T(DB_HEAD, add(r.W, [-14, 0, 0]), add(r.W, [-7.5, 0, 0]), [0, 1, 0], "rig");
  }
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

export const DB_BENCH_PRESS_ANATOMY = {
  label: "3D dumbbell bench press demonstration",
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
    "Lie on a flat bench with your feet planted and shoulder blades pinched into the pad. Hold the dumbbells over your chest on straight arms, palms facing your feet.",
    "Lower the dumbbells under control to the sides of your chest, with your elbows about 45° from your body and your wrists stacked over your elbows.",
    "Pause when your upper arms are level with the bench and you feel a stretch across your chest. Keep your shoulder blades tight.",
    "Drive your feet down and press the dumbbells up and slightly together until your arms are straight over your shoulders."
  ],
  muscles: [
    ["pec", "Chest", 0],
    ["adelt", "Front delts", 1],
    ["tric", "Triceps", 1],
    ["fore", "Forearms", 1]
  ],
  yaw: 38,
  pitch: 12,
  views: { three: 38 },
  view: { tg: [0, 76, -36], span: 235 }
};
