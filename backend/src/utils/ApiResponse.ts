import { Response } from 'express';

interface ApiResponseData<T> {
  success: boolean;
  message?: string;
  data?: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export class ApiResponse {
  // Başarılı yanıt
  static success<T>(res: Response, data?: T, message = 'İşlem başarılı', statusCode = 200): Response {
    const response: ApiResponseData<T> = {
      success: true,
      message,
      data,
    };
    return res.status(statusCode).json(response);
  }

  // Oluşturma başarılı
  static created<T>(res: Response, data?: T, message = 'Kayıt oluşturuldu'): Response {
    return this.success(res, data, message, 201);
  }

  // Sayfalanmış liste yanıtı
  static paginated<T>(
    res: Response,
    data: T[],
    page: number,
    limit: number,
    total: number,
    message = 'Liste başarıyla getirildi'
  ): Response {
    const totalPages = Math.ceil(total / limit);
    const response: ApiResponseData<T[]> = {
      success: true,
      message,
      data,
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    };
    return res.status(200).json(response);
  }

  // Hata yanıtı
  static error(res: Response, message: string, statusCode = 500): Response {
    const response: ApiResponseData<null> = {
      success: false,
      message,
    };
    return res.status(statusCode).json(response);
  }

  // İçerik yok
  static noContent(res: Response): Response {
    return res.status(204).send();
  }
}

export default ApiResponse;
