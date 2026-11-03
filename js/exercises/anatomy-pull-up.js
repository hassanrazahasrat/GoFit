import { mk, PI, cos, sin, add, mul, lv, ease, ik, TORSO, THIGH, SHIN, FARM, UARM, NECK, HEAD, FOOT, HIPJ, HAND, KNEE, ELB, WRI, ANK, BAR } from "../viewer/anatomy-engine.js";

const CYCLE = 6;
const BAR_Y = 214;
const GRIP_X = 30;
const SHOULDER_X = 22;
const REACH_HANG = 55;
const TOP_DROP = 17;
const POST = mk(1, 10, [[0, 2.4, 2.4, 2.4], [1, 2.4, 2.4, 2.4]], [], null);

function pullPhase(t) {
  t = ((t % CYCLE) + CYCLE) % CYCLE;
  if (t < 0.7) return { u: 0, p: 0 };
  if (t < 2.4) return { u: ease((t - 0.7) / 1.7), p: 1 };
  if (t < 3.3) return { u: 1, p: 2 };
  if (t < 5.6) return { u: 1 - ease((t - 3.3) / 2.3), p: 3 };
  return { u: 0, p: 0 };
}

function pullPose(u) {
  const o = [];
  function T(d, from, to, up, col) { o.push({ d: d, A: from, B: to, u: up, col: col || "musc" }); }
  const sg = [1, -1];
  const lam = -(2 + 14 * u) * PI / 180;
  const a = [0, cos(lam), sin(lam)];
  const ut = [0, -sin(lam), cos(lam)];
  const sy = BAR_Y - REACH_HANG + (REACH_HANG - TOP_DROP) * u;
  const sz = -3 - 12 * u;
  const SC = [0, sy, sz];
  const P = add(SC, mul(a, -44));
  T(TORSO, add(P, mul(a, -10)), add(P, mul(a, 50)), ut);
  const hl = lam * 0.2;
  const hd = [0, cos(hl), sin(hl)];
  const hu = [0, -sin(hl), cos(hl)];
  const NB = add(P, mul(a, 50));
  T(NECK, add(NB, mul(hd, -2)), add(NB, mul(hd, 7)), ut);
  T(HEAD, add(NB, mul(hd, 5)), add(NB, mul(hd, 25)), hu, "head");
  o.E = [];
  o.grips = [];
  for (let i = 0; i < 2; i++) {
    const s = sg[i];
    const S = add(SC, [s * (SHOULDER_X - 1.5 * u), 0, 0]);
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
  for (let i = 0; i < 2; i++) {
    const s = sg[i];
    const H = add(P, [s * 9.5, -3, 0]);
    const Ak = [s * 10, H[1] - 79, H[2] - 12];
    const r2 = ik(H, Ak, 44, 42, [s * 0.1, 0, 1]);
    T(HIPJ, add(H, [0, -8.8, 0]), add(H, [0, 8.8, 0]), [0, 0, 1]);
    T(THIGH, H, r2.E, r2.pole);
    T(SHIN, r2.E, r2.W, r2.pole);
    T(KNEE, add(r2.E, [0, -5.6, 0]), add(r2.E, [0, 5.6, 0]), [0, 0, 1], "tend");
    T(ANK, add(Ak, [0, -3.4, 0]), add(Ak, [0, 3.4, 0]), [0, 0, 1], "tend");
    T(FOOT, add(Ak, [s * 0.5, -5, -4]), add(Ak, [s * 1.5, -5, 14]), [0, 1, 0], "tend");
  }
  return o;
}

const PATH = (function () {
  const e0 = [];
  const e1 = [];
  for (let i = 0; i <= 16; i++) {
    const p = pullPose(i / 16);
    e0.push(p.E[0]);
    e1.push(p.E[1]);
  }
  return [e0, e1];
})();

export const PULL_UP_ANATOMY = {
  label: "3D pull-up demonstration",
  cycle: CYCLE,
  phase: pullPhase,
  pose: pullPose,
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
  phases: ["Hang", "Pull", "Top", "Lower"],
  cues: [
    "Hang from the bar with an overhand grip just wider than your shoulders, arms long and legs relaxed. If this is too hard, loop a resistance band under your knees or use an assist machine.",
    "Pull your shoulder blades down first, then drive your elbows toward your ribs. Lead with your chest and keep your legs still.",
    "Get your chin over the bar and hold for a second. Keep your shoulders pulled down and away from your ears.",
    "Lower slowly until your arms are fully straight again. Do not drop into the hang."
  ],
  muscles: [
    ["lats", "Lats", 0],
    ["teres", "Teres major", 0],
    ["trap", "Mid & lower traps", 0],
    ["rhomb", "Rhomboids", 0],
    ["bic", "Biceps & brachialis", 1],
    ["rdelt", "Rear delts", 1],
    ["infra", "Infraspinatus", 1],
    ["fore", "Forearms (grip)", 1],
    ["tric", "Triceps", 1]
  ],
  yaw: -38,
  pitch: 6,
  view: { tg: [0, 120, 0], span: 330 }
};
