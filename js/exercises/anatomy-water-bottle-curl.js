import { mk, PI, cos, sin, sqrt, add, mul, ease, ik, TORSO, THIGH, SHIN, FARM, UARM, NECK, HEAD, FOOT, HIPJ, HAND, KNEE, ELB, WRI, ANK, BAR } from "../viewer/anatomy-engine.js";

const CYCLE = 5.2;
const LEAN = 3 * PI / 180;
const A = [0, cos(LEAN), sin(LEAN)];
const UT = [0, -sin(LEAN), cos(LEAN)];
const P = [0, 92, -6];
const SC = add(P, mul(A, 44));
const BOTTLE = mk(1, 14, [[0, 3.9, 3.9, 3.9], [1, 3.9, 3.9, 3.9]], [], null);
const CAP = mk(1, 10, [[0, 1.8, 1.8, 1.8], [1, 1.8, 1.8, 1.8]], [], null);

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

function cross(a, b) {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

function curlPose(u) {
  const o = [];
  function T(d, from, to, up, col) { o.push({ d: d, A: from, B: to, u: up, col: col || "musc" }); }
  const sg = [1, -1];
  const theta = (12 + 128 * u) * PI / 180;
  T(TORSO, add(P, mul(A, -10)), add(P, mul(A, 50)), UT);
  const NB = add(P, mul(A, 50));
  T(NECK, add(NB, mul(A, -2)), add(NB, mul(A, 7)), UT);
  T(HEAD, add(NB, mul(A, 5)), add(NB, mul(A, 25)), UT, "head");
  const grips = [];
  for (let i = 0; i < 2; i++) {
    const s = sg[i];
    const S = add(SC, [s * 22, 0, 0]);
    const E = add(S, mul(unit([s * 0.05, -0.95, 0.33]), 30));
    const f = unit([0, -cos(theta), sin(theta)]);
    const W = add(E, mul(f, 26));
    const n = unit(cross(f, [0, 1, 0]));
    const g = add(W, mul(f, 5));
    T(UARM, S, E, [0, 0, 1]);
    T(FARM, E, W, unit(cross(n, f)));
    T(ELB, add(E, [0, -4.2, 0]), add(E, [0, 4.2, 0]), [0, 0, 1], "tend");
    T(WRI, add(W, mul(f, -3)), add(W, mul(f, 3)), n, "tend");
    T(HAND, W, add(W, mul(f, 9)), n, "tend");
    T(BOTTLE, [g[0] - s * 11, g[1], g[2]], [g[0] + s * 5, g[1], g[2]], [0, 1, 0], "hub");
    T(CAP, [g[0] + s * 5, g[1], g[2]], [g[0] + s * 10, g[1], g[2]], [0, 1, 0], "pad");
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

export const WATER_BOTTLE_CURL_ANATOMY = {
  label: "3D water-bottle curl demonstration",
  cycle: CYCLE,
  phase: curlPhase,
  pose: curlPose,
  path: PATH,
  role: { bic: 0, brach: 0, fore: 1, adelt: 1 },
  group: {
    bic: ["bic", "brach"],
    fore: ["fore"],
    adelt: ["adelt"]
  },
  phases: ["Set", "Curl", "Squeeze", "Lower"],
  cues: [
    "Stand tall with your feet hip-width apart and a filled water bottle in each hand, palms facing forward. Pin your elbows to your sides.",
    "Curl both bottles up by bending only your elbows. Keep your upper arms still and do not swing your body.",
    "Squeeze your biceps at the top for a second with your wrists straight.",
    "Lower the bottles slowly until your arms are almost straight. Keep your elbows by your sides."
  ],
  muscles: [
    ["bic", "Biceps & brachialis", 0],
    ["fore", "Forearms", 1],
    ["adelt", "Front delts", 1]
  ],
  yaw: 38,
  pitch: 10,
  views: { three: 38 },
  view: { tg: [0, 88, 6], span: 215 }
};
