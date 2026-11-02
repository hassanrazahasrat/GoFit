import * as THREE from "three";

const TIMING = { raise: 2, hold: 2.5, lower: 4.6, duration: 5.2 };

export function findBone(root, name) {
  const plain = name.replace(/[\[\].:]/g, "");
  let found = null;
  root.traverse(function (node) {
    if (node.name === name || node.name === plain) found = node;
  });
  if (!found) throw new Error("Missing bone " + name);
  return found;
}

function axisQuat(x, y, z, degrees) {
  return new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(x, y, z), degrees * Math.PI / 180);
}

export function deltaQuat(pose) {
  const q = new THREE.Quaternion();
  if (pose.x) q.multiply(axisQuat(1, 0, 0, pose.x));
  if (pose.z) q.multiply(axisQuat(0, 0, 1, pose.z));
  if (pose.y) q.multiply(axisQuat(0, 1, 0, pose.y));
  return q;
}

export function applyStill(root, pose) {
  Object.keys(pose).forEach(function (name) {
    findBone(root, name).quaternion.multiply(deltaQuat(pose[name]));
  });
}

export function poseBones(root, pose) {
  applyStill(root, pose);
}

function mix(from, to, u) {
  return {
    x: (from.x || 0) + ((to.x || 0) - (from.x || 0)) * u,
    y: (from.y || 0) + ((to.y || 0) - (from.y || 0)) * u,
    z: (from.z || 0) + ((to.z || 0) - (from.z || 0)) * u
  };
}

function mixArmPose(from, to, u) {
  function lerp(a, b) {
    let d = (b || 0) - (a || 0);
    while (d > 180) d -= 360;
    while (d < -180) d += 360;
    return (a || 0) + d * u;
  }
  return {
    ux: lerp(from.ux, to.ux),
    uy: lerp(from.uy, to.uy),
    uz: lerp(from.uz, to.uz),
    lx: lerp(from.lx, to.lx),
    ly: lerp(from.ly, to.ly),
    lz: lerp(from.lz, to.lz)
  };
}

function amount(t) {
  if (t <= TIMING.raise) return (1 - Math.cos(Math.PI * (t / TIMING.raise))) / 2;
  if (t <= TIMING.hold) return 1;
  if (t <= TIMING.lower) return 1 - (1 - Math.cos(Math.PI * ((t - TIMING.hold) / (TIMING.lower - TIMING.hold)))) / 2;
  return 0;
}

function pushQuat(list, q) {
  list.push(q.x, q.y, q.z, q.w);
}

const ARM_KEYS = ["ux", "uz", "uy", "lz", "lx"];
const ARM_KEYS_LOCK = ["ux", "uz", "lz", "lx"];

function refineArm(pose, score, steps, passes, keys) {
  const search = keys || ARM_KEYS;
  let best = score(pose);
  for (let s = 0; s < steps.length; s += 1) {
    const step = steps[s];
    for (let pass = 0; pass < passes; pass += 1) {
      if (best < 0.008) return { pose: pose, error: best };
      for (let k = 0; k < search.length; k += 1) {
        const key = search[k];
        for (let dir = -1; dir <= 1; dir += 2) {
          const trial = Object.assign({}, pose);
          trial[key] = pose[key] + dir * step;
          const value = score(trial);
          if (value + 1e-5 < best) {
            best = value;
            pose = trial;
          }
        }
      }
    }
  }
  return { pose: pose, error: best };
}

