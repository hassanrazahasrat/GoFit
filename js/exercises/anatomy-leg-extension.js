import { mk, PI, cos, sin, add, mul, ease, ik, TORSO, THIGH, SHIN, FARM, UARM, NECK, HEAD, FOOT, HIPJ, HAND, KNEE, ELB, WRI, ANK, BAR, HUB } from "../viewer/anatomy-engine.js";

const CYCLE = 5.6;
const LEAN = -12 * PI / 180;
const CURL_TOP = 88 * PI / 180;
const CURL_LOW = -3 * PI / 180;
const P = [0, 60, 0];
const A = [0, cos(LEAN), sin(LEAN)];
const UT = [0, -sin(LEAN), cos(LEAN)];
const SC = add(P, mul(A, 44));
const HIP_Y = P[1] - 3;
const KNEE_Z = 44;
const PAD = mk(1, 18, [[0, 4, 4, 17], [1, 4, 4, 17]], [], null);
const BACK_PAD = mk(1, 18, [[0, 3.5, 3.5, 15], [1, 3.5, 3.5, 15]], [], null);
const ROLLER = mk(1, 16, [[0, 4.5, 4.5, 4.5], [1, 4.5, 4.5, 4.5]], [], null);
const POST = mk(1, 10, [[0, 2.2, 2.2, 2.2], [1, 2.2, 2.2, 2.2]], [], null);

function extPhase(t) {
  t = ((t % CYCLE) + CYCLE) % CYCLE;
  if (t < 0.6) return { u: 0, p: 0 };
  if (t < 2.2) return { u: ease((t - 0.6) / 1.6), p: 1 };
  if (t < 3.2) return { u: 1, p: 2 };
  return { u: 1 - ease((t - 3.2) / 2.4), p: 3 };
}

