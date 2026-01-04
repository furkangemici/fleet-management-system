import { Request, Response } from 'express';
import insuranceService from '../services/insuranceService';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { InsuranceType } from '../../generated/prisma';

class InsuranceController {
  getAllInsurances = asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    // Boolean filtre
    const isExpiringSoon = req.query.isExpiringSoon === 'true';

    const type = req.query.type as InsuranceType | undefined;
    const search = req.query.search as string | undefined;
    const vehicleId = req.query.vehicleId ? parseInt(req.query.vehicleId as string) : undefined;

    const result = await insuranceService.getAllInsurances(page, limit, { type, search, vehicleId, isExpiringSoon });

    return ApiResponse.success(res, result, 'Sigorta kayıtları listelendi');
  });

  getInsuranceById = asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const insurance = await insuranceService.getInsuranceById(id);

    return ApiResponse.success(res, insurance, 'Sigorta detayı getirildi');
  });

  createInsurance = asyncHandler(async (req: Request, res: Response) => {
    const data = {
      ...req.body,
      startDate: new Date(req.body.startDate),
      endDate: new Date(req.body.endDate),
    };

    const insurance = await insuranceService.createInsurance(data);

    return ApiResponse.created(res, insurance, 'Sigorta poliçesi oluşturuldu');
  });

  updateInsurance = asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    
    const data = { ...req.body };
    if (data.startDate) data.startDate = new Date(data.startDate);
    if (data.endDate) data.endDate = new Date(data.endDate);

    const insurance = await insuranceService.updateInsurance(id, data);

    return ApiResponse.success(res, insurance, 'Sigorta poliçesi güncellendi');
  });

  deleteInsurance = asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    await insuranceService.deleteInsurance(id);

    return ApiResponse.success(res, null, 'Sigorta poliçesi silindi');
  });
}

export default new InsuranceController();
