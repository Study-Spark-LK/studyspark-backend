export type VarkDimension = 'visual' | 'auditory' | 'reading' | 'kinesthetic';

/**
 * Derives the dominant learning style from VARK scores.
 * Scores of -1 (unset) and null are treated as 0.
 * Returns null when every score is 0 or below (no analysis yet).
 * Returns the dimension with the highest score; when there is a tie the
 * first dimension in V-A-R-K order wins (insertion order of the object).
 */
export function computeLearningStyle(
	visualScore: number | null,
	auditoryScore: number | null,
	readingScore: number | null,
	kinestheticScore: number | null
): VarkDimension | null {
	const scores: Record<VarkDimension, number> = {
		visual:      visualScore      ?? 0,
		auditory:    auditoryScore    ?? 0,
		reading:     readingScore     ?? 0,
		kinesthetic: kinestheticScore ?? 0
	};
	const maxScore = Math.max(...Object.values(scores));
	if (maxScore <= 0) return null;
	return (Object.entries(scores).find(([, v]) => v === maxScore)?.[0] ?? null) as VarkDimension | null;
}
