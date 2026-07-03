import {
  Easing,
  FadeIn,
  FadeInDown,
  ReduceMotion,
} from 'react-native-reanimated';

// ============================================================================
// MOTION SYSTEM
// ----------------------------------------------------------------------------
// One shared set of durations + easing curves for the whole app, so every
// animation feels like it belongs to the same family: smooth, calm, and
// unhurried. No bounce, no spring, no extreme scale/rotation. Reduced-motion is
// honoured everywhere via ReduceMotion.System.
// ============================================================================

export const durations = {
  /** Micro interactions: toggles, small indicators. */
  micro: 220,
  /** Page transitions + content entrances. */
  screen: 320,
  /** Skeleton -> content cross-fade. */
  crossfade: 300,
  /** Odometer price roll: slow and luxurious, lands softly. */
  odometer: 900,
  /** Market band: axis draws first. */
  bandAxis: 420,
  /** Market band: each dot's own fade/settle. */
  bandDotFade: 300,
  /** Market band: max total window the dot stagger is allowed to occupy. */
  bandDotWindowMax: 1000,
  /** Market band: ideal delay between consecutive dots (capped by the window). */
  bandDotStagger: 28,
  /** Skeleton shimmer loop: slow, barely-there pulse. */
  shimmer: 1350,
} as const;

// A single easing family. `out` decelerates so motion "lands" gently; `inOut`
// is symmetric for things that travel between two points (sliding indicators).
export const easing = {
  /** Gentle deceleration (ease-out). The default for entrances + the odometer. */
  out: Easing.bezier(0.22, 1, 0.36, 1),
  /** Symmetric ease-in-out for moving indicators and curtains. */
  inOut: Easing.bezier(0.4, 0, 0.2, 1),
} as const;

/** Use everywhere so the OS "Reduce Motion" setting is always respected. */
export const reduceMotion = ReduceMotion.System;

// Shared entrance presets (Reanimated layout animations). Kept subtle: a soft
// fade, or a fade plus a small 10px rise. Both honour reduced motion.
export const enterFade = FadeIn.duration(durations.crossfade)
  .easing(easing.out)
  .reduceMotion(reduceMotion);

export const enterRise = FadeInDown.duration(durations.screen)
  .easing(easing.out)
  .reduceMotion(reduceMotion);
