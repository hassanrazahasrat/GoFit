import { mk, cos, sin, sqrt, add, sub, mul, ease, ik, TORSO, THIGH, SHIN, FARM, UARM, NECK, HEAD, FOOT, HIPJ, HAND, KNEE, ELB, WRI, ANK } from "../viewer/anatomy-engine.js";

const CYCLE = 5.4;
const LEG_REACH = 85.6;
const ANKLE_Y = 11;
const WRIST_LIFT = 6.5;
const SLAB = mk(1, 18, [[0, 2.5, 2.5, 20], [1, 2.5, 2.5, 20]], [], null);
const POST = mk(1, 10, [[0, 2.2, 2.2, 2.2], [1, 2.2, 2.2, 2.2]], [], null);

function pushPhase(t) {
  t = ((t % CYCLE) + CYCLE) % CYCLE;
  if (t < 0.6) return { u: 0, p: 0 };
  if (t < 2.5) return { u: ease((t - 0.6) / 1.9), p: 1 };
  if (t < 3.1) return { u: 1, p: 2 };
  if (t < 4.9) return { u: 1 - ease((t - 3.1) / 1.8), p: 3 };
  return { u: 0, p: 0 };
}

function buildPushUp(cfg) {
  const handH = cfg.handH || 0;
  const footH = cfg.footH || 0;
  const feetY = ANKLE_Y + footH;
  const wristY = handH + WRIST_LIFT;
  const shoulderX = 22;
  const dx = shoulderX - cfg.handX;
  const sTop = wristY + sqrt(55.2 * 55.2 - dx * dx - 4);
  const bodyLen = function (sn) {
    const drop = 3 * sn;
    return drop + sqrt(LEG_REACH * LEG_REACH - 9 + drop * drop) + 44;
  };
  const bodyAt = function (sy) {
    let sn = 0;
    for (let k = 0; k < 4; k++) sn = Math.max(-0.95, Math.min(0.95, (sy - feetY) / bodyLen(sn)));
    const th = Math.asin(sn);
    return { th: th, D: [0, sn, cos(th)], len: bodyLen(sn) };
  };
  const topBody = bodyAt(sTop);
  const handZ = topBody.len * topBody.D[2] + 2;
  const botGuess = bodyAt(wristY + cfg.reachBottom);
  const dzBot = botGuess.len * botGuess.D[2] - handZ;
  const sBot = wristY + sqrt(Math.max(100, cfg.reachBottom * cfg.reachBottom - dx * dx - dzBot * dzBot));

  function pose(u) {
    const o = [];
    function T(d, from, to, up, col) { o.push({ d: d, A: from, B: to, u: up, col: col || "musc" }); }
    const sg = [1, -1];
    const sy = sTop + (sBot - sTop) * u;
    const b = bodyAt(sy);
    const D = b.D;
    const F = [0, feetY, 0];
    const P = add(F, mul(D, b.len - 44));
    const SC = add(P, mul(D, 44));
    const UT = [0, -D[2], D[1]];
    T(TORSO, add(P, mul(D, -10)), add(P, mul(D, 50)), UT);
    const NB = add(P, mul(D, 50));
    const hl = Math.atan2(D[2], D[1]) - 0.35;
    const hd = [0, cos(hl), sin(hl)];
    const hu = [0, -sin(hl), cos(hl)];
    T(NECK, add(NB, mul(hd, -2)), add(NB, mul(hd, 7)), UT);
    T(HEAD, add(NB, mul(hd, 5)), add(NB, mul(hd, 25)), hu, "head");
    o.E = [];
    o.grips = [];
    for (let i = 0; i < 2; i++) {
      const s = sg[i];
      const S = add(SC, [s * shoulderX, 0, 0]);
      const W = [s * cfg.handX, wristY, handZ];
      const r = ik(S, W, 30, 26, [s * cfg.flare, 0.15, -0.6]);
      T(UARM, S, r.E, mul(r.pole, -1));
      T(FARM, r.E, r.W, mul(r.pole, -1));
      T(ELB, add(r.E, [0, -4.2, 0]), add(r.E, [0, 4.2, 0]), [0, 0, 1], "tend");
      T(WRI, add(r.W, [0, -2.6, 0]), add(r.W, [0, 2.6, 0]), [0, 0, 1], "tend");
      T(HAND, add(r.W, [0, -2.5, -2]), add(r.W, [0, -4.5, 9]), [0, 1, 0], "tend");
      o.E[i] = r.E;
      o.grips[i] = r.W;
    }
    for (let i = 0; i < 2; i++) {
      const s = sg[i];
      const H = add(P, [s * 9.5, -3, 0]);
      const Ak = [s * 10, feetY, 0];
      const r2 = ik(H, Ak, 44, 42, [0, 1, -0.2]);
      T(HIPJ, add(H, [0, -8.8, 0]), add(H, [0, 8.8, 0]), [0, 0, 1]);
      T(THIGH, H, r2.E, r2.pole);
      T(SHIN, r2.E, r2.W, r2.pole);
      T(KNEE, add(r2.E, [0, -5.6, 0]), add(r2.E, [0, 5.6, 0]), [0, 0, 1], "tend");
      T(ANK, add(Ak, [0, -3.4, 0]), add(Ak, [0, 3.4, 0]), [0, 0, 1], "tend");
      T(FOOT, sub(Ak, mul(UT, 8)), add(Ak, mul(UT, 8.5)), [0, 0, 1], "tend");
    }
    if (handH > 0) {
      T(SLAB, [-32, handH - 2.5, handZ + 2], [32, handH - 2.5, handZ + 2], [0, 1, 0], "pad");
      for (let i = 0; i < 2; i++) {
        const s = sg[i];
        T(POST, [s * 27, 2, handZ - 12], [s * 27, handH - 4, handZ - 12], [0, 0, 1], "rig");
        T(POST, [s * 27, 2, handZ + 16], [s * 27, handH - 4, handZ + 16], [0, 0, 1], "rig");
      }
    }
    if (footH > 0) {
      T(SLAB, [-32, footH - 0.5, -2], [32, footH - 0.5, -2], [0, 1, 0], "pad");
      for (let i = 0; i < 2; i++) {
        const s = sg[i];
        T(POST, [s * 27, 2, -14], [s * 27, footH - 3, -14], [0, 0, 1], "rig");
        T(POST, [s * 27, 2, 10], [s * 27, footH - 3, 10], [0, 0, 1], "rig");
      }
    }
    return o;
  }

  const path = (function () {
    const e0 = [];
    const e1 = [];
    for (let i = 0; i <= 16; i++) {
      const p = pose(i / 16);
      e0.push(p.E[0]);
      e1.push(p.E[1]);
    }
    return [e0, e1];
  })();

  return {
    label: cfg.label,
    cycle: CYCLE,
    phase: pushPhase,
    pose: pose,
    path: path,
    role: cfg.role,
    group: { pec: ["pec"], adelt: ["adelt"], tric: ["tric"], abs: ["abs"] },
    phases: ["Set", "Lower", "Bottom", "Press"],
    cues: cfg.cues,
    muscles: cfg.muscles,
    yaw: 50,
    pitch: 8,
    views: { three: 50 },
    view: cfg.view
  };
}