export function buildPoseClip(root, spec) {
  const start = spec.start || {};
  const peak = spec.peak || {};
  const upperL = findBone(root, "UpperArmL");
  const lowerL = findBone(root, "LowerArmL");
  const upperR = findBone(root, "UpperArmR");
  const lowerR = findBone(root, "LowerArmR");
  const wristL = findBone(root, "WristL");
  const wristR = findBone(root, "WristR");
  const restUL = upperL.quaternion.clone();
  const restLL = lowerL.quaternion.clone();
  const restUR = upperR.quaternion.clone();
  const restLR = lowerR.quaternion.clone();
  const others = Object.keys(peak).filter(function (name) {
    return name !== "UpperArmL" && name !== "LowerArmL" && name !== "UpperArmR" && name !== "LowerArmR";
  });
  const otherBones = others.map(function (name) { return findBone(root, name); });
  const otherRest = otherBones.map(function (bone) { return bone.quaternion.clone(); });
  const leftUpperStart = restUL.clone().multiply(deltaQuat(start.UpperArmL || {}));
  const leftUpperPeak = restUL.clone().multiply(deltaQuat(peak.UpperArmL || {}));
  const leftLowerStart = restLL.clone().multiply(deltaQuat(start.LowerArmL || {}));
  const leftLowerPeak = restLL.clone().multiply(deltaQuat(peak.LowerArmL || {}));
  root.updateMatrixWorld(true);
  const centerX = findBone(root, "Chest").getWorldPosition(new THREE.Vector3()).x;
  const elbowL = new THREE.Vector3();
  const wristLP = new THREE.Vector3();
  const elbowT = new THREE.Vector3();
  const wristT = new THREE.Vector3();
  const elbowR = new THREE.Vector3();
  const wristRP = new THREE.Vector3();
  const times = [];
  const leftUpperValues = [];
  const leftLowerValues = [];
  const rightUpperValues = [];
  const rightLowerValues = [];
  const otherValues = others.map(function () { return []; });
  let solved = null;
  let prevSolved = null;
  const steps = 52;
  const lockTwist = !!spec.lockTwist;
  const eulerPath = !!spec.eulerPath || lockTwist;
  const searchKeys = lockTwist ? ARM_KEYS_LOCK : ARM_KEYS;
  function score(pose) {
    upperR.quaternion.copy(restUR).multiply(deltaQuat({ x: pose.ux, y: pose.uy, z: pose.uz }));
    lowerR.quaternion.copy(restLR).multiply(deltaQuat({ x: pose.lx, y: pose.ly, z: pose.lz }));
    root.updateMatrixWorld(true);
    lowerR.getWorldPosition(elbowR);
    wristR.getWorldPosition(wristRP);
    return elbowR.distanceTo(elbowT) + wristRP.distanceTo(wristT);
  }
  function clampToward(prev, next, limit) {
    const out = Object.assign({}, next);
    if (!prev) return out;
    ["ux", "uy", "uz", "lx", "ly", "lz"].forEach(function (key) {
      let d = out[key] - prev[key];
      while (d > 180) d -= 360;
      while (d < -180) d += 360;
      if (Math.abs(d) > limit) out[key] = prev[key] + Math.sign(d) * limit;
      else out[key] = prev[key] + d;
    });
    return out;
  }
  function solveRight(leftUpper, leftLower) {
    upperL.quaternion.copy(restUL).multiply(deltaQuat(leftUpper));
    lowerL.quaternion.copy(restLL).multiply(deltaQuat(leftLower));
    root.updateMatrixWorld(true);
    lowerL.getWorldPosition(elbowL);
    wristL.getWorldPosition(wristLP);
    elbowT.copy(elbowL);
    wristT.copy(wristLP);
    elbowT.x = centerX * 2 - elbowT.x;
    wristT.x = centerX * 2 - wristT.x;
    const twist = -(leftLower.y || 0);
    const upperTwist = -(leftUpper.y || 0);
    const seeds = [
      {
        ux: leftUpper.x || 0,
        uz: -(leftUpper.z || 0),
        uy: upperTwist,
        lz: -(leftLower.z || 0),
        lx: -(leftLower.x || 0),
        ly: twist
      },
      {
        ux: leftUpper.x || 0,
        uz: leftUpper.z || 0,
        uy: upperTwist,
        lz: leftLower.z || 0,
        lx: leftLower.x || 0,
        ly: twist
      },
      {
        ux: -(leftUpper.x || 0),
        uz: -(leftUpper.z || 0),
        uy: leftUpper.y || 0,
        lz: -(leftLower.z || 0),
        lx: leftLower.x || 0,
        ly: twist
      }
    ];
    let bestSeed = seeds[0];
    let bestError = Infinity;
    seeds.forEach(function (seed) {
      const error = score(seed);
      if (error < bestError) {
        bestError = error;
        bestSeed = seed;
      }
    });
    let refined = refineArm(bestSeed, score, [24, 12, 6, 3, 1], 4, searchKeys);
    if (refined.error > 0.02) {
      const wide = refineArm(refined.pose, score, [28, 14, 7, 3, 1], 3, searchKeys);
      if (wide.error < refined.error) refined = wide;
    }
    const pose = refined.pose;
    pose.ly = twist;
    if (lockTwist) pose.uy = upperTwist;
    return pose;
  }

  // For lockTwist presses, IK only at the endpoints then euler-mix.
  // Per-frame IK was the source of visible hand vibration.
  let rightStart = null;
  let rightPeak = null;
  if (lockTwist) {
    rightStart = solveRight(start.UpperArmL || {}, start.LowerArmL || {});
    rightPeak = solveRight(peak.UpperArmL || {}, peak.LowerArmL || {});
  }

  for (let i = 0; i <= steps; i += 1) {
    const t = TIMING.duration * i / steps;
    const u = amount(t);
    times.push(t);
    const leftUpper = mix(start.UpperArmL || {}, peak.UpperArmL || {}, u);
    const leftLower = mix(start.LowerArmL || {}, peak.LowerArmL || {}, u);
    const upperQ = eulerPath
      ? restUL.clone().multiply(deltaQuat(leftUpper))
      : leftUpperStart.clone().slerp(leftUpperPeak, u);
    const lowerQ = eulerPath
      ? restLL.clone().multiply(deltaQuat(leftLower))
      : leftLowerStart.clone().slerp(leftLowerPeak, u);
    upperL.quaternion.copy(upperQ);
    lowerL.quaternion.copy(lowerQ);
    if (lockTwist) {
      const rightPose = mixArmPose(rightStart, rightPeak, u);
      rightPose.ly = -(leftLower.y || 0);
      rightPose.uy = -(leftUpper.y || 0);
      upperR.quaternion.copy(restUR).multiply(deltaQuat({ x: rightPose.ux, y: rightPose.uy, z: rightPose.uz }));
      lowerR.quaternion.copy(restLR).multiply(deltaQuat({ x: rightPose.lx, y: rightPose.ly, z: rightPose.lz }));
    } else {
      root.updateMatrixWorld(true);
      lowerL.getWorldPosition(elbowL);
      wristL.getWorldPosition(wristLP);
      elbowT.copy(elbowL);
      wristT.copy(wristLP);
      elbowT.x = centerX * 2 - elbowT.x;
      wristT.x = centerX * 2 - wristT.x;
      const twist = -(leftLower.y || 0);
      const upperTwist = -(leftUpper.y || 0);
      let guess = solved ? Object.assign({}, solved, { ly: twist }) : {
        ux: leftUpper.x || 0,
        uz: -(leftUpper.z || 0),
        uy: upperTwist,
        lz: -(leftLower.z || 0),
        lx: -(leftLower.x || 0),
        ly: twist
      };
      if (!solved) {
        const seeds = [
          guess,
          { ux: leftUpper.x || 0, uz: leftUpper.z || 0, uy: upperTwist, lz: leftLower.z || 0, lx: leftLower.x || 0, ly: twist },
          { ux: -(leftUpper.x || 0), uz: -(leftUpper.z || 0), uy: leftUpper.y || 0, lz: -(leftLower.z || 0), lx: leftLower.x || 0, ly: twist }
        ];
        let bestSeed = seeds[0];
        let bestError = Infinity;
        seeds.forEach(function (seed) {
          const error = score(seed);
          if (error < bestError) {
            bestError = error;
            bestSeed = seed;
          }
        });
        guess = refineArm(bestSeed, score, [24, 12, 6, 3, 1], 4, searchKeys).pose;
      }
      let refined = refineArm(guess, score, solved ? [8, 3, 1] : [6, 2], solved ? 2 : 3, searchKeys);
      if (refined.error > 0.02) {
        const wide = refineArm(refined.pose, score, [28, 14, 7, 3, 1], 3, searchKeys);
        if (wide.error < refined.error) refined = wide;
      }
      solved = refined.pose;
      solved.ly = twist;
      solved = clampToward(prevSolved, solved, 40);
      solved.ly = twist;
      prevSolved = Object.assign({}, solved);
      upperR.quaternion.copy(restUR).multiply(deltaQuat({ x: solved.ux, y: solved.uy, z: solved.uz }));
      lowerR.quaternion.copy(restLR).multiply(deltaQuat({ x: solved.lx, y: solved.ly, z: solved.lz }));
    }
    pushQuat(leftUpperValues, upperQ);
    pushQuat(leftLowerValues, lowerQ);
    pushQuat(rightUpperValues, upperR.quaternion);
    pushQuat(rightLowerValues, lowerR.quaternion);
    others.forEach(function (name, index) {
      const pose = mix(start[name] || {}, peak[name] || {}, u);
      pushQuat(otherValues[index], otherRest[index].clone().multiply(deltaQuat(pose)));
    });
  }
  upperL.quaternion.copy(leftUpperStart);
  lowerL.quaternion.copy(leftLowerStart);
  upperR.quaternion.set(rightUpperValues[0], rightUpperValues[1], rightUpperValues[2], rightUpperValues[3]);
  lowerR.quaternion.set(rightLowerValues[0], rightLowerValues[1], rightLowerValues[2], rightLowerValues[3]);
  otherBones.forEach(function (bone, index) {
    const values = otherValues[index];
    bone.quaternion.set(values[0], values[1], values[2], values[3]);
  });
  const bones = [upperL, lowerL, upperR, lowerR].concat(otherBones);
  const values = [leftUpperValues, leftLowerValues, rightUpperValues, rightLowerValues].concat(otherValues);
  const tracks = bones.map(function (bone, index) {
    return new THREE.QuaternionKeyframeTrack(bone.name + ".quaternion", times, values[index]);
  });
  return new THREE.AnimationClip(spec.clip, TIMING.duration, tracks);
}

