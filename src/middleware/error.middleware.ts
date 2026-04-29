import { Request, Response, NextFunction } from 'express';

export function errorMiddleware(
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  return res.status(400).json({
    success: false,
    message: error.message || 'Unexpected error',
  });
}
