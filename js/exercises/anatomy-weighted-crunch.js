import { mk, PI, cos, sin, add, mul, ease, ik, TORSO, THIGH, SHIN, FARM, UARM, NECK, HEAD, FOOT, HIPJ, HAND, KNEE, ELB, WRI, ANK, BAR } from "../viewer/anatomy-engine.js";

const CYCLE = 5.2;
const CRUNCH = 34 * PI / 180;
const TUCK = 12 * PI / 180;
const P = [0, 16, 0];
const Q = add(P, [0, 0, -14]);
const MAT = mk(1, 18, [[0, 1.8, 1.8, 24], [1, 1.8, 1.8, 24]], [], null);
const DB_HEAD = mk(1, 14, [[0, 8.5, 8.5, 8.5], [1, 8.5, 8.5, 8.5]], [], null);

function crunchPhase(t) {
  t = ((t % CYCLE) + CYCLE) % CYCLE;
  if (t < 0.6) return { u: 0, p: 0 };
  if (t < 1.9) return { u: ease((t - 0.6) / 1.3), p: 1 };
  if (t < 2.7) return { u: 1, p: 2 };
  if (t < 4.9) return { u: 1 - ease((t - 2.7) / 2.2), p: 3 };
  return { u: 0, p: 0 };
}

function crunchPose(u) {
  const o = [];
  function T(d, from, to, up, col) { o.push({ d: d, A: from, B: to, u: up, col: col || "musc" }); }
  const sg = [1, -1];
  const th = CRUNCH * u;
  const a = [0, sin(th), -cos(th)];
  const ut = [0, cos(th), sin(th)];
  const SC = add(Q, mul(a, 30));
  T(TORSO, add(Q, mul(a, -24)), add(Q, mul(a, 36)), ut);
  const hl = th + TUCK * u;
  const hd = [0, sin(hl), -cos(hl)];
  const hu = [0, cos(hl), sin(hl)];
  const NB = add(Q, mul(a, 36));
  T(NECK, add(NB, mul(hd, -2)), add(NB, mul(hd, 7)), ut);
  T(HEAD, add(NB, mul(hd, 5)), add(NB, mul(hd, 25)), hu, "head");
  const C = add(add(Q, mul(a, 20)), mul(ut, 22));
  T(BAR, add(C, mul(a, -6)), add(C, mul(a, 6)), ut, "hub");
  T(DB_HEAD, add(C, mul(a, 6)), add(C, mul(a, 16)), ut, "pad");
  T(DB_HEAD, add(C, mul(a, -16)), add(C, mul(a, -6)), ut, "pad");
  o.E = [];
  for (let i = 0; i < 2; i++) {
    const s = sg[i];
    const S = add(SC, [s * 22, 0, 0]);
    const W = add(add(C, mul(a, 12)), [s * 9, 0, 0]);
    const r = ik(S, W, 30, 26, [s * 1, 0.3, 0]);
    o.E[i] = r.E;
    T(UARM, S, r.E, mul(r.pole, -1));
    T(FARM, r.E, r.W, mul(r.pole, -1));
    T(ELB, add(r.E, [0, -4.2, 0]), add(r.E, [0, 4.2, 0]), [0, 0, 1], "tend");
    T(WRI, add(r.W, [-2.6, 0, 0]), add(r.W, [2.6, 0, 0]), [0, 1, 0], "tend");
    T(HAND, add(r.W, [-3.9, 0, 0]), add(r.W, [3.9, 0, 0]), [0, 1, 0], "tend");
  }
  T(MAT, [0, 1.8, -96], [0, 1.8, 84], [0, 1, 0], "pad");
  for (let i = 0; i < 2; i++) {
    const s = sg[i];
    const H = add(P, [s * 9.5, -3, 0]);
    const Ak = [s * 14, 8, 60];
    const r2 = ik(H, Ak, 44, 42, [s * 0.2, 1, 0.2]);
    T(HIPJ, add(H, [0, -8.8, 0]), add(H, [0, 8.8, 0]), [0, 0, 1]);
    T(THIGH, H, r2.E, r2.pole);
    T(SHIN, r2.E, r2.W, r2.pole);
    T(KNEE, add(r2.E, [0, -5.6, 0]), add(r2.E, [0, 5.6, 0]), [0, 0, 1], "tend");
    T(ANK, add(Ak, [0, -3.4, 0]), add(Ak, [0, 3.4, 0]), [0, 0, 1], "tend");
    T(FOOT, add(Ak, [s * 0.5, -5, -7]), add(Ak, [s * 1.5, -5, 17]), [0, 1, 0], "tend");
  }
  o.db = C;
  return o;
}

const PATH = (function () {
  const c = [];
  const e0 = [];
  for (let i = 0; i <= 16; i++) {
    const p = crunchPose(i / 16);
    c.push(p.db);
    e0.push(p.E[0]);
  }
  return [c, e0];
})();

export const WEIGHTED_CRUNCH_ANATOMY = {
  label: "3D weighted crunch demonstration",
  cycle: CYCLE,
  phase: crunchPhase,
  pose: crunchPose,
  path: PATH,
  role: { abs: 0, quad: 1 },
  group: {
    abs: ["abs"],
    quad: ["quad"]
  },
  phases: ["Set", "Crunch", "Squeeze", "Lower"],
  cues: [
    "Lie on your back with your knees bent and feet flat. Hold a dumbbell upright against your chest with both hands and press your lower back into the floor.",
    "Curl your ribs toward your hips and lift your shoulder blades off the floor. Tuck your chin lightly and keep the dumbbell tight to your chest.",
    "Squeeze your abs hard at the top for a second. Keep your lower back and hips on the floor and do not pull on your neck.",
    "Lower slowly and keep your abs tight until your shoulders touch down. Do not flop back onto the floor."
  ],
  muscles: [
    ["abs", "Abs", 0],
    ["quad", "Hip flexors & quads", 1]
  ],
  yaw: 38,
  pitch: 14,
  views: { three: 38 },
  view: { tg: [0, 24, -12], span: 190 }
};