function bend(root, name, x, z) {
  const bone = findBone(root, name);
  const turn = new THREE.Quaternion();
  if (x) turn.multiply(axisQuat(1, 0, 0, x * 180 / Math.PI));
  if (z) turn.multiply(axisQuat(0, 0, 1, z * 180 / Math.PI));
  bone.quaternion.multiply(turn);
}

export function closeHands(root) {
  ["L", "R"].forEach(function (side) {
    ["Index", "Middle", "Ring", "Pinky"].forEach(function (finger) {
      bend(root, finger + "1." + side, -0.55, 0);
      bend(root, finger + "2." + side, -0.85, 0);
      bend(root, finger + "3." + side, -0.45, 0);
    });
    bend(root, "Thumb1." + side, -0.35, side === "L" ? -0.45 : 0.45);
    bend(root, "Thumb2." + side, -0.4, 0);
    bend(root, "Thumb3." + side, -0.25, 0);
  });
}

export function gripBar(root) {
  ["L", "R"].forEach(function (side) {
    ["Index", "Middle", "Ring", "Pinky"].forEach(function (finger) {
      bend(root, finger + "1." + side, -0.7, 0);
      bend(root, finger + "2." + side, -1.05, 0);
      bend(root, finger + "3." + side, -0.65, 0);
    });
    bend(root, "Thumb1." + side, -0.5, side === "L" ? -0.6 : 0.6);
    bend(root, "Thumb2." + side, -0.65, 0);
    bend(root, "Thumb3." + side, -0.4, 0);
  });
}

