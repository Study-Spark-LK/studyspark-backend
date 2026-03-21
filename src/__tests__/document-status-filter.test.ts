import { describe, it, expect } from 'vitest';

/**
 * Tests for the document/profile status filter logic used in:
 *   - GET /documents  (get-documents.ts)  – filters by category + pagination
 *   - GET /profiles   (get-profiles.ts)   – filters by status query param
 *
 * The query-param → DB-filter mapping is:
 *   'ready'   → only READY documents
 *   'pending' → only PENDING documents
 *   'all' / undefined → all documents
 */

type DocStatus = 'PENDING' | 'READY';

type Document = {
	id: string;
	status: DocStatus;
	category: string;
	clerkId: string;
};

// ─── Pure filter predicates mirroring the WHERE clause logic ─────────────────

function matchesStatusFilter(
	docStatus: DocStatus,
	filter: 'all' | 'pending' | 'ready' | undefined
): boolean {
	if (!filter || filter === 'all') return true;
	return filter === 'ready' ? docStatus === 'READY' : docStatus === 'PENDING';
}

function filterDocuments(
	docs: Document[],
	filter: 'all' | 'pending' | 'ready' | undefined,
	category?: string
): Document[] {
	return docs.filter(
		(d) =>
			matchesStatusFilter(d.status, filter) &&
			(category === undefined || d.category === category)
	);
}

// ─── Test data ────────────────────────────────────────────────────────────────

const DOCS: Document[] = [
	{ id: '1', status: 'READY',   category: 'Science',  clerkId: 'user_a' },
	{ id: '2', status: 'PENDING', category: 'Science',  clerkId: 'user_a' },
	{ id: '3', status: 'READY',   category: 'Math',     clerkId: 'user_a' },
	{ id: '4', status: 'PENDING', category: 'Math',     clerkId: 'user_a' },
	{ id: '5', status: 'READY',   category: 'History',  clerkId: 'user_a' }
];

// ─── Status filter ────────────────────────────────────────────────────────────

describe('document status filter – filter=ready', () => {
	it('returns only READY documents', () => {
		const result = filterDocuments(DOCS, 'ready');
		expect(result.every((d) => d.status === 'READY')).toBe(true);
	});

	it('excludes PENDING documents', () => {
		const result = filterDocuments(DOCS, 'ready');
		expect(result.some((d) => d.status === 'PENDING')).toBe(false);
	});

	it('returns the correct count', () => {
		expect(filterDocuments(DOCS, 'ready')).toHaveLength(3);
	});
});

describe('document status filter – filter=pending', () => {
	it('returns only PENDING documents', () => {
		const result = filterDocuments(DOCS, 'pending');
		expect(result.every((d) => d.status === 'PENDING')).toBe(true);
	});

	it('excludes READY documents', () => {
		const result = filterDocuments(DOCS, 'pending');
		expect(result.some((d) => d.status === 'READY')).toBe(false);
	});

	it('returns the correct count', () => {
		expect(filterDocuments(DOCS, 'pending')).toHaveLength(2);
	});
});

describe('document status filter – filter=all or undefined', () => {
	it('filter="all" returns all documents', () => {
		expect(filterDocuments(DOCS, 'all')).toHaveLength(DOCS.length);
	});

	it('filter=undefined returns all documents', () => {
		expect(filterDocuments(DOCS, undefined)).toHaveLength(DOCS.length);
	});

	it('returns both READY and PENDING when no filter applied', () => {
		const result = filterDocuments(DOCS, undefined);
		expect(result.some((d) => d.status === 'READY')).toBe(true);
		expect(result.some((d) => d.status === 'PENDING')).toBe(true);
	});
});

describe('document status filter – empty list', () => {
	it('filter=ready on empty list returns empty array', () => {
		expect(filterDocuments([], 'ready')).toEqual([]);
	});

	it('filter=pending on empty list returns empty array', () => {
		expect(filterDocuments([], 'pending')).toEqual([]);
	});

	it('filter=all on empty list returns empty array', () => {
		expect(filterDocuments([], 'all')).toEqual([]);
	});
});

describe('document status filter – combined with category', () => {
	it('filter=ready + category="Science" returns only READY Science docs', () => {
		const result = filterDocuments(DOCS, 'ready', 'Science');
		expect(result).toHaveLength(1);
		expect(result[0].id).toBe('1');
	});

	it('filter=pending + category="Math" returns only PENDING Math docs', () => {
		const result = filterDocuments(DOCS, 'pending', 'Math');
		expect(result).toHaveLength(1);
		expect(result[0].id).toBe('4');
	});

	it('no matching category returns empty array', () => {
		const result = filterDocuments(DOCS, 'all', 'Nonexistent');
		expect(result).toEqual([]);
	});
});
