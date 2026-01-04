import { Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { AuthRequest } from '../middlewares/authMiddleware';
import userRepository from '../repositories/userRepository';
import bcrypt from 'bcrypt';
import config from '../config';
import { BadRequestError } from '../utils/ApiError';

class UserController {
  // GET /api/users/profile - Kullanıcı profilini getir
  getProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;

    const user = await userRepository.findById(userId);
    if (!user) {
      throw new BadRequestError('Kullanıcı bulunamadı');
    }

    // Şifreyi çıkar
    const { password, ...userWithoutPassword } = user;

    return ApiResponse.success(res, { user: userWithoutPassword }, 'Profil bilgileri getirildi');
  });

  // PUT /api/users/profile - Profil bilgilerini güncelle
  updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const { fullName, phone, avatar } = req.body;

    // Telefon formatı kontrolü (eğer telefon güncellenmişse)
    if (phone) {
      const cleanPhone = phone.replace(/\D/g, '');
      const phoneRegex = /^05[0-9]{9}$/;
      
      if (!phoneRegex.test(cleanPhone)) {
        throw new BadRequestError('Geçersiz telefon numarası. 11 haneli olmalı ve 05 ile başlamalıdır. (Örn: 0545 054 73 87)');
      }
      
      // Formatlanmış halde kaydet: 0545 054 73 87
      const formattedPhone = `${cleanPhone.slice(0, 4)} ${cleanPhone.slice(4, 7)} ${cleanPhone.slice(7, 9)} ${cleanPhone.slice(9, 11)}`;
      
      const updatedUser = await userRepository.update(userId, {
        fullName,
        phone: formattedPhone,
        avatar,
      });

      const { password, ...userWithoutPassword } = updatedUser;
      return ApiResponse.success(res, { user: userWithoutPassword }, 'Profil başarıyla güncellendi');
    }

    // Telefon güncellenmemişse
    const updatedUser = await userRepository.update(userId, {
      fullName,
      avatar,
    });

    const { password, ...userWithoutPassword } = updatedUser;
    return ApiResponse.success(res, { user: userWithoutPassword }, 'Profil başarıyla güncellendi');
  });

  // PUT /api/users/change-password - Şifre değiştir (profil sayfasından)
  changePassword = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const { currentPassword, newPassword } = req.body;

    const user = await userRepository.findById(userId);
    if (!user) {
      throw new BadRequestError('Kullanıcı bulunamadı');
    }

    // Mevcut şifre kontrolü
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new BadRequestError('Mevcut şifre hatalı');
    }

    // Güçlü şifre validasyonu
    if (newPassword.length < 8) {
      throw new BadRequestError('Şifre en az 8 karakter olmalıdır');
    }
    if (!/[A-Z]/.test(newPassword)) {
      throw new BadRequestError('Şifre en az 1 büyük harf içermelidir');
    }
    if (!/[a-z]/.test(newPassword)) {
      throw new BadRequestError('Şifre en az 1 küçük harf içermelidir');
    }
    if (!/[0-9]/.test(newPassword)) {
      throw new BadRequestError('Şifre en az 1 rakam içermelidir');
    }

    // Yeni şifreyi hashle ve güncelle
    const hashedPassword = await bcrypt.hash(newPassword, config.bcryptRounds);
    await userRepository.update(userId, { password: hashedPassword });

    return ApiResponse.success(res, null, 'Şifre başarıyla değiştirildi');
  });
}

export default new UserController();
