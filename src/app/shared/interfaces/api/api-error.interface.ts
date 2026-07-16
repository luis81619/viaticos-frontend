export interface ApiErrorDetail {
  field?: string;

  issue?: string;

  value?: unknown;
}

export interface ApiError {
  code: string;

  message: string;

  details: ApiErrorDetail[];
}
