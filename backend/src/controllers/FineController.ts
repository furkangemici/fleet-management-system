import { Request, Response } from 'express';
import fineService from '../services/fineService';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';

class FineController {
  getAllFines = asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    // Boolean dönüşümü
    let isPaid: boolean | undefined = undefined;
    if (req.query.isPaid === 'true') isPaid = true;
    if (req.query.isPaid === 'false') isPaid = false;

    const search = req.query.search as string | undefined;
    const vehicleId = req.query.vehicleId ? parseInt(req.query.vehicleId as string) : undefined;
    const driverId = req.query.driverId ? parseInt(req.query.driverId as string) : undefined;
    
    // Tarih Aralığı
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

    const result = await fineService.getAllFines(page, limit, { 
      isPaid, 
      search, 
      vehicleId, 
      driverId,
      startDate,
      endDate
    });

    // Pagination uyumlu dönüş
    return ApiResponse.paginated(res, result.fines, result.total, page, limit, 'Ceza kayıtları listelendi');
  });

  getStats = asyncHandler(async (req: Request, res: Response) => {
    // Filtreleri hazırla
    let isPaid: boolean | undefined = undefined;
    if (req.query.isPaid === 'true') isPaid = true;
    if (req.query.isPaid === 'false') isPaid = false;
    
    const search = req.query.search as string | undefined;
    const vehicleId = req.query.vehicleId ? parseInt(req.query.vehicleId as string) : undefined;
    const driverId = req.query.driverId ? parseInt(req.query.driverId as string) : undefined;
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

    const stats = await fineService.getStats({
      isPaid,
      search,
      vehicleId,
      driverId,
      startDate,
      endDate
    });

    return ApiResponse.success(res, stats, 'İstatistikler getirildi');
  });

  getFineById = asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const fine = await fineService.getFineById(id);

    return ApiResponse.success(res, fine, 'Ceza detayı getirildi');
  });

  createFine = asyncHandler(async (req: Request, res: Response) => {
    const data = {
      ...req.body,
      date: new Date(req.body.date),
      dueDate: req.body.dueDate ? new Date(req.body.dueDate) : undefined,
      paidAt: req.body.paidAt ? new Date(req.body.paidAt) : undefined,
    };

    const fine = await fineService.createFine(data);

    return ApiResponse.created(res, fine, 'Ceza kaydı oluşturuldu');
  });

  updateFine = asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    
    const data = { ...req.body };
    if (data.date) data.date = new Date(data.date);
    if (data.dueDate) data.dueDate = new Date(data.dueDate);
    if (data.paidAt) data.paidAt = new Date(data.paidAt);

    const fine = await fineService.updateFine(id, data);

    return ApiResponse.success(res, fine, 'Ceza kaydı güncellendi');
  });

  deleteFine = asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    await fineService.deleteFine(id);

    return ApiResponse.success(res, null, 'Ceza kaydı silindi');
  });
}

export default new FineController();
