/**
 * Shared test env — must run before app imports that read process.env.
 */
process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = 'test_access_secret_at_least_32_characters_long';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_at_least_32_characters_long';
process.env.CLIENT_URL = 'http://localhost:5173';
process.env.COOKIE_SECURE = 'false';
process.env.RATE_LIMIT_MAX = '10000';
process.env.ACCESS_TOKEN_EXPIRES_IN = '15m';
process.env.REFRESH_TOKEN_EXPIRES_IN = '7d';
