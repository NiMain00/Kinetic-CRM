export interface PaginatedRequest {
  page?: number;
  perPage?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
