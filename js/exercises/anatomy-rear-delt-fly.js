import { mk, PI, cos, sin, add, mul, ease, ik, TORSO, THIGH, SHIN, FARM, UARM, NECK, HEAD, FOOT, HIPJ, HAND, KNEE, ELB, WRI, ANK, BAR } from "../viewer/anatomy-engine.js";

const CYCLE = 5.6;
const LAM = 64 * PI / 180;
const A = [0, cos(LAM), sin(LAM)];
const UT = [0, -sin(LAM), cos(LAM)];
const P = [0, 86, -28];
const SC = add(P, mul(A, 44));
const REACH = 53.5;
const ALPHA_TOP = 6 * PI / 180;
const ALPHA_HIGH = 88 * PI / 180;
const DB_HEAD = mk(1, 14, [[0, 6.5, 6.5, 6.5], [1, 6.5, 6.5, 6.5]], [], null);

function flyPhase(t) {
  t = ((t % CYCLE) + CYCLE) % CYCLE;
  if (t < 0.6) return { u: 0, p: 0 };
  if (t < 2.2) return { u: ease((t - 0.6) / 1.6), p: 1 };
  if (t < 3.2) return { u: 1, p: 2 };
  if (t < 5.4) return { u: 1 - ease((t - 3.2) / 2.2), p: 3 };
  return { u: 0, p: 0 };
}

function flyPose(u) {
  const o = [];
  function T(d, from, to, up, col) { o.push({ d: d, A: from, B: to, u: up, col: col || "musc" }); }
  const sg = [1, -1];
  T(TORSO, add(P, mul(A, -10)), add(P, mul(A, 50)), UT);
  const hl = LAM * 0.8;
  const hd = [0, cos(hl), sin(hl)];
  const hu = [0, -sin(hl), cos(hl)];
  const NB = add(P, mul(A, 50));
  T(NECK, add(NB, mul(hd, -2)), add(NB, mul(hd, 7)), UT);
  T(HEAD, add(NB, mul(hd, 5)), add(NB, mul(hd, 25)), hu, "head");
  const al = ALPHA_TOP + (ALPHA_HIGH - ALPHA_TOP) * u;
  o.E = [];
  o.grips = [];
  for (let i = 0; i < 2; i++) {
    const s = sg[i];
    const S = add(SC, [s * 22, 0, 0]);
    const W = add(S, [s * REACH * sin(al), -REACH * cos(al), 0]);
    const r = ik(S, W, 30, 26, [0, 0.3, -1]);
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
  return o;
}

const PATH = (function () {
  const g0 = [];
  const g1 = [];
  for (let i = 0; i <= 16; i++) {
    const p = flyPose(i / 16);
    g0.push(p.grips[0]);
    g1.push(p.grips[1]);
  }
  return [g0, g1];
})();

export const REAR_DELT_FLY_ANATOMY = {
  label: "3D rear-delt fly demonstration",
  cycle: CYCLE,
  phase: flyPhase,
  pose: flyPose,
  path: PATH,
  role: { rdelt: 0, rhomb: 1, trap: 1, infra: 1, teres: 1, erec: 1 },
  group: {
    rdelt: ["rdelt"],
    rhomb: ["rhomb"],
    trap: ["trap"],
    scap: ["infra", "teres"],
    erec: ["erec"]
  },
  phases: ["Set", "Raise", "Squeeze", "Lower"],
  cues: [
    "Hinge forward with a flat back and soft knees. Let the dumbbells hang under your shoulders with a slight bend in your elbows, palms facing each other.",
    "Raise your arms out to the sides in a wide arc, leading with your elbows. Keep your torso still and think about pulling your arms apart, not lifting the weights.",
    "Stop when your arms are about level with your shoulders and squeeze your upper back for a second. Do not shrug.",
    "Lower slowly along the same arc until the dumbbells hang straight down again. Do not swing your body."
  ],
  muscles: [
    ["rdelt", "Rear delts", 0],
    ["rhomb", "Rhomboids", 1],
    ["trap", "Mid & lower traps", 1],
    ["scap", "Infraspinatus & teres", 1],
    ["erec", "Lower back", 1]
  ],
  yaw: -38,
  pitch: 12,
  view: { tg: [0, 84, 6], span: 245 }
};
