import { mountExerciseViewer } from "../viewer/exercise-viewer.js";
import { CHARACTER_MODEL, CHARACTER_CREDIT } from "./character.js";
import { motionFor } from "./push.js";

export function exerciseDemo(anim, name) {
  const motion = motionFor(name, anim);
  if (!motion) return null;
  return {
    modelUrl: CHARACTER_MODEL,
    clip: motion.clip,
    prepare: motion.prepare,
    cues: motion.cues,
    muscles: motion.muscles,
    credit: CHARACTER_CREDIT
  };
}

export { mountExerciseViewer, CHARACTER_MODEL };