function metalMaterial() {
  return new THREE.MeshStandardMaterial({ color: 0xd5dde6, metalness: 0.78, roughness: 0.28 });
}

function shade(mesh) {
  mesh.traverse(function (node) {
    if (!node.isMesh) return;
    node.castShadow = true;
    node.receiveShadow = true;
  });
}

function makeDumbbell(material, plates) {
  const group = new THREE.Group();
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.00018, 0.00018, plates ? 0.00135 : 0.0015, 12), material);
  handle.rotation.z = Math.PI / 2;
  group.add(handle);
  if (plates) {
    const plate = new THREE.CylinderGeometry(0.00072, 0.00072, 0.00018, 18);
    const left = new THREE.Mesh(plate, material);
    const right = new THREE.Mesh(plate, material);
    left.rotation.z = Math.PI / 2;
    right.rotation.z = Math.PI / 2;
    left.position.x = -0.00058;
    right.position.x = 0.00058;
    group.add(left, right);
  }
  group.position.set(0, 0.00095, -0.0004);
  shade(group);
  return group;
}

function holdWeights(root, plates) {
  const material = metalMaterial();
  const left = makeDumbbell(material, plates);
  const right = makeDumbbell(material, plates);
  left.position.x = 0.00036;
  right.position.x = -0.0002;
  findBone(root, "WristL").add(left);
  findBone(root, "WristR").add(right);
}

