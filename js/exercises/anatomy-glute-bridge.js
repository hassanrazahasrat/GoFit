import { PI, cos, sin, add, mul, ease, ik, TORSO, THIGH, SHIN, FARM, UARM, NECK, HEAD, FOOT, HIPJ, HAND, KNEE, ELB, WRI, ANK } from "../viewer/anatomy-engine.js";

const CYCLE = 5.4;
const LIFT = 30 * PI / 180;
const SHOULDER_Y = 10;
const SHOULDER_Z = -97.2;
const ANKLE_Z = 0;
const STANCE = 13;

function bridgePhase(t) {
  t = ((t % CYCLE) + CYCLE) % CYCLE;
  if (t < 0.6) return { u: 0, p: 0 };
  if (t < 1.9) return { u: ease((t - 0.6) / 1.3), p: 1 };
  if (t < 2.9) return { u: 1, p: 2 };
  if (t < 4.9) return { u: 1 - ease((t - 2.9) / 2), p: 3 };
  return { u: 0, p: 0 };
}

function bridgePose(u) {
  const th = LIFT * u;
  const a = [0, -sin(th), -cos(th)];
  const ut = [0, cos(th), -sin(th)];
  const SC = [0, SHOULDER_Y, SHOULDER_Z];
  const P = add(SC, mul(a, -44));
  const o = [];
  function T(d, from, to, up, col) { o.push({ d: d, A: from, B: to, u: up, col: col || "musc" }); }
  const sg = [1, -1];
  T(TORSO, add(P, mul(a, -10)), add(P, mul(a, 50)), ut);
  const NB = add(P, mul(a, 50));
  const headY = 10.5;
  T(NECK, add(NB, [0, 0, 2]), [0, headY, NB[2] - 7], ut);
  T(HEAD, [0, headY, NB[2] - 5], [0, headY, NB[2] - 25], [0, 1, 0], "head");
  for (let i = 0; i < 2; i++) {
    const s = sg[i];
    const S = add(SC, [s * 22, 0, 0]);
    const W = [s * 26, 5.4, SHOULDER_Z + 55];
    const r = ik(S, W, 30, 26, [0, 1, 0]);
    T(UARM, S, r.E, mul(r.pole, -1));
    T(FARM, r.E, r.W, mul(r.pole, -1));
    T(ELB, add(r.E, [0, -4.2, 0]), add(r.E, [0, 4.2, 0]), [0, 0, 1], "tend");
    T(WRI, add(r.W, [0, -2.6, 0]), add(r.W, [0, 2.6, 0]), [0, 0, 1], "tend");
    T(HAND, r.W, add(r.W, [0, 0, 8]), [0, 1, 0], "tend");
  }
  o.knee = [];
  for (let i = 0; i < 2; i++) {
    const s = sg[i];
    const H = add(P, [s * 9.5, -3, 0]);
    const Ak = [s * STANCE, 9, ANKLE_Z];
    const r2 = ik(H, Ak, 44, 42, [s * 0.1, 1, 0.2]);
    o.knee[i] = r2.E;
    T(HIPJ, add(H, [0, -8.8, 0]), add(H, [0, 8.8, 0]), [0, 0, 1]);
    T(THIGH, H, r2.E, r2.pole);
    T(SHIN, r2.E, r2.W, r2.pole);
    T(KNEE, add(r2.E, [0, -5.6, 0]), add(r2.E, [0, 5.6, 0]), [0, 0, 1], "tend");
    T(ANK, add(Ak, [0, -3.4, 0]), add(Ak, [0, 3.4, 0]), [0, 0, 1], "tend");
    T(FOOT, add(Ak, [s * 0.5, -5, -7]), add(Ak, [s * 1.5, -5, 17]), [0, 1, 0], "tend");
  }
  o.hip = add(P, [0, -3, 0]);
  return o;
}

const PATH = (function () {
  const h = [];
  const k = [];
  for (let i = 0; i <= 16; i++) {
    const p = bridgePose(i / 16);
    h.push(p.hip);
    k.push(p.knee[0]);
  }
  return [h, k];
})();

export const GLUTE_BRIDGE_ANATOMY = {
  label: "3D glute bridge demonstration",
  cycle: CYCLE,
  phase: bridgePhase,
  pose: bridgePose,
  path: PATH,
  role: { glut: 0, ham: 1, erec: 1, abs: 1 },
  group: {
    glut: ["glut"],
    ham: ["ham"],
    erec: ["erec"],
    abs: ["abs"]
  },
  phases: ["Set", "Lift", "Squeeze", "Lower"],
  cues: [
    "Lie on your back with your knees bent and your feet flat on the floor, about hip-width apart. Rest your arms by your sides and brace your core.",
    "Press through your heels and lift your hips until your body makes a straight line from your shoulders to your knees.",
    "Squeeze your glutes hard at the top for a second. Do not arch your lower back or push your ribs up.",
    "Lower your hips slowly back toward the floor with control."
  ],
  muscles: [
    ["glut", "Glutes", 0],
    ["ham", "Hamstrings", 1],
    ["erec", "Lower back", 1],
    ["abs", "Core", 1]
  ],
  yaw: 40,
  pitch: -14,
  views: { three: 40 },
  view: { tg: [0, 28, -55], span: 215 }
};
