import { mk, PI, cos, sin, sqrt, add, mul, lv, ease, ik, TORSO, THIGH, SHIN, FARM, UARM, NECK, HEAD, FOOT, HIPJ, HAND, KNEE, ELB, WRI, ANK } from "../viewer/anatomy-engine.js";

const CYCLE = 6;
const LAM = 72 * PI / 180;
const HEAD_LAM = 36 * PI / 180;
const P = [0, 84, -24];
const A = [0, cos(LAM), sin(LAM)];
const UT = [0, -sin(LAM), cos(LAM)];
const SC = add(P, mul(A, 44));
const SHOULDER_X = 22;
const REACH = 55.2;
const SEAT_Y = 45;
const REST_Y = 51.5;
const REST_X = 16;
const REST_Z = SC[2] + sqrt(REACH * REACH - (SC[1] - REST_Y) * (SC[1] - REST_Y) - (SHOULDER_X - REST_X) * (SHOULDER_X - REST_X));
const SEAT_Z = REST_Z + 8;
const HANG = [-24, SC[1] - 54.6, SC[2]];
const TOP = [-27, 79, -16];
const SLAB = mk(1, 18, [[0, 2.5, 2.5, 20], [1, 2.5, 2.5, 20]], [], null);
const POST = mk(1, 10, [[0, 2.2, 2.2, 2.2], [1, 2.2, 2.2, 2.2]], [], null);
const PACK = mk(6, 18, [[0, 0.5, 0.5, 0.5], [0.04, 5, 5, 9], [0.12, 6, 6, 12.5], [0.88, 6, 6, 12.5], [0.96, 5, 5, 9], [1, 0.5, 0.5, 0.5]], [], null);
const POCKET = mk(4, 14, [[0, 0.5, 0.5, 0.5], [0.1, 3, 3, 7], [0.9, 3, 3, 7], [1, 0.5, 0.5, 0.5]], [], null);
const STRAP = mk(1, 8, [[0, 1.3, 1.3, 1.3], [1, 1.3, 1.3, 1.3]], [], null);

function rowPhase(t) {
  t = ((t % CYCLE) + CYCLE) % CYCLE;
  if (t < 0.7) return { u: 0, p: 0 };
  if (t < 2.2) return { u: ease((t - 0.7) / 1.5), p: 1 };
  if (t < 3.2) return { u: 1, p: 2 };
  if (t < 5.6) return { u: 1 - ease((t - 3.2) / 2.4), p: 3 };
  return { u: 0, p: 0 };
}

