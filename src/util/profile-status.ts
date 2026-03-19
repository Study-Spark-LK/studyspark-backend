export type VarkScores = {
	visualScore:      number | null;
	auditoryScore:    number | null;
	readingScore:     number | null;
	kinestheticScore: number | null;
};

/**
 * Derives whether a profile should be PENDING or READY based on VARK scores.
 *
 * Business rule:
 *   - PENDING  — all scores are still at their initial unset value (-1 or null).
 *   - READY    — at least one score has been written (any value other than -1 / null),
 *                including 0 which is the result of applying a zero delta to an
 *                unset score via applyDelta(-1, 0) = 0.
 *
 * The queue consumers and PATCH /internal/users/:userId/profile always set status
 * explicitly; this utility encodes the underlying business rule so it can be
 * tested independently.
 */
export function computeProfileStatus(scores: VarkScores): 'PENDING' | 'READY' {
	const allUnset = (Object.values(scores) as (number | null)[]).every(
		(s) => s === null || s === -1
	);
	return allUnset ? 'PENDING' : 'READY';
}
