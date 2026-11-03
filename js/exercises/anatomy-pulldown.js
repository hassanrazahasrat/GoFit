import { mk, PI, cos, sin, add, mul, lv, ease, ik, TORSO, THIGH, SHIN, FARM, UARM, NECK, HEAD, FOOT, HIPJ, HAND, KNEE, ELB, WRI, ANK, BAR } from "../viewer/anatomy-engine.js";

const CYCLE = 6;
const SEAT = mk(1, 18, [[0, 4, 4, 17], [1, 4, 4, 17]], [], null);
const THIGH_PAD = mk(1, 16, [[0, 4.5, 4.5, 4.5], [1, 4.5, 4.5, 4.5]], [], null);
const POST = mk(1, 10, [[0, 2.2, 2.2, 2.2], [1, 2.2, 2.2, 2.2]], [], null);
const CABLE = mk(1, 6, [[0, 0.8, 0.8, 0.8], [1, 0.8, 0.8, 0.8]], [], null);

const GRIP_X = 36;
const BAR_TOP = [0, 160, 4];
const BAR_LOW = [0, 98, -5];

function pulldownPhase(t) {
  t = ((t % CYCLE) + CYCLE) % CYCLE;
  if (t < 0.6) return { u: 0, p: 0 };
  if (t < 2.0) return { u: ease((t - 0.6) / 1.4), p: 1 };
  if (t < 3.0) return { u: 1, p: 2 };
  if (t < 5.4) return { u: 1 - ease((t - 3.0) / 2.4), p: 3 };
  return { u: 0, p: 0 };
}

function pulldownPose(u) {
  const lam = -(4 + 11 * u) * PI / 180;
  const a = [0, cos(lam), sin(lam)];
  const ut = [0, -sin(lam), cos(lam)];
  const P = [0, 57, -10];
  const o = [];
  function T(d, A, B, up, col) { o.push({ d: d, A: A, B: B, u: up, col: col || "musc" }); }
  const sx = 23 - 1.8 * u;
  const bk = 0.3 + 1.8 * u;
  const SC = add(add(P, mul(a, 44)), [0, 4 - 5 * u, 0]);
  const sg = [1, -1];
  const S = [];
  const wr = [];
  T(TORSO, add(P, mul(a, -10)), add(P, mul(a, 50)), ut);
  const hl = lam * 0.35;
  const hd = [0, cos(hl), sin(hl)];
  const hu = [0, -sin(hl), cos(hl)];
  const NB = add(P, mul(a, 50));
  T(NECK, add(NB, mul(hd, -2)), add(NB, mul(hd, 7)), ut);
  T(HEAD, add(NB, mul(hd, 5)), add(NB, mul(hd, 25)), hu, "head");
  const Bt = lv(BAR_TOP, BAR_LOW, u);
  for (let i = 0; i < 2; i++) {
    const s = sg[i];
    S[i] = add(add(SC, [s * sx, 0, 0]), mul(a, -bk));
    const r = ik(S[i], [s * GRIP_X, Bt[1] - 3, Bt[2]], 30, 26, [s * (1 - 0.7 * u), -0.6 - 0.4 * u, -0.5 * u]);
    o.E = o.E || [];
    o.E[i] = r.E;
    T(UARM, S[i], r.E, mul(r.pole, -1));
    T(FARM, r.E, r.W, mul(r.pole, -1));
    T(ELB, add(r.E, [0, -4.2, 0]), add(r.E, [0, 4.2, 0]), [0, 0, 1], "tend");
    T(WRI, add(r.W, [0, -3, 0]), add(r.W, [0, 3, 0]), [0, 0, 1], "tend");
    wr[i] = r.W;
  }
  const by = Bt[1];
  const bz = Bt[2];
  for (let i = 0; i < 2; i++) T(HAND, [wr[i][0], by - 3.9, bz], [wr[i][0], by + 3.9, bz], [0, 0, 1], "tend");
  o.bar = [0, by, bz];
  T(BAR, [-38, by, bz], [38, by, bz], [0, 1, 0], "bar");
  for (let i = 0; i < 2; i++) {
    const s = sg[i];
    T(BAR, [s * 38, by, bz], [s * 45, by - 8, bz], [0, 0, 1], "bar");
    T(BAR, [s * 14, by, bz], [0, by + 20, bz], [0, 0, 1], "hub");
  }
  T(CABLE, [0, by + 20, bz], [0, 250, 16], [1, 0, 0], "hub");
  T(SEAT, [-17, 44, -12], [17, 44, -12], [0, 1, 0], "pad");
  T(POST, [0, 42, -12], [0, 2, -12], [1, 0, 0], "rig");
  T(POST, [0, 2, -40], [0, 2, 66], [0, 1, 0], "rig");
  T(POST, [-25, 2, 20], [25, 2, 20], [0, 1, 0], "rig");
  T(THIGH_PAD, [-23, 69, 20], [23, 69, 20], [0, 1, 0], "pad");
  for (let i = 0; i < 2; i++) T(POST, [sg[i] * 25, 69, 20], [sg[i] * 25, 2, 20], [1, 0, 0], "rig");
  for (let i = 0; i < 2; i++) {
    const s2 = sg[i];
    const H = add(P, [s2 * 9.5, -3, 0]);
    const Ak = [s2 * 11, 9, 38];
    const r2 = ik(H, Ak, 44, 42, [s2 * 0.2, 1, 0.3]);
    T(HIPJ, add(H, [0, -8.8, 0]), add(H, [0, 8.8, 0]), [0, 0, 1]);
    T(THIGH, H, r2.E, r2.pole);
    T(SHIN, r2.E, r2.W, r2.pole);
    T(KNEE, add(r2.E, [0, -5.6, 0]), add(r2.E, [0, 5.6, 0]), [0, 0, 1], "tend");
    T(ANK, add(Ak, [0, -3.4, 0]), add(Ak, [0, 3.4, 0]), [0, 0, 1], "tend");
    T(FOOT, add(Ak, [s2 * 0.5, -5, -7]), add(Ak, [s2 * 1.5, -5, 17]), [0, 1, 0], "tend");
  }
  return o;
}

