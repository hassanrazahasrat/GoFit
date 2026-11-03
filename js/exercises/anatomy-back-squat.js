import { mk, PI, cos, sin, add, mul, ease, ik, TORSO, THIGH, SHIN, FARM, UARM, NECK, HEAD, FOOT, HIPJ, HAND, KNEE, ELB, WRI, ANK, BAR, PLATE, HUB } from "../viewer/anatomy-engine.js";

const CYCLE = 6;
const HIP_TOP = 95;
const HIP_LOW = 45;
const LEAN_TOP = 5 * PI / 180;
const LEAN_LOW = 44 * PI / 180;
const BAR_Z = -3;
const GRIP_X = 38;
const STANCE = 19;
const POST = mk(1, 10, [[0, 2.2, 2.2, 2.2], [1, 2.2, 2.2, 2.2]], [], null);

function squatPhase(t) {
  t = ((t % CYCLE) + CYCLE) % CYCLE;
  if (t < 0.8) return { u: 0, p: 0 };
  if (t < 3.4) return { u: ease((t - 0.8) / 2.6), p: 1 };
  if (t < 4.0) return { u: 1, p: 2 };
  return { u: 1 - ease((t - 4.0) / 2.0), p: 3 };
}

function squatPose(u) {
  const lam = LEAN_TOP + (LEAN_LOW - LEAN_TOP) * u;
  const a = [0, cos(lam), sin(lam)];
  const ut = [0, -sin(lam), cos(lam)];
  const P = [0, HIP_TOP + (HIP_LOW - HIP_TOP) * u, BAR_Z - 47 * sin(lam) + 11 * cos(lam)];
  const SC = add(P, mul(a, 44));
  const B = add(add(P, mul(a, 47)), mul(ut, -11));
  const o = [];
  function T(d, from, to, up, col) { o.push({ d: d, A: from, B: to, u: up, col: col || "musc" }); }
  const sg = [1, -1];
  T(TORSO, add(P, mul(a, -10)), add(P, mul(a, 50)), ut);
  const hl = lam * 0.55;
  const hd = [0, cos(hl), sin(hl)];
  const hu = [0, -sin(hl), cos(hl)];
  const NB = add(P, mul(a, 50));
  T(NECK, add(NB, mul(hd, -2)), add(NB, mul(hd, 7)), ut);
  T(HEAD, add(NB, mul(hd, 5)), add(NB, mul(hd, 25)), hu, "head");
  const wr = [];
  for (let i = 0; i < 2; i++) {
    const s = sg[i];
    const S = add(SC, [s * 22, 0, 0]);
    const r = ik(S, [s * GRIP_X, B[1], B[2]], 30, 26, [s * 0.3, -1, -0.5]);
    T(UARM, S, r.E, mul(r.pole, -1));
    T(FARM, r.E, r.W, mul(r.pole, -1));
    T(ELB, add(r.E, [0, -4.2, 0]), add(r.E, [0, 4.2, 0]), [0, 0, 1], "tend");
    T(WRI, add(r.W, [0, -3, 0]), add(r.W, [0, 3, 0]), [0, 0, 1], "tend");
    wr[i] = r.W;
  }
  for (let i = 0; i < 2; i++) T(HAND, [wr[i][0], B[1] - 3.9, B[2]], [wr[i][0], B[1] + 3.9, B[2]], [0, 0, 1], "tend");
  T(BAR, [-78, B[1], B[2]], [78, B[1], B[2]], [0, 1, 0], "bar");
  [[52, 56], [56.5, 60.5]].forEach(function (pair) {
    for (let k = 0; k < 2; k++) {
      const g = k ? -1 : 1;
      T(PLATE, [g * pair[0], B[1], B[2]], [g * pair[1], B[1], B[2]], [0, 1, 0], "plate");
    }
  });
  for (let i = 0; i < 2; i++) T(HUB, [sg[i] * 60.4, B[1], B[2]], [sg[i] * 61.2, B[1], B[2]], [0, 1, 0], "hub");
  for (let i = 0; i < 2; i++) {
    const s = sg[i];
    T(POST, [s * 72, 2, -48], [s * 72, 178, -48], [0, 0, 1], "rig");
    T(POST, [s * 72, 2, -48], [s * 72, 2, 34], [0, 1, 0], "rig");
    T(POST, [s * 72, 38, -48], [s * 72, 38, 26], [0, 1, 0], "rig");
    T(POST, [s * 72, 150, -48], [s * 72, 150, -34], [0, 1, 0], "rig");
  }
  T(POST, [-72, 178, -48], [72, 178, -48], [0, 1, 0], "rig");
  o.knee = [];
  for (let i = 0; i < 2; i++) {
    const s = sg[i];
    const H = add(P, [s * 9.5, -3, 0]);
    const Ak = [s * STANCE, 9, 0];
    const r2 = ik(H, Ak, 44, 42, [s * 0.25, 0, 1]);
    o.knee[i] = r2.E;
    T(HIPJ, add(H, [0, -8.8, 0]), add(H, [0, 8.8, 0]), [0, 0, 1]);
    T(THIGH, H, r2.E, r2.pole);
    T(SHIN, r2.E, r2.W, r2.pole);
    T(KNEE, add(r2.E, [0, -5.6, 0]), add(r2.E, [0, 5.6, 0]), [0, 0, 1], "tend");
    T(ANK, add(Ak, [0, -3.4, 0]), add(Ak, [0, 3.4, 0]), [0, 0, 1], "tend");
    T(FOOT, add(Ak, [s * 0.5, -5, -7]), add(Ak, [s * 2, -5, 19]), [0, 1, 0], "tend");
  }
  o.bar = B;
  o.hip = add(P, [0, -3, 0]);
  return o;
}

const PATH = (function () {
  const b = [];
  const k = [];
  const h = [];
  for (let i = 0; i <= 16; i++) {
    const p = squatPose(i / 16);
    b.push(add(p.bar, [-46, 0, 0]));
    k.push(p.knee[0]);
    h.push(p.hip);
  }
  return [b, k, h];
})();

export const BACK_SQUAT_ANATOMY = {
  label: "3D back squat demonstration",
  cycle: CYCLE,
  phase: squatPhase,
  pose: squatPose,
  path: PATH,
  role: { quad: 0, glut: 0, ham: 1, erec: 1, abs: 1, calf: 1 },
  group: {
    quad: ["quad"],
    glut: ["glut"],
    ham: ["ham"],
    erec: ["erec"],
    abs: ["abs"],
    calf: ["calf"]
  },
  phases: ["Set", "Descend", "Bottom", "Drive"],
  cues: [
    "Set the bar high on your upper traps with your feet about shoulder-width apart and toes slightly out. Take a big breath, brace your core and keep your chest up.",
    "Sit down and back by bending your knees and hips together. Keep your knees tracking over your toes and your heels flat on the floor.",
    "Go to a depth you can control, with your hips at or just below your knees. Keep your back flat and your core braced.",
    "Drive your feet through the floor and stand up with your chest up. The bar should travel straight up over your mid-foot."
  ],
  muscles: [
    ["quad", "Quads", 0],
    ["glut", "Glutes", 0],
    ["ham", "Hamstrings", 1],
    ["erec", "Lower back", 1],
    ["abs", "Core", 1],
    ["calf", "Calves", 1]
  ],
  yaw: 38,
  pitch: 10,
  views: { three: 38 },
  view: { tg: [0, 90, 0], span: 275 }
};
