import { Request, Response } from 'express';
import maintenanceService from '../services/maintenanceService';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { MaintenanceStatus, MaintenanceType } from '../../generated/prisma';

class MaintenanceController {
  getAllMaintenances = asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as MaintenanceStatus | undefined;
    const type = req.query.type as MaintenanceType | undefined;
    const search = req.query.search as string | undefined;
    const vehicleId = req.query.vehicleId ? parseInt(req.query.vehicleId as string) : undefined;
    const driverId = req.query.driverId ? parseInt(req.query.driverId as string) : undefined;
    
    // Ödeme Durumu
    let isPaid: boolean | undefined = undefined;
    if (req.query.isPaid === 'true') isPaid = true;
    if (req.query.isPaid === 'false') isPaid = false;

    // Tarih Aralığı
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

    const result = await maintenanceService.getAllMaintenances(page, limit, { 
      status, 
      type, 
      search, 
      vehicleId, 
      driverId, 
      isPaid,
      startDate,
      endDate
    });

    // Paginated response formatında döndür
    return ApiResponse.paginated(res, result.maintenances, result.total, page, limit, 'Bakım kayıtları listelendi');
  });

  getStats = asyncHandler(async (req: Request, res: Response) => {
    const status = req.query.status as MaintenanceStatus | undefined;
    const type = req.query.type as MaintenanceType | undefined;
    const search = req.query.search as string | undefined;
    const vehicleId = req.query.vehicleId ? parseInt(req.query.vehicleId as string) : undefined;
    const driverId = req.query.driverId ? parseInt(req.query.driverId as string) : undefined;
    
    let isPaid: boolean | undefined = undefined;
    if (req.query.isPaid === 'true') isPaid = true;
    if (req.query.isPaid === 'false') isPaid = false;

    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

    const stats = await maintenanceService.getStats({
      status,
      type,
      search,
      vehicleId,
      driverId,
      isPaid,
      startDate,
      endDate
    });

    return ApiResponse.success(res, stats, 'İstatistikler getirildi');
  });

  getMaintenanceById = asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const maintenance = await maintenanceService.getMaintenanceById(id);

    return ApiResponse.success(res, maintenance, 'Bakım detayı getirildi');
  });

  createMaintenance = asyncHandler(async (req: Request, res: Response) => {
    // Tarih dönüşümleri
    const data = {
      ...req.body,
      date: new Date(req.body.date),
      nextDate: req.body.nextDate ? new Date(req.body.nextDate) : undefined,
    };

    const maintenance = await maintenanceService.createMaintenance(data);

    return ApiResponse.created(res, maintenance, 'Bakım kaydı oluşturuldu');
  });

  updateMaintenance = asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    
    // Tarih dönüşümleri
    const data = { ...req.body };
    if (data.date) data.date = new Date(data.date);
    if (data.nextDate) data.nextDate = new Date(data.nextDate);

    const maintenance = await maintenanceService.updateMaintenance(id, data);

    return ApiResponse.success(res, maintenance, 'Bakım kaydı güncellendi');
  });

  deleteMaintenance = asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    await maintenanceService.deleteMaintenance(id);

    return ApiResponse.success(res, null, 'Bakım kaydı silindi');
  });
}

export default new MaintenanceController();
