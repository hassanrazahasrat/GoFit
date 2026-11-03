import { mk, PI, cos, sin, add, mul, ease, ik, TORSO, THIGH, SHIN, FARM, UARM, NECK, HEAD, FOOT, HIPJ, HAND, KNEE, ELB, WRI, ANK } from "../viewer/anatomy-engine.js";

const CYCLE = 5.4;
const LEAN = -4 * PI / 180;
const A = [0, cos(LEAN), sin(LEAN)];
const UT = [0, -sin(LEAN), cos(LEAN)];
const P = [0, 52, 0];
const SC = add(P, mul(A, 44));
const HIP_Y = P[1] - 3;
const OPEN = 70 * PI / 180;
const CLOSED = -34 * PI / 180;
const SEAT = mk(1, 18, [[0, 4, 4, 17], [1, 4, 4, 17]], [], null);
const BACK_PAD = mk(1, 18, [[0, 3.5, 3.5, 17], [1, 3.5, 3.5, 17]], [], null);
const POST = mk(1, 10, [[0, 2.2, 2.2, 2.2], [1, 2.2, 2.2, 2.2]], [], null);
const ARM_PAD = mk(1, 14, [[0, 4.2, 4.2, 4.2], [1, 4.2, 4.2, 4.2]], [], null);

function deckPhase(t) {
  t = ((t % CYCLE) + CYCLE) % CYCLE;
  if (t < 0.6) return { u: 0, p: 0 };
  if (t < 2.0) return { u: ease((t - 0.6) / 1.4), p: 1 };
  if (t < 2.9) return { u: 1, p: 2 };
  if (t < 5.0) return { u: 1 - ease((t - 2.9) / 2.1), p: 3 };
  return { u: 0, p: 0 };
}

function deckPose(u) {
  const o = [];
  function T(d, from, to, up, col) { o.push({ d: d, A: from, B: to, u: up, col: col || "musc" }); }
  const sg = [1, -1];
  T(TORSO, add(P, mul(A, -10)), add(P, mul(A, 50)), UT);
  const NB = add(P, mul(A, 50));
  T(NECK, add(NB, mul(A, -2)), add(NB, mul(A, 7)), UT);
  T(HEAD, add(NB, mul(A, 5)), add(NB, mul(A, 25)), UT, "head");
  const g = OPEN + (CLOSED - OPEN) * u;
  o.E = [];
  o.grips = [];
  for (let i = 0; i < 2; i++) {
    const s = sg[i];
    const S = add(SC, [s * 22, 0, 0]);
    const E = add(S, [s * 30 * sin(g), 0, 30 * cos(g)]);
    const W = add(E, [0, 26, 0]);
    o.E[i] = E;
    o.grips[i] = W;
    T(UARM, S, E, [0, 1, 0]);
    T(FARM, E, W, [0, 0, 1]);
    T(ELB, add(E, [0, -4.2, 0]), add(E, [0, 4.2, 0]), [0, 0, 1], "tend");
    T(WRI, add(W, [0, -3, 0]), add(W, [0, 3, 0]), [0, 0, 1], "tend");
    T(HAND, add(W, [0, -3.9, 0]), add(W, [0, 3.9, 0]), [0, 0, 1], "tend");
    T(ARM_PAD, add(E, [0, 4, 0]), add(E, [0, 24, 0]), [0, 0, 1], "pad");
  }
  const seatY = HIP_Y - 13;
  T(SEAT, [0, seatY, -14], [0, seatY, 30], [0, 1, 0], "pad");
  T(POST, [0, seatY - 4, 8], [0, 2, 8], [1, 0, 0], "rig");
  const bp = add(add(P, mul(A, -4)), mul(UT, -13.5));
  T(BACK_PAD, bp, add(add(P, mul(A, 72)), mul(UT, -13.5)), UT, "pad");
  T(POST, bp, [0, 2, -36], [1, 0, 0], "rig");
  T(POST, [0, 2, -36], [0, 2, 62], [1, 0, 0], "rig");
  T(POST, [-26, 2, -36], [26, 2, -36], [0, 1, 0], "rig");
  T(POST, [-22, 2, 56], [22, 2, 56], [0, 1, 0], "rig");
  for (let i = 0; i < 2; i++) {
    const s = sg[i];
    const H = add(P, [s * 9.5, -3, 0]);
    const Ak = [s * 17, 9, 40];
    const r2 = ik(H, Ak, 44, 42, [s * 0.1, 1, 0.2]);
    T(HIPJ, add(H, [0, -8.8, 0]), add(H, [0, 8.8, 0]), [0, 0, 1]);
    T(THIGH, H, r2.E, r2.pole);
    T(SHIN, r2.E, r2.W, r2.pole);
    T(KNEE, add(r2.E, [0, -5.6, 0]), add(r2.E, [0, 5.6, 0]), [0, 0, 1], "tend");
    T(ANK, add(Ak, [0, -3.4, 0]), add(Ak, [0, 3.4, 0]), [0, 0, 1], "tend");
    T(FOOT, add(Ak, [s * 0.5, -5, -7]), add(Ak, [s * 1.5, -5, 17]), [0, 1, 0], "tend");
  }
  return o;
}

const PATH = (function () {
  const e0 = [];
  const e1 = [];
  const h0 = [];
  for (let i = 0; i <= 16; i++) {
    const p = deckPose(i / 16);
    e0.push(p.E[0]);
    e1.push(p.E[1]);
    h0.push(p.grips[0]);
  }
  return [e0, e1, h0];
})();

export const PEC_DECK_ANATOMY = {
  label: "3D pec deck demonstration",
  cycle: CYCLE,
  phase: deckPhase,
  pose: deckPose,
  path: PATH,
  role: { pec: 0, adelt: 1 },
  group: {
    pec: ["pec"],
    adelt: ["adelt"]
  },
  phases: ["Set", "Squeeze", "Hold", "Open"],
  cues: [
    "Sit with your back flat on the pad and your upper arms level with your shoulders. Rest your forearms on the pads with your elbows bent about 90°.",
    "Bring your elbows together in front of your chest in a wide arc. Keep your shoulders down and your back on the pad.",
    "Squeeze your chest for a second with your forearms nearly touching. Do not shrug or let your shoulders roll forward.",
    "Open your arms slowly until you feel a stretch across your chest, stopping before your shoulders go behind your torso."
  ],
  muscles: [
    ["pec", "Chest", 0],
    ["adelt", "Front delts", 1]
  ],
  yaw: 38,
  pitch: 14,
  views: { three: 38 },
  view: { tg: [0, 94, 8], span: 235 }
};
