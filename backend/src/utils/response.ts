interface PaginationMeta {
  page: number;
  perPage: number;
  totalItems: number;
  totalPages: number;
}

export function success<T>(data: T, pagination?: PaginationMeta) {
  return {
    success: true,
    data,
    meta: {
      requestId: `req_${Date.now()}`,
      timestamp: new Date().toISOString(),
      ...(pagination ? { pagination } : {}),
    },
  };
}

export function error(code: string, message: string, status: number, details?: unknown) {
  const err = new Error(message) as Error & { statusCode: number; errorCode: string; details?: unknown };
  err.statusCode = status;
  err.errorCode = code;
  err.details = details;
  return err;
}
