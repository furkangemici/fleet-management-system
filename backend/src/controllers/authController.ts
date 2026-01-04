import { Request, Response } from 'express';
import authService from '../services/authService';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { AuthRequest } from '../middlewares/authMiddleware';

class AuthController {
  // POST /api/auth/register
  register = asyncHandler(async (req: Request, res: Response) => {
    const { email, password, fullName, role, phone } = req.body;

    const result = await authService.register({
      email,
      password,
      fullName,
      role,
      phone,
    });

    return ApiResponse.created(res, result, 'Kayıt başarılı');
  });

  // POST /api/auth/login
  login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    const result = await authService.login({ email, password });

    return ApiResponse.success(res, result, 'Giriş başarılı');
  });

  // GET /api/auth/me
  getCurrentUser = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;

    const user = await authService.getCurrentUser(userId);

    return ApiResponse.success(res, { user }, 'Kullanıcı bilgileri getirildi');
  });

  // PUT /api/auth/change-password
  changePassword = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const { currentPassword, newPassword } = req.body;

    await authService.changePassword(userId, currentPassword, newPassword);

    return ApiResponse.success(res, null, 'Şifre başarıyla değiştirildi');
  });

  // POST /api/auth/forgot-password
  requestPasswordReset = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;

    const result = await authService.requestPasswordReset(email);

    return ApiResponse.success(res, result, result.message);
  });

  // POST /api/auth/reset-password
  resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const { token, newPassword } = req.body;

    const result = await authService.resetPassword(token, newPassword);

    return ApiResponse.success(res, result, result.message);
  });
}

export default new AuthController();
