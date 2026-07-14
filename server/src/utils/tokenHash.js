import crypto from 'crypto';

/** One-way hash for refresh / invite tokens at rest. */
export function hashToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
}

/** Constant-time compare of raw token to stored SHA-256 hash only (no plaintext legacy). */
export function tokenMatches(storedHash, rawToken) {
  if (!storedHash || !rawToken) return false;
  const hashed = hashToken(rawToken);
  try {
    const a = Buffer.from(String(storedHash), 'utf8');
    const b = Buffer.from(hashed, 'utf8');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function generateSecureToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('base64url');
}
