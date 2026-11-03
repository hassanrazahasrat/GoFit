import { mk, PI, cos, sin, add, mul, lv, ease, ik, TORSO, THIGH, SHIN, FARM, UARM, NECK, HEAD, FOOT, HIPJ, HAND, KNEE, ELB, WRI, ANK, BAR, PLATE, HUB } from "../viewer/anatomy-engine.js";

const CYCLE = 5.6;
const BACK_PAD = mk(1, 18, [[0, 3.5, 3.5, 15], [1, 3.5, 3.5, 15]], [], null);
const POST = mk(1, 10, [[0, 2.2, 2.2, 2.2], [1, 2.2, 2.2, 2.2]], [], null);

const LAM = -PI / 2;
const A = [0, cos(LAM), sin(LAM)];
const UT = [0, -sin(LAM), cos(LAM)];
const P = [0, 56, 0];
const SC = add(P, mul(A, 44));
const SHOULDER_LIFT = mul(UT, 2.5);
const BAR_LOW = add(add(P, mul(A, 35)), mul(UT, 15.5));
const BAR_TOP = [0, SC[1] + SHOULDER_LIFT[1] + 58, SC[2] + SHOULDER_LIFT[2] - 1];

function pressPhase(t) {
  t = ((t % CYCLE) + CYCLE) % CYCLE;
  if (t < 0.6) return { u: 0, p: 0 };
  if (t < 2.6) return { u: ease((t - 0.6) / 2.0), p: 1 };
  if (t < 3.4) return { u: 1, p: 2 };
  if (t < 4.9) return { u: 1 - ease((t - 3.4) / 1.5), p: 3 };
  return { u: 0, p: 0 };
}

function buildBenchPress(cfg) {
  function pressPose(u) {
    const o = [];
    function T(d, from, to, up, col) { o.push({ d: d, A: from, B: to, u: up, col: col || "musc" }); }
    const sx = 22 - 1.2 * u;
    const sg = [1, -1];
    const wr = [];
    T(TORSO, add(P, mul(A, -10)), add(P, mul(A, 50)), UT);
    const NB = add(P, mul(A, 50));
    T(NECK, add(NB, mul(A, -2)), add(NB, mul(A, 7)), UT);
    T(HEAD, add(NB, mul(A, 5)), add(NB, mul(A, 25)), UT, "head");
    const Bt = lv(BAR_TOP, BAR_LOW, u);
    for (let i = 0; i < 2; i++) {
      const s = sg[i];
      const S = add(add(SC, [s * sx, 0, 0]), SHOULDER_LIFT);
      const r = ik(S, [s * cfg.grip, Bt[1] - 3, Bt[2]], 30, 26, [s * cfg.pole, -1, 0.5]);
      o.E = o.E || [];
      o.E[i] = r.E;
      T(UARM, S, r.E, mul(r.pole, -1));
      T(FARM, r.E, r.W, mul(r.pole, -1));
      T(ELB, add(r.E, [0, -4.2, 0]), add(r.E, [0, 4.2, 0]), [0, 0, 1], "tend");
      T(WRI, add(r.W, [0, -3, 0]), add(r.W, [0, 3, 0]), [0, 0, 1], "tend");
      wr[i] = r.W;
    }
    const by = Bt[1];
    const bz = Bt[2];
    for (let i = 0; i < 2; i++) T(HAND, [wr[i][0], by - 3.9, bz], [wr[i][0], by + 3.9, bz], [0, 0, 1], "tend");
    o.bar = [0, by, bz];
    T(BAR, [-78, by, bz], [78, by, bz], [0, 1, 0], "bar");
    [[52, 56], [56.5, 60.5]].forEach(function (pair) {
      for (let k = 0; k < 2; k++) {
        const g = k ? -1 : 1;
        T(PLATE, [g * pair[0], by, bz], [g * pair[1], by, bz], [0, 1, 0], "plate");
      }
    });
    for (let i = 0; i < 2; i++) T(HUB, [sg[i] * 60.4, by, bz], [sg[i] * 61.2, by, bz], [0, 1, 0], "hub");
    T(BACK_PAD, add(add(P, mul(A, -4)), mul(UT, -13.5)), add(add(P, mul(A, 72)), mul(UT, -13.5)), UT, "pad");
    for (let i = 0; i < 2; i++) {
      const s = sg[i];
      T(POST, [s * 12, 41, -4], [s * 12, 2, -4], [1, 0, 0], "rig");
      T(POST, [s * 12, 41, -74], [s * 12, 2, -74], [1, 0, 0], "rig");
    }
    T(POST, [-12, 2, -4], [12, 2, -4], [0, 1, 0], "rig");
    T(POST, [-12, 2, -74], [12, 2, -74], [0, 1, 0], "rig");
    for (let i = 0; i < 2; i++) {
      const s = sg[i];
      T(POST, [s * 46, 2, -88], [s * 46, 120, -88], [0, 0, 1], "rig");
      T(POST, [s * 46, 113, -88], [s * 46, 113, -44], [1, 0, 0], "rig");
    }
    for (let i = 0; i < 2; i++) {
      const s = sg[i];
      const H = add(P, [s * 9.5, -3, 0]);
      const Ak = [s * 20, 9, 38];
      const r2 = ik(H, Ak, 44, 42, [s * 0.3, 1, 0.2]);
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
    const b = [];
    for (let i = 0; i <= 16; i++) {
      const p = pressPose(i / 16);
      e0.push(p.E[0]);
      e1.push(p.E[1]);
      b.push(add(p.bar, [-cfg.grip, 0, 0]));
    }
    return [e0, e1, b];
  })();

  return {
    label: cfg.label,
    cycle: CYCLE,
    phase: pressPhase,
    pose: pressPose,
    path: PATH,
    role: cfg.role,
    group: { pec: ["pec"], adelt: ["adelt"], tric: ["tric"], fore: ["fore"] },
    phases: ["Set", "Lower", "Pause", "Press"],
    cues: cfg.cues,
    muscles: cfg.muscles,
    yaw: 38,
    pitch: 12,
    views: { three: 38 },
    view: { tg: [0, 76, -40], span: 235 }
  };
}

