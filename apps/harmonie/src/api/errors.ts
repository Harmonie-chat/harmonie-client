export interface ApiError {
  code: string;
  detail: string;
  errors: Record<string, { code: string; detail: string }[]> | null;
  status: number;
  traceId: string;
}
