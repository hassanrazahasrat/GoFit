import { mk, PI, cos, sin, sqrt, add, mul, ease, ik, TORSO, THIGH, SHIN, FARM, UARM, NECK, HEAD, FOOT, HIPJ, HAND, KNEE, ELB, WRI, ANK } from "../viewer/anatomy-engine.js";

const CYCLE = 6;
const SEAT_Y = 45;
const EDGE_Z = 6;
const WRIST_Y = 51.5;
const WRIST_Z = 0;
const HAND_X = 21.5;
const SHOULDER_X = 22;
const SHOULDER_DZ = 22;
const REACH_TOP = 55.2;
const REACH_LOW = 40.8;
const ANKLE_Z = WRIST_Z + SHOULDER_DZ + 40;
const SLAB = mk(1, 18, [[0, 2.5, 2.5, 20], [1, 2.5, 2.5, 20]], [], null);
const POST = mk(1, 10, [[0, 2.2, 2.2, 2.2], [1, 2.2, 2.2, 2.2]], [], null);

function dipPhase(t) {
  t = ((t % CYCLE) + CYCLE) % CYCLE;
  if (t < 0.6) return { u: 0, p: 0 };
  if (t < 3.0) return { u: ease((t - 0.6) / 2.4), p: 1 };
  if (t < 3.8) return { u: 1, p: 2 };
  return { u: 1 - ease((t - 3.8) / 2.2), p: 3 };
}

function dipPose(u) {
  const o = [];
  function T(d, from, to, up, col) { o.push({ d: d, A: from, B: to, u: up, col: col || "musc" }); }
  const sg = [1, -1];
  const reach = REACH_TOP + (REACH_LOW - REACH_TOP) * u;
  const dx = SHOULDER_X - HAND_X;
  const sy = WRIST_Y + sqrt(reach * reach - SHOULDER_DZ * SHOULDER_DZ - dx * dx);
  const lam = (3 + 8 * u) * PI / 180;
  const a = [0, cos(lam), sin(lam)];
  const ut = [0, -sin(lam), cos(lam)];
  const SC = [0, sy, WRIST_Z + SHOULDER_DZ];
  const P = add(SC, mul(a, -44));
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
    const S = add(SC, [s * SHOULDER_X, 0, 0]);
    const W = [s * HAND_X, WRIST_Y, WRIST_Z];
    const r = ik(S, W, 30, 26, [s * 0.35, 0, -1]);
    const up = mul(r.pole, -1);
    o.E[i] = r.E;
    T(UARM, S, r.E, up);
    T(FARM, r.E, r.W, up);
    T(ELB, add(r.E, [0, -4.2, 0]), add(r.E, [0, 4.2, 0]), [0, 0, 1], "tend");
    T(WRI, add(r.W, [0, -2.9, 0]), add(r.W, [0, 2.9, 0]), [0, 0, 1], "tend");
    T(HAND, r.W, add(r.W, [0, 0, 8]), [0, 1, 0], "tend");
  }
  o.sc = SC;
  T(SLAB, [-27, SEAT_Y - 2.5, EDGE_Z - 18], [27, SEAT_Y - 2.5, EDGE_Z - 18], [0, 1, 0], "pad");
  for (let i = 0; i < 2; i++) {
    const s = sg[i];
    T(POST, [s * 25, 2, EDGE_Z - 3], [s * 25, SEAT_Y - 4, EDGE_Z - 3], [0, 0, 1], "rig");
    T(POST, [s * 25, 2, EDGE_Z - 35], [s * 25, 90, EDGE_Z - 35], [0, 0, 1], "rig");
  }
  T(POST, [-25, 88, EDGE_Z - 35], [25, 88, EDGE_Z - 35], [0, 1, 0], "rig");
  for (let i = 0; i < 2; i++) {
    const s = sg[i];
    const H = add(P, [s * 9.5, -3, 0]);
    const Ak = [s * 12, 9, ANKLE_Z];
    const r2 = ik(H, Ak, 44, 42, [0, 1, 0.2]);
    T(HIPJ, add(H, [0, -8.8, 0]), add(H, [0, 8.8, 0]), [0, 0, 1]);
    T(THIGH, H, r2.E, r2.pole);
    T(SHIN, r2.E, r2.W, r2.pole);
    T(KNEE, add(r2.E, [0, -5.6, 0]), add(r2.E, [0, 5.6, 0]), [0, 0, 1], "tend");
    T(ANK, add(Ak, [0, -3.4, 0]), add(Ak, [0, 3.4, 0]), [0, 0, 1], "tend");
    T(FOOT, add(Ak, [s * 0.5, -5, -7]), add(Ak, [s * 1.5, -5, 17]), [0, 1, 0], "tend");
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

export const CHAIR_DIP_ANATOMY = {
  label: "3D chair dip demonstration",
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
    "Sit on the edge of a sturdy chair or bench and grip the front edge beside your hips, with your feet flat on the floor. Slide your hips forward off the seat and straighten your arms with a soft elbow.",
    "Lower your hips straight down by bending your elbows back, not out. Keep your back close to the chair and your shoulders down.",
    "Pause when your elbows reach about 90°. Do not go deeper, because that strains the shoulders.",
    "Press through your palms until your arms are straight. Do not shrug and do not lock your elbows hard."
  ],
  muscles: [
    ["tric", "Triceps", 0],
    ["pec", "Lower chest", 1],
    ["adelt", "Front delts", 1]
  ],
  yaw: 35,
  pitch: 8,
  views: { three: 35 },
  view: { tg: [0, 62, 14], span: 200 }
};