function rowPose(u) {
  const o = [];
  function T(d, from, to, up, col) { o.push({ d: d, A: from, B: to, u: up, col: col || "musc" }); }
  const sg = [1, -1];
  T(TORSO, add(P, mul(A, -10)), add(P, mul(A, 50)), UT);
  const hd = [0, cos(HEAD_LAM), sin(HEAD_LAM)];
  const hu = [0, -sin(HEAD_LAM), cos(HEAD_LAM)];
  const NB = add(P, mul(A, 50));
  T(NECK, add(NB, mul(hd, -2)), add(NB, mul(hd, 7)), UT);
  T(HEAD, add(NB, mul(hd, 5)), add(NB, mul(hd, 25)), hu, "head");
  const Sw = add(add(SC, [-SHOULDER_X, 0, 0]), mul(A, -2.4 * u));
  const Ww = lv(HANG, TOP, u);
  const rw = ik(Sw, Ww, 30, 26, [-0.3, 0.6, -1]);
  const upw = mul(rw.pole, -1);
  T(UARM, Sw, rw.E, upw);
  T(FARM, rw.E, rw.W, upw);
  T(ELB, add(rw.E, [0, -4.2, 0]), add(rw.E, [0, 4.2, 0]), [0, 0, 1], "tend");
  T(WRI, add(rw.W, [-2.6, 0, 0]), add(rw.W, [2.6, 0, 0]), [0, 1, 0], "tend");
  T(HAND, add(rw.W, [0, 0, -3.9]), add(rw.W, [0, 0, 3.9]), [1, 0, 0], "tend");
  const px = rw.W[0] - 2;
  T(STRAP, [px, rw.W[1] + 1, rw.W[2] - 7], [px, rw.W[1] + 1, rw.W[2] + 7], [0, 1, 0], "rig");
  T(PACK, [px, rw.W[1] - 27, rw.W[2]], [px, rw.W[1] + 3, rw.W[2]], [1, 0, 0], "hub");
  T(POCKET, [px - 5.5, rw.W[1] - 22, rw.W[2]], [px - 5.5, rw.W[1] - 9, rw.W[2]], [1, 0, 0], "rig");
  const Sr = add(SC, [SHOULDER_X, 0, 0]);
  const rr = ik(Sr, [REST_X, REST_Y, REST_Z], 30, 26, [0.35, 0, -1]);
  const upr = mul(rr.pole, -1);
  T(UARM, Sr, rr.E, upr);
  T(FARM, rr.E, rr.W, upr);
  T(ELB, add(rr.E, [0, -4.2, 0]), add(rr.E, [0, 4.2, 0]), [0, 0, 1], "tend");
  T(WRI, add(rr.W, [0, -2.9, 0]), add(rr.W, [0, 2.9, 0]), [0, 0, 1], "tend");
  T(HAND, rr.W, add(rr.W, [0, 0, 8]), [0, 1, 0], "tend");
  T(SLAB, [-27, SEAT_Y - 2.5, SEAT_Z], [27, SEAT_Y - 2.5, SEAT_Z], [0, 1, 0], "pad");
  for (let i = 0; i < 2; i++) {
    const s = sg[i];
    T(POST, [s * 25, 2, SEAT_Z - 16], [s * 25, SEAT_Y - 4, SEAT_Z - 16], [0, 0, 1], "rig");
    T(POST, [s * 25, 2, SEAT_Z + 16], [s * 25, SEAT_Y - 4, SEAT_Z + 16], [0, 0, 1], "rig");
  }
  for (let i = 0; i < 2; i++) {
    const s = sg[i];
    const H = add(P, [s * 9.5, -3, 0]);
    const Ak = [s * 13, 9, s < 0 ? -10 : 14];
    const r2 = ik(H, Ak, 44, 42, [s * 0.2, 0, 1]);
    T(HIPJ, add(H, [0, -8.8, 0]), add(H, [0, 8.8, 0]), [0, 0, 1]);
    T(THIGH, H, r2.E, r2.pole);
    T(SHIN, r2.E, r2.W, r2.pole);
    T(KNEE, add(r2.E, [0, -5.6, 0]), add(r2.E, [0, 5.6, 0]), [0, 0, 1], "tend");
    T(ANK, add(Ak, [0, -3.4, 0]), add(Ak, [0, 3.4, 0]), [0, 0, 1], "tend");
    T(FOOT, add(Ak, [s * 0.5, -5, -7]), add(Ak, [s * 1.5, -5, 17]), [0, 1, 0], "tend");
  }
  o.E = rw.E;
  o.W = rw.W;
  return o;
}

const PATH = (function () {
  const e = [];
  const w = [];
  for (let i = 0; i <= 16; i++) {
    const p = rowPose(i / 16);
    e.push(p.E);
    w.push(p.W);
  }
  return [e, w];
})();

export const ONE_ARM_BACKPACK_ROW_ANATOMY = {
  label: "3D one-arm backpack row demonstration",
  cycle: CYCLE,
  phase: rowPhase,
  pose: rowPose,
  path: PATH,
  role: { lats: 0, trap: 0, rhomb: 0, rdelt: 1, infra: 1, teres: 1, bic: 1, brach: 1, fore: 1, erec: 1 },
  group: {
    lats: ["lats"],
    trap: ["trap"],
    rhomb: ["rhomb"],
    rdelt: ["rdelt"],
    scap: ["infra", "teres"],
    bic: ["bic", "brach"],
    fore: ["fore"],
    erec: ["erec"]
  },
  phases: ["Set", "Pull", "Squeeze", "Lower"],
  cues: [
    "Rest one hand on a sturdy chair or table, hinge forward with a flat back, and let the loaded backpack hang from the other hand by its handle, directly under your shoulder.",
    "Pull the backpack toward your hip. Lead with your elbow, drive it up and back past your torso, and keep your hips and shoulders square to the floor.",
    "Squeeze your shoulder blade toward your spine and hold for a second. Do not twist your torso to lift the backpack.",
    "Lower the backpack slowly until your arm is fully stretched again. Keep your back flat the whole time."
  ],
  muscles: [
    ["lats", "Lats", 0],
    ["trap", "Mid & lower traps", 0],
    ["rhomb", "Rhomboids", 0],
    ["rdelt", "Rear delts", 1],
    ["scap", "Infraspinatus & teres", 1],
    ["bic", "Biceps & brachialis", 1],
    ["fore", "Forearms (grip)", 1],
    ["erec", "Lower back", 1]
  ],
  yaw: -38,
  pitch: 10,
  view: { tg: [0, 62, 22], span: 250 }
};
