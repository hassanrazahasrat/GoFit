import { PI, sin, add, mul, ease, ik, UARM, FARM, ELB, WRI, HAND } from "../viewer/anatomy-engine.js";
import { PUSH_UP_ANATOMY } from "./anatomy-push-up.js";

const CYCLE = 8;
const STATE = { tau: 0 };

function tapPhase(t) {
  t = ((t % CYCLE) + CYCLE) % CYCLE;
  const tau = 2 * t / CYCLE;
  STATE.tau = tau;
  const loc = tau % 1;
  const p = loc < 0.1 ? 0 : loc < 0.38 ? 1 : loc < 0.5 ? 2 : loc < 0.8 ? 3 : 0;
  return { u: 0, p: p };
}

function reach(loc) {
  if (loc < 0.1) return 0;
  if (loc < 0.38) return ease((loc - 0.1) / 0.28);
  if (loc < 0.5) return 1;
  if (loc < 0.8) return 1 - ease((loc - 0.5) / 0.3);
  return 0;
}

function tapPose() {
  const o = PUSH_UP_ANATOMY.pose(0);
  const tau = STATE.tau;
  const lift = Math.floor(tau) % 2;
  const e = reach(tau - Math.floor(tau));
  const sg = [1, -1];
  const s = sg[lift];
  const S = o[3 + 5 * lift].A;
  const So = o[3 + 5 * (1 - lift)].A;
  const floor = o.grips[lift];
  const tap = [So[0] * 0.55, So[1] - 5, So[2] + 5];
  const W = [
    floor[0] + (tap[0] - floor[0]) * e,
    floor[1] + (tap[1] - floor[1]) * e + 14 * sin(PI * e),
    floor[2] + (tap[2] - floor[2]) * e
  ];
  const r = ik(S, W, 30, 26, [s * 1, 0.3, -0.5]);
  const base = 3 + 5 * lift;
  const down = mul(r.pole, -1);
  o[base] = { d: UARM, A: S, B: r.E, u: down, col: "musc" };
  o[base + 1] = { d: FARM, A: r.E, B: r.W, u: down, col: "musc" };
  o[base + 2] = { d: ELB, A: add(r.E, [0, -4.2, 0]), B: add(r.E, [0, 4.2, 0]), u: [0, 0, 1], col: "tend" };
  o[base + 3] = { d: WRI, A: add(r.W, [0, -2.6, 0]), B: add(r.W, [0, 2.6, 0]), u: [0, 0, 1], col: "tend" };
  o[base + 4] = { d: HAND, A: add(r.W, [0, -2.5, -2]), B: add(r.W, [0, -4.5, 9]), u: [0, 1, 0], col: "tend" };
  o.E = [r.E, r.E];
  o.grips = [r.W, r.W];
  o.tapHand = r.W;
  return o;
}

const PATH = (function () {
  const k = [];
  for (let i = 0; i <= 24; i++) {
    STATE.tau = 0.1 + 0.7 * i / 24;
    k.push(tapPose().tapHand);
  }
  STATE.tau = 0;
  return [k];
})();

export const SHOULDER_TAP_ANATOMY = Object.assign({}, PUSH_UP_ANATOMY, {
  label: "3D plank shoulder tap demonstration",
  cycle: CYCLE,
  phase: tapPhase,
  pose: tapPose,
  path: PATH,
  role: { abs: 0, adelt: 1, pec: 1, glut: 1 },
  group: {
    abs: ["abs"],
    adelt: ["adelt"],
    pec: ["pec"],
    glut: ["glut"]
  },
  phases: ["Brace", "Reach", "Tap", "Return"],
  cues: [
    "Start in a high plank with your hands under your shoulders and your feet a little wider than hip-width. Make a straight line from your head to your heels and brace your core.",
    "Lift one hand and reach it toward the opposite shoulder while keeping your hips and shoulders square to the floor.",
    "Tap your shoulder lightly and hold your body still. Do not let your hips rock or twist.",
    "Place your hand back on the floor under your shoulder with control, then repeat with the other hand."
  ],
  muscles: [
    ["abs", "Abs & obliques", 0],
    ["adelt", "Shoulders (support arm)", 1],
    ["pec", "Chest", 1],
    ["glut", "Glutes", 1]
  ]
});
