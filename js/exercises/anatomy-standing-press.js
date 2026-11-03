import { mk, add, mul, lv, ease, ik, TORSO, THIGH, SHIN, FARM, UARM, NECK, HEAD, FOOT, HIPJ, HAND, KNEE, ELB, WRI, ANK, BAR, PLATE, HUB } from "../viewer/anatomy-engine.js";

const CYCLE = 5.8;
const P = [0, 94.5, 0];
const SC = add(P, [0, 44, 0]);
const A = [0, 1, 0];
const UT = [0, 0, 1];
const MAT = mk(1, 18, [[0, 1.8, 1.8, 40], [1, 1.8, 1.8, 40]], [], null);
const DB_HEAD = mk(1, 14, [[0, 6.5, 6.5, 6.5], [1, 6.5, 6.5, 6.5]], [], null);

function pressPhase(t) {
  t = ((t % CYCLE) + CYCLE) % CYCLE;
  if (t < 0.7) return { u: 0, p: 0 };
  if (t < 2.6) return { u: ease((t - 0.7) / 1.9), p: 1 };
  if (t < 3.4) return { u: 1, p: 2 };
  if (t < 5.4) return { u: 1 - ease((t - 3.4) / 2.0), p: 3 };
  return { u: 0, p: 0 };
}

function smooth(x) {
  const k = Math.max(0, Math.min(1, x));
  return k * k * (3 - 2 * k);
}

function buildStandingPress(cfg) {
  const low = [cfg.lowX, SC[1] + cfg.lowY, SC[2] + cfg.lowZ];
  const top = [cfg.topX, SC[1] + 53, SC[2] + cfg.topZ];

  function pose(u) {
    const o = [];
    function T(d, from, to, up, col) { o.push({ d: d, A: from, B: to, u: up, col: col || "musc" }); }
    const sg = [1, -1];
    T(TORSO, add(P, mul(A, -10)), add(P, mul(A, 50)), UT);
    const NB = add(P, mul(A, 50));
    T(NECK, add(NB, mul(A, -2)), add(NB, mul(A, 7)), UT);
    T(HEAD, add(NB, mul(A, 5)), add(NB, mul(A, 25)), UT, "head");
    const g = lv(low, top, u);
    const zb = low[2] + (top[2] - low[2]) * smooth((u - cfg.lag) / (1 - cfg.lag));
    o.E = [];
    o.grips = [];
    const wr = [];
    for (let i = 0; i < 2; i++) {
      const s = sg[i];
      const S = add(SC, [s * 22, 0, 0]);
      const W = [s * g[0], g[1], zb];
      const r = ik(S, W, 30, 26, [s * cfg.pole, -1, 0.35 * (1 - u) + 0.1]);
      o.E[i] = r.E;
      o.grips[i] = r.W;
      wr[i] = r.W;
      T(UARM, S, r.E, mul(r.pole, -1));
      T(FARM, r.E, r.W, mul(r.pole, -1));
      T(ELB, add(r.E, [0, -4.2, 0]), add(r.E, [0, 4.2, 0]), [0, 0, 1], "tend");
      T(WRI, add(r.W, [0, -3, 0]), add(r.W, [0, 3, 0]), [0, 0, 1], "tend");
      T(HAND, add(r.W, [0, -3.9, 0]), add(r.W, [0, 3.9, 0]), [0, 0, 1], "tend");
    }
    if (cfg.bar) {
      const by = g[1] + 3;
      T(BAR, [-78, by, zb], [78, by, zb], [0, 1, 0], "bar");
      [[52, 56], [56.5, 60.5]].forEach(function (pair) {
        for (let k = 0; k < 2; k++) {
          const q = k ? -1 : 1;
          T(PLATE, [q * pair[0], by, zb], [q * pair[1], by, zb], [0, 1, 0], "plate");
        }
      });
      for (let i = 0; i < 2; i++) T(HUB, [sg[i] * 60.4, by, zb], [sg[i] * 61.2, by, zb], [0, 1, 0], "hub");
    } else {
      for (let i = 0; i < 2; i++) {
        const W = wr[i];
        T(BAR, add(W, [-7.5, 3, 0]), add(W, [7.5, 3, 0]), [0, 1, 0], "bar");
        T(DB_HEAD, add(W, [7.5, 3, 0]), add(W, [14, 3, 0]), [0, 1, 0], "rig");
        T(DB_HEAD, add(W, [-14, 3, 0]), add(W, [-7.5, 3, 0]), [0, 1, 0], "rig");
      }
    }
    for (let i = 0; i < 2; i++) {
      const s = sg[i];
      const H = add(P, [s * 9.5, -3, 0]);
      const Ak = [s * 11, 9, 0];
      const r2 = ik(H, Ak, 44, 42, [0, 0, 1]);
      T(HIPJ, add(H, [0, -8.8, 0]), add(H, [0, 8.8, 0]), [0, 0, 1]);
      T(THIGH, H, r2.E, r2.pole);
      T(SHIN, r2.E, r2.W, r2.pole);
      T(KNEE, add(r2.E, [0, -5.6, 0]), add(r2.E, [0, 5.6, 0]), [0, 0, 1], "tend");
      T(ANK, add(Ak, [0, -3.4, 0]), add(Ak, [0, 3.4, 0]), [0, 0, 1], "tend");
      T(FOOT, add(Ak, [s * 0.5, -5, -7]), add(Ak, [s * 1.5, -5, 17]), [0, 1, 0], "tend");
    }
    T(MAT, [0, 1.8, -70], [0, 1.8, 70], [0, 1, 0], "pad");
    return o;
  }

  const PATH = (function () {
    const e0 = [];
    const e1 = [];
    const h0 = [];
    for (let i = 0; i <= 16; i++) {
      const p = pose(i / 16);
      e0.push(p.E[0]);
      e1.push(p.E[1]);
      h0.push(p.grips[0]);
    }
    return [e0, e1, h0];
  })();

  return {
    label: cfg.label,
    cycle: CYCLE,
    phase: pressPhase,
    pose: pose,
    path: PATH,
    role: { adelt: 0, ldelt: 0, tric: 1, utrap: 1, abs: 1 },
    group: { adelt: ["adelt"], ldelt: ["ldelt"], tric: ["tric"], utrap: ["utrap"], abs: ["abs"] },
    phases: ["Set", "Press", "Lockout", "Lower"],
    cues: cfg.cues,
    muscles: [
      ["adelt", "Front delts", 0],
      ["ldelt", "Side delts", 0],
      ["tric", "Triceps", 1],
      ["utrap", "Upper traps", 1],
      ["abs", "Core (bracing)", 1]
    ],
    yaw: 38,
    pitch: 8,
    view: { tg: [0, 104, 0], span: 330 }
  };
}

