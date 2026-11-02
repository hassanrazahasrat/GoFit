import * as THREE from "three";
import { findBone, closeHands, attachDumbbells, attachHandles, applyStill } from "./rig.js";

export const LATERAL_RAISE_CLIP = "lateral-raise";

export const LATERAL_RAISE_MUSCLES = {
  primary: ["deltoid-lateral-l", "deltoid-lateral-r"],
  secondary: ["trapezius-upper"],
  primaryLabel: "lateral deltoid",
  secondaryLabel: "upper trapezius"
};

const RAISE = 2;
const HOLD = 2.5;
const LOWER = 4.6;
const DURATION = 5.2;
const LEFT = { x: 74 * Math.PI / 180, z: -30 * Math.PI / 180, twist: 0.45 };
const RIGHT = { x: 64 * Math.PI / 180, z: 40 * Math.PI / 180, twist: -0.45 };

function ease(t) {
  const u = Math.max(0, Math.min(1, t));
  return (1 - Math.cos(Math.PI * u)) / 2;
}

function amount(t) {
  if (t <= RAISE) return ease(t / RAISE);
  if (t <= HOLD) return 1;
  if (t <= LOWER) return 1 - ease((t - HOLD) / (LOWER - HOLD));
  return 0;
}

function swing(rest, pose, u) {
  const q = rest.clone();
  const x = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), pose.x * u);
  const z = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), pose.z * u);
  const y = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), pose.twist * u);
  q.multiply(x).multiply(z).multiply(y);
  return q;
}

function pushQuat(list, q) {
  list.push(q.x, q.y, q.z, q.w);
}

export function prepareLateralRaise(gltf, options) {
  const root = gltf.scene;
  const settings = options || {};
  if (settings.lean) applyStill(root, { Torso: { z: settings.lean } });
  if (settings.seated) applyStill(root, { UpperLegL: { x: -70 }, UpperLegR: { x: -70 } });
  const upperLeft = findBone(root, "UpperArm.L");
  const upperRight = findBone(root, "UpperArm.R");
  const leftRest = upperLeft.quaternion.clone();
  const rightRest = upperRight.quaternion.clone();
  const times = [];
  const leftValues = [];
  const rightValues = [];
  const steps = 52;
  for (let i = 0; i <= steps; i++) {
    const t = DURATION * i / steps;
    const u = amount(t);
    times.push(t);
    pushQuat(leftValues, swing(leftRest, LEFT, u));
    pushQuat(rightValues, swing(rightRest, RIGHT, u));
  }
  gltf.animations.push(new THREE.AnimationClip(LATERAL_RAISE_CLIP, DURATION, [
    new THREE.QuaternionKeyframeTrack(upperLeft.name + ".quaternion", times, leftValues),
    new THREE.QuaternionKeyframeTrack(upperRight.name + ".quaternion", times, rightValues)
  ]));

  if (settings.gear === "handle") attachHandles(root);
  else if (settings.gear !== "none") attachDumbbells(root);
  closeHands(root);
}

export const LATERAL_RAISE_CUES = [
  { from: 0, text: "Stand tall. Weights at your sides." },
  { from: 0.28, text: "Lead with the elbows, out to the sides." },
  { from: 1.65, text: "Shoulder height. Little fingers slightly up." },
  { from: 3.15, text: "Lower slowly. Do not swing." }
];
