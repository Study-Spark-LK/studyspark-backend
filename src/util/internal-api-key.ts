/**
 * Returns true only when the provided key is a non-empty string that exactly
 * matches the expected internal API key.
 *
 * Mirrors the guard used in both internal route handlers:
 *   if (!providedKey || providedKey !== c.env.INTERNAL_API_KEY) → 401
 */
export function isValidInternalApiKey(
	providedKey: string | null | undefined,
	expectedKey: string
): boolean {
	return !!providedKey && providedKey === expectedKey;
}