export function attachDumbbells(root) {
  holdWeights(root, true);
}

export function attachHandles(root) {
  holdWeights(root, false);
}

function chainGear(root, fn) {
  const previous = root.userData.updateGear;
  root.userData.updateGear = function () {
    if (previous) previous();
    fn();
  };
}

export function attachBar(root) {
  const material = metalMaterial();
  const group = new THREE.Group();
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 1, 16), material);
  function makePlate(radius, thick) {
    return new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, thick, 28), material);
  }
  const plates = [
    makePlate(0.15, 0.042),
    makePlate(0.12, 0.034),
    makePlate(0.15, 0.042),
    makePlate(0.12, 0.034)
  ];
  group.add(shaft);
  plates.forEach(function (plate) { group.add(plate); });
  shade(group);
  root.add(group);
  const leftBone = findBone(root, "WristL");
  const rightBone = findBone(root, "WristR");
  const leftPalm = new THREE.Vector3(0.0003, 0.0007, -0.00035);
  const rightPalm = new THREE.Vector3(-0.0003, 0.0007, -0.00035);
  const left = new THREE.Vector3();
  const right = new THREE.Vector3();
  const dir = new THREE.Vector3();
  const mid = new THREE.Vector3();
  chainGear(root, function () {
    leftBone.localToWorld(left.copy(leftPalm));
    rightBone.localToWorld(right.copy(rightPalm));
    mid.copy(left).add(right).multiplyScalar(0.5);
    dir.set(right.x - left.x, 0, 0);
    if (Math.abs(dir.x) < 0.04) dir.x = dir.x < 0 ? -0.04 : 0.04;
    const grip = Math.abs(right.x - left.x);
    const length = grip + 0.9;
    dir.normalize();
    // Sit the shaft deep in the palms.
    group.position.set(mid.x, mid.y - 0.028, mid.z);
    root.worldToLocal(group.position);
    const worldQ = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    const parentQ = root.getWorldQuaternion(new THREE.Quaternion());
    group.quaternion.copy(parentQ.invert()).multiply(worldQ);
    shaft.scale.set(1, length, 1);
    const tip = length * 0.5 - 0.03;
    plates[0].position.set(0, -tip, 0);
    plates[1].position.set(0, -tip + 0.048, 0);
    plates[2].position.set(0, tip, 0);
    plates[3].position.set(0, tip - 0.048, 0);
  });
}

function benchMaterial() {
  return new THREE.MeshStandardMaterial({ color: 0x2c3344, roughness: 0.92, metalness: 0.02 });
}

export function attachBench(root) {
  const material = benchMaterial();
  const pad = new THREE.Mesh(new THREE.BoxGeometry(0.42, 1.08, 0.08), material);
  pad.position.set(0, 1.22, -0.012);
  shade(pad);
  const leg = new THREE.BoxGeometry(0.36, 0.08, 0.28);
  const head = new THREE.Mesh(leg, material);
  const foot = new THREE.Mesh(leg, material);
  head.position.set(0, 1.52, -0.18);
  foot.position.set(0, 0.86, -0.18);
  shade(head);
  shade(foot);
  root.add(pad, head, foot);
}

export function attachFlatBench(root) {
  const material = benchMaterial();
  const pad = new THREE.Mesh(new THREE.BoxGeometry(0.36, 1.22, 0.06), material);
  pad.position.set(0, 1.16, -0.1);
  shade(pad);
  const post = new THREE.BoxGeometry(0.32, 0.07, 0.12);
  const head = new THREE.Mesh(post, material);
  const foot = new THREE.Mesh(post, material);
  head.position.set(0, 1.52, -0.15);
  foot.position.set(0, 0.74, -0.15);
  shade(head);
  shade(foot);
  root.add(pad, head, foot);
}

