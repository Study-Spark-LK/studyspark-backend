import { describe, it, expect } from 'vitest';

/**
 * Tests for the document progress update formula used in evaluate-quiz.ts:
 *
 *   const base = (currentProgress ?? -1) < 0 ? 0 : (currentProgress ?? 0);
 *   const newProgress = Math.min(100, base + Math.round(score / 10));
 */
function computeNewProgress(currentProgress: number | null, score: number): number {
	const base = (currentProgress ?? -1) < 0 ? 0 : (currentProgress ?? 0);
	return Math.min(100, base + Math.round(score / 10));
}

describe('document progress – specified examples', () => {
	it('score 80, progress 50  → 58', () => {
		expect(computeNewProgress(50, 80)).toBe(58);
	});

	it('score 100, progress 95 → 100 (capped)', () => {
		expect(computeNewProgress(95, 100)).toBe(100);
	});

	it('score 0, progress 30   → 30 (no change)', () => {
		expect(computeNewProgress(30, 0)).toBe(30);
	});

	it('score 70, progress -1  → 7 (treats -1 as 0)', () => {
		expect(computeNewProgress(-1, 70)).toBe(7);
	});

	it('score 50, progress 100 → stays at 100', () => {
		expect(computeNewProgress(100, 50)).toBe(100);
	});
});

describe('document progress – unset/null progress', () => {
	it('null progress is treated as 0 before adding', () => {
		expect(computeNewProgress(null, 50)).toBe(5);
	});

	it('-1 and null both produce the same base of 0', () => {
		expect(computeNewProgress(-1, 80)).toBe(computeNewProgress(null, 80));
	});

	it('any negative progress value is treated as 0', () => {
		expect(computeNewProgress(-50, 60)).toBe(6);
	});
});

describe('document progress – rounding behaviour', () => {
	it('rounds 0.5 up (score 75 → adds 8)', () => {
		expect(computeNewProgress(0, 75)).toBe(8); // Math.round(7.5) = 8
	});

	it('rounds down when fractional part < 0.5 (score 74 → adds 7)', () => {
		expect(computeNewProgress(0, 74)).toBe(7);
	});

	it('score 5 adds 1 (not 0) after rounding', () => {
		expect(computeNewProgress(10, 5)).toBe(11); // round(0.5) = 1
	});

	it('score 4 adds 0 (rounds down to 0)', () => {
		expect(computeNewProgress(10, 4)).toBe(10); // round(0.4) = 0
	});
});

describe('document progress – cap enforcement', () => {
	it('never exceeds 100 regardless of score', () => {
		expect(computeNewProgress(99, 100)).toBe(100);
	});

	it('already at 100 stays at 100 for any score', () => {
		for (const score of [0, 50, 100]) {
			expect(computeNewProgress(100, score)).toBe(100);
		}
	});

	it('progress of 91 with score 100 caps at 100 (91 + 10 = 101)', () => {
		expect(computeNewProgress(91, 100)).toBe(100);
	});
});
