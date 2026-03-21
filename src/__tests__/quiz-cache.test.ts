import { describe, it, expect } from 'vitest';

/**
 * Pure-logic tests for the two behaviours in generate-quiz.ts and
 * evaluate-quiz.ts that do not require DB or agent connectivity:
 *
 * 1. Stripping correctAnswer from cached D1 questions  (generate-quiz.ts:71-80)
 * 2. Stripping correct_answer from fresh agent results (generate-quiz.ts:153)
 * 3. Progress update formula                           (evaluate-quiz.ts:107-108)
 */

// ─── helpers mirroring the production code ────────────────────────────────────

type CachedQuestion = {
	id: string;
	question: string;
	options: string[];
	correctAnswer: string;
	explanation?: string | null;
	difficulty: string;
	concept?: string | null;
	varkDimension?: string | null;
};

type AgentQuestion = {
	question: string;
	options: string[];
	correct_answer: string;
	explanation?: string;
	difficulty?: string;
	concept?: string;
	vark_dimension?: string;
};

// Mirrors generate-quiz.ts:71-80
function stripCached(q: CachedQuestion) {
	const { correctAnswer: _ca, ...rest } = q;
	return {
		id: rest.id,
		question: rest.question,
		options: rest.options,
		explanation: rest.explanation ?? null,
		difficulty: rest.difficulty,
		concept: rest.concept ?? null,
		vark_dimension: rest.varkDimension ?? null
	};
}

// Mirrors generate-quiz.ts:153
function stripAgent(q: AgentQuestion) {
	const { correct_answer: _ca, ...rest } = q;
	return rest;
}

// Mirrors evaluate-quiz.ts:107-108
function computeNewProgress(currentProgress: number | null, score: number): number {
	const base = (currentProgress ?? -1) < 0 ? 0 : (currentProgress ?? 0);
	return Math.min(100, base + Math.round(score / 10));
}

// ─── tests ────────────────────────────────────────────────────────────────────

describe('quiz cache hit – stripCached (D1 questions)', () => {
	const base: CachedQuestion = {
		id: 'q-1',
		question: 'What is 2 + 2?',
		options: ['3', '4', '5', '6'],
		correctAnswer: '4',
		explanation: 'Basic addition.',
		difficulty: 'easy',
		concept: 'arithmetic',
		varkDimension: 'reading'
	};

	it('removes correctAnswer from the output', () => {
		const result = stripCached(base);
		expect(result).not.toHaveProperty('correctAnswer');
	});

	it('preserves all public question fields', () => {
		const result = stripCached(base);
		expect(result.id).toBe('q-1');
		expect(result.question).toBe('What is 2 + 2?');
		expect(result.options).toEqual(['3', '4', '5', '6']);
		expect(result.explanation).toBe('Basic addition.');
		expect(result.difficulty).toBe('easy');
		expect(result.concept).toBe('arithmetic');
	});

	it('renames varkDimension → vark_dimension for the Flutter client', () => {
		const result = stripCached(base);
		expect(result.vark_dimension).toBe('reading');
		expect(result).not.toHaveProperty('varkDimension');
	});

	it('fills undefined optional fields with null', () => {
		const result = stripCached({
			...base,
			explanation: undefined,
			concept: undefined,
			varkDimension: undefined
		});
		expect(result.explanation).toBeNull();
		expect(result.concept).toBeNull();
		expect(result.vark_dimension).toBeNull();
	});

	it('fills null optional fields with null (passes through)', () => {
		const result = stripCached({ ...base, explanation: null, concept: null, varkDimension: null });
		expect(result.explanation).toBeNull();
		expect(result.concept).toBeNull();
		expect(result.vark_dimension).toBeNull();
	});
});

describe('quiz cache miss – stripAgent (fresh agent questions)', () => {
	const base: AgentQuestion = {
		question: 'What is the capital of France?',
		options: ['Berlin', 'Madrid', 'Paris', 'Rome'],
		correct_answer: 'Paris',
		difficulty: 'easy',
		concept: 'geography',
		vark_dimension: 'reading'
	};

	it('removes correct_answer from the output', () => {
		const result = stripAgent(base);
		expect(result).not.toHaveProperty('correct_answer');
	});

	it('preserves all public fields returned by the agent', () => {
		const result = stripAgent(base);
		expect(result.question).toBe('What is the capital of France?');
		expect(result.options).toEqual(['Berlin', 'Madrid', 'Paris', 'Rome']);
		expect(result.difficulty).toBe('easy');
		expect(result.concept).toBe('geography');
		expect(result.vark_dimension).toBe('reading');
	});

	it('works when optional agent fields are absent', () => {
		const minimal: AgentQuestion = {
			question: 'Q?',
			options: ['A', 'B'],
			correct_answer: 'A'
		};
		const result = stripAgent(minimal);
		expect(result).not.toHaveProperty('correct_answer');
		expect(result.question).toBe('Q?');
	});
});

describe('evaluate-quiz – progress update formula', () => {
	it('treats -1 (unset progress) as 0 before adding', () => {
		expect(computeNewProgress(-1, 80)).toBe(8); // 0 + round(8) = 8
	});

	it('treats null (missing progress) the same as -1', () => {
		expect(computeNewProgress(null, 50)).toBe(5); // 0 + round(5) = 5
	});

	it('adds round(score / 10) to existing progress', () => {
		expect(computeNewProgress(20, 70)).toBe(27); // 20 + round(7) = 27
	});

	it('rounds 0.5 up (JS Math.round behaviour)', () => {
		expect(computeNewProgress(0, 75)).toBe(8); // round(7.5) = 8
	});

	it('rounds down when fractional part < 0.5', () => {
		expect(computeNewProgress(0, 74)).toBe(7); // round(7.4) = 7
	});

	it('caps result at 100 when sum exceeds 100', () => {
		expect(computeNewProgress(95, 100)).toBe(100); // 95 + 10 = 105 → 100
	});

	it('does not change progress when score is 0', () => {
		expect(computeNewProgress(50, 0)).toBe(50);
	});

	it('returns 0 for unset progress with a score of 0', () => {
		expect(computeNewProgress(-1, 0)).toBe(0);
	});

	it('does not cap at 100 for a score of 90 from 0', () => {
		expect(computeNewProgress(0, 90)).toBe(9); // 0 + 9 = 9
	});
});
