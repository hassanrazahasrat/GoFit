import { mountExerciseViewer as mountCharacterViewer } from "../viewer/exercise-viewer.js";
import { mountAnatomyViewer } from "../viewer/anatomy-viewer.js";
import { CHARACTER_MODEL, CHARACTER_CREDIT } from "./character.js";
import { motionFor } from "./push.js";
import { ROW_ANATOMY } from "./anatomy-row.js";
import { PULLDOWN_ANATOMY } from "./anatomy-pulldown.js";
import { INCLINE_PRESS_ANATOMY } from "./anatomy-incline-press.js";
import { CABLE_FLY_ANATOMY } from "./anatomy-cable-fly.js";
import { PUSHDOWN_ANATOMY } from "./anatomy-pushdown.js";
import { EZ_CURL_ANATOMY } from "./anatomy-ez-curl.js";
import { HAMMER_CURL_ANATOMY } from "./anatomy-hammer-curl.js";
import { ASSISTED_DIP_ANATOMY } from "./anatomy-assisted-dip.js";
import { BACK_SQUAT_ANATOMY } from "./anatomy-back-squat.js";
import { RDL_ANATOMY } from "./anatomy-rdl.js";
import { LEG_CURL_ANATOMY } from "./anatomy-leg-curl.js";
import { CALF_RAISE_ANATOMY } from "./anatomy-calf-raise.js";
import { DB_PRESS_ANATOMY } from "./anatomy-db-press.js";
import { LATERAL_RAISE_ANATOMY, WATER_BOTTLE_LATERAL_RAISE_ANATOMY } from "./anatomy-lateral-raise.js";
import { FACE_PULL_ANATOMY } from "./anatomy-face-pull.js";
import { CABLE_CRUNCH_ANATOMY } from "./anatomy-cable-crunch.js";
import { INCLINE_MACHINE_PRESS_ANATOMY } from "./anatomy-incline-machine-press.js";
import { CHEST_ROW_ANATOMY } from "./anatomy-chest-row.js";
import { INVERTED_ROW_ANATOMY } from "./anatomy-inverted-row.js";
import { WATER_BOTTLE_CURL_ANATOMY } from "./anatomy-water-bottle-curl.js";
import { CHAIR_DIP_ANATOMY } from "./anatomy-chair-dip.js";
import { GOBLET_SQUAT_ANATOMY } from "./anatomy-goblet-squat.js";
import { BACKPACK_RDL_ANATOMY } from "./anatomy-backpack-rdl.js";
import { GLUTE_BRIDGE_ANATOMY } from "./anatomy-glute-bridge.js";
import { PIKE_PUSH_UP_ANATOMY } from "./anatomy-pike-push-up.js";
import { PRONE_Y_RAISE_ANATOMY } from "./anatomy-prone-y-raise.js";
import { DEAD_BUG_ANATOMY } from "./anatomy-dead-bug.js";
import { ONE_ARM_BACKPACK_ROW_ANATOMY } from "./anatomy-one-arm-backpack-row.js";
import { INCLINE_DB_PRESS_ANATOMY } from "./anatomy-incline-db-press.js";
import { PULL_UP_ANATOMY } from "./anatomy-pull-up.js";
import { DB_FLY_ANATOMY } from "./anatomy-db-fly.js";
import { SKULL_CRUSHER_ANATOMY } from "./anatomy-skull-crusher.js";
import { DB_CURL_ANATOMY } from "./anatomy-db-curl.js";
import { DB_RDL_ANATOMY } from "./anatomy-db-rdl.js";
import { DB_GOBLET_SQUAT_ANATOMY } from "./anatomy-db-goblet-squat.js";
import { DB_LEG_CURL_ANATOMY } from "./anatomy-db-leg-curl.js";
import { DB_CALF_RAISE_ANATOMY } from "./anatomy-db-calf-raise.js";
import { WEIGHTED_CRUNCH_ANATOMY } from "./anatomy-weighted-crunch.js";
import { REAR_DELT_FLY_ANATOMY } from "./anatomy-rear-delt-fly.js";
import { WEIGHTED_DIP_ANATOMY } from "./anatomy-weighted-dip.js";
import { BENCH_PRESS_ANATOMY } from "./anatomy-bench-press.js";
import { STRAIGHT_ARM_PULLDOWN_ANATOMY } from "./anatomy-straight-arm-pulldown.js";
import { HANGING_KNEE_RAISE_ANATOMY } from "./anatomy-hanging-knee-raise.js";
import { LEG_EXTENSION_ANATOMY } from "./anatomy-leg-extension.js";
import { SIDE_PLANK_ANATOMY } from "./anatomy-side-plank.js";
import { WALKING_LUNGE_ANATOMY } from "./anatomy-walking-lunge.js";
import { SEATED_CABLE_ROW_ANATOMY } from "./anatomy-seated-cable-row.js";
import { PLANK_ANATOMY } from "./anatomy-plank.js";
import { DB_BENCH_PRESS_ANATOMY } from "./anatomy-db-bench-press.js";
import { ONE_ARM_DB_ROW_ANATOMY } from "./anatomy-one-arm-db-row.js";
import { LYING_LEG_RAISE_ANATOMY } from "./anatomy-lying-leg-raise.js";
import { REVERSE_LUNGE_ANATOMY } from "./anatomy-reverse-lunge.js";
import { DB_PULLOVER_ANATOMY } from "./anatomy-db-pullover.js";
import { STEP_UP_ANATOMY } from "./anatomy-step-up.js";
import { PUSH_UP_ANATOMY, WIDE_PUSH_UP_ANATOMY, DIAMOND_PUSH_UP_ANATOMY, INCLINE_PUSH_UP_ANATOMY, DECLINE_PUSH_UP_ANATOMY } from "./anatomy-push-up.js";

