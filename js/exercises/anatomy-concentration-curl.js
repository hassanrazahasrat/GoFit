import { mk, PI, cos, sin, sqrt, add, mul, lv, ease, ik, TORSO, THIGH, SHIN, FARM, UARM, NECK, HEAD, FOOT, HIPJ, HAND, KNEE, ELB, WRI, ANK } from "../viewer/anatomy-engine.js";

const CYCLE = 5.2;
const LEAN = -10 * PI / 180;
const A = [0, cos(LEAN), sin(LEAN)];
const UT = [0, -sin(LEAN), cos(LEAN)];
const P = [0, 52, 0];
const SC = add(P, mul(A, 44));
const HIP_Y = P[1] - 3;
const SEAT = mk(1, 18, [[0, 4, 4, 17], [1, 4, 4, 17]], [], null);
const POST = mk(1, 10, [[0, 2.2, 2.2, 2.2], [1, 2.2, 2.2, 2.2]], [], null);
const DB_HEAD = mk(1, 14, [[0, 6, 6, 6], [1, 6, 6, 6]], [], null);

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
  const theta = (15 + 125 * u) * PI / 180;
  T(TORSO, add(P, mul(A, -10)), add(P, mul(A, 50)), UT);
  const hl = LEAN * 0.5;
  const hd = [0, cos(hl), sin(hl)];
  const hu = [0, -sin(hl), cos(hl)];
  const NB = add(P, mul(A, 50));
  T(NECK, add(NB, mul(hd, -2)), add(NB, mul(hd, 7)), UT);
  T(HEAD, add(NB, mul(hd, 5)), add(NB, mul(hd, 25)), hu, "head");
  const grips = [];
  const WORK = 1;
  for (let i = 0; i < 2; i++) {
    const s = sg[i];
    const S = add(SC, [s * 22, 0, 0]);
    if (s === WORK) {
      const edir = unit([-s * 0.3, -0.72, 0.5]);
      const E = add(S, mul(edir, 30));
      const f = unit([0, -cos(theta), sin(theta) * 0.8 + 0.2]);
      const W = add(E, mul(f, 26));
      const n = unit(cross(f, [0, 1, 0]));
      const g = add(W, mul(f, 5));
      T(UARM, S, E, [0, 0, 1]);
      T(FARM, E, W, unit(cross(n, f)));
      T(ELB, add(E, [0, -4.2, 0]), add(E, [0, 4.2, 0]), [0, 0, 1], "tend");
      T(WRI, add(W, mul(f, -3)), add(W, mul(f, 3)), n, "tend");
      T(HAND, W, add(W, mul(f, 9)), n, "tend");
      T(DB_HEAD, add(g, mul(f, -4)), add(g, mul(f, 4)), n, "rig");
      T(DB_HEAD, add(g, mul(f, 4)), add(g, mul(f, 10)), n, "rig");
      T(DB_HEAD, add(g, mul(f, -10)), add(g, mul(f, -4)), n, "rig");
      grips[i] = g;
    } else {
      const W = [s * 12, HIP_Y + 4, 34];
      const r = ik(S, W, 30, 26, [s * 0.5, -0.5, 0.4]);
      T(UARM, S, r.E, mul(r.pole, -1));
      T(FARM, r.E, r.W, mul(r.pole, -1));
      T(ELB, add(r.E, [0, -4.2, 0]), add(r.E, [0, 4.2, 0]), [0, 0, 1], "tend");
      T(WRI, add(r.W, [0, -2.9, 0]), add(r.W, [0, 2.9, 0]), [0, 0, 1], "tend");
      T(HAND, add(r.W, [0, -3.9, 0]), add(r.W, [0, 3.9, 0]), [0, 0, 1], "tend");
      grips[i] = r.W;
    }
  }
  o.grips = grips;
  const seatY = HIP_Y - 13;
  T(SEAT, [0, seatY, -14], [0, seatY, 30], [0, 1, 0], "pad");
  T(POST, [0, seatY - 4, 8], [0, 2, 8], [1, 0, 0], "rig");
  T(POST, [0, seatY - 4, 26], [0, 2, 26], [1, 0, 0], "rig");
  for (let i = 0; i < 2; i++) {
    const s = sg[i];
    const H = add(P, [s * 9.5, -3, 0]);
    const Ak = [s * 16, 9, 44];
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
  const g0 = [];
  for (let i = 0; i <= 16; i++) {
    const p = curlPose(i / 16);
    g0.push(p.grips[1]);
  }
  return [g0];
})();

export const CONCENTRATION_CURL_ANATOMY = {
  label: "3D concentration curl demonstration",
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
    "Sit on a bench with your feet flat and your knees apart. Take a dumbbell in one hand and brace your elbow on the inside of the same-side thigh.",
    "Keeping your upper arm still against your thigh, curl the dumbbell up by bending only your elbow. Your palm turns up as you lift.",
    "Squeeze your bicep at the top for a second with your wrist straight.",
    "Lower the dumbbell slowly until your arm is almost straight, then repeat. Keep your elbow planted on your thigh the whole set."
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
