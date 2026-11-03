import { mk, PI, cos, sin, add, mul, lv, ease, ik, TORSO, THIGH, SHIN, FARM, UARM, NECK, HEAD, FOOT, HIPJ, HAND, KNEE, ELB, WRI, ANK, BAR, HUB } from "../viewer/anatomy-engine.js";

const CYCLE = 5.6;
const LEAN_STRETCH = 16 * PI / 180;
const LEAN_PULL = -6 * PI / 180;
const P = [0, 55, 0];
const SEAT_Y = 42;
const PULLEY = [0, 28, 104];
const PAD = mk(1, 18, [[0, 4, 4, 17], [1, 4, 4, 17]], [], null);
const SLAB = mk(1, 18, [[0, 2.5, 2.5, 22], [1, 2.5, 2.5, 22]], [], null);
const POST = mk(1, 10, [[0, 2.2, 2.2, 2.2], [1, 2.2, 2.2, 2.2]], [], null);
const CABLE = mk(1, 6, [[0, 0.8, 0.8, 0.8], [1, 0.8, 0.8, 0.8]], [], null);
const WHEEL = mk(1, 14, [[0, 5, 5, 5], [1, 5, 5, 5]], [], null);

function rowPhase(t) {
  t = ((t % CYCLE) + CYCLE) % CYCLE;
  if (t < 0.6) return { u: 0, p: 0 };
  if (t < 2.1) return { u: ease((t - 0.6) / 1.5), p: 1 };
  if (t < 3.0) return { u: 1, p: 2 };
  if (t < 5.4) return { u: 1 - ease((t - 3.0) / 2.4), p: 3 };
  return { u: 0, p: 0 };
}

function rowPose(u) {
  const o = [];
  function T(d, from, to, up, col) { o.push({ d: d, A: from, B: to, u: up, col: col || "musc" }); }
  const sg = [1, -1];
  const lam = LEAN_STRETCH + (LEAN_PULL - LEAN_STRETCH) * u;
  const a = [0, cos(lam), sin(lam)];
  const ut = [0, -sin(lam), cos(lam)];
  const SC = add(P, mul(a, 44));
  T(TORSO, add(P, mul(a, -10)), add(P, mul(a, 50)), ut);
  const hl = lam * 0.4;
  const hd = [0, cos(hl), sin(hl)];
  const hu = [0, -sin(hl), cos(hl)];
  const NB = add(P, mul(a, 50));
  T(NECK, add(NB, mul(hd, -2)), add(NB, mul(hd, 7)), ut);
  T(HEAD, add(NB, mul(hd, 5)), add(NB, mul(hd, 25)), hu, "head");
  const W0 = [0, SC[1] - 15, SC[2] + 53];
  const W1 = [0, P[1] + 22, P[2] + 18];
  const Wc = lv(W0, W1, u);
  o.E = [];
  o.grips = [];
  for (let i = 0; i < 2; i++) {
    const s = sg[i];
    const S = add(SC, [s * (22 - 1.5 * u), 0, 0]);
    const W = [s * 8, Wc[1], Wc[2]];
    const r = ik(S, W, 30, 26, [s * 0.5, 0.3, -1]);
    o.E[i] = r.E;
    o.grips[i] = r.W;
    T(UARM, S, r.E, mul(r.pole, -1));
    T(FARM, r.E, r.W, mul(r.pole, -1));
    T(ELB, add(r.E, [0, -4.2, 0]), add(r.E, [0, 4.2, 0]), [0, 0, 1], "tend");
    T(WRI, add(r.W, [-2.6, 0, 0]), add(r.W, [2.6, 0, 0]), [0, 1, 0], "tend");
    T(HAND, add(r.W, [0, 0, -3.9]), add(r.W, [0, 0, 3.9]), [0, 1, 0], "tend");
    T(BAR, add(r.W, [0, 0, -7]), add(r.W, [0, 0, 7]), [0, 1, 0], "bar");
  }
  T(BAR, [-8, Wc[1], Wc[2] + 7], [8, Wc[1], Wc[2] + 7], [0, 1, 0], "bar");
  T(CABLE, [0, Wc[1], Wc[2] + 7], PULLEY, [1, 0, 0], "rig");
  T(WHEEL, add(PULLEY, [-2.5, 0, 0]), add(PULLEY, [2.5, 0, 0]), [0, 1, 0], "hub");
  T(PAD, [0, SEAT_Y, -16], [0, SEAT_Y, 40], [0, 1, 0], "pad");
  T(POST, [0, SEAT_Y - 4, 10], [0, 2, 10], [1, 0, 0], "rig");
  T(POST, [0, 2, -24], [0, 2, 112], [1, 0, 0], "rig");
  T(POST, [-24, 2, 10], [24, 2, 10], [0, 1, 0], "rig");
  T(POST, [0, 2, 112], [0, 40, 112], [1, 0, 0], "rig");
  T(POST, [0, 28, 104], [0, 28, 112], [1, 0, 0], "rig");
  T(SLAB, [-26, 28, 85], [26, 28, 85], [0, 0, 1], "pad");
  T(POST, [-18, 2, 85], [-18, 28, 85], [0, 0, 1], "rig");
  T(POST, [18, 2, 85], [18, 28, 85], [0, 0, 1], "rig");
  for (let i = 0; i < 2; i++) {
    const s = sg[i];
    const H = add(P, [s * 9.5, -3, 0]);
    const Ak = [s * 12, 24, 78];
    const r2 = ik(H, Ak, 44, 42, [s * 0.1, 1, 0.1]);
    T(HIPJ, add(H, [0, -8.8, 0]), add(H, [0, 8.8, 0]), [0, 0, 1]);
    T(THIGH, H, r2.E, r2.pole);
    T(SHIN, r2.E, r2.W, r2.pole);
    T(KNEE, add(r2.E, [0, -5.6, 0]), add(r2.E, [0, 5.6, 0]), [0, 0, 1], "tend");
    T(ANK, add(Ak, [0, -3.4, 0]), add(Ak, [0, 3.4, 0]), [0, 0, 1], "tend");
    T(FOOT, add(Ak, [s * 0.5, -1, -4]), add(Ak, [s * 1.5, 7, 3]), [0, 0, -1], "tend");
  }
  return o;
}

