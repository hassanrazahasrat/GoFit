import { mk, PI, cos, sin, add, mul, ease, ik, TORSO, THIGH, SHIN, FARM, UARM, NECK, HEAD, FOOT, HIPJ, HAND, KNEE, ELB, WRI, ANK, BAR } from "../viewer/anatomy-engine.js";

const CYCLE = 5.6;
const A = [0, 0, -1];
const UT = [0, -1, 0];
const P = [0, 56, 0];
const SC = add(P, [0, -2.5, -44]);
const SHOULDER_X = 22;
const KNEE_Z = 44;
const CURL_TOP = -8 * PI / 180;
const CURL_LOW = 100 * PI / 180;
const HEAD_DIR = [0, 0.42, -0.9];
const HEAD_UP = [0, -0.9, -0.42];
const GRIP = [20, 56, -82];
const PAD = mk(1, 18, [[0, 3.5, 3.5, 15], [1, 3.5, 3.5, 15]], [], null);
const POST = mk(1, 10, [[0, 2.2, 2.2, 2.2], [1, 2.2, 2.2, 2.2]], [], null);
const DB_HEAD = mk(1, 14, [[0, 6.5, 6.5, 6.5], [1, 6.5, 6.5, 6.5]], [], null);

function curlPhase(t) {
  t = ((t % CYCLE) + CYCLE) % CYCLE;
  if (t < 0.6) return { u: 0, p: 0 };
  if (t < 2.2) return { u: ease((t - 0.6) / 1.6), p: 1 };
  if (t < 3.2) return { u: 1, p: 2 };
  return { u: 1 - ease((t - 3.2) / 2.4), p: 3 };
}

function curlPose(u) {
  const gam = CURL_TOP + (CURL_LOW - CURL_TOP) * u;
  const d = [0, sin(gam), cos(gam)];
  const nn = [0, -cos(gam), sin(gam)];
  const o = [];
  function T(dd, from, to, up, col) { o.push({ d: dd, A: from, B: to, u: up, col: col || "musc" }); }
  const sg = [1, -1];
  T(TORSO, add(P, mul(A, -10)), add(P, mul(A, 50)), UT);
  const NB = add(P, mul(A, 50));
  T(NECK, add(NB, mul(A, -2)), add(NB, mul(HEAD_DIR, 7)), UT);
  T(HEAD, add(NB, mul(HEAD_DIR, 5)), add(NB, mul(HEAD_DIR, 25)), HEAD_UP, "head");
  for (let i = 0; i < 2; i++) {
    const s = sg[i];
    const S = add(SC, [s * SHOULDER_X, 0, 0]);
    const W = [s * GRIP[0], GRIP[1], GRIP[2]];
    const r = ik(S, W, 30, 26, [s * 0.6, 1, 0]);
    T(UARM, S, r.E, mul(r.pole, -1));
    T(FARM, r.E, r.W, mul(r.pole, -1));
    T(ELB, add(r.E, [0, -4.2, 0]), add(r.E, [0, 4.2, 0]), [0, 0, 1], "tend");
    T(WRI, add(r.W, [0, -2.9, 0]), add(r.W, [0, 2.9, 0]), [0, 0, 1], "tend");
    T(HAND, add(W, [0, -3.9, 0]), add(W, [0, 3.9, 0]), [0, 0, 1], "tend");
    T(POST, [W[0], 44, W[2]], [W[0], 64, W[2]], [0, 0, 1], "rig");
  }
  T(PAD, add(P, [0, -13.5, KNEE_Z + 2]), add(P, [0, -13.5, -88]), UT, "pad");
  T(POST, [0, P[1] - 15, 30], [0, 2, 30], [1, 0, 0], "rig");
  T(POST, [0, P[1] - 15, -70], [0, 2, -70], [1, 0, 0], "rig");
  T(POST, [0, 2, -95], [0, 2, 40], [0, 1, 0], "rig");
  T(POST, [-24, 2, 30], [24, 2, 30], [0, 1, 0], "rig");
  T(POST, [-24, 2, -70], [24, 2, -70], [0, 1, 0], "rig");
  o.heels = [];
  for (let i = 0; i < 2; i++) {
    const s = sg[i];
    const H = add(P, [s * 9.5, -3, 0]);
    const K = add(H, [s * 1.5, -1, KNEE_Z]);
    const Ak = add(K, mul(d, 42));
    o.heels[i] = Ak;
    T(HIPJ, add(H, [0, -8.8, 0]), add(H, [0, 8.8, 0]), [0, 0, 1]);
    T(THIGH, H, K, [0, -1, 0]);
    T(SHIN, K, Ak, nn);
    T(KNEE, add(K, [0, -5.6, 0]), add(K, [0, 5.6, 0]), [0, 0, 1], "tend");
    T(ANK, add(Ak, [0, -3.4, 0]), add(Ak, [0, 3.4, 0]), [0, 0, 1], "tend");
    T(FOOT, add(add(Ak, mul(d, 5)), mul(nn, -7)), add(add(Ak, mul(d, 5)), mul(nn, 17)), mul(d, -1), "tend");
  }
  const C = add(add(add(P, [0, -3 - 1, KNEE_Z]), mul(d, 47)), mul(nn, 5));
  T(BAR, add(C, mul(nn, -7.5)), add(C, mul(nn, 7.5)), [1, 0, 0], "bar");
  T(DB_HEAD, add(C, mul(nn, 7.5)), add(C, mul(nn, 14)), [1, 0, 0], "rig");
  T(DB_HEAD, add(C, mul(nn, -14)), add(C, mul(nn, -7.5)), [1, 0, 0], "rig");
  o.db = C;
  return o;
}

const PATH = (function () {
  const h = [];
  const c = [];
  for (let i = 0; i <= 16; i++) {
    const p = curlPose(i / 16);
    h.push(p.heels[0]);
    c.push(p.db);
  }
  return [h, c];
})();

export const DB_LEG_CURL_ANATOMY = {
  label: "3D dumbbell leg curl demonstration",
  cycle: CYCLE,
  phase: curlPhase,
  pose: curlPose,
  path: PATH,
  role: { ham: 0, calf: 1, glut: 1 },
  group: {
    ham: ["ham"],
    calf: ["calf"],
    glut: ["glut"]
  },
  phases: ["Set", "Curl", "Squeeze", "Lower"],
  cues: [
    "Lie face down on a flat bench with your knees just off the end. Pinch a dumbbell upright between your feet and hold the front of the bench.",
    "Curl your heels toward your glutes by bending only at the knees. Keep your hips pressed into the bench and your thighs still.",
    "Squeeze your hamstrings at the top for a second without letting your hips lift. Keep the dumbbell pinched firmly.",
    "Lower the dumbbell slowly until your legs are almost straight. Do not let it drop or swing."
  ],
  muscles: [
    ["ham", "Hamstrings", 0],
    ["calf", "Calves", 1],
    ["glut", "Glutes", 1]
  ],
  yaw: 38,
  pitch: 12,
  views: { three: 38 },
  view: { tg: [0, 60, -6], span: 255 }
};
