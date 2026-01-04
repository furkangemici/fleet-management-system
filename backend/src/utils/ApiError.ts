export class ApiError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(statusCode: number, message: string, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

// HTTP Hata Sınıfları
export class BadRequestError extends ApiError {
  constructor(message = 'Geçersiz istek') {
    super(400, message);
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = 'Yetkisiz erişim') {
    super(401, message);
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = 'Bu işlem için yetkiniz yok') {
    super(403, message);
  }
}

export class NotFoundError extends ApiError {
  constructor(message = 'Kaynak bulunamadı') {
    super(404, message);
  }
}

export class ConflictError extends ApiError {
  constructor(message = 'Kaynak zaten mevcut') {
    super(409, message);
  }
}

export class InternalServerError extends ApiError {
  constructor(message = 'Sunucu hatası') {
    super(500, message, false);
  }
}
