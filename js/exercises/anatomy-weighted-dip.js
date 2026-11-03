import { mk, PI, cos, sin, add, mul, ease, ik, TORSO, THIGH, SHIN, FARM, UARM, NECK, HEAD, FOOT, HIPJ, HAND, KNEE, ELB, WRI, ANK, BAR } from "../viewer/anatomy-engine.js";

const CYCLE = 6;
const DROP = 21;
const LEAN_TOP = 6 * PI / 180;
const LEAN_LOW = 24 * PI / 180;
const HIP_Y = 87;
const GRIP = [24, 79.3, -10];
const BELT = mk(1, 12, [[0, 2.6, 2.6, 5.5], [1, 2.6, 2.6, 5.5]], [], null);
const CHAIN = mk(1, 6, [[0, 0.8, 0.8, 0.8], [1, 0.8, 0.8, 0.8]], [], null);
const WPLATE = mk(1, 20, [[0, 3.2, 3.2, 11], [1, 3.2, 3.2, 11]], [], null);
const POST = mk(1, 10, [[0, 2.2, 2.2, 2.2], [1, 2.2, 2.2, 2.2]], [], null);
const BASE = mk(1, 10, [[0, 2.6, 2.6, 2.6], [1, 2.6, 2.6, 2.6]], [], null);

function dipPhase(t) {
  t = ((t % CYCLE) + CYCLE) % CYCLE;
  if (t < 0.6) return { u: 0, p: 0 };
  if (t < 3.0) return { u: ease((t - 0.6) / 2.4), p: 1 };
  if (t < 3.8) return { u: 1, p: 2 };
  return { u: 1 - ease((t - 3.8) / 2.2), p: 3 };
}

function dipPose(u) {
  const lam = LEAN_TOP + (LEAN_LOW - LEAN_TOP) * u;
  const a = [0, cos(lam), sin(lam)];
  const ut = [0, -sin(lam), cos(lam)];
  const P = [0, HIP_Y - DROP * u, 0];
  const SC = add(P, mul(a, 44));
  const o = [];
  function T(d, A, B, up, col) { o.push({ d: d, A: A, B: B, u: up, col: col || "musc" }); }
  const sg = [1, -1];
  T(TORSO, add(P, mul(a, -10)), add(P, mul(a, 50)), ut);
  const hl = lam * 0.4;
  const hd = [0, cos(hl), sin(hl)];
  const hu = [0, -sin(hl), cos(hl)];
  const NB = add(P, mul(a, 50));
  T(NECK, add(NB, mul(hd, -2)), add(NB, mul(hd, 7)), ut);
  T(HEAD, add(NB, mul(hd, 5)), add(NB, mul(hd, 25)), hu, "head");
  o.E = [];
  for (let i = 0; i < 2; i++) {
    const s = sg[i];
    const S = add(SC, [s * 22, 0, 0]);
    const W = [s * GRIP[0], GRIP[1], GRIP[2]];
    const r = ik(S, W, 30, 26, [s * 0.2, 0, -1]);
    const up = mul(r.pole, -1);
    o.E[i] = r.E;
    T(UARM, S, r.E, up);
    T(FARM, r.E, r.W, up);
    T(ELB, add(r.E, [0, -4.2, 0]), add(r.E, [0, 4.2, 0]), [0, 0, 1], "tend");
    T(WRI, add(r.W, [0, -2.9, 0]), add(r.W, [0, 2.9, 0]), [0, 0, 1], "tend");
    T(HAND, add(r.W, [0, 0, -4.5]), add(r.W, [0, 0, 4.5]), [0, 1, 0], "tend");
  }
  o.sc = SC;
  for (let i = 0; i < 2; i++) {
    const s = sg[i];
    const x = s * GRIP[0];
    T(BAR, [x, GRIP[1], -26], [x, GRIP[1], 16], [0, 1, 0], "bar");
    T(POST, [x, GRIP[1], -26], [x, 2, -26], [1, 0, 0], "rig");
    T(POST, [x, GRIP[1], 16], [x, 2, 16], [1, 0, 0], "rig");
    T(BASE, [x, 2, -26], [x, 2, 16], [0, 1, 0], "rig");
  }
  const B0 = add(add(P, [0, -4, 0]), mul(ut, 14));
  const PC = add(B0, [0, -29, 7]);
  T(BELT, add(B0, [-17, 0, 0]), add(B0, [17, 0, 0]), ut, "pad");
  T(CHAIN, B0, add(PC, [0, 5, 0]), [1, 0, 0], "bar");
  T(WPLATE, add(PC, [-3.2, 0, 0]), add(PC, [3.2, 0, 0]), [0, 1, 0], "plate");
  for (let i = 0; i < 2; i++) {
    const s = sg[i];
    const H = add(P, [s * 9.5, -3, 0]);
    const Ak = [-s * 3, H[1] - 42, -28];
    const r2 = ik(H, Ak, 44, 42, [0, -0.1, 1]);
    T(HIPJ, add(H, [0, -8.8, 0]), add(H, [0, 8.8, 0]), [0, 0, 1]);
    T(THIGH, H, r2.E, r2.pole);
    T(SHIN, r2.E, r2.W, r2.pole);
    T(KNEE, add(r2.E, [0, -5.6, 0]), add(r2.E, [0, 5.6, 0]), [0, 0, 1], "tend");
    T(ANK, add(Ak, [0, -3.4, 0]), add(Ak, [0, 3.4, 0]), [0, 0, 1], "tend");
    T(FOOT, add(Ak, [0, -1, 0]), add(Ak, [-s * 0.5, -2, -17]), [0, 1, 0], "tend");
  }
  return o;
}

const PATH = (function () {
  const e0 = [];
  const e1 = [];
  const sc = [];
  for (let i = 0; i <= 16; i++) {
    const p = dipPose(i / 16);
    e0.push(p.E[0]);
    e1.push(p.E[1]);
    sc.push(p.sc);
  }
  return [e0, e1, sc];
})();

export const WEIGHTED_DIP_ANATOMY = {
  label: "3D weighted dip demonstration",
  cycle: CYCLE,
  phase: dipPhase,
  pose: dipPose,
  path: PATH,
  role: { tric: 0, pec: 1, adelt: 1 },
  group: {
    tric: ["tric"],
    pec: ["pec"],
    adelt: ["adelt"]
  },
  phases: ["Set", "Lower", "Bottom", "Press"],
  cues: [
    "Grip the handles with a weight belt or a dumbbell between your feet, lift yourself and straighten your arms with a soft elbow. Cross your ankles behind you and keep your shoulders down.",
    "Lower slowly by bending your elbows back, not out. Stay fairly upright and keep your elbows close to your sides.",
    "Pause when your upper arms are about parallel to the floor. Do not drop any deeper.",
    "Press through your palms until your arms are straight. Do not shrug and do not slam your elbows into lockout."
  ],
  muscles: [
    ["tric", "Triceps", 0],
    ["pec", "Lower chest", 1],
    ["adelt", "Front delts", 1]
  ],
  yaw: -38,
  pitch: 8,
  view: { tg: [0, 92, 0], span: 235 }
};