export function attachSeat(root) {
  const material = benchMaterial();
  const seatY = 0.78;
  const postBottom = 0.34;
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.07, 0.34), material);
  seat.position.set(0, seatY, 0.06);
  shade(seat);
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.56, 0.06), material);
  back.position.set(0, seatY + 0.34, -0.08);
  shade(back);
  const postH = seatY - postBottom;
  const post = new THREE.BoxGeometry(0.06, postH, 0.06);
  const left = new THREE.Mesh(post, material);
  const right = new THREE.Mesh(post, material);
  left.position.set(-0.16, postBottom + postH * 0.5, 0.06);
  right.position.set(0.16, postBottom + postH * 0.5, 0.06);
  shade(left);
  shade(right);
  root.add(seat, back, left, right);
}

export function bindFeet(root) {
  if (root.userData.feetBound) return;
  root.updateMatrixWorld(true);
  ["L", "R"].forEach(function (side) {
    const knee = findBone(root, "LowerLeg" + side);
    const foot = findBone(root, "Foot" + side);
    const tip = findBone(root, "PT" + side);
    knee.attach(foot);
    foot.attach(tip);
    tip.position.set(0, 0.001, 0);
    tip.quaternion.identity();
  });
  root.userData.feetBound = true;
}

export function plantHands(root) {
  ["L", "R"].forEach(function (side) {
    ["Index", "Middle", "Ring", "Pinky"].forEach(function (finger) {
      bend(root, finger + "1." + side, 0.15, 0);
      bend(root, finger + "2." + side, 0.08, 0);
      bend(root, finger + "3." + side, 0.05, 0);
    });
    bend(root, "Thumb1." + side, 0.2, side === "L" ? 0.25 : -0.25);
    bend(root, "Thumb2." + side, 0.1, 0);
    bend(root, "Thumb3." + side, 0.08, 0);
  });
}

function orientFeetFlat(root) {
  const down = new THREE.Vector3(0, -1, 0);
  const ahead = new THREE.Vector3();
  const xAxis = new THREE.Vector3();
  const yAxis = new THREE.Vector3();
  const basis = new THREE.Matrix4();
  const target = new THREE.Quaternion();
  const parentQ = new THREE.Quaternion();
  ["L", "R"].forEach(function (side) {
    const foot = findBone(root, "Foot" + side);
    const parent = foot.parent;
    parent.updateMatrixWorld(true);
    ahead.set(0, 0, 1);
    xAxis.crossVectors(ahead, down);
    if (xAxis.lengthSq() < 1e-6) xAxis.set(side === "L" ? 1 : -1, 0, 0);
    xAxis.normalize();
    yAxis.crossVectors(down, xAxis).normalize();
    target.setFromRotationMatrix(basis.makeBasis(xAxis, yAxis, down));
    foot.quaternion.copy(parent.getWorldQuaternion(parentQ).invert()).multiply(target);
    foot.updateMatrixWorld(true);
  });
}

export function trackFeet(root, mode) {
  bindFeet(root);
  if (mode !== "plant") return;
  chainGear(root, function () {
    orientFeetFlat(root);
  });
}

