import { mk, PI, cos, sin, add, mul, lv, ease, ik, TORSO, THIGH, SHIN, FARM, UARM, NECK, HEAD, FOOT, HIPJ, HAND, KNEE, ELB, WRI, ANK, BAR } from "../viewer/anatomy-engine.js";

const CYCLE = 6;
const BAR_Y = 214;
const GRIP_X = 30;
const SHOULDER_X = 22;
const REACH_HANG = 55;
const PHI_LOW = 4 * PI / 180;
const PHI_TOP = 100 * PI / 180;
const FLEX_LOW = 12 * PI / 180;
const FLEX_TOP = 108 * PI / 180;
const POST = mk(1, 10, [[0, 2.4, 2.4, 2.4], [1, 2.4, 2.4, 2.4]], [], null);

function kneePhase(t) {
  t = ((t % CYCLE) + CYCLE) % CYCLE;
  if (t < 0.7) return { u: 0, p: 0 };
  if (t < 2.4) return { u: ease((t - 0.7) / 1.7), p: 1 };
  if (t < 3.3) return { u: 1, p: 2 };
  if (t < 5.6) return { u: 1 - ease((t - 3.3) / 2.3), p: 3 };
  return { u: 0, p: 0 };
}

function kneePose(u) {
  const o = [];
  function T(d, from, to, up, col) { o.push({ d: d, A: from, B: to, u: up, col: col || "musc" }); }
  const sg = [1, -1];
  const lam = -(2 + 8 * u) * PI / 180;
  const a = [0, cos(lam), sin(lam)];
  const ut = [0, -sin(lam), cos(lam)];
  const sy = BAR_Y - REACH_HANG;
  const sz = -3;
  const SC = [0, sy, sz];
  const P = add(SC, mul(a, -44));
  T(TORSO, add(P, mul(a, -10)), add(P, mul(a, 50)), ut);
  const hl = lam * 0.2 + 0.1 * u;
  const hd = [0, cos(hl), sin(hl)];
  const hu = [0, -sin(hl), cos(hl)];
  const NB = add(P, mul(a, 50));
  T(NECK, add(NB, mul(hd, -2)), add(NB, mul(hd, 7)), ut);
  T(HEAD, add(NB, mul(hd, 5)), add(NB, mul(hd, 25)), hu, "head");
  o.E = [];
  o.grips = [];
  for (let i = 0; i < 2; i++) {
    const s = sg[i];
    const S = add(SC, [s * SHOULDER_X, 0, 0]);
    const W = [s * GRIP_X, BAR_Y - 3, 0];
    const r = ik(S, W, 30, 26, [s * 0.4, -1, 0.2]);
    o.E[i] = r.E;
    o.grips[i] = [W[0], BAR_Y, 0];
    T(UARM, S, r.E, mul(r.pole, -1));
    T(FARM, r.E, r.W, mul(r.pole, -1));
    T(ELB, add(r.E, [0, -4.2, 0]), add(r.E, [0, 4.2, 0]), [0, 0, 1], "tend");
    T(WRI, add(r.W, [0, -3, 0]), add(r.W, [0, 3, 0]), [0, 0, 1], "tend");
    T(HAND, [W[0], BAR_Y - 3.9, 0], [W[0], BAR_Y + 3.9, 0], [0, 0, 1], "tend");
  }
  T(BAR, [-62, BAR_Y, 0], [62, BAR_Y, 0], [0, 1, 0], "bar");
  for (let i = 0; i < 2; i++) {
    const s = sg[i];
    T(POST, [s * 62, 2, 0], [s * 62, BAR_Y + 2, 0], [0, 0, 1], "rig");
    T(POST, [s * 62, 2, -40], [s * 62, 2, 40], [1, 0, 0], "rig");
  }
  const phi = PHI_LOW + (PHI_TOP - PHI_LOW) * u;
  const psi = phi - (FLEX_LOW + (FLEX_TOP - FLEX_LOW) * u);
  o.K = [];
  for (let i = 0; i < 2; i++) {
    const s = sg[i];
    const H = add(P, [s * 9.5, -3, 0]);
    const K = add(H, [0, -44 * cos(phi), 44 * sin(phi)]);
    const Ak = add(K, [0, -42 * cos(psi), 42 * sin(psi)]);
    const r2 = ik(H, [Ak[0] + s * 0.5, Ak[1], Ak[2]], 44, 42, [s * 0.05, 0.25, 1]);
    o.K[i] = r2.E;
    T(HIPJ, add(H, [0, -8.8, 0]), add(H, [0, 8.8, 0]), [0, 0, 1]);
    T(THIGH, H, r2.E, r2.pole);
    T(SHIN, r2.E, r2.W, r2.pole);
    T(KNEE, add(r2.E, [0, -5.6, 0]), add(r2.E, [0, 5.6, 0]), [0, 0, 1], "tend");
    T(ANK, add(r2.W, [0, -3.4, 0]), add(r2.W, [0, 3.4, 0]), [0, 0, 1], "tend");
    T(FOOT, add(r2.W, [s * 0.5, -5, -4]), add(r2.W, [s * 1.5, -5, 14]), [0, 1, 0], "tend");
  }
  return o;
}

const PATH = (function () {
  const k0 = [];
  const k1 = [];
  for (let i = 0; i <= 16; i++) {
    const p = kneePose(i / 16);
    k0.push(p.K[0]);
    k1.push(p.K[1]);
  }
  return [k0, k1];
})();

export const HANGING_KNEE_RAISE_ANATOMY = {
  label: "3D hanging knee raise demonstration",
  cycle: CYCLE,
  phase: kneePhase,
  pose: kneePose,
  path: PATH,
  role: { abs: 0, quad: 1, fore: 1, lats: 1 },
  group: {
    abs: ["abs"],
    quad: ["quad"],
    fore: ["fore"],
    lats: ["lats"]
  },
  phases: ["Hang", "Raise", "Top", "Lower"],
  cues: [
    "Hang from the bar with an overhand grip, shoulders pulled down and legs together. Brace your abs so your body stays still.",
    "Curl your pelvis up and drive your knees toward your chest. Lift with your abs and do not swing your legs with momentum.",
    "Pause with your knees above hip height and your lower back slightly rounded. Keep your shoulders down and your torso quiet.",
    "Lower your legs slowly without swinging, keeping tension in your abs until you are back in a controlled hang."
  ],
  muscles: [
    ["abs", "Abs", 0],
    ["quad", "Hip flexors & quads", 1],
    ["fore", "Forearms (grip)", 1],
    ["lats", "Lats (stability)", 1]
  ],
  yaw: -38,
  pitch: 6,
  view: { tg: [0, 120, 10], span: 330 }
};
