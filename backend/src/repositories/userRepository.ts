import prisma from '../config/database';
import { User, UserRole, Prisma } from '../../generated/prisma';

export interface CreateUserData {
  email: string;
  password: string;
  fullName: string;
  role?: UserRole;
  phone?: string;
}

export interface UpdateUserData {
  email?: string;
  password?: string;
  fullName?: string;
  role?: UserRole;
  phone?: string;
  avatar?: string;
  isActive?: boolean;
  lastLoginAt?: Date;
  loginAttempts?: number; 
  lockedUntil?: Date | null;  
}

class UserRepository {
  // Kullanıcı oluştur
  async create(data: CreateUserData): Promise<User> {
    return prisma.user.create({
      data: {
        email: data.email,
        password: data.password,
        fullName: data.fullName,
        role: data.role || UserRole.FLEET_MANAGER,
        phone: data.phone,
      },
    });
  }

  // ID ile kullanıcı bul
  async findById(id: number): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  // Email ile kullanıcı bul
  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  // Tüm kullanıcıları getir (pagination ile)
  async findAll(page = 1, limit = 10): Promise<{ users: User[]; total: number }> {
    const skip = (page - 1) * limit;
    
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          phone: true,
          avatar: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
          password: false, // Şifreyi dahil etme
        },
      }) as unknown as User[],
      prisma.user.count(),
    ]);

    return { users, total };
  }

  // Kullanıcı güncelle
  async update(id: number, data: UpdateUserData): Promise<User> {
    return prisma.user.update({
      where: { id },
      data,
    });
  }

  // Son giriş zamanını güncelle
  async updateLastLogin(id: number): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  }

  // Kullanıcı sil (soft delete - isActive: false)
  async softDelete(id: number): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // Kullanıcı sil (hard delete)
  async delete(id: number): Promise<User> {
    return prisma.user.delete({
      where: { id },
    });
  }

  // Email var mı kontrol et
  async emailExists(email: string, excludeId?: number): Promise<boolean> {
    const where: Prisma.UserWhereInput = { email };
    if (excludeId) {
      where.id = { not: excludeId };
    }
    const user = await prisma.user.findFirst({ where });
    return !!user;
  }

  // Şifre sıfırlama token'ı oluştur
  async createPasswordResetToken(userId: number, token: string, expiresAt: Date) {
    return prisma.passwordResetToken.create({
      data: {
        userId,
        token,
        expiresAt,
      },
    });
  }

  // Token ile şifre sıfırlama kaydını bul
  async findPasswordResetToken(token: string) {
    return prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });
  }

  // Token'ı kullanılmış olarak işaretle
  async markTokenAsUsed(token: string) {
    return prisma.passwordResetToken.update({
      where: { token },
      data: { used: true },
    });
  }
}

export default new UserRepository();