// Mirror the left leg pose onto the right in world space so both feet plant
// at the same height despite asymmetric bind eulers on this character.
export function mirrorLegs(root) {
  bindFeet(root);
  root.updateMatrixWorld(true);
  const upperR = findBone(root, "UpperLegR");
  const lowerR = findBone(root, "LowerLegR");
  const restUR = upperR.quaternion.clone();
  const restLR = lowerR.quaternion.clone();
  const centerX = findBone(root, "Hips").getWorldPosition(new THREE.Vector3()).x;
  const kneeL = findBone(root, "LowerLegL").getWorldPosition(new THREE.Vector3());
  const footL = findBone(root, "FootL").getWorldPosition(new THREE.Vector3());
  const kneeT = new THREE.Vector3(centerX * 2 - kneeL.x, kneeL.y, kneeL.z);
  const footT = new THREE.Vector3(centerX * 2 - footL.x, footL.y, footL.z);
  const kneeR = new THREE.Vector3();
  const footR = new THREE.Vector3();
  function score(pose) {
    upperR.quaternion.copy(restUR).multiply(deltaQuat({ x: pose.ux, y: pose.uy, z: pose.uz }));
    lowerR.quaternion.copy(restLR).multiply(deltaQuat({ x: pose.lx, y: pose.ly, z: pose.lz }));
    orientFeetFlat(root);
    root.updateMatrixWorld(true);
    findBone(root, "LowerLegR").getWorldPosition(kneeR);
    findBone(root, "FootR").getWorldPosition(footR);
    return kneeR.distanceTo(kneeT) + footR.distanceTo(footT);
  }
  let best = { ux: -58, uy: -56, uz: 60, lx: 0, ly: 0, lz: -30 };
  let bestE = score(best);
  const seeds = [
    best,
    { ux: -60, uy: -60, uz: 60, lx: 20, ly: 0, lz: -40 },
    { ux: -50, uy: -20, uz: 20, lx: -20, ly: 0, lz: -60 },
    { ux: -80, uy: -40, uz: 80, lx: 30, ly: 0, lz: -20 },
    { ux: -40, uy: -50, uz: 50, lx: 10, ly: 0, lz: -50 },
    { ux: -70, uy: -30, uz: 40, lx: 24, ly: 0, lz: -40 }
  ];
  seeds.forEach(function (seed) {
    const err = score(seed);
    if (err < bestE) {
      bestE = err;
      best = Object.assign({}, seed);
    }
  });
  const keys = ["ux", "uy", "uz", "lx", "lz"];
  [16, 8, 4, 2, 1].forEach(function (step) {
    for (let pass = 0; pass < 10; pass += 1) {
      keys.forEach(function (key) {
        [-1, 1].forEach(function (dir) {
          const trial = Object.assign({}, best);
          trial[key] += dir * step;
          const err = score(trial);
          if (err + 1e-6 < bestE) {
            bestE = err;
            best = trial;
          }
        });
      });
    }
  });
  upperR.quaternion.copy(restUR).multiply(deltaQuat({ x: best.ux, y: best.uy, z: best.uz }));
  lowerR.quaternion.copy(restLR).multiply(deltaQuat({ x: best.lx, y: best.ly, z: best.lz }));
  orientFeetFlat(root);
  root.updateMatrixWorld(true);
}

export function plantWrists(root, mode) {
  const leftBone = findBone(root, "WristL");
  const rightBone = findBone(root, "WristR");
  const hold = new THREE.Vector3();
  const box = new THREE.Box3();
  let ready = false;
  chainGear(root, function () {
    root.updateMatrixWorld(true);
    const left = leftBone.getWorldPosition(new THREE.Vector3());
    const right = rightBone.getWorldPosition(new THREE.Vector3());
    const mid = left.add(right).multiplyScalar(0.5);
    if (!ready) {
      hold.copy(mid);
      if (mode === "floor") hold.y = 0.07;
      ready = true;
    }
    const delta = hold.clone().sub(mid);
    if (delta.lengthSq() >= 1e-8) {
      root.position.add(delta);
      root.updateMatrixWorld(true);
    }
    if (mode === "floor") {
      box.setFromObject(root);
      if (box.min.y < -0.001) {
        root.position.y -= box.min.y;
        hold.y -= box.min.y;
        root.updateMatrixWorld(true);
      }
    }
  });
}

export function placeBars(root) {
  const material = metalMaterial();
  const leftBar = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.2, 12), material);
  const rightBar = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.2, 12), material);
  shade(leftBar);
  shade(rightBar);
  let placed = false;
  chainGear(root, function () {
    if (placed || !root.parent) return;
    const left = findBone(root, "WristL").getWorldPosition(new THREE.Vector3());
    const right = findBone(root, "WristR").getWorldPosition(new THREE.Vector3());
    leftBar.position.set(left.x, 0.58, left.z);
    rightBar.position.set(right.x, 0.58, right.z);
    root.parent.add(leftBar, rightBar);
    const extras = root.userData.extraGear || [];
    extras.push(leftBar, rightBar);
    root.userData.extraGear = extras;
    placed = true;
  });
}
