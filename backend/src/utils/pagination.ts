export function getPagination(query: { page?: string; perPage?: string }) {
  const page = Math.max(1, parseInt(query.page || '1', 10));
  const perPage = Math.min(100, Math.max(1, parseInt(query.perPage || '10', 10)));
  return { page, perPage, skip: (page - 1) * perPage };
}
