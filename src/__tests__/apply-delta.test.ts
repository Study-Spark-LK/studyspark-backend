import { describe, it, expect } from 'vitest';
import { applyDelta } from '../util/vark';

describe('applyDelta', () => {
	it('treats -1 (unset) as 0 when applying a positive delta', () => {
		expect(applyDelta(-1, 10)).toBe(10);
	});

	it('treats null as 0 when applying a positive delta', () => {
		expect(applyDelta(null, 10)).toBe(10);
	});

	it('applies a positive delta to an existing score', () => {
		expect(applyDelta(50, 20)).toBe(70);
	});

	it('applies a negative delta to an existing score', () => {
		expect(applyDelta(50, -20)).toBe(30);
	});

	it('clamps the result to 100 when the sum exceeds 100', () => {
		expect(applyDelta(90, 20)).toBe(100);
	});

	it('clamps the result to 0 when the sum goes negative', () => {
		expect(applyDelta(5, -20)).toBe(0);
	});

	it('does not go below 0 when starting from an unset score with a negative delta', () => {
		expect(applyDelta(-1, -5)).toBe(0);
	});

	it('returns 0 when delta is 0 and score is -1 (unset)', () => {
		expect(applyDelta(-1, 0)).toBe(0);
	});

	it('returns the unchanged score when delta is 0', () => {
		expect(applyDelta(42, 0)).toBe(42);
	});

	it('returns 100 when score is already 100 and delta is positive', () => {
		expect(applyDelta(100, 15)).toBe(100);
	});

	it('returns 0 when score is 0 and delta is 0', () => {
		expect(applyDelta(0, 0)).toBe(0);
	});
});
