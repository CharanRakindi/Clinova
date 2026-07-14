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

/**
 * Run a find with count for pagination meta.
 */
export async function paginateQuery(Model, filter, { page, limit, skip, sort = { createdAt: -1 }, populate = [] } = {}) {
  let q = Model.find(filter).sort(sort).skip(skip).limit(limit);
  for (const p of populate) {
    q = typeof p === 'string' ? q.populate(p) : q.populate(p);
  }
  const [data, total] = await Promise.all([
    q.lean ? q : q,
    Model.countDocuments(filter),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / limit) || 1);
  return {
    data,
    meta: { page, limit, total, totalPages },
  };
}
