import { toast } from 'react-hot-toast';
import type { AxiosError } from 'axios';

export interface AppError {
  message: string;
  status?: number;
  code?: string;
  details?: unknown;
}

function readServerMessage(data: unknown): string {
  if (!data || typeof data !== 'object') return '';
  const record = data as Record<string, unknown>;

  if (typeof record.message === 'string') return record.message;
  if (typeof record.error === 'string') return record.error;

  if (Array.isArray(record.errors) && record.errors.length > 0) {
    const first = record.errors[0] as unknown;
    if (typeof first === 'string') return first;
    if (first && typeof first === 'object' && typeof (first as Record<string, unknown>).message === 'string') {
      return (first as Record<string, string>).message;
    }
  }

  return '';
}

export function normalizeApiError(error: unknown): AppError {
  const axiosError = error as AxiosError;
  const status = axiosError.response?.status;
  const serverMessage = readServerMessage(axiosError.response?.data);
  const retryAfter = axiosError.response?.headers?.['retry-after'];

  if (!axiosError.response) {
    return {
      message: 'Cannot reach the server. Check your internet connection and try again.',
      code: 'NETWORK_ERROR'
    };
  }

  if (serverMessage) {
    return { message: serverMessage, status, details: axiosError.response.data };
  }

  const messages: Record<number, string> = {
    400: 'The request has invalid details. Check the form and try again.',
    401: 'Wrong email or password, or your session has expired.',
    403: 'You do not have permission to perform this action.',
    404: 'That record could not be found.',
    409: 'This action conflicts with existing records.',
    422: 'Some details are missing or invalid.',
    500: 'The server could not complete the request. Try again shortly.'
  };

  if (status === 429) {
    const suffix = retryAfter ? ` Try again after ${retryAfter} seconds.` : ' Please wait before trying again.';
    return { message: `Too many attempts.${suffix}`, status, code: 'RATE_LIMITED' };
  }

  return {
    message: status ? messages[status] || `Request failed with status ${status}.` : 'Something went wrong. Try again.',
    status,
    details: axiosError.response.data
  };
}

export function getErrorMessage(error: unknown) {
  if (error && typeof error === 'object' && 'appError' in error) {
    return ((error as { appError?: AppError }).appError?.message) || normalizeApiError(error).message;
  }
  if (error instanceof Error) return error.message;
  return normalizeApiError(error).message;
}

export function notifySuccess(message: string) {
  toast.success(message);
}

export function notifyError(error: unknown, fallback = 'Unable to complete the action.') {
  const message = getErrorMessage(error) || fallback;
  toast.error(message);
  return message;
}
