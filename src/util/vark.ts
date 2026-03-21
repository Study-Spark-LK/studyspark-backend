/**
 * Applies a VARK score delta.
 * A current score of -1 (unset) is treated as 0 before adding the delta.
 * Result is clamped to the range 0–100.
 */
export const applyDelta = (current: number | null, delta: number): number => {
	const base = (current ?? -1) === -1 ? 0 : (current ?? 0);
	return Math.min(100, Math.max(0, base + delta));
};
