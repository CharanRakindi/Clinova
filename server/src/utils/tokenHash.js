import crypto from 'crypto';

/** One-way hash for refresh tokens at rest (DB leak ≠ reusable token). */
export function hashToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
}

/** Constant-time compare of hashed token to stored hash (or legacy plaintext). */
export function tokenMatches(stored, rawToken) {
  if (!stored || !rawToken) return false;
  const hashed = hashToken(rawToken);
  // Prefer hashed equality
  try {
    const a = Buffer.from(stored);
    const b = Buffer.from(hashed);
    if (a.length === b.length && crypto.timingSafeEqual(a, b)) return true;
  } catch {
    // fall through
  }
  // Legacy: plaintext stored before migration
  return stored === rawToken;
}
