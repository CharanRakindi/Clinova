/**
 * Parse page/limit from query with safe defaults.
 * @returns {{ page: number, limit: number, skip: number }}
 */
export function parsePagination(query = {}, { defaultLimit = 25, maxLimit = 100 } = {}) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  let limit = parseInt(query.limit, 10) || defaultLimit;
  if (Number.isNaN(limit) || limit < 1) limit = defaultLimit;
  limit = Math.min(limit, maxLimit);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}
