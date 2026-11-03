import { mk, PI, cos, sin, add, mul, ease, ik, TORSO, THIGH, SHIN, FARM, UARM, NECK, HEAD, FOOT, HIPJ, HAND, KNEE, ELB, WRI, ANK, BAR } from "../viewer/anatomy-engine.js";

const CYCLE = 6;
const A = [0, 0, -1];
const UT = [0, 1, 0];
const P = [0, 56, 0];
const SC = add(P, [0, 2.5, -44]);
const SHOULDER_X = 22;
const REACH = 53.5;
const ALPHA_TOP = 8 * PI / 180;
const ALPHA_LOW = 96 * PI / 180;
const PAD = mk(1, 18, [[0, 3.5, 3.5, 15], [1, 3.5, 3.5, 15]], [], null);
const POST = mk(1, 10, [[0, 2.2, 2.2, 2.2], [1, 2.2, 2.2, 2.2]], [], null);
const DB_HEAD = mk(1, 14, [[0, 6.5, 6.5, 6.5], [1, 6.5, 6.5, 6.5]], [], null);

function flyPhase(t) {
  t = ((t % CYCLE) + CYCLE) % CYCLE;
  if (t < 0.6) return { u: 0, p: 0 };
  if (t < 2.6) return { u: ease((t - 0.6) / 2.0), p: 1 };
  if (t < 3.4) return { u: 1, p: 2 };
  if (t < 5.4) return { u: 1 - ease((t - 3.4) / 2.0), p: 3 };
  return { u: 0, p: 0 };
}

function flyPose(u) {
  const o = [];
  function T(d, from, to, up, col) { o.push({ d: d, A: from, B: to, u: up, col: col || "musc" }); }
  const sg = [1, -1];
  T(TORSO, add(P, mul(A, -10)), add(P, mul(A, 50)), UT);
  const NB = add(P, mul(A, 50));
  T(NECK, add(NB, mul(A, -2)), add(NB, mul(A, 7)), UT);
  T(HEAD, add(NB, mul(A, 5)), add(NB, mul(A, 25)), UT, "head");
  const al = ALPHA_TOP + (ALPHA_LOW - ALPHA_TOP) * u;
  o.E = [];
  o.grips = [];
  for (let i = 0; i < 2; i++) {
    const s = sg[i];
    const S = add(SC, [s * SHOULDER_X, 0, 0]);
    const W = add(S, [s * REACH * sin(al), REACH * cos(al), 0]);
    const r = ik(S, W, 30, 26, [s * cos(al), -sin(al), 0]);
    o.E[i] = r.E;
    o.grips[i] = r.W;
    T(UARM, S, r.E, mul(r.pole, -1));
    T(FARM, r.E, r.W, mul(r.pole, -1));
    T(ELB, add(r.E, [0, -4.2, 0]), add(r.E, [0, 4.2, 0]), [0, 0, 1], "tend");
    T(WRI, add(r.W, [0, -2.9, 0]), add(r.W, [0, 2.9, 0]), [0, 0, 1], "tend");
    T(HAND, add(r.W, [0, -3.9, 0]), add(r.W, [0, 3.9, 0]), [0, 0, 1], "tend");
    T(BAR, add(r.W, [0, 0, -7.5]), add(r.W, [0, 0, 7.5]), [0, 1, 0], "bar");
    T(DB_HEAD, add(r.W, [0, 0, 7.5]), add(r.W, [0, 0, 14]), [0, 1, 0], "rig");
    T(DB_HEAD, add(r.W, [0, 0, -14]), add(r.W, [0, 0, -7.5]), [0, 1, 0], "rig");
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
    const p = flyPose(i / 16);
    e0.push(p.E[0]);
    e1.push(p.E[1]);
    h0.push(p.grips[0]);
    h1.push(p.grips[1]);
  }
  return [e0, e1, h0, h1];
})();

export const DB_FLY_ANATOMY = {
  label: "3D dumbbell fly demonstration",
  cycle: CYCLE,
  phase: flyPhase,
  pose: flyPose,
  path: PATH,
  role: { pec: 0, adelt: 1, bic: 1, brach: 1 },
  group: {
    pec: ["pec"],
    adelt: ["adelt"],
    bic: ["bic", "brach"]
  },
  phases: ["Set", "Open", "Stretch", "Squeeze"],
  cues: [
    "Lie on a flat bench with your feet planted and shoulder blades pinched into the pad. Hold the dumbbells over your chest, palms facing each other, with a soft bend in your elbows.",
    "Open your arms in a wide arc, keeping the same elbow bend. Lower the dumbbells out to the sides as if hugging a big tree.",
    "Stop when your upper arms are about level with the bench and you feel a deep stretch across your chest. Do not go lower.",
    "Squeeze your chest to bring the dumbbells back along the same arc until they meet over your chest. Do not turn it into a press."
  ],
  muscles: [
    ["pec", "Chest", 0],
    ["adelt", "Front delts", 1],
    ["bic", "Biceps", 1]
  ],
  yaw: 38,
  pitch: 14,
  views: { three: 38 },
  view: { tg: [0, 62, -30], span: 235 }
};