const PATH = (function () {
  const e0 = [];
  const e1 = [];
  const g = [];
  for (let i = 0; i <= 16; i++) {
    const p = rowPose(i / 16);
    e0.push(p.E[0]);
    e1.push(p.E[1]);
    g.push([0, p.grips[0][1], p.grips[0][2]]);
  }
  return [e0, e1, g];
})();

export const SEATED_CABLE_ROW_ANATOMY = {
  label: "3D seated cable row demonstration",
  cycle: CYCLE,
  phase: rowPhase,
  pose: rowPose,
  path: PATH,
  role: { lats: 0, trap: 0, rhomb: 0, teres: 1, infra: 1, rdelt: 1, bic: 1, brach: 1, fore: 1, erec: 1 },
  group: {
    lats: ["lats"],
    trap: ["trap"],
    rhomb: ["rhomb"],
    scap: ["teres", "infra"],
    rdelt: ["rdelt"],
    bic: ["bic", "brach"],
    fore: ["fore"],
    erec: ["erec"]
  },
  phases: ["Reach", "Row", "Squeeze", "Return"],
  cues: [
    "Sit tall with your feet on the plate and your knees slightly bent. Hold the handle with straight arms and reach forward with a flat back.",
    "Pull your shoulder blades back first, then drive your elbows past your sides and bring the handle to your lower ribs. Keep your torso upright.",
    "Squeeze your shoulder blades together for a second. Do not lean back or shrug.",
    "Let the handle travel forward slowly until your arms are straight and your lats stretch. Keep your back flat and do not round forward."
  ],
  muscles: [
    ["lats", "Lats", 0],
    ["trap", "Mid & lower traps", 0],
    ["rhomb", "Rhomboids", 0],
    ["scap", "Teres & infraspinatus", 1],
    ["rdelt", "Rear delts", 1],
    ["bic", "Biceps & brachialis", 1],
    ["fore", "Forearms", 1],
    ["erec", "Lower back", 1]
  ],
  yaw: -38,
  pitch: 8,
  view: { tg: [0, 62, 44], span: 235 }
};
