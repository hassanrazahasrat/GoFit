import { prepareLateralRaise, LATERAL_RAISE_CLIP, LATERAL_RAISE_CUES, LATERAL_RAISE_MUSCLES } from "./lateral-raise.js";
import { applyStill, buildPoseClip, closeHands, gripBar, plantHands, attachDumbbells, attachHandles, attachBar, attachBench, attachFlatBench, attachSeat, bindFeet, trackFeet, mirrorLegs, plantWrists, placeBars } from "./rig.js";

const CHEST = {
  primary: ["pectoralis"],
  secondary: ["deltoid-anterior-l", "deltoid-anterior-r", "triceps-l", "triceps-r"],
  primaryLabel: "chest",
  secondaryLabel: "front deltoid, triceps"
};

const FLY = {
  primary: ["pectoralis"],
  secondary: ["deltoid-anterior-l", "deltoid-anterior-r"],
  primaryLabel: "chest",
  secondaryLabel: "front deltoid"
};

const SHOULDER = {
  primary: ["deltoid-anterior-l", "deltoid-anterior-r"],
  secondary: ["triceps-l", "triceps-r"],
  primaryLabel: "front deltoid",
  secondaryLabel: "triceps"
};

const SHOULDER_PRESS = {
  primary: ["deltoid-lateral-l", "deltoid-lateral-r"],
  secondary: ["trapezius-upper"],
  primaryLabel: "shoulder",
  secondaryLabel: "upper trapezius"
};

const TRICEPS = {
  primary: ["triceps-l", "triceps-r"],
  secondary: [],
  primaryLabel: "triceps",
  secondaryLabel: ""
};

const TRICEPS_CHEST = {
  primary: ["triceps-l", "triceps-r"],
  secondary: ["pectoralis"],
  primaryLabel: "triceps",
  secondaryLabel: "chest"
};

function gearFor(name) {
  if (/dumbbell|water-bottle|squeeze/.test(name)) return "dumbbell";
  if (/cable|rope|machine|pec|deck/.test(name)) return "handle";
  if (/push-up|push up|pike|handstand|dip|tap/.test(name)) return "none";
  return "bar";
}

function cues(a, b, c, d) {
  return [
    { from: 0, text: a },
    { from: 0.28, text: b },
    { from: 1.65, text: c },
    { from: 3.15, text: d }
  ];
}

function motion(def) {
  return {
    clip: def.clip,
    cues: def.cues,
    muscles: def.muscles,
    prepare: function (gltf) {
      const root = gltf.scene;
      if (def.feet || def.plant === "floor" || def.orient) bindFeet(root);
      if (def.still) applyStill(root, def.still);
      if (def.mirrorLegs) mirrorLegs(root);
      if (def.feet) trackFeet(root, def.feet === true ? "plant" : def.feet);
      gltf.animations.push(buildPoseClip(root, {
        clip: def.clip,
        start: def.start || {},
        peak: def.peak || {},
        lockTwist: !!def.lockTwist,
        straight: !!def.straight,
        palmFacing: def.palmFacing || null
      }));
      if (def.grip === "plant") plantHands(root);
      else if (def.grip === "bar") gripBar(root);
      else if (def.grip !== false) closeHands(root);
      if (def.gear === "dumbbell") attachDumbbells(root);
      if (def.gear === "handle") attachHandles(root);
      if (def.gear === "bar") attachBar(root);
      if (def.bench === "flat") attachFlatBench(root);
      else if (def.bench === "seat") attachSeat(root);
      else if (def.bench) attachBench(root);
      if (def.plant) plantWrists(root, def.plant);
      if (def.bars) placeBars(root);
      if (def.orient) root.userData.demoOrient = { x: def.orient * Math.PI / 180 };
      if (def.view) root.userData.demoView = def.view;
      if (def.drop) {
        const amount = def.drop;
        const previous = root.userData.updateGear;
        root.userData.updateGear = function () {
          if (previous) previous();
          if (root.userData.sitBaseY == null) root.userData.sitBaseY = root.position.y;
          root.position.y = root.userData.sitBaseY - amount;
        };
      }
    }
  };
}

function lateralMotion(name) {
  const gear = /cable|machine/.test(name) ? "handle" : "dumbbell";
  return {
    clip: LATERAL_RAISE_CLIP,
    cues: LATERAL_RAISE_CUES,
    muscles: LATERAL_RAISE_MUSCLES,
    prepare: function (gltf) {
      prepareLateralRaise(gltf, {
        gear: gear,
        lean: /lean/.test(name) ? 18 : 0,
        seated: /seated/.test(name)
      });
    }
  };
}

