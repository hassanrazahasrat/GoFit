import { mk, cos, sin, sqrt, add, sub, mul, ease, ik, TORSO, THIGH, SHIN, FARM, UARM, NECK, HEAD, FOOT, HIPJ, HAND, KNEE, ELB, WRI, ANK, BAR } from "../viewer/anatomy-engine.js";

const CYCLE = 5.4;
const LEG_REACH = 85.6;
const ANKLE_Y = 11;
const BAR_Y = 90;
const HAND_X = 27;
const SHOULDER_X = 22;
const REACH = 55.2;
const LEAN = 22;
const CHEST_GAP = 17.5;
const POST = mk(1, 10, [[0, 2.2, 2.2, 2.2], [1, 2.2, 2.2, 2.2]], [], null);

function bodyLen(sn) {
  const drop = 3 * sn;
  return drop + sqrt(LEG_REACH * LEG_REACH - 9 + drop * drop) + 44;
}

function bodyAt(sy) {
  let sn = 0;
  for (let k = 0; k < 5; k++) sn = Math.max(-0.95, Math.min(0.95, (sy - ANKLE_Y) / bodyLen(sn)));
  return { sn: sn, c: sqrt(1 - sn * sn), len: bodyLen(sn) };
}

const BOTTOM_Y = BAR_Y - sqrt(REACH * REACH - (HAND_X - SHOULDER_X) * (HAND_X - SHOULDER_X) - LEAN * LEAN);
const BOTTOM_BODY = bodyAt(BOTTOM_Y);
const BAR_Z = -BOTTOM_BODY.len * BOTTOM_BODY.c + LEAN;

function chestGap(sn) {
  const c = sqrt(1 - sn * sn);
  const len = bodyLen(sn);
  const py = ANKLE_Y + (len - 44) * sn;
  const pz = -(len - 44) * c;
  return (BAR_Y - py) * c + (BAR_Z - pz) * sn;
}

const TOP_SN = (function () {
  let lo = 0.05;
  let hi = 0.95;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (chestGap(mid) > CHEST_GAP) lo = mid;
    else hi = mid;
  }
  return lo;
})();
const TOP_Y = ANKLE_Y + bodyLen(TOP_SN) * TOP_SN;

function rowPhase(t) {
  t = ((t % CYCLE) + CYCLE) % CYCLE;
  if (t < 0.6) return { u: 0, p: 0 };
  if (t < 1.8) return { u: ease((t - 0.6) / 1.2), p: 1 };
  if (t < 2.7) return { u: 1, p: 2 };
  if (t < 4.9) return { u: 1 - ease((t - 2.7) / 2.2), p: 3 };
  return { u: 0, p: 0 };
}

