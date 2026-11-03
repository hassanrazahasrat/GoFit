import { mk, PI, cos, sin, add, mul, ease, ik, TORSO, THIGH, SHIN, FARM, UARM, NECK, HEAD, FOOT, HIPJ, HAND, KNEE, ELB, WRI, ANK, BAR } from "../viewer/anatomy-engine.js";

const CYCLE = 6;
const HIP_TOP = 95;
const HIP_LOW = 42;
const HIP_Z_TOP = 2;
const HIP_Z_LOW = -26;
const LEAN_TOP = 6 * PI / 180;
const LEAN_LOW = 32 * PI / 180;
const STANCE = 19;
const DB_HEAD = mk(1, 14, [[0, 8.5, 8.5, 8.5], [1, 8.5, 8.5, 8.5]], [], null);

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
  const P = [0, HIP_TOP + (HIP_LOW - HIP_TOP) * u, HIP_Z_TOP + (HIP_Z_LOW - HIP_Z_TOP) * u];
  const SC = add(P, mul(a, 44));
  const C = add(add(P, mul(a, 26)), mul(ut, 23));
  const o = [];
  function T(d, from, to, up, col) { o.push({ d: d, A: from, B: to, u: up, col: col || "musc" }); }
  const sg = [1, -1];
  T(TORSO, add(P, mul(a, -10)), add(P, mul(a, 50)), ut);
  const hl = lam * 0.45;
  const hd = [0, cos(hl), sin(hl)];
  const hu = [0, -sin(hl), cos(hl)];
  const NB = add(P, mul(a, 50));
  T(NECK, add(NB, mul(hd, -2)), add(NB, mul(hd, 7)), ut);
  T(HEAD, add(NB, mul(hd, 5)), add(NB, mul(hd, 25)), hu, "head");
  T(BAR, add(C, mul(a, -6)), add(C, mul(a, 6)), ut, "hub");
  T(DB_HEAD, add(C, mul(a, 6)), add(C, mul(a, 16)), ut, "pad");
  T(DB_HEAD, add(C, mul(a, -16)), add(C, mul(a, -6)), ut, "pad");
  for (let i = 0; i < 2; i++) {
    const s = sg[i];
    const S = add(SC, [s * 22, 0, 0]);
    const W = add(add(C, mul(a, 12)), [s * 9, 0, 0]);
    const r = ik(S, W, 30, 26, [s * 0.2, -1, 0.1]);
    T(UARM, S, r.E, mul(r.pole, -1));
    T(FARM, r.E, r.W, mul(r.pole, -1));
    T(ELB, add(r.E, [0, -4.2, 0]), add(r.E, [0, 4.2, 0]), [0, 0, 1], "tend");
    T(WRI, add(r.W, [-2.6, 0, 0]), add(r.W, [2.6, 0, 0]), [0, 1, 0], "tend");
    T(HAND, add(r.W, [-3.9, 0, 0]), add(r.W, [3.9, 0, 0]), [0, 1, 0], "tend");
  }
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
  o.pack = C;
  o.hip = add(P, [0, -3, 0]);
  return o;
}

const PATH = (function () {
  const c = [];
  const k = [];
  const h = [];
  for (let i = 0; i <= 16; i++) {
    const p = squatPose(i / 16);
    c.push(p.pack);
    k.push(p.knee[0]);
    h.push(p.hip);
  }
  return [c, k, h];
})();

export const DB_GOBLET_SQUAT_ANATOMY = {
  label: "3D goblet squat demonstration",
  cycle: CYCLE,
  phase: squatPhase,
  pose: squatPose,
  path: PATH,
  role: { quad: 0, glut: 0, ham: 1, erec: 1, abs: 1, calf: 1, bic: 1, brach: 1 },
  group: {
    quad: ["quad"],
    glut: ["glut"],
    ham: ["ham"],
    erec: ["erec"],
    abs: ["abs"],
    calf: ["calf"],
    bic: ["bic", "brach"]
  },
  phases: ["Set", "Descend", "Bottom", "Drive"],
  cues: [
    "Stand with your feet a little wider than your hips and your toes turned out slightly. Hold one dumbbell upright against your chest, cupping the top end with both hands and your elbows tucked in.",
    "Sit down between your knees and push your knees out over your toes. Keep your chest tall and the dumbbell tight to your chest.",
    "At the bottom keep your elbows inside your knees and your heels flat. Stop where you can keep your back flat.",
    "Drive your feet through the floor and stand up, keeping the dumbbell against your chest."
  ],
  muscles: [
    ["quad", "Quads", 0],
    ["glut", "Glutes", 0],
    ["ham", "Hamstrings", 1],
    ["erec", "Lower back", 1],
    ["abs", "Core", 1],
    ["bic", "Biceps (holding)", 1],
    ["calf", "Calves", 1]
  ],
  yaw: 38,
  pitch: 10,
  views: { three: 38 },
  view: { tg: [0, 86, 6], span: 245 }
};