function benchMotion(name, incline) {
  const gear = gearFor(name);
  const flatBar = !incline && (gear === "none" ? "bar" : gear) === "bar" && !/close-grip/.test(name);
  if (flatBar) {
    return motion({
      clip: "bench-press",
      gear: "bar",
      grip: "bar",
      bench: "flat",
      feet: true,
      mirrorLegs: true,
      lockTwist: true,
      straight: true,
      palmFacing: [0, -1, 0],
      orient: -90,
      view: "bench3",
      muscles: CHEST,
      still: {
        UpperLegL: { x: -40, y: -20, z: 5 },
        LowerLegL: { x: 24, z: -40 }
      },
      start: {
        UpperArmL: { x: -80, y: -19, z: -110 },
        LowerArmL: { z: 11 },
        WristL: { x: 18 },
        WristR: { x: 18 }
      },
      peak: {
        UpperArmL: { x: 30, y: -30, z: -10 },
        LowerArmL: { z: -60, x: -30 },
        WristL: { x: 18 },
        WristR: { x: 18 }
      },
      cues: cues("Lie flat. Bar over the chest, feet planted.", "Lower the bar to mid-chest with elbows about 45°.", "Forearms vertical. Wrists stacked over elbows.", "Press up until the arms are straight. Soft lockout.")
    });
  }
  return motion({
    clip: incline ? "incline-press" : "bench-press",
    gear: gear === "none" ? "bar" : gear,
    bench: true,
    orient: incline ? -62 : -90,
    view: "three",
    muscles: /close-grip/.test(name) ? TRICEPS_CHEST : CHEST,
    start: /close-grip/.test(name)
      ? { UpperArmL: { x: 0, z: -28 }, LowerArmL: { z: -88, x: -6 } }
      : { UpperArmL: { x: 5, z: -35 }, LowerArmL: { z: -80, x: 10 } },
    peak: /close-grip/.test(name)
      ? { UpperArmL: { x: 0, z: -98 }, LowerArmL: { z: 16, x: 22 } }
      : { UpperArmL: { x: 4, z: -100 }, LowerArmL: { z: 15, x: 30 } },
    cues: incline
      ? cues("Bar on the upper chest, elbows tucked about 45°.", "Press the bar up over the upper chest.", "Arms straight, bar over the shoulders.", "Lower it back to the upper chest.")
      : cues("Bar on the mid-chest, elbows about 45° from your sides.", "Press the bar up over the chest.", "Arms straight, bar stacked over the shoulders.", "Lower it back to the mid-chest.")
  });
}

function flyMotion(name) {
  const lying = /dumbbell|floor|squeeze/.test(name) || !/cable|crossover|pec|deck/.test(name);
  return motion({
    clip: "fly",
    gear: gearFor(name) === "bar" ? "dumbbell" : gearFor(name),
    bench: lying,
    orient: lying ? -90 : 0,
    view: lying ? "high" : "",
    muscles: FLY,
    start: { UpperArmL: { x: 80, z: -8 }, LowerArmL: { z: -16 } },
    peak: { UpperArmL: { x: 14, z: -76 }, LowerArmL: { z: -14 } },
    cues: cues("Arms open at shoulder height, elbows softly bent.", "Sweep the arms together over the chest.", "Hands meet in front. Keep the same elbow bend.", "Open back out slowly.")
  });
}

function shoulderMotion(name) {
  const arnold = /arnold/.test(name);
  if (arnold) {
    return motion({
      clip: "arnold-press",
      gear: gearFor(name) === "bar" ? "dumbbell" : gearFor(name),
      muscles: SHOULDER,
      start: { UpperArmL: { x: 24, z: -55 }, LowerArmL: { z: -75, x: 20, y: 70 } },
      peak: { UpperArmL: { x: 170, z: 5 }, LowerArmL: { z: 20, y: 0 } },
      cues: cues("Palms toward you, dumbbells at the shoulders.", "Rotate the palms out as you press.", "Finish with the arms straight, just in front of the ears.", "Lower and rotate the palms back.")
    });
  }
  const standing = /standing/.test(name);
  return motion({
    clip: "shoulder-press",
    gear: gearFor(name) === "bar" ? "dumbbell" : gearFor(name),
    muscles: SHOULDER_PRESS,
    lockTwist: true,
    feet: !standing,
    bench: standing ? false : "seat",
    drop: standing ? 0 : 0.34,
    view: "press3",
    still: standing ? null : {
      UpperLegL: { x: 55, z: 55, y: -30 },
      LowerLegL: { z: -80, x: 40 },
      UpperLegR: { x: -40, z: -40, y: -60 },
      LowerLegR: { z: -80, x: -80 }
    },
    start: {
      UpperArmL: { x: 55, y: -85, z: -50 },
      LowerArmL: { z: -65, x: -20, y: 30 },
      WristL: { x: 40 },
      WristR: { x: 40 }
    },
    peak: {
      UpperArmL: { x: 155, y: -85, z: 25 },
      LowerArmL: { z: 20, x: 10, y: 30 },
      WristL: { x: 40 },
      WristR: { x: 40 }
    },
    cues: cues("Sit tall. Dumbbells at ear level, elbows tucked about 45°.", "Press straight up. Keep wrists stacked over elbows.", "Arms extended overhead, ribs down.", "Lower with control back to ear level.")
  });
}

