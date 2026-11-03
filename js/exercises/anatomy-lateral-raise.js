import { mk, PI, cos, sin, sqrt, add, mul, ease, ik, TORSO, THIGH, SHIN, FARM, UARM, NECK, HEAD, FOOT, HIPJ, HAND, KNEE, ELB, WRI, ANK, BAR } from "../viewer/anatomy-engine.js";

const CYCLE = 5.4;
const LEAN = 5 * PI / 180;
const A = [0, cos(LEAN), sin(LEAN)];
const UT = [0, -sin(LEAN), cos(LEAN)];
const P = [0, 92, -5];
const SC = add(P, mul(A, 44));
const REACH = 54.5;
const HEAD_WEIGHT = mk(1, 12, [[0, 5.5, 5.5, 5.5], [1, 5.5, 5.5, 5.5]], [], null);

function raisePhase(t) {
  t = ((t % CYCLE) + CYCLE) % CYCLE;
  if (t < 0.6) return { u: 0, p: 0 };
  if (t < 2.1) return { u: ease((t - 0.6) / 1.5), p: 1 };
  if (t < 3.0) return { u: 1, p: 2 };
  return { u: 1 - ease((t - 3.0) / 2.4), p: 3 };
}

function unit(v) {
  const l = sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
}

function raisePose(u) {
  const o = [];
  function T(d, from, to, up, col) { o.push({ d: d, A: from, B: to, u: up, col: col || "musc" }); }
  const sg = [1, -1];
  const ang = (6 + 82 * u) * PI / 180;
  T(TORSO, add(P, mul(A, -10)), add(P, mul(A, 50)), UT);
  const NB = add(P, mul(A, 50));
  T(NECK, add(NB, mul(A, -2)), add(NB, mul(A, 7)), UT);
  T(HEAD, add(NB, mul(A, 5)), add(NB, mul(A, 25)), UT, "head");
  o.E = [];
  o.grips = [];
  for (let i = 0; i < 2; i++) {
    const s = sg[i];
    const S = add(SC, [s * 22, 0, 0]);
    const dir = unit([s * sin(ang), -cos(ang), 0.28 * sin(ang)]);
    const Wt = add(S, mul(dir, REACH));
    const r = ik(S, Wt, 30, 26, [s * 0.4, 0.6, -0.3]);
    const W = r.W;
    const f = unit([W[0] - r.E[0], W[1] - r.E[1], W[2] - r.E[2]]);
    const g = add(W, mul(f, 4.5));
    T(UARM, S, r.E, [0, 0, 1]);
    T(FARM, r.E, W, [0, 0, 1]);
    T(ELB, add(r.E, [0, -4.2, 0]), add(r.E, [0, 4.2, 0]), [0, 0, 1], "tend");
    T(WRI, add(W, mul(f, -3)), add(W, mul(f, 3)), [0, 0, 1], "tend");
    T(HAND, W, add(W, mul(f, 9)), [0, 0, 1], "tend");
    T(BAR, [g[0], g[1], g[2] - 7], [g[0], g[1], g[2] + 7], [0, 1, 0], "bar");
    T(HEAD_WEIGHT, [g[0], g[1], g[2] + 7], [g[0], g[1], g[2] + 13], [0, 1, 0], "rig");
    T(HEAD_WEIGHT, [g[0], g[1], g[2] - 13], [g[0], g[1], g[2] - 7], [0, 1, 0], "rig");
    o.E[i] = r.E;
    o.grips[i] = g;
  }
  for (let i = 0; i < 2; i++) {
    const s = sg[i];
    const H = add(P, [s * 9.5, -3, 0]);
    const Ak = [s * 12, 9, 0];
    const r2 = ik(H, Ak, 44, 42, [s * 0.2, 0, 1]);
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
    const p = raisePose(i / 16);
    g0.push(p.grips[0]);
    g1.push(p.grips[1]);
  }
  return [g0, g1];
})();

export const LATERAL_RAISE_ANATOMY = {
  label: "3D dumbbell lateral raise demonstration",
  cycle: CYCLE,
  phase: raisePhase,
  pose: raisePose,
  path: PATH,
  role: { ldelt: 0, adelt: 1, utrap: 1 },
  group: {
    ldelt: ["ldelt"],
    adelt: ["adelt"],
    utrap: ["utrap"]
  },
  phases: ["Set", "Raise", "Peak", "Lower"],
  cues: [
    "Stand tall with a dumbbell in each hand at your sides. Keep a soft bend in your elbows and your shoulders down and back.",
    "Raise both arms out to the sides, leading with your elbows. Keep your shoulders away from your ears and do not swing your body.",
    "Stop when your arms are about level with your shoulders, with your hands no higher than your elbows.",
    "Lower the dumbbells slowly along the same arc until they are back at your sides."
  ],
  muscles: [
    ["ldelt", "Side delts", 0],
    ["adelt", "Front delts", 1],
    ["utrap", "Upper traps", 1]
  ],
  yaw: 28,
  pitch: 8,
  views: { three: 28 },
  view: { tg: [0, 90, 0], span: 235 }
};

export const WATER_BOTTLE_LATERAL_RAISE_ANATOMY = Object.assign({}, LATERAL_RAISE_ANATOMY, {
  label: "3D water-bottle lateral raise demonstration",
  cues: [
    "Stand tall with a filled water bottle in each hand at your sides. Keep a soft bend in your elbows and your shoulders down and back.",
    "Raise both arms out to the sides, leading with your elbows. Keep your shoulders away from your ears and do not swing your body.",
    "Stop when your arms are about level with your shoulders, with your hands no higher than your elbows.",
    "Lower the bottles slowly along the same arc until they are back at your sides."
  ]
});