export const STANDING_BARBELL_PRESS_ANATOMY = buildStandingPress({
  label: "3D standing barbell press demonstration",
  bar: true,
  lowX: 19,
  lowY: 3,
  lowZ: 15,
  topX: 19,
  topZ: 1,
  lag: 0.35,
  pole: 0.1,
  cues: [
    "Stand with your feet hip-width apart and the bar resting on your front delts. Keep your elbows slightly in front of the bar, glutes tight and ribs down.",
    "Press the bar straight up, moving your head back just enough for the bar to pass your face. Keep your legs locked and do not lean back.",
    "Finish with the bar over the middle of your feet, your arms straight and your head pushed slightly forward through your arms.",
    "Lower the bar slowly back to your front delts, moving your head back to let it pass, and reset your core."
  ]
});

export const STANDING_DB_PRESS_ANATOMY = buildStandingPress({
  label: "3D standing dumbbell press demonstration",
  bar: false,
  lowX: 25,
  lowY: 1,
  lowZ: 9,
  topX: 17,
  topZ: 2,
  lag: 0,
  pole: 0.5,
  cues: [
    "Stand with your feet hip-width apart and the dumbbells at your shoulders, palms facing forward. Keep your core tight and your ribs down.",
    "Press the dumbbells up and slightly together until your arms are almost straight. Keep your legs locked and do not lean back.",
    "Pause with the dumbbells over your shoulders and your arms almost straight. Do not slam your elbows into lockout.",
    "Lower the dumbbells slowly back to shoulder height with your forearms vertical."
  ]
});