function overheadMotion() {
  return motion({
    clip: "overhead-extension",
    gear: "dumbbell",
    muscles: TRICEPS,
    start: { UpperArmL: { x: 160, y: 180, z: 0 }, LowerArmL: { z: 20, x: 30 } },
    peak: { UpperArmL: { x: 160, y: 180, z: 0 }, LowerArmL: { z: -90, x: 0 } },
    cues: cues("Arms straight, upper arms beside the ears.", "Bend only the elbows.", "Weights drop behind the head.", "Straighten without moving the upper arms.")
  });
}

function pushdownMotion(name) {
  return motion({
    clip: "pushdown",
    gear: /dumbbell/.test(name) ? "dumbbell" : /bar/.test(name) ? "bar" : "handle",
    muscles: TRICEPS,
    start: { UpperArmL: { x: 0, z: -30 }, LowerArmL: { z: -60 } },
    peak: { UpperArmL: { x: 0, z: -30 }, LowerArmL: { z: 0, x: 20 } },
    cues: cues("Elbows pinned to your sides, forearms up.", "Press down until the arms are straight.", "Squeeze the triceps. Upper arms stay still.", "Let the forearms rise back up.")
  });
}

function skullMotion(name) {
  return motion({
    clip: "skull-crusher",
    gear: gearFor(name) === "handle" ? "dumbbell" : gearFor(name),
    bench: true,
    orient: -90,
    view: "three",
    muscles: TRICEPS,
    start: { UpperArmL: { x: 20, z: -80 }, LowerArmL: { z: 20, x: 20 } },
    peak: { UpperArmL: { x: 20, z: -60 }, LowerArmL: { z: -60, x: 60 } },
    cues: cues("Arms straight over the chest.", "Bend only the elbows toward the forehead.", "Upper arms stay pointed at the ceiling.", "Extend back to straight arms.")
  });
}

function kickbackMotion() {
  return motion({
    clip: "kickback",
    gear: "dumbbell",
    still: { Torso: { x: -52 } },
    view: "side",
    muscles: TRICEPS,
    start: { UpperArmL: { x: 8, z: 42 }, LowerArmL: { z: -85 } },
    peak: { UpperArmL: { x: 8, z: 42 }, LowerArmL: { z: 20, x: 22 } },
    cues: cues("Hinge at the hips, upper arm fixed.", "Straighten the arm behind you.", "Squeeze the triceps at full extension.", "Bend the elbow back slowly.")
  });
}

function dipMotion() {
  return motion({
    clip: "dip",
    gear: "handle",
    bars: true,
    plant: "hold",
    muscles: TRICEPS_CHEST,
    start: { UpperArmL: { x: 12, z: 16 }, LowerArmL: { z: 20, x: 24 } },
    peak: { UpperArmL: { x: 18, z: 36 }, LowerArmL: { z: -78 } },
    cues: cues("Support yourself on straight arms.", "Bend the elbows and lower the shoulders.", "Stop when the elbows reach about 90°.", "Press back up to straight arms.")
  });
}

function benchDipMotion() {
  return motion({
    clip: "bench-dip",
    gear: "none",
    grip: false,
    bench: true,
    plant: "hold",
    still: { UpperLegL: { x: -78 }, UpperLegR: { x: -78 } },
    muscles: TRICEPS,
    start: { UpperArmL: { x: 8, z: 30 }, LowerArmL: { z: 18, x: 20 } },
    peak: { UpperArmL: { x: 10, z: 22 }, LowerArmL: { z: -82 } },
    cues: cues("Hands on the bench edge, arms straight.", "Bend the elbows to about 90°.", "Keep the back close to the bench.", "Press through the palms to straight arms.")
  });
}