export const PUSH_UP_ANATOMY = buildPushUp({
  label: "3D push-up demonstration",
  handX: 25,
  flare: 0.9,
  reachBottom: 36,
  role: { pec: 0, adelt: 1, tric: 1, abs: 1 },
  muscles: [["pec", "Chest", 0], ["adelt", "Front delts", 1], ["tric", "Triceps", 1], ["abs", "Core", 1]],
  cues: [
    "Place your hands just outside your shoulders and make a straight line from your head to your heels. Squeeze your glutes and brace your core.",
    "Lower your chest toward the floor with your elbows about 45° from your body. Keep your hips level with your shoulders.",
    "Stop with your chest just above the floor and your elbows near 90°. Do not let your hips sag.",
    "Press the floor away until your arms are straight, keeping your body in one line."
  ],
  view: { tg: [0, 48, 64], span: 275 }
});

export const WIDE_PUSH_UP_ANATOMY = buildPushUp({
  label: "3D wide push-up demonstration",
  handX: 37,
  flare: 1.1,
  reachBottom: 35,
  role: { pec: 0, adelt: 1, tric: 1, abs: 1 },
  muscles: [["pec", "Chest", 0], ["adelt", "Front delts", 1], ["tric", "Triceps", 1], ["abs", "Core", 1]],
  cues: [
    "Place your hands well outside your shoulders, with your fingers pointing forward or slightly out, and make a straight line from your head to your heels.",
    "Lower your chest between your hands with your elbows out to about 60° from your body. Keep your core braced.",
    "Stop with your chest just above the floor and feel the stretch across your chest. Keep your hips level.",
    "Press the floor away and squeeze your chest as your arms straighten."
  ],
  view: { tg: [0, 48, 64], span: 275 }
});

