import { describe, it, expect } from 'vitest';
import { isValidInternalApiKey } from '../util/internal-api-key';

const EXPECTED_KEY = 'dev-secret-change-in-prod';

describe('isValidInternalApiKey – valid key', () => {
	it('returns true when the provided key exactly matches the expected key', () => {
		expect(isValidInternalApiKey(EXPECTED_KEY, EXPECTED_KEY)).toBe(true);
	});

	it('returns true for a different valid key string', () => {
		const key = 'super-secret-production-key-xyz';
		expect(isValidInternalApiKey(key, key)).toBe(true);
	});
});

describe('isValidInternalApiKey – missing or empty key', () => {
	it('returns false when the header is undefined (not provided)', () => {
		expect(isValidInternalApiKey(undefined, EXPECTED_KEY)).toBe(false);
	});

	it('returns false when the header is null', () => {
		expect(isValidInternalApiKey(null, EXPECTED_KEY)).toBe(false);
	});

	it('returns false when the header is an empty string', () => {
		// empty string is falsy → !!providedKey is false
		expect(isValidInternalApiKey('', EXPECTED_KEY)).toBe(false);
	});
});

describe('isValidInternalApiKey – wrong key', () => {
	it('returns false when the key is completely wrong', () => {
		expect(isValidInternalApiKey('wrong-key', EXPECTED_KEY)).toBe(false);
	});

	it('returns false when the key has a leading space', () => {
		expect(isValidInternalApiKey(` ${EXPECTED_KEY}`, EXPECTED_KEY)).toBe(false);
	});

	it('returns false when the key has a trailing space', () => {
		expect(isValidInternalApiKey(`${EXPECTED_KEY} `, EXPECTED_KEY)).toBe(false);
	});

	it('returns false when the key is the correct value but wrong case', () => {
		expect(isValidInternalApiKey(EXPECTED_KEY.toUpperCase(), EXPECTED_KEY)).toBe(false);
	});

	it('returns false when only a prefix of the correct key is provided', () => {
		expect(isValidInternalApiKey(EXPECTED_KEY.slice(0, 5), EXPECTED_KEY)).toBe(false);
	});

	it('returns false when the key is "undefined" as a string', () => {
		expect(isValidInternalApiKey('undefined', EXPECTED_KEY)).toBe(false);
	});
});