const PATH = (function () {
  const e0 = [];
  const e1 = [];
  const b = [];
  for (let i = 0; i <= 16; i++) {
    const p = pulldownPose(i / 16);
    e0.push(p.E[0]);
    e1.push(p.E[1]);
    b.push(add(p.bar, [-30, 0, 0]));
  }
  return [e0, e1, b];
})();

export const PULLDOWN_ANATOMY = {
  label: "3D lat pulldown demonstration",
  cycle: CYCLE,
  phase: pulldownPhase,
  pose: pulldownPose,
  path: PATH,
  role: { lats: 0, teres: 0, trap: 0, rhomb: 0, bic: 1, brach: 1, rdelt: 1, infra: 1, fore: 1, tric: 1 },
  group: {
    lats: ["lats"],
    teres: ["teres"],
    trap: ["trap"],
    rhomb: ["rhomb"],
    bic: ["bic", "brach"],
    rdelt: ["rdelt"],
    infra: ["infra"],
    fore: ["fore"],
    tric: ["tric"]
  },
  phases: ["Reach", "Pull", "Squeeze", "Return"],
  cues: [
    "Sit tall with your thighs locked under the pad. Reach up with a grip just wider than your shoulders and feel your lats stretch.",
    "Pull your shoulder blades down first, then drive your elbows down toward your ribs. Lean back only slightly and bring the bar to your upper chest.",
    "Hold the bar at your upper chest for a second. Chest up, elbows down, shoulder blades pulled down.",
    "Let the bar rise slowly under control until your arms are straight again. Do not let the weight yank your shoulders up."
  ],
  muscles: [
    ["lats", "Lats", 0],
    ["teres", "Teres major", 0],
    ["trap", "Mid & lower traps", 0],
    ["rhomb", "Rhomboids", 0],
    ["bic", "Biceps & brachialis", 1],
    ["rdelt", "Rear delts", 1],
    ["infra", "Infraspinatus", 1],
    ["fore", "Forearms", 1],
    ["tric", "Triceps", 1]
  ],
  yaw: -38,
  pitch: 8,
  view: { tg: [0, 94, 6], span: 240 }
};
