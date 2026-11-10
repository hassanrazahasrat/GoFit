import { mk, PI, cos, sin, add, mul, ease, ik, TORSO, THIGH, SHIN, FARM, UARM, NECK, HEAD, FOOT, HIPJ, HAND, KNEE, ELB, WRI, ANK, BAR, PLATE, HUB } from "../viewer/anatomy-engine.js";

const CYCLE = 5.4;
const LIFT = 32 * PI / 180;
const SHOULDER_Y = 10;
const SHOULDER_Z = -97.2;
const ANKLE_Z = 0;
const STANCE = 13;
const BENCH_PAD = mk(1, 14, [[0, 3, 3, 17], [1, 3, 3, 17]], [], null);
const BENCH_LEG = mk(1, 10, [[0, 2.5, 2.5, 2.5], [1, 2.5, 2.5, 2.5]], [], null);

function hipThrustPhase(t) {
  t = ((t % CYCLE) + CYCLE) % CYCLE;
  if (t < 0.6) return { u: 0, p: 0 };
  if (t < 1.9) return { u: ease((t - 0.6) / 1.3), p: 1 };
  if (t < 2.9) return { u: 1, p: 2 };
  if (t < 4.9) return { u: 1 - ease((t - 2.9) / 2), p: 3 };
  return { u: 0, p: 0 };
}

function hipThrustPose(u) {
  const th = LIFT * u;
  const a = [0, -sin(th), -cos(th)];
  const ut = [0, cos(th), -sin(th)];
  const SC = [0, SHOULDER_Y, SHOULDER_Z];
  const P = add(SC, mul(a, -44));
  const o = [];
  function T(d, from, to, up, col) { o.push({ d: d, A: from, B: to, u: up, col: col || "musc" }); }
  const sg = [1, -1];
  T(TORSO, add(P, mul(a, -10)), add(P, mul(a, 50)), ut);
  const NB = add(P, mul(a, 50));
  const headY = 10.5;
  T(NECK, add(NB, [0, 0, 2]), [0, headY, NB[2] - 7], ut);
  T(HEAD, [0, headY, NB[2] - 5], [0, headY, NB[2] - 25], [0, 1, 0], "head");
  for (let i = 0; i < 2; i++) {
    const s = sg[i];
    const S = add(SC, [s * 22, 0, 0]);
    const W = [s * 26, 5.4, SHOULDER_Z + 55];
    const r = ik(S, W, 30, 26, [0, 1, 0]);
    T(UARM, S, r.E, mul(r.pole, -1));
    T(FARM, r.E, r.W, mul(r.pole, -1));
    T(ELB, add(r.E, [0, -4.2, 0]), add(r.E, [0, 4.2, 0]), [0, 0, 1], "tend");
    T(WRI, add(r.W, [0, -2.6, 0]), add(r.W, [0, 2.6, 0]), [0, 0, 1], "tend");
    T(HAND, r.W, add(r.W, [0, 0, 8]), [0, 1, 0], "tend");
  }
  o.knee = [];
  for (let i = 0; i < 2; i++) {
    const s = sg[i];
    const H = add(P, [s * 9.5, -3, 0]);
    const Ak = [s * STANCE, 9, ANKLE_Z];
    const r2 = ik(H, Ak, 44, 42, [s * 0.1, 1, 0.2]);
    o.knee[i] = r2.E;
    T(HIPJ, add(H, [0, -8.8, 0]), add(H, [0, 8.8, 0]), [0, 0, 1]);
    T(THIGH, H, r2.E, r2.pole);
    T(SHIN, r2.E, r2.W, r2.pole);
    T(KNEE, add(r2.E, [0, -5.6, 0]), add(r2.E, [0, 5.6, 0]), [0, 0, 1], "tend");
    T(ANK, add(Ak, [0, -3.4, 0]), add(Ak, [0, 3.4, 0]), [0, 0, 1], "tend");
    T(FOOT, add(Ak, [s * 0.5, -5, -7]), add(Ak, [s * 1.5, -5, 17]), [0, 1, 0], "tend");
  }
  const barC = add(add(P, mul(a, -10)), [0, 6, 0]);
  T(BAR, [barC[0] - 60, barC[1], barC[2]], [barC[0] + 60, barC[1], barC[2]], [0, 1, 0], "bar");
  [[42, 46], [47, 51]].forEach(function (pair) {
    for (let k = 0; k < 2; k++) {
      const g = k ? -1 : 1;
      T(PLATE, [g * pair[0] + (g < 0 ? -4 : 0), barC[1], barC[2]], [g * pair[1] + (g < 0 ? -4 : 0), barC[1], barC[2]], [0, 1, 0], "plate");
    }
  });
  for (let i = 0; i < 2; i++) T(HUB, [sg[i] * 55, barC[1], barC[2]], [sg[i] * 56, barC[1], barC[2]], [0, 1, 0], "hub");
  T(BENCH_PAD, [0, 12.5, -111], [0, 12.5, -85], [0, 1, 0], "pad");
  for (let i = 0; i < 2; i++) {
    const s = sg[i];
    T(BENCH_LEG, [s * 14, 1, -99], [s * 14, 10.5, -99], [1, 0, 0], "rig");
    T(BENCH_LEG, [s * 14, 1, -90], [s * 14, 10.5, -90], [1, 0, 0], "rig");
  }
  o.bar = barC;
  o.hip = add(P, [0, -3, 0]);
  return o;
}

const PATH = (function () {
  const b = [];
  const k = [];
  const h = [];
  for (let i = 0; i <= 16; i++) {
    const p = hipThrustPose(i / 16);
    b.push(p.bar);
    k.push(p.knee[0]);
    h.push(p.hip);
  }
  return [b, k, h];
})();

export const HIP_THRUST_ANATOMY = {
  label: "3D hip thrust demonstration",
  cycle: CYCLE,
  phase: hipThrustPhase,
  pose: hipThrustPose,
  path: PATH,
  role: { glut: 0, ham: 1, erec: 1, abs: 1 },
  group: {
    glut: ["glut"],
    ham: ["ham"],
    erec: ["erec"],
    abs: ["abs"]
  },
  phases: ["Set", "Thrust", "Squeeze", "Lower"],
  cues: [
    "Sit on the floor with your upper back resting on a bench and the bar across your hip crease. Bend your knees and plant your feet flat about hip-width apart.",
    "Brace your core, tuck your ribs and grip the bar just outside your hips.",
    "Drive through your heels and thrust your hips up until your body forms a straight line from shoulders to knees. Squeeze your glutes hard at the top.",
    "Lower the bar slowly until your hips are just above the floor, then repeat."
  ],
  muscles: [
    ["glut", "Glutes", 0],
    ["ham", "Hamstrings", 1],
    ["erec", "Lower back", 1],
    ["abs", "Core", 1]
  ],
  yaw: 40,
  pitch: -14,
  views: { three: 40 },
  view: { tg: [0, 28, -55], span: 215 }
};
