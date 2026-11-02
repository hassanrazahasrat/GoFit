import * as THREE from "three";

const PRIMARY = 0xff2d2d;
const SECONDARY = 0xff8c1a;
const LIFT = 0.0045;

const REGIONS = {
  "deltoid-lateral-l": function (point, bones) { return lateralDeltoid(point, bones, "L"); },
  "deltoid-lateral-r": function (point, bones) { return lateralDeltoid(point, bones, "R"); },
  "deltoid-cap-l": function (point, bones) { return deltoidCap(point, bones, "L"); },
  "deltoid-cap-r": function (point, bones) { return deltoidCap(point, bones, "R"); },
  "deltoid-anterior-l": function (point, bones) { return anteriorDeltoid(point, bones, "L"); },
  "deltoid-anterior-r": function (point, bones) { return anteriorDeltoid(point, bones, "R"); },
  "triceps-l": function (point, bones) { return triceps(point, bones, "L"); },
  "triceps-r": function (point, bones) { return triceps(point, bones, "R"); },
  pectoralis: pectoralis,
  "trapezius-upper": upperTrapezius
};

function bonePosition(root, name) {
  const plain = name.replace(/[\[\].:/]/g, "");
  let found = null;
  root.traverse(function (node) {
    if (node.isBone && (node.name === name || node.name === plain)) found = node;
  });
  return found ? found.getWorldPosition(new THREE.Vector3()) : null;
}

function readBones(root) {
  const bones = {};
  ["Chest", "Neck", "Head", "Shoulder.L", "Shoulder.R", "UpperArm.L", "UpperArm.R", "LowerArm.L", "LowerArm.R"].forEach(function (name) {
    const position = bonePosition(root, name);
    if (position) bones[name] = position;
  });
  bones.facing = new THREE.Vector3(0, 0, 1);
  if (bones.Head && bones.Neck) {
    bones.facing.subVectors(bones.Head, bones.Neck);
    bones.facing.y = 0;
    if (bones.facing.lengthSq() > 1e-8) bones.facing.normalize();
    else bones.facing.set(0, 0, 1);
  }
  return bones;
}

function lateralDeltoid(point, bones, side) {
  const shoulder = bones["Shoulder." + side];
  const upper = bones["UpperArm." + side];
  const elbow = bones["LowerArm." + side];
  const chest = bones.Chest;
  if (!shoulder || !upper || !elbow || !chest) return false;
  const sign = side === "L" ? 1 : -1;
  const cap = shoulder.clone().lerp(upper, 0.55);
  if (point.distanceTo(cap) > 0.11) return false;
  if (point.x * sign < cap.x * sign - 0.01) return false;
  const direction = elbow.clone().sub(upper);
  const length = direction.length();
  if (length < 0.05) return false;
  const along = point.clone().sub(upper).dot(direction) / length;
  if (along > length * 0.34 || along < -0.05) return false;
  return point.y > cap.y - 0.08;
}

function deltoidCap(point, bones, side) {
  const shoulder = bones["Shoulder." + side];
  const upper = bones["UpperArm." + side];
  const elbow = bones["LowerArm." + side];
  const neck = bones.Neck;
  if (!shoulder || !upper || !elbow || !neck) return false;
  const sign = side === "L" ? 1 : -1;
  const cap = shoulder.clone().lerp(upper, 0.4);
  if (point.distanceTo(cap) > 0.115) return false;
  if (point.x * sign < cap.x * sign - 0.008) return false;
  if (point.y < Math.max(cap.y - 0.02, shoulder.y - 0.01)) return false;
  if (point.y > neck.y + 0.03) return false;
  if (point.clone().sub(cap).dot(bones.facing) > 0.02) return false;
  const direction = elbow.clone().sub(upper);
  const length = direction.length();
  if (length < 0.05) return false;
  const along = point.clone().sub(upper).dot(direction) / length;
  return along < length * 0.28 && along > -0.05;
}

function anteriorDeltoid(point, bones, side) {
  const shoulder = bones["Shoulder." + side];
  const upper = bones["UpperArm." + side];
  if (!shoulder || !upper) return false;
  const cap = shoulder.clone().lerp(upper, 0.42);
  if (point.distanceTo(cap) > 0.1) return false;
  if (point.clone().sub(cap).dot(bones.facing) < 0.012) return false;
  return point.y > cap.y - 0.05 && point.y < cap.y + 0.09;
}

