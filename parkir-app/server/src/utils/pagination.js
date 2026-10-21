/** Mengambil parameter page/limit dengan batas aman. */
export function getPagination(req, defaultLimit = 10, maxLimit = 100) {
  const pageRaw = Number.parseInt(req.query.page, 10);
  const limitRaw = Number.parseInt(req.query.limit, 10);
  const page = Number.isInteger(pageRaw) && pageRaw > 0 ? pageRaw : 1;
  const limit = Number.isInteger(limitRaw) && limitRaw > 0
    ? Math.min(limitRaw, maxLimit)
    : defaultLimit;

  return { page, limit, offset: (page - 1) * limit };
}

/** Metadata paginasi standar. */
export function buildMeta(total, page, limit) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return {
    total,
    page,
    limit,
    total_pages: totalPages,
    has_prev: page > 1,
    has_next: page < totalPages,
  };
}

/** Menentukan sorting dari whitelist kolom agar aman dari SQL injection. */
export function getSorting(req, columnMap, fallback) {
  const requested = String(req.query.sort || '');
  const sort = columnMap[requested] || fallback;
  const order = String(req.query.order || 'desc').toLowerCase() === 'asc' ? 'ASC' : 'DESC';
  return { sort, order };
}