export const BENCH_PRESS_ANATOMY = buildBenchPress({
  label: "3D barbell bench press demonstration",
  grip: 32,
  pole: 0.4,
  role: { pec: 0, adelt: 1, tric: 1, fore: 1 },
  cues: [
    "Lie back with your eyes under the bar, feet flat and shoulder blades pinched into the bench. Hold the bar over your chest on straight arms.",
    "Lower the bar under control to your mid chest with your elbows about 45° from your body. Keep your wrists stacked over your elbows.",
    "Touch your chest lightly and pause for a second. Keep your shoulder blades tight and your feet planted.",
    "Drive your feet down and press the bar up and slightly back until your arms are straight over your shoulders."
  ],
  muscles: [
    ["pec", "Chest", 0],
    ["adelt", "Front delts", 1],
    ["tric", "Triceps", 1],
    ["fore", "Forearms", 1]
  ]
});

export const CLOSE_GRIP_BENCH_PRESS_ANATOMY = buildBenchPress({
  label: "3D close-grip bench press demonstration",
  grip: 17,
  pole: 0.12,
  role: { tric: 0, pec: 1, adelt: 1, fore: 1 },
  cues: [
    "Lie back with your eyes under the bar and your feet flat. Grip the bar with your hands about shoulder-width apart, not closer, and hold it over your chest on straight arms.",
    "Lower the bar under control to your lower chest with your elbows tucked close to your ribs. Keep your wrists straight and stacked over your elbows.",
    "Touch your lower chest lightly and pause for a second. Keep your shoulder blades tight and your elbows pointing toward your feet.",
    "Drive your feet down and press the bar up until your arms are straight, squeezing your triceps at the top."
  ],
  muscles: [
    ["tric", "Triceps", 0],
    ["pec", "Inner chest", 1],
    ["adelt", "Front delts", 1],
    ["fore", "Forearms", 1]
  ]
});
