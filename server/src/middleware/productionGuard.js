/**
 * Fail fast on insecure production configuration when enforcing real PHI tier.
 * Call once at process start (server.js).
 *
 * Soft mode (default NODE_ENV=production): warn on HTTP cookies.
 * Hard mode (REQUIRE_HTTPS=true): exit if COOKIE_SECURE is not true.
 */
export function assertProductionConfig() {
  const env = process.env.NODE_ENV || 'development';
  if (env !== 'production') return;

  const errors = [];
  const warnings = [];

  if (!process.env.JWT_ACCESS_SECRET || process.env.JWT_ACCESS_SECRET.length < 32) {
    errors.push('JWT_ACCESS_SECRET must be set and >= 32 characters');
  }
  if (!process.env.JWT_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET.length < 32) {
    errors.push('JWT_REFRESH_SECRET must be set and >= 32 characters');
  }
  if (!process.env.CLIENT_URL || process.env.CLIENT_URL.includes('*')) {
    errors.push('CLIENT_URL must be an explicit origin list (no wildcards)');
  }
  if (process.env.ALLOW_SEED === 'true') {
    errors.push('ALLOW_SEED must not be true in production');
  }

  if (process.env.COOKIE_SECURE !== 'true') {
    warnings.push(
      'COOKIE_SECURE is not true — sessions may be stolen over HTTP. Not suitable for real patient data.'
    );
    if (process.env.REQUIRE_HTTPS === 'true') {
      errors.push('REQUIRE_HTTPS=true requires COOKIE_SECURE=true');
    }
  }

  if (process.env.REQUIRE_MONGO_AUTH === 'true') {
    const uri = process.env.MONGO_URI || '';
    if (!uri.includes('@')) {
      errors.push('REQUIRE_MONGO_AUTH=true requires authenticated MONGO_URI');
    }
  }

  for (const w of warnings) console.warn('WARNING:', w);

  if (errors.length) {
    console.error('FATAL: insecure production configuration:\n- ' + errors.join('\n- '));
    process.exit(1);
  }
}
