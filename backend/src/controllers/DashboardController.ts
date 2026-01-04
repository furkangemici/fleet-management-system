import { Request, Response } from 'express';
import dashboardService from '../services/dashboardService';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';

class DashboardController {
  // GET /api/dashboard
  getStats = asyncHandler(async (req: Request, res: Response) => {
    const data = await dashboardService.getStats();
    return ApiResponse.success(res, data, 'Dashboard verileri getirildi');
  });
}

export default new DashboardController();
