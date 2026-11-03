import { mk, PI, cos, sin, add, mul, ease, ik, TORSO, THIGH, SHIN, FARM, UARM, NECK, HEAD, FOOT, HIPJ, HAND, KNEE, ELB, WRI, ANK, BAR } from "../viewer/anatomy-engine.js";

const CYCLE = 5.4;
const FOOT_LOW = 12 * PI / 180;
const FOOT_HIGH = -35 * PI / 180;
const BALL = [13, 11.5, 0];
const A = [0, 1, 0];
const UT = [0, 0, 1];
const PLATFORM = mk(1, 18, [[0, 4, 4, 24], [1, 4, 4, 24]], [], null);
const PAD = mk(1, 16, [[0, 5, 5, 5], [1, 5, 5, 5]], [], null);
const POST = mk(1, 10, [[0, 2.2, 2.2, 2.2], [1, 2.2, 2.2, 2.2]], [], null);

function raisePhase(t) {
  t = ((t % CYCLE) + CYCLE) % CYCLE;
  if (t < 0.6) return { u: 0, p: 0 };
  if (t < 2.0) return { u: ease((t - 0.6) / 1.4), p: 1 };
  if (t < 3.0) return { u: 1, p: 2 };
  return { u: 1 - ease((t - 3.0) / 2.4), p: 3 };
}

function raisePose(u) {
  const psi = FOOT_LOW + (FOOT_HIGH - FOOT_LOW) * u;
  const f = [0, sin(psi), cos(psi)];
  const nn = [0, cos(psi), -sin(psi)];
  const o = [];
  function T(d, from, to, up, col) { o.push({ d: d, A: from, B: to, u: up, col: col || "musc" }); }
  const sg = [1, -1];
  const ank = add(add([0, BALL[1], BALL[2]], mul(f, -10)), mul(nn, 5.5));
  const P = [0, ank[1] + 88.5, ank[2]];
  const SC = add(P, mul(A, 44));
  T(TORSO, add(P, mul(A, -10)), add(P, mul(A, 50)), UT);
  const NB = add(P, mul(A, 50));
  T(NECK, add(NB, mul(A, -2)), add(NB, mul(A, 7)), UT);
  T(HEAD, add(NB, mul(A, 5)), add(NB, mul(A, 25)), UT, "head");
  const padY = SC[1] + 9;
  const topY = padY + 30;
  for (let i = 0; i < 2; i++) {
    const s = sg[i];
    const S = add(SC, [s * 22, 0, 0]);
    const W = [s * 33, P[1] - 4, 4];
    const r = ik(S, W, 30, 26, [s * 0.3, 0, -1]);
    T(UARM, S, r.E, mul(r.pole, -1));
    T(FARM, r.E, r.W, mul(r.pole, -1));
    T(ELB, add(r.E, [0, -4.2, 0]), add(r.E, [0, 4.2, 0]), [0, 0, 1], "tend");
    T(WRI, add(r.W, [0, -2.9, 0]), add(r.W, [0, 2.9, 0]), [0, 0, 1], "tend");
    T(HAND, add(W, [0, 0, -4.5]), add(W, [0, 0, 4.5]), [0, 1, 0], "tend");
    T(BAR, add(W, [0, 0, -8]), add(W, [s * 3, 0, 8]), [0, 1, 0], "bar");
    T(PAD, [s * 12, padY, 0], [s * 36, padY, 0], [0, 1, 0], "pad");
    T(POST, [s * 36, P[1] - 4, 0], [s * 36, topY, 0], [0, 0, 1], "rig");
    T(POST, [s * 36, topY, 0], [s * 36, topY, -34], [0, 1, 0], "rig");
    T(POST, [s * 36, 2, -34], [s * 36, 190, -34], [0, 0, 1], "rig");
    T(POST, [s * 36, 2, -34], [s * 36, 2, 40], [0, 1, 0], "rig");
  }
  T(POST, [-36, 2, -34], [36, 2, -34], [0, 1, 0], "rig");
  T(POST, [-36, 190, -34], [36, 190, -34], [0, 1, 0], "rig");
  T(PLATFORM, [0, 4, BALL[2] - 4], [0, 4, BALL[2] + 16], [0, 1, 0], "pad");
  o.heel = [];
  for (let i = 0; i < 2; i++) {
    const s = sg[i];
    const B = [s * BALL[0], BALL[1], BALL[2]];
    const W = add(add(B, mul(f, -10)), mul(nn, 5.5));
    const H = add(P, [s * 9.5, -3, 0]);
    const r2 = ik(H, W, 44, 42, [s * 0.1, 0, 1]);
    const heel = add(B, mul(f, -17));
    o.heel[i] = heel;
    T(HIPJ, add(H, [0, -8.8, 0]), add(H, [0, 8.8, 0]), [0, 0, 1]);
    T(THIGH, H, r2.E, r2.pole);
    T(SHIN, r2.E, r2.W, r2.pole);
    T(KNEE, add(r2.E, [0, -5.6, 0]), add(r2.E, [0, 5.6, 0]), [0, 0, 1], "tend");
    T(ANK, add(W, [0, -3.4, 0]), add(W, [0, 3.4, 0]), [0, 0, 1], "tend");
    T(FOOT, heel, add(B, mul(f, 7)), nn, "tend");
  }
  return o;
}

const PATH = (function () {
  const h = [];
  for (let i = 0; i <= 16; i++) h.push(raisePose(i / 16).heel[0]);
  return [h];
})();

export const CALF_RAISE_ANATOMY = {
  label: "3D standing calf raise demonstration",
  cycle: CYCLE,
  phase: raisePhase,
  pose: raisePose,
  path: PATH,
  role: { calf: 0, abs: 1, erec: 1 },
  group: {
    calf: ["calf"],
    core: ["abs", "erec"]
  },
  phases: ["Stretch", "Rise", "Peak", "Lower"],
  cues: [
    "Stand tall with the pads on your shoulders and the balls of your feet on the platform edge. Let your heels drop for a full stretch in your calves.",
    "Push through the balls of your feet and lift your heels as high as you can. Keep your knees straight and your body tall.",
    "Pause at the top for a second and squeeze your calves hard. Do not let your ankles roll outward.",
    "Lower slowly until your heels are below the platform and feel the stretch. Do not bounce at the bottom."
  ],
  muscles: [
    ["calf", "Calves", 0],
    ["core", "Core & lower back", 1]
  ],
  yaw: -38,
  pitch: 6,
  view: { tg: [0, 96, 0], span: 262 }
};
