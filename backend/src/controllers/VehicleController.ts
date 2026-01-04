import { Request, Response } from 'express';
import vehicleService from '../services/vehicleService';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { VehicleStatus } from '../../generated/prisma';

class VehicleController {
  // GET /api/vehicles
  getAllVehicles = asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as VehicleStatus | undefined;
    const search = req.query.search as string | undefined;
    const isAvailable = req.query.available === 'true';

    const result = await vehicleService.getAllVehicles(page, limit, { status, search, isAvailable });

    // Paginated response formatında döndür
    return ApiResponse.paginated(res, result.vehicles, page, limit, result.total, 'Araçlar listelendi');
  });

  // GET /api/vehicles/:id
  getVehicleById = asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const vehicle = await vehicleService.getVehicleById(id);

    return ApiResponse.success(res, vehicle, 'Araç detayı getirildi');
  });

  // POST /api/vehicles
  createVehicle = asyncHandler(async (req: Request, res: Response) => {
    const vehicle = await vehicleService.createVehicle(req.body);

    return ApiResponse.created(res, vehicle, 'Araç başarıyla oluşturuldu');
  });

  // PUT /api/vehicles/:id
  updateVehicle = asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const vehicle = await vehicleService.updateVehicle(id, req.body);

    return ApiResponse.success(res, vehicle, 'Araç güncellendi');
  });

  // DELETE /api/vehicles/:id
  deleteVehicle = asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    await vehicleService.deleteVehicle(id);

    return ApiResponse.success(res, null, 'Araç silindi');
  });
}

export default new VehicleController();