export const DIAMOND_PUSH_UP_ANATOMY = buildPushUp({
  label: "3D diamond push-up demonstration",
  handX: 5,
  flare: 0.35,
  reachBottom: 37,
  role: { tric: 0, pec: 1, adelt: 1, abs: 1 },
  muscles: [["tric", "Triceps", 0], ["pec", "Inner chest", 1], ["adelt", "Front delts", 1], ["abs", "Core", 1]],
  cues: [
    "Place your hands under your chest with your thumbs and index fingers touching to make a diamond. Make a straight line from your head to your heels.",
    "Lower your chest toward your hands with your elbows brushing your sides. Keep your core braced.",
    "Stop with your chest just above your hands and your elbows close to your ribs. Do not let your hips sag.",
    "Press the floor away and squeeze your triceps until your arms are straight."
  ],
  view: { tg: [0, 48, 64], span: 275 }
});

export const INCLINE_PUSH_UP_ANATOMY = buildPushUp({
  label: "3D incline push-up demonstration",
  handH: 40,
  handX: 25,
  flare: 0.9,
  reachBottom: 36,
  role: { pec: 0, adelt: 1, tric: 1, abs: 1 },
  muscles: [["pec", "Lower chest", 0], ["adelt", "Front delts", 1], ["tric", "Triceps", 1], ["abs", "Core", 1]],
  cues: [
    "Place your hands on a bench or sturdy box just outside your shoulders and make a straight line from your head to your heels. A higher surface makes this easier.",
    "Lower your chest toward the edge of the bench with your elbows about 45° from your body. Keep your hips level.",
    "Stop with your chest just above the bench and your elbows near 90°. Do not let your hips sag.",
    "Press the bench away until your arms are straight, keeping your body in one line."
  ],
  view: { tg: [0, 60, 66], span: 300 }
});

export const DECLINE_PUSH_UP_ANATOMY = buildPushUp({
  label: "3D decline push-up demonstration",
  footH: 40,
  handX: 25,
  flare: 0.9,
  reachBottom: 36,
  role: { pec: 0, adelt: 0, tric: 1, abs: 1 },
  muscles: [["pec", "Upper chest", 0], ["adelt", "Front delts", 0], ["tric", "Triceps", 1], ["abs", "Core", 1]],
  cues: [
    "Place your feet on a bench and your hands just outside your shoulders. Make a straight line from your head to your heels.",
    "Lower your chest toward the floor with your elbows about 45° from your body. Keep your hips level and your core braced.",
    "Stop with your chest just above the floor and your elbows near 90°. Do not let your hips pike up or sag.",
    "Press the floor away until your arms are straight, keeping your body in one line."
  ],
  view: { tg: [0, 52, 64], span: 285 }
});

export const CLOSE_PUSH_UP_ANATOMY = buildPushUp({
  label: "3D close push-up demonstration",
  handX: 14,
  flare: 0.5,
  reachBottom: 36,
  role: { tric: 0, pec: 0, adelt: 1, abs: 1 },
  muscles: [["tric", "Triceps", 0], ["pec", "Inner chest", 0], ["adelt", "Front delts", 1], ["abs", "Core", 1]],
  cues: [
    "Place your hands directly under your shoulders, closer than a standard push-up, and make a straight line from your head to your heels.",
    "Lower your chest toward the floor with your elbows brushing your sides. Keep your hips level and your core braced.",
    "Stop with your chest just above the floor and your elbows close to your ribs. Do not let your hips sag.",
    "Press the floor away and squeeze your triceps until your arms are straight."
  ],
  view: { tg: [0, 48, 64], span: 275 }
});
