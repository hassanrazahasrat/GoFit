import { mk, PI, cos, sin, add, mul, ease, ik, TORSO, THIGH, SHIN, FARM, UARM, NECK, HEAD, FOOT, HIPJ, HAND, KNEE, ELB, WRI, ANK } from "../viewer/anatomy-engine.js";

const CYCLE = 7;
const BOX = 38;
const BOX_Z0 = 14;
const BOX_Z1 = 70;
const LEAD_Z = 40;
const LEAN_LOW = 16 * PI / 180;
const LEAN_TOP = 3 * PI / 180;
const HIP_LOW = [95, -2];
const HIP_TOP = [BOX + 9 + 86, LEAD_Z - 1];
const TRAIL_LOW = [9, -30];
const TRAIL_TOP = [76, 28];
const MAT = mk(1, 18, [[0, 1.8, 1.8, 40], [1, 1.8, 1.8, 40]], [], null);
const STEP = mk(1, 20, [[0, BOX / 2, BOX / 2, 26], [1, BOX / 2, BOX / 2, 26]], [], null);

function stepPhase(t) {
  t = ((t % CYCLE) + CYCLE) % CYCLE;
  if (t < 0.7) return { u: 0, p: 0 };
  if (t < 2.7) return { u: ease((t - 0.7) / 2.0), p: 1 };
  if (t < 3.5) return { u: 1, p: 2 };
  if (t < 6.0) return { u: 1 - ease((t - 3.5) / 2.5), p: 3 };
  return { u: 0, p: 0 };
}

function stepPose(u) {
  const o = [];
  function T(d, from, to, up, col) { o.push({ d: d, A: from, B: to, u: up, col: col || "musc" }); }
  const sg = [1, -1];
  const P = [0, HIP_LOW[0] + (HIP_TOP[0] - HIP_LOW[0]) * u, HIP_LOW[1] + (HIP_TOP[1] - HIP_LOW[1]) * u];
  const lean = LEAN_LOW + (LEAN_TOP - LEAN_LOW) * u;
  const a = [0, cos(lean), sin(lean)];
  const ut = [0, -sin(lean), cos(lean)];
  const SC = add(P, mul(a, 44));
  T(TORSO, add(P, mul(a, -10)), add(P, mul(a, 50)), ut);
  const hl = lean * 0.3;
  const hd = [0, cos(hl), sin(hl)];
  const hu = [0, -sin(hl), cos(hl)];
  const NB = add(P, mul(a, 50));
  T(NECK, add(NB, mul(hd, -2)), add(NB, mul(hd, 7)), ut);
  T(HEAD, add(NB, mul(hd, 5)), add(NB, mul(hd, 25)), hu, "head");
  for (let i = 0; i < 2; i++) {
    const s = sg[i];
    const S = add(SC, [s * 22, 0, 0]);
    const W = add(S, [s * 3, -54, 3]);
    const r = ik(S, W, 30, 26, [s * 0.2, 0, -1]);
    T(UARM, S, r.E, mul(r.pole, -1));
    T(FARM, r.E, r.W, mul(r.pole, -1));
    T(ELB, add(r.E, [0, -4.2, 0]), add(r.E, [0, 4.2, 0]), [0, 0, 1], "tend");
    T(WRI, add(r.W, [-2.6, 0, 0]), add(r.W, [2.6, 0, 0]), [0, 1, 0], "tend");
    T(HAND, add(r.W, [0, -3.9, 0]), add(r.W, [0, 3.9, 0]), [0, 0, 1], "tend");
  }
  const e = u;
  const ey = 1 - (1 - e) * (1 - e);
  const trail = [TRAIL_LOW[0] + (TRAIL_TOP[0] - TRAIL_LOW[0]) * ey, TRAIL_LOW[1] + (TRAIL_TOP[1] - TRAIL_LOW[1]) * e];
  const w = Math.min(1, e * 2);
  o.knee = null;
  for (let i = 0; i < 2; i++) {
    const s = sg[i];
    const lead = i === 0;
    const H = add(P, [s * 9.5, -3, 0]);
    const Ak = lead ? [s * 9, BOX + 9, LEAD_Z] : [s * 9, trail[0], trail[1]];
    const r2 = ik(H, Ak, 44, 42, [s * 0.1, -0.2, 1]);
    if (lead) o.knee = r2.E;
    const fw = lead ? 0 : w;
    T(HIPJ, add(H, [0, -8.8, 0]), add(H, [0, 8.8, 0]), [0, 0, 1]);
    T(THIGH, H, r2.E, r2.pole);
    T(SHIN, r2.E, r2.W, r2.pole);
    T(KNEE, add(r2.E, [0, -5.6, 0]), add(r2.E, [0, 5.6, 0]), [0, 0, 1], "tend");
    T(ANK, add(Ak, [0, -3.4, 0]), add(Ak, [0, 3.4, 0]), [0, 0, 1], "tend");
    T(FOOT, add(Ak, [s * 0.5, -5 + 6 * fw, -7 + 3 * fw]), add(Ak, [s * 1.5, -5 - 8 * fw, 17 - 6 * fw]), [0, 1, 0], "tend");
  }
  T(STEP, [0, BOX / 2, BOX_Z0], [0, BOX / 2, BOX_Z1], [0, 1, 0], "rig");
  T(MAT, [0, 1.8, -90], [0, 1.8, 130], [0, 1, 0], "pad");
  return o;
}

const PATH = (function () {
  const k = [];
  for (let i = 0; i <= 16; i++) k.push(stepPose(i / 16).knee);
  return [k];
})();

export const STEP_UP_ANATOMY = {
  label: "3D step-up demonstration",
  cycle: CYCLE,
  phase: stepPhase,
  pose: stepPose,
  path: PATH,
  role: { quad: 0, glut: 0, ham: 1, calf: 1 },
  group: {
    quad: ["quad"],
    glut: ["glut"],
    ham: ["ham"],
    calf: ["calf"]
  },
  phases: ["Set", "Drive", "Top", "Lower"],
  cues: [
    "Stand facing a sturdy box or bench and place one whole foot on it. Keep your chest up and your other foot light on the floor behind you.",
    "Drive through the heel of the foot on the box and stand up. Do not push off the back foot. Keep your knee tracking over your toes.",
    "Stand tall on the box with your hips level and your free knee lifted. Squeeze your glute at the top.",
    "Lower slowly by bending the working leg and tap the floor with your free foot. Keep your weight on the box foot, then repeat and switch sides after your reps."
  ],
  muscles: [
    ["quad", "Quads", 0],
    ["glut", "Glutes", 0],
    ["ham", "Hamstrings", 1],
    ["calf", "Calves", 1]
  ],
  yaw: -38,
  pitch: 6,
  view: { tg: [0, 86, 22], span: 330 }
};
