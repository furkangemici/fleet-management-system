import { Request, Response } from 'express';
import driverService from '../services/driverService';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { BadRequestError } from '../utils/ApiError';
import { DriverStatus } from '../../generated/prisma';

class DriverController {
  // GET /api/drivers
  getAllDrivers = asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as DriverStatus | undefined;
    const search = req.query.search as string | undefined;
    const vehicleId = req.query.vehicleId ? parseInt(req.query.vehicleId as string) : undefined;
    const isAvailable = req.query.available === 'true';

    const result = await driverService.getAllDrivers(page, limit, { status, search, vehicleId, isAvailable });

    // Paginated response formatında döndür
    return ApiResponse.paginated(res, result.drivers, page, limit, result.total, 'Sürücüler listelendi');
  });

  // GET /api/drivers/:id
  getDriverById = asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const driver = await driverService.getDriverById(id);

    return ApiResponse.success(res, driver, 'Sürücü detayı getirildi');
  });

  // POST /api/drivers
  createDriver = asyncHandler(async (req: Request, res: Response) => {
    // Tarih alanlarını Date objesine çevir ve Validasyon yap
    const licenseExpiry = req.body.licenseExpiry ? new Date(req.body.licenseExpiry) : null;
    if (!licenseExpiry || isNaN(licenseExpiry.getTime())) {
        throw new BadRequestError('Geçerli bir ehliyet geçerlilik tarihi giriniz.');
    }

    let birthDate: Date | undefined = undefined;
    if (req.body.birthDate) {
        birthDate = new Date(req.body.birthDate);
        if (isNaN(birthDate.getTime())) {
            throw new BadRequestError('Geçersiz doğum tarihi.');
        }
    }

    const data = {
      ...req.body,
      licenseExpiry,
      birthDate,
    };

    const currentUserId = (req as any).user?.id;
    const driver = await driverService.createDriver(data, currentUserId);

    return ApiResponse.created(res, driver, 'Sürücü başarıyla oluşturuldu');
  });

  // PUT /api/drivers/:id
  updateDriver = asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    
    // Tarih alanlarını Date objesine çevir (eğer varsa)
    const data = { ...req.body };
    
    if (data.licenseExpiry) {
        data.licenseExpiry = new Date(data.licenseExpiry);
        if (isNaN(data.licenseExpiry.getTime())) {
            throw new BadRequestError('Geçersiz ehliyet geçerlilik tarihi.');
        }
    }

    if (data.birthDate) {
        data.birthDate = new Date(data.birthDate);
        if (isNaN(data.birthDate.getTime())) {
            throw new BadRequestError('Geçersiz doğum tarihi.');
        }
    }

    const driver = await driverService.updateDriver(id, data);

    return ApiResponse.success(res, driver, 'Sürücü güncellendi');
  });

  // DELETE /api/drivers/:id
  deleteDriver = asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    await driverService.deleteDriver(id);

    return ApiResponse.success(res, null, 'Sürücü silindi');
  });
}

export default new DriverController();
