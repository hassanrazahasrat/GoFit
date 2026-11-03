import { mk, PI, cos, sin, sqrt, add, mul, ease, ik, TORSO, THIGH, SHIN, FARM, UARM, NECK, HEAD, FOOT, HIPJ, HAND, KNEE, ELB, WRI, ANK } from "../viewer/anatomy-engine.js";

const CYCLE = 6;
const LEAN_TOP = 3 * PI / 180;
const LEAN_LOW = 62 * PI / 180;
const HIP_Y_TOP = 97.2;
const HIP_Y_LOW = 85;
const HIP_Z_LOW = -28;
const ARM = 54;
const GRIP_X = 7;
const STANCE = 13;
const PACK = mk(6, 18, [[0, 0.5, 0.5, 0.5], [0.04, 6.5, 6.5, 12], [0.12, 8, 8, 16.5], [0.88, 8, 8, 16.5], [0.96, 6.5, 6.5, 12], [1, 0.5, 0.5, 0.5]], [], null);
const POCKET = mk(4, 14, [[0, 0.5, 0.5, 0.5], [0.1, 3, 3, 7], [0.9, 3, 3, 7], [1, 0.5, 0.5, 0.5]], [], null);
const STRAP = mk(1, 8, [[0, 1.3, 1.3, 1.3], [1, 1.3, 1.3, 1.3]], [], null);

function rdlPhase(t) {
  t = ((t % CYCLE) + CYCLE) % CYCLE;
  if (t < 0.8) return { u: 0, p: 0 };
  if (t < 3.4) return { u: ease((t - 0.8) / 2.6), p: 1 };
  if (t < 4.0) return { u: 1, p: 2 };
  return { u: 1 - ease((t - 4.0) / 2.0), p: 3 };
}

function rdlPose(u) {
  const lam = LEAN_TOP + (LEAN_LOW - LEAN_TOP) * u;
  const a = [0, cos(lam), sin(lam)];
  const ut = [0, -sin(lam), cos(lam)];
  const P = [0, HIP_Y_TOP + (HIP_Y_LOW - HIP_Y_TOP) * u, HIP_Z_LOW * u];
  const SC = add(P, mul(a, 44));
  const dz = 22 - 8 * u;
  const dx = 22 - GRIP_X;
  const hy = SC[1] - sqrt(ARM * ARM - dz * dz - dx * dx);
  const hz = SC[2] + dz;
  const o = [];
  function T(d, from, to, up, col) { o.push({ d: d, A: from, B: to, u: up, col: col || "musc" }); }
  const sg = [1, -1];
  T(TORSO, add(P, mul(a, -10)), add(P, mul(a, 50)), ut);
  const hl = lam * 0.8;
  const hd = [0, cos(hl), sin(hl)];
  const hu = [0, -sin(hl), cos(hl)];
  const NB = add(P, mul(a, 50));
  T(NECK, add(NB, mul(hd, -2)), add(NB, mul(hd, 7)), ut);
  T(HEAD, add(NB, mul(hd, 5)), add(NB, mul(hd, 25)), hu, "head");
  for (let i = 0; i < 2; i++) {
    const s = sg[i];
    const S = add(SC, [s * 22, 0, 0]);
    const r = ik(S, [s * GRIP_X, hy, hz], 30, 26, [s * 0.3, 0, -1]);
    T(UARM, S, r.E, mul(r.pole, -1));
    T(FARM, r.E, r.W, mul(r.pole, -1));
    T(ELB, add(r.E, [0, -4.2, 0]), add(r.E, [0, 4.2, 0]), [0, 0, 1], "tend");
    T(WRI, add(r.W, [-2.6, 0, 0]), add(r.W, [2.6, 0, 0]), [0, 1, 0], "tend");
    T(HAND, add(r.W, [-3.9, 0, 0]), add(r.W, [3.9, 0, 0]), [0, 1, 0], "tend");
  }
  T(STRAP, [-GRIP_X, hy + 1, hz], [GRIP_X, hy + 1, hz], [0, 1, 0], "rig");
  T(PACK, [0, hy - 31, hz], [0, hy + 3, hz], [0, 0, 1], "pad");
  T(POCKET, [0, hy - 25, hz + 9], [0, hy - 9, hz + 9], [0, 0, 1], "rig");
  o.knee = [];
  for (let i = 0; i < 2; i++) {
    const s = sg[i];
    const H = add(P, [s * 9.5, -3, 0]);
    const Ak = [s * STANCE, 9, 0];
    const r2 = ik(H, Ak, 44, 42, [s * 0.15, 0, 1]);
    o.knee[i] = r2.E;
    T(HIPJ, add(H, [0, -8.8, 0]), add(H, [0, 8.8, 0]), [0, 0, 1]);
    T(THIGH, H, r2.E, r2.pole);
    T(SHIN, r2.E, r2.W, r2.pole);
    T(KNEE, add(r2.E, [0, -5.6, 0]), add(r2.E, [0, 5.6, 0]), [0, 0, 1], "tend");
    T(ANK, add(Ak, [0, -3.4, 0]), add(Ak, [0, 3.4, 0]), [0, 0, 1], "tend");
    T(FOOT, add(Ak, [s * 0.5, -5, -7]), add(Ak, [s * 1.5, -5, 17]), [0, 1, 0], "tend");
  }
  o.pack = [0, hy - 14, hz + 9];
  o.hip = add(P, [0, -3, 0]);
  return o;
}

const PATH = (function () {
  const b = [];
  const k = [];
  const h = [];
  for (let i = 0; i <= 16; i++) {
    const p = rdlPose(i / 16);
    b.push(p.pack);
    k.push(p.knee[0]);
    h.push(p.hip);
  }
  return [b, k, h];
})();

export const BACKPACK_RDL_ANATOMY = {
  label: "3D backpack Romanian deadlift demonstration",
  cycle: CYCLE,
  phase: rdlPhase,
  pose: rdlPose,
  path: PATH,
  role: { ham: 0, glut: 0, erec: 1, lats: 1, trap: 1, fore: 1 },
  group: {
    ham: ["ham"],
    glut: ["glut"],
    erec: ["erec"],
    lats: ["lats"],
    trap: ["trap", "utrap"],
    fore: ["fore"]
  },
  phases: ["Set", "Hinge", "Stretch", "Drive"],
  cues: [
    "Stand tall holding a loaded backpack by its top handle in front of your thighs. Soften your knees, brace your core and pull your shoulders back.",
    "Push your hips straight back as if closing a door behind you. Keep your back long and flat, the backpack close to your legs and your knees only slightly bent.",
    "Stop when you feel a deep stretch in your hamstrings, with the backpack around knee height. Do not round your back to go lower.",
    "Drive your hips forward and squeeze your glutes to stand tall. Keep the backpack dragging up your thighs and do not lean back at the top."
  ],
  muscles: [
    ["ham", "Hamstrings", 0],
    ["glut", "Glutes", 0],
    ["erec", "Lower back", 1],
    ["lats", "Lats", 1],
    ["trap", "Traps", 1],
    ["fore", "Forearms (grip)", 1]
  ],
  yaw: -38,
  pitch: 8,
  view: { tg: [0, 84, 6], span: 245 }
};
