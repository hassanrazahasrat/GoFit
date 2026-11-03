import { mk, PI, cos, sin, add, mul, lv, ease, ik, TORSO, THIGH, SHIN, FARM, UARM, NECK, HEAD, FOOT, HIPJ, HAND, KNEE, ELB, WRI, ANK, BAR } from "../viewer/anatomy-engine.js";

const CYCLE = 5.4;
const LAM = 45 * PI / 180;
const A = [0, cos(LAM), sin(LAM)];
const UT = [0, -sin(LAM), cos(LAM)];
const P = [0, 90, 0];
const SC = add(P, mul(A, 44));
const PAD = mk(1, 18, [[0, 3.5, 3.5, 15], [1, 3.5, 3.5, 15]], [], null);
const POST = mk(1, 10, [[0, 2.2, 2.2, 2.2], [1, 2.2, 2.2, 2.2]], [], null);
const DB_HEAD = mk(1, 14, [[0, 6.5, 6.5, 6.5], [1, 6.5, 6.5, 6.5]], [], null);

const HAND_LOW = [0, SC[1] - 55, SC[2] + 1];
const HAND_TOP = [0, SC[1] - 36, SC[2] - 12];

function rowPhase(t) {
  t = ((t % CYCLE) + CYCLE) % CYCLE;
  if (t < 0.6) return { u: 0, p: 0 };
  if (t < 1.8) return { u: ease((t - 0.6) / 1.2), p: 1 };
  if (t < 2.7) return { u: 1, p: 2 };
  if (t < 4.9) return { u: 1 - ease((t - 2.7) / 2.2), p: 3 };
  return { u: 0, p: 0 };
}

function rowPose(u) {
  const o = [];
  function T(d, from, to, up, col) { o.push({ d: d, A: from, B: to, u: up, col: col || "musc" }); }
  const sg = [1, -1];
  const sx = 22 - 2.4 * u;
  const bk = 0.4 + 2.4 * u;
  T(TORSO, add(P, mul(A, -10)), add(P, mul(A, 50)), UT);
  const hl = LAM - 0.2;
  const hd = [0, cos(hl), sin(hl)];
  const hu = [0, -sin(hl), cos(hl)];
  const NB = add(P, mul(A, 50));
  T(NECK, add(NB, mul(hd, -2)), add(NB, mul(hd, 7)), UT);
  T(HEAD, add(NB, mul(hd, 5)), add(NB, mul(hd, 25)), hu, "head");
  const g = lv(HAND_LOW, HAND_TOP, u);
  o.E = [];
  o.grips = [];
  for (let i = 0; i < 2; i++) {
    const s = sg[i];
    const S = add(add(SC, [s * sx, 0, 0]), mul(A, -bk));
    const W = [s * (24 + 3 * u), g[1], g[2]];
    const r = ik(S, W, 30, 26, [s * 0.5, 0.6, -1]);
    T(UARM, S, r.E, mul(r.pole, -1));
    T(FARM, r.E, r.W, mul(r.pole, -1));
    T(ELB, add(r.E, [0, -4.2, 0]), add(r.E, [0, 4.2, 0]), [0, 0, 1], "tend");
    T(WRI, add(r.W, [0, -3, 0]), add(r.W, [0, 3, 0]), [0, 0, 1], "tend");
    T(HAND, add(r.W, [0, -3.9, 0]), add(r.W, [0, 3.9, 0]), [0, 0, 1], "tend");
    T(BAR, add(r.W, [0, 0, -7.5]), add(r.W, [0, 0, 7.5]), [0, 1, 0], "bar");
    T(DB_HEAD, add(r.W, [0, 0, 7.5]), add(r.W, [0, 0, 14]), [0, 1, 0], "rig");
    T(DB_HEAD, add(r.W, [0, 0, -14]), add(r.W, [0, 0, -7.5]), [0, 1, 0], "rig");
    o.E[i] = r.E;
    o.grips[i] = r.W;
  }
  const pb = add(add(P, mul(A, -4)), mul(UT, 13.5));
  const pt = add(add(P, mul(A, 52)), mul(UT, 13.5));
  T(PAD, pb, pt, UT, "pad");
  T(POST, pb, [0, 2, pb[2] + 8], [1, 0, 0], "rig");
  T(POST, pt, [0, 2, pt[2] + 26], [1, 0, 0], "rig");
  T(POST, [0, 2, pb[2] - 18], [0, 2, pt[2] + 40], [0, 1, 0], "rig");
  T(POST, [-26, 2, pb[2] + 8], [26, 2, pb[2] + 8], [0, 1, 0], "rig");
  T(POST, [-26, 2, pt[2] + 26], [26, 2, pt[2] + 26], [0, 1, 0], "rig");
  for (let i = 0; i < 2; i++) {
    const s = sg[i];
    const H = add(P, [s * 9.5, -3, 0]);
    const Ak = [s * 16, 9, -12];
    const r2 = ik(H, Ak, 44, 42, [s * 0.2, 0, 1]);
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
  const g0 = [];
  const g1 = [];
  for (let i = 0; i <= 16; i++) {
    const p = rowPose(i / 16);
    e0.push(p.E[0]);
    e1.push(p.E[1]);
    g0.push(p.grips[0]);
    g1.push(p.grips[1]);
  }
  return [e0, e1, g0, g1];
})();

export const CHEST_ROW_ANATOMY = {
  label: "3D chest-supported row demonstration",
  cycle: CYCLE,
  phase: rowPhase,
  pose: rowPose,
  path: PATH,
  role: { lats: 0, trap: 0, rhomb: 0, infra: 0, teres: 0, rdelt: 0, bic: 1, brach: 1, fore: 1, utrap: 1 },
  group: {
    lats: ["lats"],
    trap: ["trap"],
    rhomb: ["rhomb"],
    scap: ["infra", "teres"],
    rdelt: ["rdelt"],
    bic: ["bic", "brach"],
    fore: ["fore"],
    utrap: ["utrap"]
  },
  phases: ["Set", "Pull", "Squeeze", "Lower"],
  cues: [
    "Lie face down on the incline pad with your chest supported and your feet on the floor. Hang the dumbbells straight down with your arms long.",
    "Pull both dumbbells toward your lower ribs. Lead with your elbows and drive them back and up. Keep your chest on the pad.",
    "Squeeze your shoulder blades together and pause for a second. Do not lift your chest off the pad.",
    "Lower the dumbbells slowly until your arms are straight, letting your shoulder blades spread apart."
  ],
  muscles: [
    ["lats", "Lats", 0],
    ["trap", "Mid & lower traps", 0],
    ["rhomb", "Rhomboids", 0],
    ["scap", "Infraspinatus & teres", 0],
    ["rdelt", "Rear delts", 0],
    ["bic", "Biceps & brachialis", 1],
    ["fore", "Forearms", 1],
    ["utrap", "Upper traps", 1]
  ],
  yaw: -38,
  pitch: 10,
  view: { tg: [0, 84, 24], span: 250 }
};
