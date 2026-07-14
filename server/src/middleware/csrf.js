import crypto from 'crypto';
import { cookieOptionsBase } from '../utils/generateToken.js';

const SAFE = new Set(['GET', 'HEAD', 'OPTIONS']);

/** Issue a non-HttpOnly CSRF cookie (double-submit pattern). */
export function issueCsrfToken(res) {
  const token = crypto.randomBytes(24).toString('base64url');
  const base = cookieOptionsBase(4 * 60 * 60 * 1000);
  res.cookie('csrfToken', token, {
    ...base,
    httpOnly: false, // readable by JS for double-submit
    sameSite: base.sameSite || 'lax',
  });
  return token;
}

/**
 * Require X-CSRF-Token header to match csrfToken cookie on mutating requests.
 * Skipped in test env and when CSRF_DISABLED=true (local tooling only).
 */
export function csrfProtection(req, res, next) {
  if (process.env.NODE_ENV === 'test' || process.env.CSRF_DISABLED === 'true') {
    return next();
  }
  if (SAFE.has(req.method)) return next();

  // Unauthenticated public auth endpoints still get CSRF after we set cookie on GET /login page;
  // for API-only clients without cookie yet, require header equals cookie when cookie present.
  const cookieToken = req.cookies?.csrfToken;
  const headerToken = req.get('x-csrf-token') || req.get('X-CSRF-Token');

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return res.status(403).json({
      success: false,
      message: 'Invalid or missing CSRF token',
    });
  }
  return next();
}
