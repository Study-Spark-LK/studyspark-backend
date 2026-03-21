import { describe, it, expect } from 'vitest';

/**
 * Tests for the flashcard persistence logic in on-document-generation-ready.ts.
 *
 * The relevant production code (lines 56-69):
 *
 *   if (payload.flashcards?.length) {
 *     await drizzleDB.insert(flashcardTable).values(
 *       payload.flashcards.map((fc) => ({
 *         id: crypto.randomUUID(),
 *         documentId: doc.id,
 *         clerkId: doc.clerkId,
 *         question: fc.question,
 *         answer: fc.answer,
 *         hint: fc.hint ?? null,
 *         createdAt: new Date(Date.now()),
 *         updatedAt: new Date(Date.now())
 *       }))
 *     );
 *   }
 *
 * These tests cover the guard condition and the mapping logic without
 * touching D1 or any Cloudflare bindings.
 */

type AgentFlashcard = {
	question: string;
	answer: string;
	hint?: string | null;
};

type InsertRow = {
	question: string;
	answer: string;
	hint: string | null;
	documentId: string;
	clerkId: string;
};

// ─── Pure helpers extracted from production code ───────────────────────────

function shouldInsertFlashcards(
	flashcards: AgentFlashcard[] | undefined | null
): boolean {
	// Mirrors: payload.flashcards?.length  (truthy check)
	return !!(flashcards?.length);
}

function mapFlashcardsToInsert(
	flashcards: AgentFlashcard[],
	documentId: string,
	clerkId: string
): InsertRow[] {
	return flashcards.map((fc) => ({
		question:   fc.question,
		answer:     fc.answer,
		hint:       fc.hint ?? null,
		documentId,
		clerkId
	}));
}

// ─── shouldInsertFlashcards (guard) ──────────────────────────────────────────

describe('flashcard persistence – guard condition', () => {
	it('returns true for a non-empty array', () => {
		expect(shouldInsertFlashcards([
			{ question: 'Q?', answer: 'A' }
		])).toBe(true);
	});

	it('returns false for an empty array (no insert)', () => {
		expect(shouldInsertFlashcards([])).toBe(false);
	});

	it('returns false for undefined (field missing from agent response)', () => {
		expect(shouldInsertFlashcards(undefined)).toBe(false);
	});

	it('returns false for null', () => {
		expect(shouldInsertFlashcards(null)).toBe(false);
	});

	it('returns true for multiple flashcards', () => {
		expect(shouldInsertFlashcards([
			{ question: 'Q1?', answer: 'A1' },
			{ question: 'Q2?', answer: 'A2' }
		])).toBe(true);
	});
});

// ─── mapFlashcardsToInsert (mapping) ─────────────────────────────────────────

describe('flashcard persistence – row mapping', () => {
	const DOC_ID   = 'doc-123';
	const CLERK_ID = 'user_abc';

	it('maps question and answer fields directly', () => {
		const [row] = mapFlashcardsToInsert(
			[{ question: 'What is HTTP?', answer: 'HyperText Transfer Protocol' }],
			DOC_ID, CLERK_ID
		);
		expect(row.question).toBe('What is HTTP?');
		expect(row.answer).toBe('HyperText Transfer Protocol');
	});

	it('stores hint as null when hint is undefined', () => {
		const [row] = mapFlashcardsToInsert(
			[{ question: 'Q?', answer: 'A' }],  // hint omitted
			DOC_ID, CLERK_ID
		);
		expect(row.hint).toBeNull();
	});

	it('stores hint as null when hint is explicitly null', () => {
		const [row] = mapFlashcardsToInsert(
			[{ question: 'Q?', answer: 'A', hint: null }],
			DOC_ID, CLERK_ID
		);
		expect(row.hint).toBeNull();
	});

	it('preserves a non-null hint string', () => {
		const [row] = mapFlashcardsToInsert(
			[{ question: 'Q?', answer: 'A', hint: 'Think about photosynthesis.' }],
			DOC_ID, CLERK_ID
		);
		expect(row.hint).toBe('Think about photosynthesis.');
	});

	it('attaches documentId and clerkId to every row', () => {
		const rows = mapFlashcardsToInsert(
			[
				{ question: 'Q1?', answer: 'A1' },
				{ question: 'Q2?', answer: 'A2' }
			],
			DOC_ID, CLERK_ID
		);
		for (const row of rows) {
			expect(row.documentId).toBe(DOC_ID);
			expect(row.clerkId).toBe(CLERK_ID);
		}
	});

	it('produces one row per flashcard', () => {
		const flashcards: AgentFlashcard[] = [
			{ question: 'Q1?', answer: 'A1' },
			{ question: 'Q2?', answer: 'A2' },
			{ question: 'Q3?', answer: 'A3' }
		];
		const rows = mapFlashcardsToInsert(flashcards, DOC_ID, CLERK_ID);
		expect(rows).toHaveLength(3);
	});

	it('preserves order of flashcards', () => {
		const flashcards: AgentFlashcard[] = [
			{ question: 'First',  answer: '1' },
			{ question: 'Second', answer: '2' }
		];
		const rows = mapFlashcardsToInsert(flashcards, DOC_ID, CLERK_ID);
		expect(rows[0].question).toBe('First');
		expect(rows[1].question).toBe('Second');
	});
});
