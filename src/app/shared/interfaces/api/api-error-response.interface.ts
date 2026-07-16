import { ApiError } from './api-error.interface';

export interface ApiErrorResponse {
  success: false;

  status: number;

  error: ApiError;

  timestamp: string;

  path: string;
}
