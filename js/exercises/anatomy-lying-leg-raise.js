import { mk, PI, cos, sin, add, mul, ease, ik, TORSO, THIGH, SHIN, FARM, UARM, NECK, HEAD, FOOT, HIPJ, HAND, KNEE, ELB, WRI, ANK } from "../viewer/anatomy-engine.js";

const CYCLE = 5.8;
const A = [0, 0, -1];
const UT = [0, 1, 0];
const P = [0, 16, 0];
const SC = add(P, mul(A, 44));
const PHI_LOW = 6 * PI / 180;
const PHI_TOP = 88 * PI / 180;
const LEG_REACH = 84.2;
const MAT = mk(1, 18, [[0, 1.8, 1.8, 40], [1, 1.8, 1.8, 40]], [], null);

function raisePhase(t) {
  t = ((t % CYCLE) + CYCLE) % CYCLE;
  if (t < 0.6) return { u: 0, p: 0 };
  if (t < 2.4) return { u: ease((t - 0.6) / 1.8), p: 1 };
  if (t < 3.2) return { u: 1, p: 2 };
  if (t < 5.6) return { u: 1 - ease((t - 3.2) / 2.4), p: 3 };
  return { u: 0, p: 0 };
}

function raisePose(u) {
  const o = [];
  function T(d, from, to, up, col) { o.push({ d: d, A: from, B: to, u: up, col: col || "musc" }); }
  const sg = [1, -1];
  const phi = PHI_LOW + (PHI_TOP - PHI_LOW) * u;
  const dl = [0, sin(phi), cos(phi)];
  const fr = [0, cos(phi), -sin(phi)];
  const Pu = add(P, [0, 2 * u, 0]);
  T(TORSO, add(Pu, mul(A, -10)), add(Pu, mul(A, 50)), UT);
  const NB = add(P, mul(A, 50));
  T(NECK, add(NB, mul(A, -2)), add(NB, mul(A, 7)), UT);
  T(HEAD, add(NB, mul(A, 5)), add(NB, mul(A, 25)), UT, "head");
  o.E = [];
  for (let i = 0; i < 2; i++) {
    const s = sg[i];
    const S = add(SC, [s * 22, 0, 0]);
    const W = [s * 24, 7, SC[2] + 53];
    const r = ik(S, W, 30, 26, [s * 0.2, 1, 0]);
    o.E[i] = r.E;
    T(UARM, S, r.E, mul(r.pole, -1));
    T(FARM, r.E, r.W, mul(r.pole, -1));
    T(ELB, add(r.E, [0, 0, -4.2]), add(r.E, [0, 0, 4.2]), [0, 1, 0], "tend");
    T(WRI, add(r.W, [-2.9, 0, 0]), add(r.W, [2.9, 0, 0]), [0, 1, 0], "tend");
    T(HAND, r.W, add(r.W, [0, 0, 8]), [0, 1, 0], "tend");
  }
  o.ank = [];
  for (let i = 0; i < 2; i++) {
    const s = sg[i];
    const H = add(Pu, [s * 9.5, -3, 0]);
    const Ak = add(H, mul(dl, LEG_REACH));
    o.ank[i] = Ak;
    const r2 = ik(H, Ak, 44, 42, [s * 0.05, fr[1], fr[2]]);
    T(HIPJ, add(H, [0, 0, -8.8]), add(H, [0, 0, 8.8]), [0, 1, 0]);
    T(THIGH, H, r2.E, r2.pole);
    T(SHIN, r2.E, r2.W, r2.pole);
    T(KNEE, add(r2.E, [0, 0, -5.6]), add(r2.E, [0, 0, 5.6]), fr, "tend");
    T(ANK, add(Ak, mul(dl, -3.4)), add(Ak, mul(dl, 3.4)), fr, "tend");
    T(FOOT, add(add(Ak, mul(dl, 5)), mul(fr, -7)), add(add(Ak, mul(dl, 5)), add(mul(fr, 17), [s * 1, 0, 0])), mul(dl, -1), "tend");
  }
  T(MAT, [0, 1.8, -110], [0, 1.8, 110], [0, 1, 0], "pad");
  return o;
}

const PATH = (function () {
  const a0 = [];
  for (let i = 0; i <= 16; i++) a0.push(raisePose(i / 16).ank[0]);
  return [a0];
})();

export const LYING_LEG_RAISE_ANATOMY = {
  label: "3D lying leg raise demonstration",
  cycle: CYCLE,
  phase: raisePhase,
  pose: raisePose,
  path: PATH,
  role: { abs: 0, quad: 1 },
  group: {
    abs: ["abs"],
    quad: ["quad"]
  },
  phases: ["Set", "Raise", "Top", "Lower"],
  cues: [
    "Lie on your back with your legs together and your arms by your sides, palms down. Press your lower back into the floor and lift your feet a few inches.",
    "Keep your legs nearly straight and raise them until your feet point at the ceiling. Curl your pelvis up slightly at the top and do not swing.",
    "Pause with your feet over your hips and keep your lower back flat on the floor.",
    "Lower your legs slowly and stop just above the floor before your lower back arches. Bend your knees a little if you cannot keep your back flat."
  ],
  muscles: [
    ["abs", "Lower abs", 0],
    ["quad", "Hip flexors & quads", 1]
  ],
  yaw: 38,
  pitch: 14,
  views: { three: 38 },
  view: { tg: [0, 46, 8], span: 215 }
};