function pushupMotion(name, kind) {
  const wide = /wide/.test(name);
  const diamond = /diamond/.test(name);
  const close = /close/.test(name);
  const flare = diamond || close ? 14 : wide ? 50 : 30;
  const orient = kind === "decline" ? 102 : kind === "incline" ? 58 : 82;
  return motion({
    clip: "push-up-" + (kind || "flat"),
    gear: "none",
    grip: "plant",
    feet: "toes",
    orient: orient,
    view: "side",
    plant: "floor",
    muscles: close || diamond ? TRICEPS_CHEST : CHEST,
    still: {
      UpperLegR: { x: -20, z: 30 },
      LowerLegR: { z: -30 }
    },
    start: { UpperArmL: { x: flare, z: -92 }, LowerArmL: { z: 20, x: 25 } },
    peak: { UpperArmL: { x: Math.max(flare - 2, 12), z: -48 }, LowerArmL: { z: -60, x: 20 } },
    cues: kind === "incline"
      ? cues("Hands on a raised surface, arms straight, body in a line.", "Bend the elbows and lower the chest.", "Elbows near 90°. A higher surface makes this easier.", "Press back up to straight arms.")
      : kind === "decline"
        ? cues("Feet raised, arms straight, body in a line.", "Bend the elbows and lower the chest.", "Elbows near 90°. Keep the hips level.", "Press back up to straight arms.")
        : cues("Hands under the shoulders, body in a straight line.", "Bend the elbows and lower the chest.", "Elbows near 90°, about 45° out from your sides.", "Press the floor away. Keep the hips level.")
  });
}

function pikeMotion(name) {
  const hold = /handstand/.test(name);
  return motion({
    clip: hold ? "handstand-hold" : "pike-push-up",
    gear: "none",
    grip: false,
    still: { Abdomen: { x: hold ? -28 : -58 } },
    plant: "floor",
    view: "side",
    muscles: SHOULDER,
    start: { UpperArmL: { x: hold ? 24 : 28, z: -90 }, LowerArmL: { z: 16, x: 16 } },
    peak: { UpperArmL: { x: hold ? 24 : 36, z: hold ? -84 : -52 }, LowerArmL: { z: hold ? 8 : -70, x: hold ? 12 : 0 } },
    cues: hold
      ? cues("Hands on the floor, body stacked over the shoulders.", "Keep the ribs tight and the arms straight.", "Hold the line. A wall can catch the feet.", "Come down with control.")
      : cues("Hips high in an upside-down V.", "Bend the elbows and lower the head between the hands.", "Press back up to the V.", "Keep the hips up the whole time.")
  });
}

export function motionFor(name, anim) {
  const n = String(name || "").toLowerCase();
  if (/lateral|water-bottle raise/.test(n) || anim === "lat") return lateralMotion(n);
  if (/fly|pec deck|crossover|squeeze press/.test(n) || anim === "fly") return flyMotion(n);
  if (/skull/.test(n) || anim === "skull") return skullMotion(n);
  if (/kickback/.test(n) || anim === "kick") return kickbackMotion();
  if (/pushdown/.test(n)) return pushdownMotion(n);
  if (/overhead/.test(n) || anim === "oext") return overheadMotion();
  if (/arnold/.test(n)) return shoulderMotion(n);
  if (/pike|handstand/.test(n) || anim === "pike") return pikeMotion(n);
  if (/push-up|push up|shoulder tap/.test(n) || anim === "pushup" || anim === "ipush" || anim === "dpush") {
    const kind = /decline/.test(n) || anim === "dpush" ? "decline" : /incline/.test(n) || anim === "ipush" ? "incline" : "flat";
    return pushupMotion(n, kind);
  }
  if (/bench dip|chair dip/.test(n) || anim === "bdip") return benchDipMotion();
  if (/dip/.test(n) || anim === "dips") return dipMotion();
  if (/incline/.test(n) || anim === "ipress") return benchMotion(n, true);
  if (/shoulder press|machine shoulder|standing dumbbell press/.test(n)) return shoulderMotion(n);
  if (/close-grip|bench|dumbbell press|machine press/.test(n) || anim === "press") return benchMotion(n, false);
  if (anim === "ohp") return shoulderMotion(n);
  if (anim === "push") return pushdownMotion(n);
  return null;
}
