import { mk, PI, cos, sin, add, sub, mul, lv, ease, ik, TORSO, THIGH, SHIN, FARM, UARM, NECK, HEAD, FOOT, HIPJ, HAND, KNEE, ELB, WRI, ANK, BAR } from "../viewer/anatomy-engine.js";

const CYCLE = 6;
const A = [0, 0, -1];
const UT = [0, 1, 0];
const P = [0, 56, 0];
const SC = add(P, [0, 2.5, -44]);
const SHOULDER_X = 22;
const TILT = 15 * PI / 180;
const BETA_LOW = 125 * PI / 180;
const UPPER = [0, cos(TILT), -sin(TILT)];
const PAD = mk(1, 18, [[0, 3.5, 3.5, 15], [1, 3.5, 3.5, 15]], [], null);
const POST = mk(1, 10, [[0, 2.2, 2.2, 2.2], [1, 2.2, 2.2, 2.2]], [], null);
const DB_HEAD = mk(1, 14, [[0, 6.5, 6.5, 6.5], [1, 6.5, 6.5, 6.5]], [], null);

function skullPhase(t) {
  t = ((t % CYCLE) + CYCLE) % CYCLE;
  if (t < 0.6) return { u: 0, p: 0 };
  if (t < 2.8) return { u: ease((t - 0.6) / 2.2), p: 1 };
  if (t < 3.6) return { u: 1, p: 2 };
  if (t < 5.4) return { u: 1 - ease((t - 3.6) / 1.8), p: 3 };
  return { u: 0, p: 0 };
}

function skullPose(u) {
  const o = [];
  function T(d, from, to, up, col) { o.push({ d: d, A: from, B: to, u: up, col: col || "musc" }); }
  const sg = [1, -1];
  T(TORSO, add(P, mul(A, -10)), add(P, mul(A, 50)), UT);
  const NB = add(P, mul(A, 50));
  T(NECK, add(NB, mul(A, -2)), add(NB, mul(A, 7)), UT);
  T(HEAD, add(NB, mul(A, 5)), add(NB, mul(A, 25)), UT, "head");
  const beta = BETA_LOW * u;
  const f = [0, cos(beta), -sin(beta)];
  const g = [0, -sin(beta), -cos(beta)];
  o.E = [];
  o.grips = [];
  for (let i = 0; i < 2; i++) {
    const s = sg[i];
    const S = add(SC, [s * SHOULDER_X, 0, 0]);
    const E = add(S, mul(UPPER, 30));
    const W = add(E, mul(f, 26));
    const r = ik(S, W, 30, 26, sub(E, lv(S, W, 0.5)));
    o.E[i] = r.E;
    o.grips[i] = r.W;
    T(UARM, S, r.E, mul(r.pole, -1));
    T(FARM, r.E, r.W, mul(r.pole, -1));
    T(ELB, add(r.E, [-4.2, 0, 0]), add(r.E, [4.2, 0, 0]), [0, 0, 1], "tend");
    T(WRI, add(r.W, [-2.9, 0, 0]), add(r.W, [2.9, 0, 0]), [0, 0, 1], "tend");
    T(HAND, add(r.W, [-3.9, 0, 0]), add(r.W, [3.9, 0, 0]), [0, 0, 1], "tend");
    T(BAR, sub(r.W, mul(g, 7.5)), add(r.W, mul(g, 7.5)), [1, 0, 0], "bar");
    T(DB_HEAD, add(r.W, mul(g, 7.5)), add(r.W, mul(g, 14)), [1, 0, 0], "rig");
    T(DB_HEAD, sub(r.W, mul(g, 14)), sub(r.W, mul(g, 7.5)), [1, 0, 0], "rig");
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
  const e = [];
  const h0 = [];
  const h1 = [];
  for (let i = 0; i <= 16; i++) {
    const p = skullPose(i / 16);
    e.push(p.E[0]);
    h0.push(p.grips[0]);
    h1.push(p.grips[1]);
  }
  return [e, h0, h1];
})();

export const SKULL_CRUSHER_ANATOMY = {
  label: "3D dumbbell skull crusher demonstration",
  cycle: CYCLE,
  phase: skullPhase,
  pose: skullPose,
  path: PATH,
  role: { tric: 0, adelt: 1, pec: 1, fore: 1 },
  group: {
    tric: ["tric"],
    adelt: ["adelt"],
    pec: ["pec"],
    fore: ["fore"]
  },
  phases: ["Set", "Lower", "Stretch", "Extend"],
  cues: [
    "Lie on a flat bench with your feet planted, holding a dumbbell in each hand over your shoulders, palms facing each other. Tilt your upper arms slightly back toward your head.",
    "Bend only at the elbows and lower the dumbbells slowly toward the sides of your head. Keep your upper arms still and your elbows pointing at the ceiling.",
    "Pause with the dumbbells just beside your forehead and feel a deep stretch in the back of your arms. Do not let your elbows flare out.",
    "Squeeze your triceps to straighten your elbows and bring the dumbbells back up. Keep your upper arms in the same place."
  ],
  muscles: [
    ["tric", "Triceps", 0],
    ["adelt", "Front delts", 1],
    ["pec", "Chest", 1],
    ["fore", "Forearms", 1]
  ],
  yaw: 38,
  pitch: 12,
  views: { three: 38 },
  view: { tg: [0, 66, -34], span: 235 }
};
