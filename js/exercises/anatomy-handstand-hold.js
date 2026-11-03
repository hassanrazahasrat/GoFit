import { mk, PI, cos, sin, add, mul, ease, ik, TORSO, THIGH, SHIN, FARM, UARM, NECK, HEAD, FOOT, HIPJ, HAND, KNEE, ELB, WRI, ANK } from "../viewer/anatomy-engine.js";

const CYCLE = 7;
const HOLD = 5 * PI / 180;
const LEAN_IN = 1.5 * PI / 180;
const WRIST_Y = 6.5;
const SC_Y = WRIST_Y + 55;
const LEG = 84.4;
const WALL_Z = 131.4 * sin(HOLD + LEAN_IN) + 12 * sin(HOLD + LEAN_IN) + 3.5;
const MAT = mk(1, 18, [[0, 1.8, 1.8, 40], [1, 1.8, 1.8, 40]], [], null);
const WALL = mk(1, 18, [[0, 1.8, 1.8, 18], [1, 1.8, 1.8, 18]], [], null);

function holdPhase(t) {
  t = ((t % CYCLE) + CYCLE) % CYCLE;
  if (t < 1.0) return { u: 0, p: 0 };
  if (t < 2.6) return { u: ease((t - 1.0) / 1.6), p: 1 };
  if (t < 5.0) return { u: 1, p: 2 };
  if (t < 6.6) return { u: 1 - ease((t - 5.0) / 1.6), p: 3 };
  return { u: 0, p: 0 };
}

function holdPose(u) {
  const o = [];
  function T(d, from, to, up, col) { o.push({ d: d, A: from, B: to, u: up, col: col || "musc" }); }
  const sg = [1, -1];
  const th = HOLD + LEAN_IN * (1 - u);
  const c = cos(th);
  const s = sin(th);
  const A = [0, -c, -s];
  const F = [0, -s, c];
  const L = [0, c, s];
  const SC = [0, SC_Y, 0];
  const P = add(SC, mul(L, 44));
  T(TORSO, add(P, mul(A, -10)), add(P, mul(A, 50)), F);
  const NB = add(P, mul(A, 50));
  T(NECK, add(NB, mul(A, -2)), add(NB, mul(A, 7)), F);
  T(HEAD, add(NB, mul(A, 5)), add(NB, mul(A, 25)), F, "head");
  o.E = [];
  for (let i = 0; i < 2; i++) {
    const q = sg[i];
    const S = add(SC, [q * 22, 0, 0]);
    const W = [q * 20, WRIST_Y, 0];
    const r = ik(S, W, 30, 26, [q * 0.3, 0, -1]);
    o.E[i] = r.E;
    T(UARM, S, r.E, mul(r.pole, -1));
    T(FARM, r.E, r.W, mul(r.pole, -1));
    T(ELB, add(r.E, [0, -4.2, 0]), add(r.E, [0, 4.2, 0]), [0, 0, 1], "tend");
    T(WRI, add(r.W, [0, -2.6, 0]), add(r.W, [0, 2.6, 0]), [0, 0, 1], "tend");
    T(HAND, add(r.W, [0, -2.5, -2]), add(r.W, [0, -4.5, 9]), [0, 1, 0], "tend");
  }
  for (let i = 0; i < 2; i++) {
    const q = sg[i];
    const H = add(add(P, mul(L, 3)), [q * 9.5, 0, 0]);
    const Ak = add(H, mul(L, LEG));
    Ak[0] = q * 9;
    const r2 = ik(H, Ak, 44, 42, F);
    T(HIPJ, add(H, mul(A, -8.8)), add(H, mul(A, 8.8)), F);
    T(THIGH, H, r2.E, r2.pole);
    T(SHIN, r2.E, r2.W, r2.pole);
    T(KNEE, add(r2.E, mul(A, -5.6)), add(r2.E, mul(A, 5.6)), F, "tend");
    T(ANK, add(Ak, mul(L, -3.4)), add(Ak, mul(L, 3.4)), F, "tend");
    T(FOOT, add(Ak, mul(A, 5)), add(add(Ak, mul(L, 12)), mul(F, 3)), F, "tend");
  }
  T(MAT, [0, 1.8, -50], [0, 1.8, 70], [0, 1, 0], "pad");
  T(WALL, [0, 0, WALL_Z], [0, 230, WALL_Z], [0, 0, 1], "rig");
  o.hip = P;
  return o;
}

const PATH = (function () {
  const k = [];
  for (let i = 0; i <= 16; i++) k.push(holdPose(i / 16).hip);
  return [k];
})();

export const HANDSTAND_HOLD_ANATOMY = {
  label: "3D wall handstand hold demonstration",
  cycle: CYCLE,
  phase: holdPhase,
  pose: holdPose,
  path: PATH,
  role: { adelt: 0, utrap: 0, tric: 1, fore: 1, abs: 1 },
  group: {
    adelt: ["adelt"],
    utrap: ["utrap"],
    tric: ["tric"],
    fore: ["fore"],
    abs: ["abs"]
  },
  phases: ["Set", "Stack", "Hold", "Release"],
  cues: [
    "Kick up with your chest facing the wall and your hands about a hand's length from it. Rest your heels or toes lightly on the wall.",
    "Push the floor away so your shoulders stay open and your ears sit between your arms. Squeeze your glutes, pull your ribs in and point your toes.",
    "Hold a straight line from your hands to your toes. Keep your elbows locked and your belly tight, and breathe steadily.",
    "Come down with control by bringing one leg at a time off the wall, and rest before your next hold."
  ],
  muscles: [
    ["adelt", "Front delts", 0],
    ["utrap", "Upper traps", 0],
    ["tric", "Triceps", 1],
    ["fore", "Forearms", 1],
    ["abs", "Core", 1]
  ],
  yaw: 0,
  pitch: 6,
  view: { tg: [0, 104, 6], span: 350 }
};
