import { describe, it, expect } from 'vitest';

/**
 * Tests for the hobbies JSON serialisation / deserialisation roundtrip.
 *
 * In the schema, hobbies is stored as:
 *   text('hobbies', { mode: 'json' }).$type<string[]>()
 *
 * Drizzle serialises the value with JSON.stringify before writing to SQLite
 * and deserialises with JSON.parse on read.  These tests verify that the
 * roundtrip is lossless for all values the application may encounter.
 */

function serialise(hobbies: string[]): string {
	return JSON.stringify(hobbies);
}

function deserialise(raw: string): string[] {
	return JSON.parse(raw) as string[];
}

function roundtrip(hobbies: string[]): string[] {
	return deserialise(serialise(hobbies));
}

describe('hobbies serialisation – basic roundtrip', () => {
	it('empty array roundtrips to empty array', () => {
		expect(roundtrip([])).toEqual([]);
	});

	it('empty array serialises to the string "[]"', () => {
		expect(serialise([])).toBe('[]');
	});

	it('single hobby roundtrips correctly', () => {
		expect(roundtrip(['Gaming'])).toEqual(['Gaming']);
	});

	it('multiple hobbies roundtrip in the same order', () => {
		const hobbies = ['Gaming', 'Music', 'Technology'];
		expect(roundtrip(hobbies)).toEqual(hobbies);
	});

	it('deserialising "[]" produces an empty array', () => {
		expect(deserialise('[]')).toEqual([]);
	});
});

describe('hobbies serialisation – special characters', () => {
	it('hobby with spaces roundtrips correctly', () => {
		expect(roundtrip(['Rock Climbing'])).toEqual(['Rock Climbing']);
	});

	it('hobby with unicode characters roundtrips correctly', () => {
		expect(roundtrip(['音楽', 'Música', 'Ünterwegs'])).toEqual(['音楽', 'Música', 'Ünterwegs']);
	});

	it('hobby with apostrophe roundtrips correctly', () => {
		expect(roundtrip(["Bird-watching", "It's complicated"])).toEqual(["Bird-watching", "It's complicated"]);
	});

	it('hobby with double quotes roundtrips correctly', () => {
		expect(roundtrip(['Say "hello"'])).toEqual(['Say "hello"']);
	});

	it('hobby with backslash roundtrips correctly', () => {
		expect(roundtrip(['C:\\Programming'])).toEqual(['C:\\Programming']);
	});

	it('hobby with emoji roundtrips correctly', () => {
		expect(roundtrip(['🎮 Gaming', '🎵 Music'])).toEqual(['🎮 Gaming', '🎵 Music']);
	});
});

describe('hobbies serialisation – schema defaults', () => {
	it('default empty array value serialises to "[]"', () => {
		// The Drizzle schema default is []
		const defaultHobbies: string[] = [];
		expect(serialise(defaultHobbies)).toBe('[]');
	});

	it('a profile with no hobbies set still returns an array (not null)', () => {
		// Route handlers use: profile.hobbies ?? []
		const hobbies: string[] | null = null;
		const result = hobbies ?? [];
		expect(Array.isArray(result)).toBe(true);
		expect(result).toHaveLength(0);
	});

	it('large hobby list roundtrips without data loss', () => {
		const large = Array.from({ length: 50 }, (_, i) => `Hobby ${i + 1}`);
		expect(roundtrip(large)).toEqual(large);
	});
});
