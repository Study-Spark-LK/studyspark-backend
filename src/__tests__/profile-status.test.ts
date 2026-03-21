import { describe, it, expect } from 'vitest';
import { computeProfileStatus } from '../util/profile-status';
import { applyDelta } from '../util/vark';

describe('computeProfileStatus – initial state', () => {
	it('returns PENDING when all scores are -1 (fresh profile, no analysis)', () => {
		expect(computeProfileStatus({
			visualScore: -1, auditoryScore: -1, readingScore: -1, kinestheticScore: -1
		})).toBe('PENDING');
	});

	it('returns PENDING when all scores are null', () => {
		expect(computeProfileStatus({
			visualScore: null, auditoryScore: null, readingScore: null, kinestheticScore: null
		})).toBe('PENDING');
	});

	it('returns PENDING when scores are a mix of null and -1', () => {
		expect(computeProfileStatus({
			visualScore: null, auditoryScore: -1, readingScore: null, kinestheticScore: -1
		})).toBe('PENDING');
	});
});

describe('computeProfileStatus – after analysis (at least one score set)', () => {
	it('returns READY when all scores are positive', () => {
		expect(computeProfileStatus({
			visualScore: 80, auditoryScore: 60, readingScore: 70, kinestheticScore: 50
		})).toBe('READY');
	});

	it('returns READY when only one score is positive', () => {
		expect(computeProfileStatus({
			visualScore: 10, auditoryScore: -1, readingScore: -1, kinestheticScore: -1
		})).toBe('READY');
	});

	it('returns READY when a score is exactly 0 (from a zero-delta applied to -1)', () => {
		// applyDelta(-1, 0) = 0, not -1 — so 0 counts as "set"
		const afterZeroDelta = applyDelta(-1, 0); // → 0
		expect(computeProfileStatus({
			visualScore: afterZeroDelta,
			auditoryScore: afterZeroDelta,
			readingScore: afterZeroDelta,
			kinestheticScore: afterZeroDelta
		})).toBe('READY');
	});

	it('returns READY when only one score is 0 (others still -1)', () => {
		expect(computeProfileStatus({
			visualScore: 0, auditoryScore: -1, readingScore: -1, kinestheticScore: -1
		})).toBe('READY');
	});
});

describe('computeProfileStatus – zero-delta transition (profile update)', () => {
	it('zero deltas turn every -1 into 0, which is still READY', () => {
		const scores = {
			visualScore:      applyDelta(-1, 0),   // 0
			auditoryScore:    applyDelta(-1, 0),   // 0
			readingScore:     applyDelta(-1, 0),   // 0
			kinestheticScore: applyDelta(-1, 0)    // 0
		};
		expect(computeProfileStatus(scores)).toBe('READY');
	});

	it('a mix of real deltas and zero deltas still produces READY', () => {
		const scores = {
			visualScore:      applyDelta(-1, 15),  // 15
			auditoryScore:    applyDelta(-1, 0),   // 0
			readingScore:     applyDelta(-1, 0),   // 0
			kinestheticScore: applyDelta(-1, 0)    // 0
		};
		expect(computeProfileStatus(scores)).toBe('READY');
	});
});

describe('computeProfileStatus – null score handling', () => {
	it('treats null identically to -1 (both = unset)', () => {
		expect(computeProfileStatus({
			visualScore: null, auditoryScore: null, readingScore: null, kinestheticScore: null
		})).toBe(computeProfileStatus({
			visualScore: -1, auditoryScore: -1, readingScore: -1, kinestheticScore: -1
		}));
	});

	it('returns READY when one null score is replaced by a positive value', () => {
		expect(computeProfileStatus({
			visualScore: 50, auditoryScore: null, readingScore: null, kinestheticScore: null
		})).toBe('READY');
	});
});
