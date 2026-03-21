import { describe, it, expect } from 'vitest';
import { computeLearningStyle, type VarkDimension } from '../util/learning-style';

const DIMENSIONS: VarkDimension[] = ['visual', 'auditory', 'reading', 'kinesthetic'];

describe('computeLearningStyle – clear winner', () => {
	it('returns "visual" when visual score is highest', () => {
		expect(computeLearningStyle(90, 40, 50, 30)).toBe('visual');
	});

	it('returns "auditory" when auditory score is highest', () => {
		expect(computeLearningStyle(40, 90, 50, 30)).toBe('auditory');
	});

	it('returns "reading" when reading score is highest', () => {
		expect(computeLearningStyle(40, 50, 90, 30)).toBe('reading');
	});

	it('returns "kinesthetic" when kinesthetic score is highest', () => {
		expect(computeLearningStyle(40, 50, 30, 90)).toBe('kinesthetic');
	});

	it('returns the correct style for typical analysed scores', () => {
		expect(computeLearningStyle(75, 60, 55, 80)).toBe('kinesthetic');
	});
});

describe('computeLearningStyle – no analysis yet (all unset)', () => {
	it('returns null when all scores are -1', () => {
		expect(computeLearningStyle(-1, -1, -1, -1)).toBeNull();
	});

	it('returns null when all scores are null', () => {
		expect(computeLearningStyle(null, null, null, null)).toBeNull();
	});

	it('returns null when all scores are 0', () => {
		// 0 is treated as "no score" for learning-style purposes (maxScore <= 0)
		expect(computeLearningStyle(0, 0, 0, 0)).toBeNull();
	});

	it('returns null when scores are a mix of null and -1', () => {
		expect(computeLearningStyle(null, -1, null, -1)).toBeNull();
	});

	it('-1 and 0 are both treated as 0, so neither produces a learning style', () => {
		expect(computeLearningStyle(-1, 0, null, 0)).toBeNull();
	});
});

describe('computeLearningStyle – tie-breaking', () => {
	it('when two dimensions tie, returns the first in V-A-R-K order', () => {
		// visual and auditory both 80
		const result = computeLearningStyle(80, 80, 40, 40);
		expect(result).toBe('visual'); // visual comes first
	});

	it('when auditory and reading tie (visual absent), returns auditory', () => {
		const result = computeLearningStyle(0, 80, 80, 40);
		expect(result).toBe('auditory');
	});

	it('when all four dimensions are equal and positive, returns "visual"', () => {
		const result = computeLearningStyle(50, 50, 50, 50);
		expect(result).toBe('visual');
	});
});

describe('computeLearningStyle – score boundary cases', () => {
	it('a single score of 1 (just above 0) is enough to produce a style', () => {
		expect(computeLearningStyle(1, 0, 0, 0)).toBe('visual');
	});

	it('returns null when max score is exactly 0', () => {
		expect(computeLearningStyle(0, 0, 0, 0)).toBeNull();
	});

	it('handles the maximum score of 100', () => {
		expect(computeLearningStyle(100, 80, 60, 40)).toBe('visual');
	});

	it('result is always one of the four valid dimensions (or null)', () => {
		const result = computeLearningStyle(60, 80, 70, 75);
		expect([...DIMENSIONS, null]).toContain(result);
	});
});
