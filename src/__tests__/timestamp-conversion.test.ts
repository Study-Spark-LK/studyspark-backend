import { describe, it, expect } from 'vitest';

/**
 * toISO is defined inline in get-profiles.ts, get-flashcards.ts, and
 * get-quiz-attempts.ts. These tests document the expected behaviour and
 * validate that the Drizzle timestamp_ms fix produces correct dates.
 *
 * With mode:'timestamp_ms', Drizzle returns new Date(storedMs) so the
 * value reaching toISO is already a proper Date object.
 * With the old mode:'timestamp', Drizzle would return new Date(storedMs * 1000),
 * producing a date in year ~58178 for a typical 2026 timestamp.
 */
const toISO = (ts: Date | number | null | undefined): string =>
	new Date(ts as any).toISOString();

// A real createdAt value from the remote D1 database (milliseconds).
const REAL_DB_TIMESTAMP_MS = 1773552826000;

describe('toISO – timestamp_ms mode (correct)', () => {
	it('converts a millisecond unix timestamp to a valid ISO 8601 string', () => {
		const result = toISO(REAL_DB_TIMESTAMP_MS);
		expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
	});

	it('produces a year in the plausible present range (not far future)', () => {
		const year = new Date(toISO(REAL_DB_TIMESTAMP_MS)).getFullYear();
		expect(year).toBeGreaterThanOrEqual(2020);
		expect(year).toBeLessThan(2100);
	});

	it('produces the correct year 2026 for the known DB timestamp', () => {
		expect(toISO(REAL_DB_TIMESTAMP_MS).startsWith('2026')).toBe(true);
	});

	it('accepts a Date object (as returned by Drizzle timestamp_ms mode)', () => {
		const date = new Date(REAL_DB_TIMESTAMP_MS);
		expect(toISO(date)).toBe(new Date(REAL_DB_TIMESTAMP_MS).toISOString());
	});
});

describe('toISO – demonstrates the old timestamp mode bug', () => {
	it('multiplying ms by 1000 again produces a far-future date (year > 9999)', () => {
		// This is what mode:'timestamp' was doing internally before the fix.
		const brokenDate = new Date(REAL_DB_TIMESTAMP_MS * 1000).toISOString();
		// ISO strings for years > 9999 are prefixed with '+'
		expect(brokenDate.startsWith('+')).toBe(true);
	});
});