function extPose(u) {
  const phi = CURL_TOP + (CURL_LOW - CURL_TOP) * u;
  const d = [0, -sin(phi), cos(phi)];
  const n = [0, -cos(phi), -sin(phi)];
  const o = [];
  function T(dd, from, to, up, col) { o.push({ d: dd, A: from, B: to, u: up, col: col || "musc" }); }
  const sg = [1, -1];
  T(TORSO, add(P, mul(A, -10)), add(P, mul(A, 50)), UT);
  const hl = LEAN * 0.5;
  const hd = [0, cos(hl), sin(hl)];
  const hu = [0, -sin(hl), cos(hl)];
  const NB = add(P, mul(A, 50));
  T(NECK, add(NB, mul(hd, -2)), add(NB, mul(hd, 7)), UT);
  T(HEAD, add(NB, mul(hd, 5)), add(NB, mul(hd, 25)), hu, "head");
  for (let i = 0; i < 2; i++) {
    const s = sg[i];
    const S = add(SC, [s * 22, 0, 0]);
    const W = [s * 27, P[1] + 6, 10];
    const r = ik(S, W, 30, 26, [s * 0.5, -0.3, -1]);
    T(UARM, S, r.E, mul(r.pole, -1));
    T(FARM, r.E, r.W, mul(r.pole, -1));
    T(ELB, add(r.E, [0, -4.2, 0]), add(r.E, [0, 4.2, 0]), [0, 0, 1], "tend");
    T(WRI, add(r.W, [0, -2.9, 0]), add(r.W, [0, 2.9, 0]), [0, 0, 1], "tend");
    T(HAND, add(W, [0, 0, -4.5]), add(W, [0, 0, 4.5]), [0, 1, 0], "tend");
    T(BAR, add(W, [0, 0, -8]), add(W, [0, 0, 8]), [0, 1, 0], "bar");
    T(POST, add(W, [0, 0, -8]), [s * 27, 2, W[2] - 8], [1, 0, 0], "rig");
  }
  const seatY = HIP_Y - 13;
  T(PAD, [0, seatY, -16], [0, seatY, 40], [0, 1, 0], "pad");
  T(POST, [0, seatY - 4, 10], [0, 2, 10], [1, 0, 0], "rig");
  const bp = add(add(P, mul(A, -4)), mul(UT, -13.5));
  T(BACK_PAD, bp, add(add(P, mul(A, 72)), mul(UT, -13.5)), UT, "pad");
  T(POST, bp, [0, 2, -34], [1, 0, 0], "rig");
  T(POST, [0, 2, -34], [0, 2, 70], [1, 0, 0], "rig");
  T(POST, [-27, 2, 2], [27, 2, 2], [0, 1, 0], "rig");
  const holdY = HIP_Y + 14;
  T(ROLLER, [-17, holdY, 40], [17, holdY, 40], [0, 1, 0], "pad");
  const knees = [];
  for (let i = 0; i < 2; i++) {
    const s = sg[i];
    const H = [s * 9.5, HIP_Y, 0];
    const K = [s * 9.5, HIP_Y, KNEE_Z];
    const W = add(K, mul(d, 42));
    knees[i] = K;
    T(HIPJ, add(H, [0, -8.8, 0]), add(H, [0, 8.8, 0]), [0, 0, 1]);
    T(THIGH, H, K, [-s * 0.45, 0.89, 0]);
    T(SHIN, K, W, mul(n, -1));
    T(KNEE, add(K, [0, -5.6, 0]), add(K, [0, 5.6, 0]), [0, 0, 1], "tend");
    T(ANK, add(W, [0, -3.4, 0]), add(W, [0, 3.4, 0]), [0, 0, 1], "tend");
    T(FOOT, add(add(W, mul(n, 2.5)), mul(d, -1.5)), add(W, mul(n, -17)), mul(d, -1), "tend");
    const Pv = [s * 22, K[1], K[2]];
    const R = add(add(K, mul(d, 37)), mul(n, -8));
    const Rend = [s * 22, R[1], R[2]];
    T(HUB, Pv, [s * 25, Pv[1], Pv[2]], [0, 1, 0], "hub");
    T(POST, Pv, Rend, [1, 0, 0], "rig");
    T(POST, Pv, [s * 38, Pv[1], 42], [0, 1, 0], "rig");
    T(POST, [s * 17, holdY, 40], [s * 38, holdY, 42], [0, 1, 0], "rig");
    T(POST, [s * 38, 2, 42], [s * 38, holdY, 42], [0, 0, 1], "rig");
  }
  T(POST, [-38, 2, 42], [38, 2, 42], [0, 1, 0], "rig");
  const R2 = add(add([0, HIP_Y, KNEE_Z], mul(d, 37)), mul(n, -8));
  T(ROLLER, [-22, R2[1], R2[2]], [22, R2[1], R2[2]], [0, 1, 0], "pad");
  o.heel = add(add([9.5, HIP_Y, KNEE_Z], mul(d, 42)), mul(n, 2.5));
  o.knee = knees;
  return o;
}

const PATH = (function () {
  const h = [];
  for (let i = 0; i <= 16; i++) h.push(extPose(i / 16).heel);
  return [h];
})();

export const LEG_EXTENSION_ANATOMY = {
  label: "3D leg extension demonstration",
  cycle: CYCLE,
  phase: extPhase,
  pose: extPose,
  path: PATH,
  role: { quad: 0, tib: 1 },
  group: {
    quad: ["quad"],
    tib: ["tib"]
  },
  phases: ["Set", "Extend", "Squeeze", "Lower"],
  cues: [
    "Sit back against the pad with your knees lined up with the machine pivot and the roller resting on the front of your lower shins. Grip the handles and keep your hips pinned to the seat.",
    "Straighten your knees by lifting the roller in a smooth arc. Keep your hips down and do not swing or kick the weight up.",
    "Squeeze your quads hard for a second at the top without snapping your knees into lockout.",
    "Lower the roller slowly back to the start until your shins are vertical. Do not let the weight stack drop."
  ],
  muscles: [
    ["quad", "Quads", 0],
    ["tib", "Shins", 1]
  ],
  yaw: -38,
  pitch: 4,
  view: { tg: [0, 68, 26], span: 250 }
};
