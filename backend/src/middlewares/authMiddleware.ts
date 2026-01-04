import { Request, Response, NextFunction } from 'express';
import authService, { JwtPayload } from '../services/authService';
import { UnauthorizedError, ForbiddenError } from '../utils/ApiError';
import { UserRole } from '../../generated/prisma';

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

// JWT Token doğrulama middleware
export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Token bulunamadı');
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      throw new UnauthorizedError('Token bulunamadı');
    }

    const decoded = authService.verifyToken(token);
    req.user = decoded;

    next();
  } catch (error) {
    next(error);
  }
};

// Rol bazlı yetkilendirme middleware
export const authorize = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError('Önce giriş yapmalısınız'));
    }

    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError('Bu işlem için yetkiniz yok'));
    }

    next();
  };
};

// Sadece Admin erişimi
export const adminOnly = authorize(UserRole.ADMIN);

// Admin ve Filo Yöneticisi erişimi
export const managerAccess = authorize(UserRole.ADMIN, UserRole.FLEET_MANAGER);

// Sürücü erişimi (ileride kullanılacak - sürücüler kendi verilerine erişebilir)
export const driverAccess = authorize(UserRole.ADMIN, UserRole.FLEET_MANAGER, UserRole.DRIVER);

export default authMiddleware;
