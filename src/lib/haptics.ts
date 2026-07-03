import * as Haptics from 'expo-haptics';

// Thin wrappers so haptics are (a) consistent and (b) never crash on platforms
// or simulators without a taptic engine (we swallow the promise rejection).

function safe(run: () => Promise<void>): void {
  run().catch(() => {
    /* haptics are best-effort; ignore unsupported-device errors */
  });
}

/** Light tap: search submit, opening a listing, selecting a chip. */
export function hapticLight(): void {
  safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
}

/** Medium tap: saving to watchlist, setting an alert. */
export function hapticMedium(): void {
  safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
}

/** Success notification: alert armed / watchlist saved confirmation. */
export function hapticSuccess(): void {
  safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
}

/** Selection tick: moving through a segmented control. */
export function hapticSelection(): void {
  safe(() => Haptics.selectionAsync());
}
