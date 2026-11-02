import * as THREE from "three";

export function createPlayback(root, animations, clipName) {
  const mixer = new THREE.AnimationMixer(root);
  let action = null;
  let currentName = "";

  function playClip(name) {
    const clip = THREE.AnimationClip.findByName(animations, name);
    if (!clip) {
      const available = animations.map(function (item) { return item.name; }).join(", ");
      throw new Error("Animation clip not found: " + name + ". Available: " + available);
    }
    if (action) action.stop();
    action = mixer.clipAction(clip);
    action.setLoop(THREE.LoopRepeat, Infinity);
    action.clampWhenFinished = false;
    action.play();
    currentName = clip.name;
    return clip;
  }

  playClip(clipName);

  return {
    mixer: mixer,
    get clipName() { return currentName; },
    get time() { return action ? action.time : 0; },
    play: function () {
      action.paused = false;
      action.play();
    },
    pause: function () {
      action.paused = true;
    },
    restart: function () {
      action.reset();
      action.paused = false;
      action.play();
    },
    setClip: function (name) {
      playClip(name);
      return currentName;
    },
    dispose: function () {
      mixer.stopAllAction();
      mixer.uncacheRoot(root);
      action = null;
    }
  };
}
