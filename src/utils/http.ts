import type { Response } from "express";

export type ApiSuccess<T> = {
  success: true;
  data: T;
  error: null;
};

export type ApiErrorBody = {
  success: false;
  data: null;
  error: { message: string; code?: string; details?: unknown };
};

export function sendSuccess<T>(res: Response, status: number, data: T): void {
  const body: ApiSuccess<T> = { success: true, data, error: null };
  res.status(status).json(body);
}

export function sendError(
  res: Response,
  status: number,
  message: string,
  code?: string,
  details?: unknown
): void {
  const body: ApiErrorBody = {
    success: false,
    data: null,
    error:
      details !== undefined
        ? { message, code, details }
        : code !== undefined
          ? { message, code }
          : { message },
  };
  res.status(status).json(body);
}
