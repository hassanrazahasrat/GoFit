import { mk, cos, sin, sqrt, add, mul, ease, ik, TORSO, THIGH, SHIN, FARM, UARM, NECK, HEAD, FOOT, HIPJ, HAND, KNEE, ELB, WRI, ANK } from "../viewer/anatomy-engine.js";

const CYCLE = 6.4;
const ZS = 125;
const SC0 = [0, 60, ZS];
const NU_HOLD = 18.8 * Math.PI / 180;
const SAG = 14;
const LEG_REACH = 85;
const ELBOW_Y = 8;
const FRONT = [-1, 0, 0];
const MAT = mk(1, 18, [[0, 1.8, 1.8, 42], [1, 1.8, 1.8, 42]], [], null);

function sidePhase(t) {
  t = ((t % CYCLE) + CYCLE) % CYCLE;
  if (t < 0.7) return { u: 0, p: 0 };
  if (t < 2.3) return { u: ease((t - 0.7) / 1.6), p: 1 };
  if (t < 4.0) return { u: 1, p: 2 };
  if (t < 6.2) return { u: 1 - ease((t - 4.0) / 2.2), p: 3 };
  return { u: 0, p: 0 };
}

function sidePose(u) {
  const o = [];
  function T(d, from, to, up, col) { o.push({ d: d, A: from, B: to, u: up, col: col || "musc" }); }
  const Ph = [0, SC0[1] - 44 * sin(NU_HOLD), ZS - 44 * cos(NU_HOLD)];
  const P = [0, Ph[1] - SAG * (1 - u), Ph[2]];
  const dv = [0, SC0[1] - P[1], SC0[2] - P[2]];
  const l = sqrt(dv[1] * dv[1] + dv[2] * dv[2]);
  const a = [0, dv[1] / l, dv[2] / l];
  const SC = add(P, mul(a, 44));
  T(TORSO, add(P, mul(a, -10)), add(P, mul(a, 50)), FRONT);
  const NB = add(P, mul(a, 50));
  T(NECK, add(NB, mul(a, -2)), add(NB, mul(a, 7)), FRONT);
  T(HEAD, add(NB, mul(a, 5)), add(NB, mul(a, 25)), FRONT, "head");
  const Sb = add(SC, [0, -22, 0]);
  const Wb = [-25.8, ELBOW_Y, SC0[2]];
  const rb = ik(Sb, Wb, 30, 26, [1, -1, 0]);
  T(UARM, Sb, rb.E, mul(rb.pole, -1));
  T(FARM, rb.E, rb.W, mul(rb.pole, -1));
  T(ELB, add(rb.E, [0, 0, -4.2]), add(rb.E, [0, 0, 4.2]), FRONT, "tend");
  T(WRI, add(rb.W, [0, 0, -2.9]), add(rb.W, [0, 0, 2.9]), [0, 1, 0], "tend");
  T(HAND, add(rb.W, [-1, 0, -3.9]), add(rb.W, [-1, 0, 3.9]), [0, 1, 0], "tend");
  const St = add(SC, [0, 22, 0]);
  const rt = ik(St, [-6, P[1] + 18, P[2] + 4], 30, 26, [0.4, 1, -0.4]);
  T(UARM, St, rt.E, mul(rt.pole, -1));
  T(FARM, rt.E, rt.W, mul(rt.pole, -1));
  T(ELB, add(rt.E, [0, 0, -4.2]), add(rt.E, [0, 0, 4.2]), FRONT, "tend");
  T(WRI, add(rt.W, [0, 0, -2.9]), add(rt.W, [0, 0, 2.9]), FRONT, "tend");
  T(HAND, add(rt.W, [0, 0, -3.9]), add(rt.W, [0, 0, 3.9]), FRONT, "tend");
  const legs = [
    { hy: -9.5, ax: 0, ay: 8.5 },
    { hy: 9.5, ax: -6, ay: 17 }
  ];
  for (let i = 0; i < 2; i++) {
    const g = legs[i];
    const H = add(add(P, mul(a, -3)), [0, g.hy, 0]);
    const dy = H[1] - g.ay;
    const dx = H[0] - g.ax;
    const Ak = [g.ax, g.ay, H[2] - sqrt(LEG_REACH * LEG_REACH - dy * dy - dx * dx)];
    const r2 = ik(H, Ak, 44, 42, [-1, 0, 0]);
    T(HIPJ, add(H, [0, 0, -8.8]), add(H, [0, 0, 8.8]), FRONT);
    T(THIGH, H, r2.E, r2.pole);
    T(SHIN, r2.E, r2.W, r2.pole);
    T(KNEE, add(r2.E, [0, 0, -5.6]), add(r2.E, [0, 0, 5.6]), FRONT, "tend");
    T(ANK, add(Ak, [0, 0, -3.4]), add(Ak, [0, 0, 3.4]), FRONT, "tend");
    T(FOOT, add(Ak, [7, 0, -5]), add(Ak, [-17, 0, -5]), [0, 0, 1], "tend");
  }
  T(MAT, [0, 1.8, -40], [0, 1.8, 185], [0, 1, 0], "pad");
  o.hip = P;
  o.hand = rt.W;
  return o;
}

const PATH = (function () {
  const h = [];
  for (let i = 0; i <= 16; i++) h.push(sidePose(i / 16).hip);
  return [h];
})();

export const SIDE_PLANK_ANATOMY = {
  label: "3D side plank demonstration",
  cycle: CYCLE,
  phase: sidePhase,
  pose: sidePose,
  path: PATH,
  role: { abs: 0, glut: 1, adelt: 1, erec: 1 },
  group: {
    abs: ["abs"],
    glut: ["glut"],
    adelt: ["adelt"],
    erec: ["erec"]
  },
  phases: ["Set", "Lift", "Hold", "Lower"],
  cues: [
    "Lie on your side with your elbow directly under your shoulder and your feet stacked. Start with your hips resting low.",
    "Press your forearm into the floor and lift your hips until your body makes one straight line from head to heels. Rest your top hand on your hip.",
    "Hold the line and breathe steadily. Do not let your hips sink or roll forward, and keep your neck in line with your spine.",
    "Lower your hips under control and rest, then repeat on the other side."
  ],
  muscles: [
    ["abs", "Obliques & abs", 0],
    ["glut", "Glutes (hip abductors)", 1],
    ["adelt", "Shoulder stabilizers", 1],
    ["erec", "Lower back", 1]
  ],
  yaw: -38,
  pitch: 8,
  view: { tg: [0, 30, 66], span: 240 }
};
