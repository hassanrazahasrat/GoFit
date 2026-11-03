import { PI, cos, sin, add, mul, lv, ease, ik, TORSO, THIGH, SHIN, FARM, UARM, NECK, HEAD, FOOT, HIPJ, HAND, KNEE, ELB, WRI, ANK } from "../viewer/anatomy-engine.js";

const REP = 6;
const P = [0, 10, 0];
const SC = [0, 10, -44];
const REACH = 54.8;
const OVERHEAD = 78 * PI / 180;
let side = 0;

function bugPhase(t) {
  const span = 2 * REP;
  t = ((t % span) + span) % span;
  side = t >= REP ? 1 : 0;
  t = t % REP;
  if (t < 0.7) return { u: 0, p: 0 };
  if (t < 2.5) return { u: ease((t - 0.7) / 1.8), p: 1 };
  if (t < 3.3) return { u: 1, p: 2 };
  if (t < 5.7) return { u: 1 - ease((t - 3.3) / 2.4), p: 3 };
  return { u: 0, p: 0 };
}

function bugPoseFor(u, which) {
  const o = [];
  function T(d, from, to, up, col) { o.push({ d: d, A: from, B: to, u: up, col: col || "musc" }); }
  const sg = [1, -1];
  const armSign = which === 0 ? 1 : -1;
  T(TORSO, add(P, [0, 0, 10]), add(P, [0, 0, -50]), [0, 1, 0]);
  const NB = add(P, [0, 0, -50]);
  T(NECK, add(NB, [0, 0, 2]), [0, 10.5, NB[2] - 7], [0, 1, 0]);
  T(HEAD, [0, 10.5, NB[2] - 5], [0, 10.5, NB[2] - 25], [0, 1, 0], "head");
  o.hands = [];
  o.ankles = [];
  for (let i = 0; i < 2; i++) {
    const s = sg[i];
    const ext = s === armSign ? u : 0;
    const phi = OVERHEAD * ext;
    const dir = [0, cos(phi), -sin(phi)];
    const S = add(SC, [s * 22, 0, 0]);
    const r = ik(S, add(S, mul(dir, REACH)), 30, 26, [0, sin(phi), cos(phi)]);
    const up = [-s, 0, 0];
    T(UARM, S, r.E, up);
    T(FARM, r.E, r.W, up);
    T(ELB, add(r.E, [0, -4.2, 0]), add(r.E, [0, 4.2, 0]), [0, 0, 1], "tend");
    T(WRI, add(r.W, mul(dir, -3)), add(r.W, mul(dir, 3)), up, "tend");
    T(HAND, r.W, add(r.W, mul(dir, 9)), up, "tend");
    o.hands[i] = add(r.W, mul(dir, 9));
  }
  for (let i = 0; i < 2; i++) {
    const s = sg[i];
    const ext = s === -armSign ? u : 0;
    const H = add(P, [s * 9.5, -3, 0]);
    const Ak = lv([s * 11, 51, 42], [s * 11, 15, 84.5], ext);
    const r2 = ik(H, Ak, 44, 42, [0, 0.7, -0.7]);
    T(HIPJ, add(H, [0, -8.8, 0]), add(H, [0, 8.8, 0]), [0, 0, 1]);
    T(THIGH, H, r2.E, r2.pole);
    T(SHIN, r2.E, r2.W, r2.pole);
    T(KNEE, add(r2.E, [0, -5.6, 0]), add(r2.E, [0, 5.6, 0]), [0, 0, 1], "tend");
    T(ANK, add(Ak, [0, -3.4, 0]), add(Ak, [0, 3.4, 0]), [0, 0, 1], "tend");
    T(FOOT, add(Ak, [0, -4, -2]), add(Ak, [0, 8, 3]), [1, 0, 0], "tend");
    o.ankles[i] = Ak;
  }
  return o;
}

function bugPose(u) {
  return bugPoseFor(u, side);
}

const PATH = (function () {
  const h0 = [];
  const h1 = [];
  const a0 = [];
  const a1 = [];
  for (let i = 0; i <= 16; i++) {
    const p0 = bugPoseFor(i / 16, 0);
    const p1 = bugPoseFor(i / 16, 1);
    h0.push(p0.hands[0]);
    h1.push(p1.hands[1]);
    a0.push(p1.ankles[0]);
    a1.push(p0.ankles[1]);
  }
  return [h0, h1, a0, a1];
})();

export const DEAD_BUG_ANATOMY = {
  label: "3D dead bug demonstration",
  cycle: 2 * REP,
  phase: bugPhase,
  pose: bugPose,
  path: PATH,
  role: { abs: 0, quad: 1, adelt: 1 },
  group: {
    abs: ["abs"],
    quad: ["quad"],
    adelt: ["adelt"]
  },
  phases: ["Set", "Extend", "Hold", "Return"],
  cues: [
    "Lie on your back with your arms straight up toward the ceiling and your hips and knees bent to 90°. Press your lower back into the floor and brace your core.",
    "Slowly lower one arm overhead and straighten the opposite leg toward the floor. Keep your lower back flat the whole time.",
    "Pause with your arm and leg hovering just above the floor. Do not let your ribs flare or your back arch.",
    "Bring your arm and leg back to the start with control, then switch sides."
  ],
  muscles: [
    ["abs", "Core", 0],
    ["quad", "Quads", 1],
    ["adelt", "Front delts", 1]
  ],
  yaw: 38,
  pitch: 14,
  views: { three: 38 },
  view: { tg: [0, 25, 5], span: 230 }
};
