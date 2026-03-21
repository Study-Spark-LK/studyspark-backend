import { describe, it, expect } from 'vitest';

/**
 * Tests for the correctAnswer / correct_answer stripping logic in generate-quiz.ts.
 *
 * Two code paths both strip the answer before returning to Flutter:
 *   1. Cache HIT  – rows from quiz_questions D1 table (camelCase correctAnswer)
 *   2. Cache MISS – objects from the agent response  (snake_case correct_answer)
 */

// ─── Types ────────────────────────────────────────────────────────────────────

type D1Question = {
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

// ─── Helpers mirroring generate-quiz.ts ───────────────────────────────────────

// Cache HIT path (line 71-80 in generate-quiz.ts)
function stripCachedQuestion(q: D1Question) {
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

// Cache MISS path (line 153 in generate-quiz.ts)
function stripAgentQuestion(q: AgentQuestion) {
	const { correct_answer: _ca, ...rest } = q;
	return rest;
}

// ─── Test data ────────────────────────────────────────────────────────────────

const FULL_D1_QUESTION: D1Question = {
	id: 'q-abc',
	question: 'What is the powerhouse of the cell?',
	options: ['Nucleus', 'Mitochondria', 'Ribosome', 'Golgi body'],
	correctAnswer: 'Mitochondria',
	explanation: 'The mitochondria produces ATP.',
	difficulty: 'easy',
	concept: 'cell biology',
	varkDimension: 'reading'
};

const FULL_AGENT_QUESTION: AgentQuestion = {
	question: 'What is the powerhouse of the cell?',
	options: ['Nucleus', 'Mitochondria', 'Ribosome', 'Golgi body'],
	correct_answer: 'Mitochondria',
	explanation: 'The mitochondria produces ATP.',
	difficulty: 'easy',
	concept: 'cell biology',
	vark_dimension: 'reading'
};

// ─── Cache HIT (D1 questions) ─────────────────────────────────────────────────

describe('quiz answer stripping – cache HIT (D1 rows)', () => {
	it('removes correctAnswer from the response', () => {
		const result = stripCachedQuestion(FULL_D1_QUESTION);
		expect(result).not.toHaveProperty('correctAnswer');
	});

	it('preserves id, question, options, explanation, difficulty, concept', () => {
		const result = stripCachedQuestion(FULL_D1_QUESTION);
		expect(result.id).toBe('q-abc');
		expect(result.question).toBe('What is the powerhouse of the cell?');
		expect(result.options).toEqual(['Nucleus', 'Mitochondria', 'Ribosome', 'Golgi body']);
		expect(result.explanation).toBe('The mitochondria produces ATP.');
		expect(result.difficulty).toBe('easy');
		expect(result.concept).toBe('cell biology');
	});

	it('renames varkDimension to vark_dimension for the Flutter client', () => {
		const result = stripCachedQuestion(FULL_D1_QUESTION);
		expect(result.vark_dimension).toBe('reading');
		expect(result).not.toHaveProperty('varkDimension');
	});

	it('maps undefined explanation to null', () => {
		const result = stripCachedQuestion({ ...FULL_D1_QUESTION, explanation: undefined });
		expect(result.explanation).toBeNull();
	});

	it('maps null explanation to null', () => {
		const result = stripCachedQuestion({ ...FULL_D1_QUESTION, explanation: null });
		expect(result.explanation).toBeNull();
	});

	it('maps undefined concept to null', () => {
		const result = stripCachedQuestion({ ...FULL_D1_QUESTION, concept: undefined });
		expect(result.concept).toBeNull();
	});

	it('maps undefined varkDimension to null', () => {
		const result = stripCachedQuestion({ ...FULL_D1_QUESTION, varkDimension: undefined });
		expect(result.vark_dimension).toBeNull();
	});

	it('strips correctAnswer from every question when mapping a list', () => {
		const questions: D1Question[] = [
			{ ...FULL_D1_QUESTION, id: 'q-1', correctAnswer: 'A' },
			{ ...FULL_D1_QUESTION, id: 'q-2', correctAnswer: 'B' },
			{ ...FULL_D1_QUESTION, id: 'q-3', correctAnswer: 'C' }
		];
		const results = questions.map(stripCachedQuestion);
		for (const r of results) {
			expect(r).not.toHaveProperty('correctAnswer');
		}
		expect(results.map((r) => r.id)).toEqual(['q-1', 'q-2', 'q-3']);
	});
});

// ─── Cache MISS (agent questions) ────────────────────────────────────────────

describe('quiz answer stripping – cache MISS (agent response)', () => {
	it('removes correct_answer from the response', () => {
		const result = stripAgentQuestion(FULL_AGENT_QUESTION);
		expect(result).not.toHaveProperty('correct_answer');
	});

	it('preserves question, options, explanation, difficulty, concept, vark_dimension', () => {
		const result = stripAgentQuestion(FULL_AGENT_QUESTION);
		expect(result.question).toBe('What is the powerhouse of the cell?');
		expect(result.options).toEqual(['Nucleus', 'Mitochondria', 'Ribosome', 'Golgi body']);
		expect(result.explanation).toBe('The mitochondria produces ATP.');
		expect(result.difficulty).toBe('easy');
		expect(result.concept).toBe('cell biology');
		expect(result.vark_dimension).toBe('reading');
	});

	it('works when all optional agent fields are absent', () => {
		const minimal: AgentQuestion = { question: 'Q?', options: ['A'], correct_answer: 'A' };
		const result = stripAgentQuestion(minimal);
		expect(result).not.toHaveProperty('correct_answer');
		expect(result.question).toBe('Q?');
	});

	it('strips correct_answer from every question when mapping a list', () => {
		const questions: AgentQuestion[] = [
			{ ...FULL_AGENT_QUESTION, correct_answer: 'X' },
			{ ...FULL_AGENT_QUESTION, correct_answer: 'Y' }
		];
		const results = questions.map(stripAgentQuestion);
		for (const r of results) {
			expect(r).not.toHaveProperty('correct_answer');
		}
	});
});
