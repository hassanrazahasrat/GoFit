import { mk, cos, sin, sqrt, add, mul, ease, ik, TORSO, THIGH, SHIN, FARM, UARM, NECK, HEAD, FOOT, HIPJ, HAND, KNEE, ELB, WRI, ANK } from "../viewer/anatomy-engine.js";

const CYCLE = 6.4;
const ZS = 125;
const SC0 = [0, 38, ZS];
const NU_HOLD = 9.1 * Math.PI / 180;
const SAG = 9;
const LEG_REACH = 85;
const ANKLE_Y = 17;
const ELBOW_Y = 8;
const MAT = mk(1, 18, [[0, 1.8, 1.8, 42], [1, 1.8, 1.8, 42]], [], null);

function plankPhase(t) {
  t = ((t % CYCLE) + CYCLE) % CYCLE;
  if (t < 0.7) return { u: 0, p: 0 };
  if (t < 2.3) return { u: ease((t - 0.7) / 1.6), p: 1 };
  if (t < 4.0) return { u: 1, p: 2 };
  if (t < 6.2) return { u: 1 - ease((t - 4.0) / 2.2), p: 3 };
  return { u: 0, p: 0 };
}

function plankPose(u) {
  const o = [];
  function T(d, from, to, up, col) { o.push({ d: d, A: from, B: to, u: up, col: col || "musc" }); }
  const sg = [1, -1];
  const Ph = [0, SC0[1] - 44 * sin(NU_HOLD), ZS - 44 * cos(NU_HOLD)];
  const P = [0, Ph[1] - SAG * (1 - u), Ph[2]];
  const dv = [0, SC0[1] - P[1], SC0[2] - P[2]];
  const l = sqrt(dv[1] * dv[1] + dv[2] * dv[2]);
  const a = [0, dv[1] / l, dv[2] / l];
  const ut = [0, -a[2], a[1]];
  const SC = add(P, mul(a, 44));
  T(TORSO, add(P, mul(a, -10)), add(P, mul(a, 50)), ut);
  const NB = add(P, mul(a, 50));
  T(NECK, add(NB, mul(a, -2)), add(NB, mul(a, 7)), ut);
  T(HEAD, add(NB, mul(a, 5)), add(NB, mul(a, 25)), ut, "head");
  o.E = [];
  for (let i = 0; i < 2; i++) {
    const s = sg[i];
    const S = add(SC, [s * 22, 0, 0]);
    const W = [s * 19, ELBOW_Y, SC0[2] + 25.8];
    const r = ik(S, W, 30, 26, [0, -0.75, -0.66]);
    o.E[i] = r.E;
    T(UARM, S, r.E, mul(r.pole, -1));
    T(FARM, r.E, r.W, mul(r.pole, -1));
    T(ELB, add(r.E, [s * 0, 0, -4.2]), add(r.E, [0, 0, 4.2]), [0, -1, 0], "tend");
    T(WRI, add(r.W, [-2.9, 0, 0]), add(r.W, [2.9, 0, 0]), [0, -1, 0], "tend");
    T(HAND, add(r.W, [-3.9, 0, 1]), add(r.W, [3.9, 0, 1]), [0, -1, 0], "tend");
  }
  for (let i = 0; i < 2; i++) {
    const s = sg[i];
    const H = add(add(P, mul(a, -3)), [s * 9.5, 0, 0]);
    const ax = s * 9;
    const dy = H[1] - ANKLE_Y;
    const dx = H[0] - ax;
    const Ak = [ax, ANKLE_Y, H[2] - sqrt(LEG_REACH * LEG_REACH - dy * dy - dx * dx)];
    const r2 = ik(H, Ak, 44, 42, [0, -1, 0]);
    T(HIPJ, add(H, [0, 0, -8.8]), add(H, [0, 0, 8.8]), [0, -1, 0]);
    T(THIGH, H, r2.E, r2.pole);
    T(SHIN, r2.E, r2.W, r2.pole);
    T(KNEE, add(r2.E, [0, 0, -5.6]), add(r2.E, [0, 0, 5.6]), [0, -1, 0], "tend");
    T(ANK, add(Ak, [0, 0, -3.4]), add(Ak, [0, 0, 3.4]), [0, -1, 0], "tend");
    T(FOOT, add(Ak, [s * 0.5, 3, -3]), add(Ak, [s * 1.5, -13.5, 1]), [0, 0, 1], "tend");
  }
  T(MAT, [0, 1.8, -40], [0, 1.8, 185], [0, 1, 0], "pad");
  o.hip = P;
  return o;
}

const PATH = (function () {
  const h = [];
  const e0 = [];
  for (let i = 0; i <= 16; i++) {
    const p = plankPose(i / 16);
    h.push(p.hip);
    e0.push(p.E[0]);
  }
  return [h];
})();

export const PLANK_ANATOMY = {
  label: "3D plank demonstration",
  cycle: CYCLE,
  phase: plankPhase,
  pose: plankPose,
  path: PATH,
  role: { abs: 0, glut: 1, adelt: 1, quad: 1 },
  group: {
    abs: ["abs"],
    glut: ["glut"],
    adelt: ["adelt"],
    quad: ["quad"]
  },
  phases: ["Set", "Lift", "Hold", "Lower"],
  cues: [
    "Place your forearms on the floor with your elbows directly under your shoulders and your toes tucked. Start with your hips low.",
    "Lift your hips until your head, hips and heels make one straight line. Squeeze your glutes and pull your ribs down.",
    "Hold the line and breathe steadily. Do not let your hips sag or pike up, and keep your neck long by looking at the floor.",
    "Lower your hips under control to rest. Stop the set when your form breaks, not when your timer ends."
  ],
  muscles: [
    ["abs", "Abs & core", 0],
    ["glut", "Glutes", 1],
    ["adelt", "Shoulders", 1],
    ["quad", "Quads", 1]
  ],
  yaw: 50,
  pitch: 8,
  views: { three: 50 },
  view: { tg: [0, 30, 66], span: 235 }
};
