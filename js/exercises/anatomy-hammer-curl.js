import { mk, PI, cos, sin, sqrt, add, mul, ease, ik, TORSO, THIGH, SHIN, FARM, UARM, NECK, HEAD, FOOT, HIPJ, HAND, KNEE, ELB, WRI, ANK, BAR } from "../viewer/anatomy-engine.js";

const CYCLE = 5.2;
const LEAN = 3 * PI / 180;
const A = [0, cos(LEAN), sin(LEAN)];
const UT = [0, -sin(LEAN), cos(LEAN)];
const P = [0, 92, -6];
const SC = add(P, mul(A, 44));
const HEAD_WEIGHT = mk(1, 12, [[0, 5.5, 5.5, 5.5], [1, 5.5, 5.5, 5.5]], [], null);

function curlPhase(t) {
  t = ((t % CYCLE) + CYCLE) % CYCLE;
  if (t < 0.5) return { u: 0, p: 0 };
  if (t < 1.9) return { u: ease((t - 0.5) / 1.4), p: 1 };
  if (t < 2.9) return { u: 1, p: 2 };
  return { u: 1 - ease((t - 2.9) / 2.3), p: 3 };
}

function unit(v) {
  const l = sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
}

function curlPose(u) {
  const o = [];
  function T(d, from, to, up, col) { o.push({ d: d, A: from, B: to, u: up, col: col || "musc" }); }
  const sg = [1, -1];
  const theta = (10 + 130 * u) * PI / 180;
  T(TORSO, add(P, mul(A, -10)), add(P, mul(A, 50)), UT);
  const NB = add(P, mul(A, 50));
  T(NECK, add(NB, mul(A, -2)), add(NB, mul(A, 7)), UT);
  T(HEAD, add(NB, mul(A, 5)), add(NB, mul(A, 25)), UT, "head");
  const grips = [];
  for (let i = 0; i < 2; i++) {
    const s = sg[i];
    const S = add(SC, [s * 22, 0, 0]);
    const E = add(S, mul(unit([s * 0.1, -0.95, 0.3]), 30));
    const f = unit([0, -cos(theta), sin(theta)]);
    const W = add(E, mul(f, 26));
    const g = add(W, mul(f, 4.5));
    T(UARM, S, E, [0, 0, 1]);
    T(FARM, E, W, [1, 0, 0]);
    T(ELB, add(E, [0, -4.2, 0]), add(E, [0, 4.2, 0]), [0, 0, 1], "tend");
    T(WRI, add(W, mul(f, -3)), add(W, mul(f, 3)), [1, 0, 0], "tend");
    T(HAND, W, add(W, mul(f, 9)), [1, 0, 0], "tend");
    const b = [0, sin(theta), cos(theta)];
    T(BAR, add(g, mul(b, -7)), add(g, mul(b, 7)), [1, 0, 0], "bar");
    T(HEAD_WEIGHT, add(g, mul(b, 7)), add(g, mul(b, 13)), [1, 0, 0], "rig");
    T(HEAD_WEIGHT, add(g, mul(b, -13)), add(g, mul(b, -7)), [1, 0, 0], "rig");
    grips[i] = g;
  }
  o.grips = grips;
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
    const p = curlPose(i / 16);
    g0.push(p.grips[0]);
    g1.push(p.grips[1]);
  }
  return [g0, g1];
})();

export const HAMMER_CURL_ANATOMY = {
  label: "3D hammer curl demonstration",
  cycle: CYCLE,
  phase: curlPhase,
  pose: curlPose,
  path: PATH,
  role: { bic: 0, brach: 0, fore: 0, adelt: 1 },
  group: {
    bic: ["bic", "brach"],
    fore: ["fore"],
    adelt: ["adelt"]
  },
  phases: ["Set", "Curl", "Squeeze", "Lower"],
  cues: [
    "Stand tall with a dumbbell in each hand and your palms facing each other. Keep your elbows pinned to your sides.",
    "Curl both dumbbells up with your thumbs pointing to the ceiling. Bend only your elbows and keep your upper arms still.",
    "Squeeze at the top for a second without turning your wrists.",
    "Lower the dumbbells slowly until your arms are almost straight. Do not swing your body."
  ],
  muscles: [
    ["bic", "Biceps & brachialis", 0],
    ["fore", "Brachioradialis (forearms)", 0],
    ["adelt", "Front delts", 1]
  ],
  yaw: 38,
  pitch: 10,
  views: { three: 38 },
  view: { tg: [0, 88, 6], span: 215 }
};