function triceps(point, bones, side) {
  const upper = bones["UpperArm." + side];
  const elbow = bones["LowerArm." + side];
  if (!upper || !elbow) return false;
  const arm = elbow.clone().sub(upper);
  const length = arm.length();
  if (length < 0.05) return false;
  const along = point.clone().sub(upper).dot(arm) / (length * length);
  if (along < 0.18 || along > 0.78) return false;
  const closest = upper.clone().addScaledVector(arm, along);
  if (point.distanceTo(closest) > 0.07) return false;
  return point.clone().sub(closest).dot(bones.facing) < -0.004;
}

function pectoralis(point, bones) {
  const chest = bones.Chest;
  const neck = bones.Neck;
  const left = bones["Shoulder.L"];
  const right = bones["Shoulder.R"];
  if (!chest || !neck || !left || !right) return false;
  if (point.y < chest.y - 0.07 || point.y > neck.y - 0.045) return false;
  const span = Math.abs(left.x - right.x) || 0.3;
  if (Math.abs(point.x - chest.x) > span * 0.5) return false;
  if (point.distanceTo(chest) > 0.2) return false;
  return point.clone().sub(chest).dot(bones.facing) > 0.02;
}

function upperTrapezius(point, bones) {
  const neck = bones.Neck;
  const left = bones["Shoulder.L"];
  const right = bones["Shoulder.R"];
  if (!neck || !left || !right) return false;
  const bottom = Math.min(left.y, right.y) + 0.005;
  if (point.y < bottom || point.y > neck.y + 0.02) return false;
  if (point.clone().sub(neck).dot(bones.facing) > 0) return false;
  const span = Math.abs(left.x - right.x);
  const minX = Math.min(left.x, right.x) + span * 0.14;
  const maxX = Math.max(left.x, right.x) - span * 0.14;
  return point.x >= minX && point.x <= maxX;
}

function paint(color) {
  return new THREE.MeshStandardMaterial({
    color: color,
    emissive: color,
    emissiveIntensity: 0.72,
    roughness: 0.46,
    metalness: 0,
    polygonOffset: true,
    polygonOffsetFactor: -4,
    polygonOffsetUnits: -4
  });
}

function selectedTriangles(mesh, ids, included, bones) {
  const index = mesh.geometry.getIndex();
  if (!index) return {};
  const groups = {};
  ids.forEach(function (id) { groups[id] = []; });
  const corner = new THREE.Vector3();
  const samples = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
  for (let triangle = 0; triangle < index.count; triangle += 3) {
    const corners = [index.getX(triangle), index.getX(triangle + 1), index.getX(triangle + 2)];
    corners.forEach(function (vertex, vertexIndex) {
      mesh.getVertexPosition(vertex, corner);
      mesh.localToWorld(corner);
      samples[vertexIndex].copy(corner);
    });
    let claimed = false;
    ids.forEach(function (id) {
      if (claimed || !included[id]) return;
      let hits = 0;
      samples.forEach(function (sample) {
        if (REGIONS[id](sample, bones)) hits += 1;
      });
      if (hits < 2) return;
      if (id === "trapezius-upper" && bones.Neck) {
        const limit = bones.Neck.y - 0.13;
        if (samples.some(function (sample) { return sample.y < limit; })) return;
      }
      groups[id].push(corners[0], corners[1], corners[2]);
      if (included[id] === PRIMARY) claimed = true;
    });
  }
  return groups;
}

function attachOverlay(root, mesh, id, color, sources) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(sources.length * 3, 3));
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(sources.length * 3, 3));
  const overlay = new THREE.Mesh(geometry, paint(color));
  overlay.name = "muscle-" + id;
  overlay.castShadow = false;
  overlay.receiveShadow = false;
  overlay.frustumCulled = false;
  root.add(overlay);
  return { root: root, mesh: mesh, geometry: geometry, sources: sources, id: id };
}

function refreshOverlays(records) {
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  const face = new THREE.Vector3();
  const edge = new THREE.Vector3();
  records.forEach(function (record) {
    const position = record.geometry.getAttribute("position");
    const normal = record.geometry.getAttribute("normal");
    for (let vertex = 0; vertex < record.sources.length; vertex += 3) {
      record.mesh.getVertexPosition(record.sources[vertex], a);
      record.mesh.localToWorld(a);
      record.mesh.getVertexPosition(record.sources[vertex + 1], b);
      record.mesh.localToWorld(b);
      record.mesh.getVertexPosition(record.sources[vertex + 2], c);
      record.mesh.localToWorld(c);
      edge.subVectors(b, a);
      face.subVectors(c, a).cross(edge);
      if (face.lengthSq() < 1e-10) face.set(0, 1, 0);
      else face.normalize();
      if (record.id === "trapezius-upper") {
        const floor = Math.max(a.y, b.y, c.y) - 0.06;
        if (a.y < floor) a.y = floor;
        if (b.y < floor) b.y = floor;
        if (c.y < floor) c.y = floor;
      }
      const outward = a.clone();
      outward.y -= 1.25;
      if (face.dot(outward) < 0) face.negate();
      a.addScaledVector(face, LIFT);
      b.addScaledVector(face, LIFT);
      c.addScaledVector(face, LIFT);
      record.root.worldToLocal(a);
      record.root.worldToLocal(b);
      record.root.worldToLocal(c);
      position.setXYZ(vertex, a.x, a.y, a.z);
      position.setXYZ(vertex + 1, b.x, b.y, b.z);
      position.setXYZ(vertex + 2, c.x, c.y, c.z);
      normal.setXYZ(vertex, face.x, face.y, face.z);
      normal.setXYZ(vertex + 1, face.x, face.y, face.z);
      normal.setXYZ(vertex + 2, face.x, face.y, face.z);
    }
    position.needsUpdate = true;
    normal.needsUpdate = true;
  });
}

