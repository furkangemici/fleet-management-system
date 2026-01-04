import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';
import config from '../config';

// Global hata yakalama middleware
export const errorMiddleware = (
  err: Error | ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Varsayılan değerler
  let statusCode = 500;
  let message = 'Sunucu hatası';
  let isOperational = false;

  // ApiError ise
  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    isOperational = err.isOperational;
  } else if (err.name === 'ValidationError') {
    // Validation hatası
    statusCode = 400;
    message = err.message;
    isOperational = true;
  } else if (err.name === 'JsonWebTokenError') {
    // JWT hatası
    statusCode = 401;
    message = 'Geçersiz token';
    isOperational = true;
  } else if (err.name === 'TokenExpiredError') {
    // Token süresi dolmuş
    statusCode = 401;
    message = 'Token süresi dolmuş';
    isOperational = true;
  }

  // Prisma hataları
  if (err.name === 'PrismaClientKnownRequestError') {
    statusCode = 400;
    message = 'Veritabanı işlem hatası';
    isOperational = true;
  }

  // Geliştirme ortamında detaylı hata
  const errorResponse: any = {
    success: false,
    message,
  };

  if (config.nodeEnv === 'development') {
    errorResponse.stack = err.stack;
    errorResponse.error = err.message;
  }

  // Logla
  if (!isOperational) {
    console.error('🔥 Beklenmeyen Hata:', err);
  } else if (config.nodeEnv === 'development') {
    console.log(`⚠️ ${statusCode}: ${message}`);
  }

  res.status(statusCode).json(errorResponse);
};

// 404 - Route bulunamadı
export const notFoundMiddleware = (req: Request, res: Response, next: NextFunction) => {
  res.status(404).json({
    success: false,
    message: `Endpoint bulunamadı: ${req.method} ${req.originalUrl}`,
  });
};

export default errorMiddleware;