function rowPose(u) {
  const o = [];
  function T(d, from, to, up, col) { o.push({ d: d, A: from, B: to, u: up, col: col || "musc" }); }
  const sg = [1, -1];
  const sy = BOTTOM_Y + (TOP_Y - BOTTOM_Y) * u;
  const b = bodyAt(sy);
  const A = [0, b.sn, -b.c];
  const UT = [0, b.c, b.sn];
  const F = [0, ANKLE_Y, 0];
  const P = add(F, mul(A, b.len - 44));
  const SC = add(P, mul(A, 44));
  const sx = SHOULDER_X - 2.4 * u;
  const bk = 0.4 + 2.4 * u;
  T(TORSO, add(P, mul(A, -10)), add(P, mul(A, 50)), UT);
  const NB = add(P, mul(A, 50));
  const hl = Math.atan2(-b.c, b.sn) + 0.25;
  const hd = [0, cos(hl), sin(hl)];
  const hu = [0, -sin(hl), cos(hl)];
  T(NECK, add(NB, mul(hd, -2)), add(NB, mul(hd, 7)), UT);
  T(HEAD, add(NB, mul(hd, 5)), add(NB, mul(hd, 25)), hu, "head");
  o.E = [];
  o.grips = [];
  for (let i = 0; i < 2; i++) {
    const s = sg[i];
    const S = add(add(SC, [s * sx, 0, 0]), mul(A, -bk));
    const W = [s * HAND_X, BAR_Y, BAR_Z];
    const r = ik(S, W, 30, 26, [s * 0.7, -0.3, 1]);
    T(UARM, S, r.E, mul(r.pole, -1));
    T(FARM, r.E, r.W, mul(r.pole, -1));
    T(ELB, add(r.E, [0, -4.2, 0]), add(r.E, [0, 4.2, 0]), [0, 0, 1], "tend");
    T(WRI, add(r.W, [-2.6, 0, 0]), add(r.W, [2.6, 0, 0]), [0, 1, 0], "tend");
    T(HAND, add(r.W, [-3.9, 0, 0]), add(r.W, [3.9, 0, 0]), [0, 1, 0], "tend");
    o.E[i] = r.E;
    o.grips[i] = r.W;
  }
  T(BAR, [-40, BAR_Y, BAR_Z], [40, BAR_Y, BAR_Z], [0, 1, 0], "bar");
  for (let i = 0; i < 2; i++) {
    const s = sg[i];
    T(POST, [s * 40, 2, BAR_Z], [s * 40, BAR_Y - 2, BAR_Z], [0, 0, 1], "rig");
    T(POST, [s * 40, 2, BAR_Z - 18], [s * 40, 2, BAR_Z + 18], [0, 1, 0], "rig");
  }
  for (let i = 0; i < 2; i++) {
    const s = sg[i];
    const H = add(P, [s * 9.5, -3, 0]);
    const Ak = [s * 10, ANKLE_Y, 0];
    const r2 = ik(H, Ak, 44, 42, UT);
    T(HIPJ, add(H, [0, -8.8, 0]), add(H, [0, 8.8, 0]), [0, 0, 1]);
    T(THIGH, H, r2.E, r2.pole);
    T(SHIN, r2.E, r2.W, r2.pole);
    T(KNEE, add(r2.E, [0, -5.6, 0]), add(r2.E, [0, 5.6, 0]), [0, 0, 1], "tend");
    T(ANK, add(Ak, [0, -3.4, 0]), add(Ak, [0, 3.4, 0]), [0, 0, 1], "tend");
    T(FOOT, sub(Ak, mul(UT, 8)), add(Ak, mul(UT, 8.5)), [0, 0, 1], "tend");
  }
  return o;
}

const PATH = (function () {
  const e0 = [];
  const e1 = [];
  for (let i = 0; i <= 16; i++) {
    const p = rowPose(i / 16);
    e0.push(p.E[0]);
    e1.push(p.E[1]);
  }
  return [e0, e1];
})();

export const INVERTED_ROW_ANATOMY = {
  label: "3D inverted row demonstration",
  cycle: CYCLE,
  phase: rowPhase,
  pose: rowPose,
  path: PATH,
  role: { lats: 0, trap: 0, rhomb: 0, infra: 0, teres: 0, rdelt: 0, bic: 1, brach: 1, fore: 1, utrap: 1, glut: 1, abs: 1, erec: 1 },
  group: {
    lats: ["lats"],
    trap: ["trap"],
    rhomb: ["rhomb"],
    scap: ["infra", "teres"],
    rdelt: ["rdelt"],
    bic: ["bic", "brach"],
    fore: ["fore"],
    utrap: ["utrap"],
    core: ["glut", "abs", "erec"]
  },
  phases: ["Set", "Pull", "Squeeze", "Lower"],
  cues: [
    "Lie under a bar set about waist height, or a sturdy table edge. Grip it just outside your shoulders with an overhand grip. Keep your heels on the floor and your body in one straight line.",
    "Pull your chest up to the bar. Lead with your elbows and squeeze your shoulder blades together. Keep your hips up the whole way.",
    "Pause with your chest just under the bar and your shoulder blades squeezed. Do not let your hips sag.",
    "Lower slowly until your arms are straight and your shoulder blades spread apart, keeping your body in one line."
  ],
  muscles: [
    ["lats", "Lats", 0],
    ["trap", "Mid & lower traps", 0],
    ["rhomb", "Rhomboids", 0],
    ["scap", "Infraspinatus & teres", 0],
    ["rdelt", "Rear delts", 0],
    ["bic", "Biceps & brachialis", 1],
    ["fore", "Forearms", 1],
    ["utrap", "Upper traps", 1],
    ["core", "Glutes & core", 1]
  ],
  yaw: 40,
  pitch: -14,
  views: { three: 40 },
  view: { tg: [0, 48, -58], span: 190 }
};