export function polishSurface(root) {
  root.traverse(function (node) {
    if (!node.isSkinnedMesh || !node.material) return;
    const materials = Array.isArray(node.material) ? node.material : [node.material];
    materials.forEach(function (material) {
      if (!material.isMeshStandardMaterial) return;
      const name = material.name || "";
      if (name === "Eye") {
        material.metalness = 0.04;
        material.roughness = 0.16;
      } else if (name === "Hair" || name === "Eyebrows") {
        material.metalness = 0;
        material.roughness = 0.62;
      } else if (name.indexOf("Skin") !== -1) {
        material.metalness = 0;
        material.roughness = 0.58;
      } else {
        material.metalness = 0;
        material.roughness = 0.86;
      }
    });
    softenNormals(node.geometry);
  });
}

function softenNormals(geometry) {
  const position = geometry.getAttribute("position");
  const normal = geometry.getAttribute("normal");
  if (!position || !normal) return;
  const groups = new Map();
  for (let i = 0; i < position.count; i += 1) {
    const key = Math.round(position.getX(i) * 1e5) + "," + Math.round(position.getY(i) * 1e5) + "," + Math.round(position.getZ(i) * 1e5);
    const group = groups.get(key);
    if (group) group.push(i);
    else groups.set(key, [i]);
  }
  groups.forEach(function (indices) {
    let x = 0;
    let y = 0;
    let z = 0;
    indices.forEach(function (index) {
      x += normal.getX(index);
      y += normal.getY(index);
      z += normal.getZ(index);
    });
    const length = Math.hypot(x, y, z) || 1;
    indices.forEach(function (index) {
      normal.setXYZ(index, x / length, y / length, z / length);
    });
  });
  normal.needsUpdate = true;
}

export function highlightMuscles(root, muscles) {
  const included = {};
  (muscles && muscles.primary ? muscles.primary : []).forEach(function (id) {
    if (REGIONS[id]) included[id] = PRIMARY;
  });
  (muscles && muscles.secondary ? muscles.secondary : []).forEach(function (id) {
    if (REGIONS[id] && included[id] !== PRIMARY) included[id] = SECONDARY;
  });
  const ids = Object.keys(included);
  if (!ids.length) return;
  root.updateWorldMatrix(true, true);
  root.traverse(function (node) {
    if (node.isSkinnedMesh && node.skeleton) node.skeleton.update();
  });
  const bones = readBones(root);
  const meshes = [];
  root.traverse(function (node) {
    if (node.isSkinnedMesh) meshes.push(node);
  });
  const records = [];
  meshes.forEach(function (mesh) {
    const groups = selectedTriangles(mesh, ids, included, bones);
    ids.forEach(function (id) {
      if (!groups[id] || !groups[id].length) return;
      records.push(attachOverlay(root, mesh, id, included[id], groups[id]));
    });
  });
  const update = function () { refreshOverlays(records); };
  update();
  root.userData.updateMuscles = update;
}

export function muscleLegend(legend, muscles) {
  if (!legend) return;
  legend.replaceChildren();
  if (!muscles) {
    legend.hidden = true;
    return;
  }
  [
    { color: "#ff2d2d", text: muscles.primaryLabel ? "Primary muscles — " + muscles.primaryLabel : "Primary muscles", show: true },
    { color: "#ff8c1a", text: muscles.secondaryLabel ? "Secondary muscles — " + muscles.secondaryLabel : "Secondary muscles", show: muscles.secondary && muscles.secondary.length }
  ].forEach(function (row) {
    if (!row.show) return;
    const item = document.createElement("span");
    const swatch = document.createElement("i");
    swatch.style.background = row.color;
    item.append(swatch, document.createTextNode(row.text));
    legend.append(item);
  });
  legend.hidden = false;
}
