import { cos, sin, sqrt, add, sub, mul, ease, ik, TORSO, THIGH, SHIN, FARM, UARM, NECK, HEAD, FOOT, HIPJ, HAND, KNEE, ELB, WRI, ANK } from "../viewer/anatomy-engine.js";

const CYCLE = 5.4;
const LEG_REACH = 85.6;
const ANKLE_Y = 11;
const WRIST_Y = 6.5;
const HAND_X = 25;
const HAND_Z = 98;
const SHOULDER_X = 22;
const REACH_TOP = 55.2;
const REACH_LOW = 33;
const SHIFT_LOW = 12;

function pikePhase(t) {
  t = ((t % CYCLE) + CYCLE) % CYCLE;
  if (t < 0.6) return { u: 0, p: 0 };
  if (t < 2.5) return { u: ease((t - 0.6) / 1.9), p: 1 };
  if (t < 3.1) return { u: 1, p: 2 };
  if (t < 4.9) return { u: 1 - ease((t - 3.1) / 1.8), p: 3 };
  return { u: 0, p: 0 };
}

function hipAt(shoulder) {
  const c1 = [ANKLE_Y + 3, 0];
  const dy = shoulder[0] - c1[0];
  const dz = shoulder[1] - c1[1];
  const d = sqrt(dy * dy + dz * dz);
  const along = (d * d + LEG_REACH * LEG_REACH - 44 * 44) / (2 * d);
  const h = sqrt(Math.max(0, LEG_REACH * LEG_REACH - along * along));
  const ey = dy / d;
  const ez = dz / d;
  const p1 = [c1[0] + ey * along - ez * h, c1[1] + ez * along + ey * h];
  const p2 = [c1[0] + ey * along + ez * h, c1[1] + ez * along - ey * h];
  return p1[0] > p2[0] ? p1 : p2;
}

function pikePose(u) {
  const o = [];
  function T(d, from, to, up, col) { o.push({ d: d, A: from, B: to, u: up, col: col || "musc" }); }
  const sg = [1, -1];
  const reach = REACH_TOP + (REACH_LOW - REACH_TOP) * u;
  const shift = SHIFT_LOW * u;
  const dx = SHOULDER_X - HAND_X;
  const sy = WRIST_Y + sqrt(reach * reach - shift * shift - dx * dx);
  const sz = HAND_Z + shift;
  const hp = hipAt([sy, sz]);
  const P = [0, hp[0], hp[1]];
  const SC = [0, sy, sz];
  const a = mul(sub(SC, P), 1 / 44);
  const ut = [0, -a[2], a[1]];
  T(TORSO, add(P, mul(a, -10)), add(P, mul(a, 50)), ut);
  const hl = Math.atan2(a[2], a[1]) + 0.2;
  const hd = [0, cos(hl), sin(hl)];
  const hu = [0, -sin(hl), cos(hl)];
  const NB = add(P, mul(a, 50));
  T(NECK, add(NB, mul(hd, -2)), add(NB, mul(hd, 7)), ut);
  T(HEAD, add(NB, mul(hd, 5)), add(NB, mul(hd, 25)), hu, "head");
  o.E = [];
  for (let i = 0; i < 2; i++) {
    const s = sg[i];
    const S = add(SC, [s * SHOULDER_X, 0, 0]);
    const W = [s * HAND_X, WRIST_Y, HAND_Z];
    const r = ik(S, W, 30, 26, [s * 0.7, 0.1, -0.8]);
    T(UARM, S, r.E, mul(r.pole, -1));
    T(FARM, r.E, r.W, mul(r.pole, -1));
    T(ELB, add(r.E, [0, -4.2, 0]), add(r.E, [0, 4.2, 0]), [0, 0, 1], "tend");
    T(WRI, add(r.W, [0, -2.6, 0]), add(r.W, [0, 2.6, 0]), [0, 0, 1], "tend");
    T(HAND, add(r.W, [0, -2.5, -2]), add(r.W, [0, -4.5, 9]), [0, 1, 0], "tend");
    o.E[i] = r.E;
  }
  for (let i = 0; i < 2; i++) {
    const s = sg[i];
    const H = add(P, [s * 9.5, -3, 0]);
    const Ak = [s * 10, ANKLE_Y, 0];
    const dir = mul(sub(H, Ak), 1 / LEG_REACH);
    const r2 = ik(H, Ak, 44, 42, [0, -dir[2], dir[1]]);
    T(HIPJ, add(H, [0, -8.8, 0]), add(H, [0, 8.8, 0]), [0, 0, 1]);
    T(THIGH, H, r2.E, r2.pole);
    T(SHIN, r2.E, r2.W, r2.pole);
    T(KNEE, add(r2.E, [0, -5.6, 0]), add(r2.E, [0, 5.6, 0]), [0, 0, 1], "tend");
    T(ANK, add(Ak, [0, -3.4, 0]), add(Ak, [0, 3.4, 0]), [0, 0, 1], "tend");
    T(FOOT, add(Ak, [0, 8, -2]), add(Ak, [0, -8.5, 2.5]), [1, 0, 0], "tend");
  }
  o.head = add(NB, mul(hd, 15));
  return o;
}

const PATH = (function () {
  const e0 = [];
  const e1 = [];
  const hd = [];
  for (let i = 0; i <= 16; i++) {
    const p = pikePose(i / 16);
    e0.push(p.E[0]);
    e1.push(p.E[1]);
    hd.push(p.head);
  }
  return [e0, e1, hd];
})();

export const PIKE_PUSH_UP_ANATOMY = {
  label: "3D pike push-up demonstration",
  cycle: CYCLE,
  phase: pikePhase,
  pose: pikePose,
  path: PATH,
  role: { adelt: 0, ldelt: 0, tric: 1, pec: 1, utrap: 1, abs: 1 },
  group: {
    delts: ["adelt", "ldelt"],
    tric: ["tric"],
    pec: ["pec"],
    utrap: ["utrap"],
    abs: ["abs"]
  },
  phases: ["Set", "Lower", "Bottom", "Press"],
  cues: [
    "Start on your hands and feet with your hips high so your body makes an upside-down V. Place your hands just wider than your shoulders and keep your legs and back straight.",
    "Bend your elbows and lower the top of your head toward the floor between your hands. Keep your hips high and your elbows about 45° from your body.",
    "Stop with your head just above the floor and your elbows near 90°. Keep your hips high and your back straight.",
    "Press the floor away until your arms are straight and your hips are high again."
  ],
  muscles: [
    ["delts", "Shoulders", 0],
    ["tric", "Triceps", 1],
    ["pec", "Upper chest", 1],
    ["utrap", "Upper traps", 1],
    ["abs", "Core", 1]
  ],
  yaw: 50,
  pitch: 8,
  views: { three: 50 },
  view: { tg: [0, 38, 62], span: 215 }
};
