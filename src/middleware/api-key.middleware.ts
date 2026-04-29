import { Request, Response, NextFunction } from 'express';

export function apiKeyMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const isRapidApiRequest =
    req.header('X-RapidAPI-Host') || req.header('x-rapidapi-host');

  if (isRapidApiRequest) {
    return next();
  }

  const apiKey = req.header('x-api-key');

  if (!apiKey) {
    return res.status(401).json({
      success: false,
      message: 'API key is required',
    });
  }

  if (apiKey !== process.env.API_KEY) {
    return res.status(403).json({
      success: false,
      message: 'Invalid API key',
    });
  }

  next();
}
