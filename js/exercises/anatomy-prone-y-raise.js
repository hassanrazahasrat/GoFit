import { PI, cos, sin, sqrt, add, mul, ease, ik, TORSO, THIGH, SHIN, FARM, UARM, NECK, HEAD, FOOT, HIPJ, HAND, KNEE, ELB, WRI, ANK } from "../viewer/anatomy-engine.js";

const CYCLE = 5.4;
const A = [0, 0, 1];
const UT = [0, -1, 0];
const P = [0, 13, 0];
const SC = add(P, mul(A, 44));
const SPREAD = 40 * PI / 180;
const LOW = -6.5 * PI / 180;
const HIGH = 22 * PI / 180;
const REACH = 55.4;

function yPhase(t) {
  t = ((t % CYCLE) + CYCLE) % CYCLE;
  if (t < 0.6) return { u: 0, p: 0 };
  if (t < 1.9) return { u: ease((t - 0.6) / 1.3), p: 1 };
  if (t < 3.0) return { u: 1, p: 2 };
  if (t < 5.0) return { u: 1 - ease((t - 3.0) / 2.0), p: 3 };
  return { u: 0, p: 0 };
}

function unit(v) {
  const l = sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
}

function yPose(u) {
  const o = [];
  function T(d, from, to, up, col) { o.push({ d: d, A: from, B: to, u: up, col: col || "musc" }); }
  const sg = [1, -1];
  const alpha = LOW + (HIGH - LOW) * u;
  T(TORSO, add(P, mul(A, -10)), add(P, mul(A, 50)), UT);
  const NB = add(P, mul(A, 50));
  T(NECK, add(NB, [0, 0, -2]), [0, 12.5, NB[2] + 7], UT);
  T(HEAD, [0, 12.5, NB[2] + 5], [0, 12.5, NB[2] + 25], UT, "head");
  o.E = [];
  o.grips = [];
  for (let i = 0; i < 2; i++) {
    const s = sg[i];
    const S = add(SC, [s * 22, 0, 0]);
    const dir = unit([s * sin(SPREAD) * cos(alpha), sin(alpha), cos(SPREAD) * cos(alpha)]);
    const r = ik(S, add(S, mul(dir, REACH)), 30, 26, [0, -1, 0]);
    const up = [-s, 0, 0];
    T(UARM, S, r.E, up);
    T(FARM, r.E, r.W, up);
    T(ELB, add(r.E, [0, -4.2, 0]), add(r.E, [0, 4.2, 0]), [0, 0, 1], "tend");
    T(WRI, add(r.W, mul(dir, -3)), add(r.W, mul(dir, 3)), up, "tend");
    T(HAND, r.W, add(r.W, mul(dir, 9)), up, "tend");
    o.E[i] = r.E;
    o.grips[i] = add(r.W, mul(dir, 9));
  }
  for (let i = 0; i < 2; i++) {
    const s = sg[i];
    const H = add(P, [s * 9.5, -3, 0]);
    const Ak = [s * 10, 7, -85.4];
    const r2 = ik(H, Ak, 44, 42, [0, -1, 0]);
    T(HIPJ, add(H, [0, -8.8, 0]), add(H, [0, 8.8, 0]), [0, 0, 1]);
    T(THIGH, H, r2.E, r2.pole);
    T(SHIN, r2.E, r2.W, r2.pole);
    T(KNEE, add(r2.E, [0, -5.6, 0]), add(r2.E, [0, 5.6, 0]), [0, 0, 1], "tend");
    T(ANK, add(Ak, [0, -3.4, 0]), add(Ak, [0, 3.4, 0]), [0, 0, 1], "tend");
    T(FOOT, add(Ak, [0, 1, 3]), add(Ak, [0, -4, -15]), [1, 0, 0], "tend");
  }
  return o;
}

const PATH = (function () {
  const g0 = [];
  const g1 = [];
  for (let i = 0; i <= 16; i++) {
    const p = yPose(i / 16);
    g0.push(p.grips[0]);
    g1.push(p.grips[1]);
  }
  return [g0, g1];
})();

export const PRONE_Y_RAISE_ANATOMY = {
  label: "3D prone Y raise demonstration",
  cycle: CYCLE,
  phase: yPhase,
  pose: yPose,
  path: PATH,
  role: { trap: 0, rdelt: 0, rhomb: 1, infra: 1, teres: 1, erec: 1 },
  group: {
    trap: ["trap"],
    rdelt: ["rdelt"],
    rhomb: ["rhomb"],
    scap: ["infra", "teres"],
    erec: ["erec"]
  },
  phases: ["Set", "Raise", "Hold", "Lower"],
  cues: [
    "Lie face down with your forehead near the floor and your legs straight. Stretch your arms overhead in a Y shape with your thumbs pointing up.",
    "Squeeze your shoulder blades down and back and lift your arms off the floor. Keep your arms straight and your neck long.",
    "Hold for a second with your arms in line with your body and your thumbs up. Do not shrug and do not arch your lower back.",
    "Lower your arms slowly back to the floor."
  ],
  muscles: [
    ["trap", "Lower & mid traps", 0],
    ["rdelt", "Rear delts", 0],
    ["rhomb", "Rhomboids", 1],
    ["scap", "Infraspinatus & teres", 1],
    ["erec", "Lower back", 1]
  ],
  yaw: 60,
  pitch: 30,
  views: { three: 60 },
  view: { tg: [0, 12, 0], span: 225 }
};
