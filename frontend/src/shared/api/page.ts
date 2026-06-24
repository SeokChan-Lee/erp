export type PageResponse<T> = {
  content: T[];
  totalItems: number;
  page: number;
  pageSize: number;
};