const ANATOMY_DEMOS = [[/^barbell row/i, ROW_ANATOMY], [/^lat pulldown/i, PULLDOWN_ANATOMY], [/^incline barbell press/i, INCLINE_PRESS_ANATOMY], [/^cable fly/i, CABLE_FLY_ANATOMY], [/^rope pushdown/i, PUSHDOWN_ANATOMY], [/^ez-bar curl/i, EZ_CURL_ANATOMY], [/^hammer curl/i, HAMMER_CURL_ANATOMY], [/^assisted dip/i, ASSISTED_DIP_ANATOMY], [/^(back squat|hack squat or back squat)/i, BACK_SQUAT_ANATOMY], [/^romanian deadlift/i, RDL_ANATOMY], [/^seated leg curl/i, LEG_CURL_ANATOMY], [/^(standing calf raise|calf raises)/i, CALF_RAISE_ANATOMY], [/^seated (db|dumbbell) shoulder press/i, DB_PRESS_ANATOMY], [/^(db|dumbbell) lateral raise/i, LATERAL_RAISE_ANATOMY], [/^face pulls?/i, FACE_PULL_ANATOMY], [/^cable crunch/i, CABLE_CRUNCH_ANATOMY], [/^incline machine press/i, INCLINE_MACHINE_PRESS_ANATOMY], [/^chest-supported (db |dumbbell )?row/i, CHEST_ROW_ANATOMY], [/^push-?up$/i, PUSH_UP_ANATOMY], [/^wide push-?up$/i, WIDE_PUSH_UP_ANATOMY], [/^diamond push-?up$/i, DIAMOND_PUSH_UP_ANATOMY], [/^incline push-?up$/i, INCLINE_PUSH_UP_ANATOMY], [/^decline push-?up$/i, DECLINE_PUSH_UP_ANATOMY], [/^inverted row/i, INVERTED_ROW_ANATOMY], [/^water-bottle curl$/i, WATER_BOTTLE_CURL_ANATOMY], [/^(chair|bench) dip$/i, CHAIR_DIP_ANATOMY], [/^backpack goblet squat$/i, GOBLET_SQUAT_ANATOMY], [/^backpack romanian deadlift$/i, BACKPACK_RDL_ANATOMY], [/^glute bridge$/i, GLUTE_BRIDGE_ANATOMY], [/^pike push-?up$/i, PIKE_PUSH_UP_ANATOMY], [/^prone y raise$/i, PRONE_Y_RAISE_ANATOMY], [/^dead bug$/i, DEAD_BUG_ANATOMY], [/^one-arm backpack row$/i, ONE_ARM_BACKPACK_ROW_ANATOMY], [/^incline (db|dumbbell) press$/i, INCLINE_DB_PRESS_ANATOMY], [/^(pull-?up or assisted pull-?up|(band-)?assisted pull-?up|weighted pull-?up|neutral-grip pull-?up|chin-?up|pull-?up)$/i, PULL_UP_ANATOMY], [/^(db|dumbbell) fly$/i, DB_FLY_ANATOMY], [/^(db|dumbbell) skull crusher$/i, SKULL_CRUSHER_ANATOMY], [/^(db|dumbbell) curl$/i, DB_CURL_ANATOMY], [/^(db|dumbbell) romanian deadlift$/i, DB_RDL_ANATOMY], [/^((db|dumbbell) )?goblet squat$/i, DB_GOBLET_SQUAT_ANATOMY], [/^(db|dumbbell) leg curl$/i, DB_LEG_CURL_ANATOMY], [/^standing (db|dumbbell) calf raise$/i, DB_CALF_RAISE_ANATOMY], [/^water-bottle lateral raise$/i, WATER_BOTTLE_LATERAL_RAISE_ANATOMY], [/^weighted crunch$/i, WEIGHTED_CRUNCH_ANATOMY], [/^(rear-delt ((db|dumbbell) )?fly(, elbows high)?|bent-over (water-bottle )?rear-delt raise)$/i, REAR_DELT_FLY_ANATOMY], [/^weighted dips?$/i, WEIGHTED_DIP_ANATOMY], [/^(barbell )?bench press$/i, BENCH_PRESS_ANATOMY], [/^straight-arm pulldown$/i, STRAIGHT_ARM_PULLDOWN_ANATOMY], [/^hanging knee raise$/i, HANGING_KNEE_RAISE_ANATOMY], [/^leg extension$/i, LEG_EXTENSION_ANATOMY], [/^side plank$/i, SIDE_PLANK_ANATOMY], [/^walking lunge$/i, WALKING_LUNGE_ANATOMY], [/^seated cable row$/i, SEATED_CABLE_ROW_ANATOMY], [/^plank$/i, PLANK_ANATOMY], [/^(db|dumbbell) bench press$/i, DB_BENCH_PRESS_ANATOMY], [/^one-arm (db|dumbbell) row$/i, ONE_ARM_DB_ROW_ANATOMY], [/^lying leg raise$/i, LYING_LEG_RAISE_ANATOMY], [/^reverse lunge$/i, REVERSE_LUNGE_ANATOMY], [/^(db|dumbbell) pullover$/i, DB_PULLOVER_ANATOMY], [/^step-?up$/i, STEP_UP_ANATOMY]];

export function exerciseDemo(anim, name) {
  const label = String(name || "");
  const anatomy = ANATOMY_DEMOS.find(function (entry) { return entry[0].test(label); });
  if (anatomy) return { anatomy: anatomy[1] };
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

export function mountExerciseViewer(container, spec) {
  if (spec.anatomy) return mountAnatomyViewer(container, spec);
  return mountCharacterViewer(container, spec);
}

export { CHARACTER_MODEL };
