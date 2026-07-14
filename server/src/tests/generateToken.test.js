import { describe, it, expect, beforeAll } from 'vitest';
import jwt from 'jsonwebtoken';
import { generateTokens } from '../utils/generateToken.js';

describe('generateTokens', () => {
  beforeAll(() => {
    process.env.JWT_ACCESS_SECRET = 'test_access_secret_at_least_32_characters_long';
    process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_at_least_32_characters_long';
  });

  it('returns signed access and refresh tokens for a user id', () => {
    const userId = '507f1f77bcf86cd799439011';
    const { accessToken, refreshToken } = generateTokens(userId);

    expect(accessToken).toBeTruthy();
    expect(refreshToken).toBeTruthy();
    expect(accessToken).not.toBe(refreshToken);

    const access = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET);
    const refresh = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    expect(access.id).toBe(userId);
    expect(refresh.id).toBe(userId);
  });
});
