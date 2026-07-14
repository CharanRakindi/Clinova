import jwt from 'jsonwebtoken';

/** Parse ms / s / m / h / d duration strings used by jsonwebtoken expiresIn. */
export function durationToMs(value, fallbackMs) {
  if (value == null || value === '') return fallbackMs;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const s = String(value).trim();
  const m = s.match(/^(\d+)(ms|s|m|h|d)?$/i);
  if (!m) return fallbackMs;
  const n = Number(m[1]);
  const unit = (m[2] || 'ms').toLowerCase();
  const mult = { ms: 1, s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  return n * (mult[unit] || 1);
}

/** Shared cookie base (auth + CSRF). */
export function cookieOptionsBase(maxAgeMs) {
  const secure =
    process.env.COOKIE_SECURE !== undefined
      ? process.env.COOKIE_SECURE === 'true'
      : process.env.NODE_ENV === 'production';

  const sameSite = process.env.COOKIE_SAMESITE || 'lax';

  return {
    httpOnly: true,
    secure,
    sameSite,
    maxAge: maxAgeMs,
    path: '/',
  };
}

export const generateTokens = (userId) => {
  const accessToken = jwt.sign({ id: userId }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || '15m',
  });

  const refreshToken = jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
  });

  return { accessToken, refreshToken };
};

export const setTokenCookies = (res, accessToken, refreshToken) => {
  const accessMs = durationToMs(process.env.ACCESS_TOKEN_EXPIRES_IN, 15 * 60 * 1000);
  const refreshMs = durationToMs(process.env.REFRESH_TOKEN_EXPIRES_IN, 7 * 24 * 60 * 60 * 1000);
  res.cookie('accessToken', accessToken, cookieOptionsBase(accessMs));
  res.cookie('refreshToken', refreshToken, cookieOptionsBase(refreshMs));
};

export const clearTokenCookies = (res) => {
  const base = cookieOptionsBase(0);
  res.cookie('accessToken', '', { ...base, maxAge: 0, expires: new Date(0) });
  res.cookie('refreshToken', '', { ...base, maxAge: 0, expires: new Date(0) });
};
