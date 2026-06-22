export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    requestId: string;
    timestamp: string;
    pagination?: {
      page: number;
      perPage: number;
      totalItems: number;
      totalPages: number;
    };
  };
}
