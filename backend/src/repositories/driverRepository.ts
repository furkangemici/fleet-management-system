import prisma from '../config/database';
import { Driver, DriverStatus, Prisma } from '../../generated/prisma';

export interface CreateDriverData {
  fullName: string;
  phone: string;
  email: string;
  licenseNumber: string;
  licenseExpiry: Date;
  birthDate?: Date;
  address?: string;
  avatar?: string;
  status?: DriverStatus;
  vehicleId?: number;
}

export interface UpdateDriverData {
  fullName?: string;
  phone?: string;
  email?: string;
  licenseNumber?: string;
  licenseExpiry?: Date;
  birthDate?: Date;
  address?: string;
  avatar?: string;
  status?: DriverStatus;
  vehicleId?: number | null; // null gönderilirse araçtan indirilir
}

export interface DriverFilter {
  status?: DriverStatus;
  search?: string;
  vehicleId?: number; // Belirli bir araca atanmış şoförü bulmak için
  isAvailable?: boolean; // Aracı olmayan boşta şoförler
}

class DriverRepository {
  // Sürücü oluştur
  async create(data: CreateDriverData): Promise<Driver> {
    return prisma.driver.create({
      data: {
        ...data,
        status: data.status || DriverStatus.ACTIVE,
      },
      include: {
        vehicle: true, // Atanan aracı da dön
      },
    });
  }

  // ID ile bul
  async findById(id: number): Promise<Driver | null> {
    return prisma.driver.findUnique({
      where: { id },
      include: {
        vehicle: true,
        fines: true,
      },
    });
  }

  // Email ile bul
  async findByEmail(email: string): Promise<Driver | null> {
    return prisma.driver.findUnique({
      where: { email },
    });
  }

  // Ehliyet No ile bul
  async findByLicense(licenseNumber: string): Promise<Driver | null> {
    return prisma.driver.findUnique({
      where: { licenseNumber },
    });
  }

  // Tüm sürücüleri getir
  async findAll(page = 1, limit = 10, filter?: DriverFilter): Promise<{ drivers: Driver[]; total: number }> {
    const skip = (page - 1) * limit;

    const where: Prisma.DriverWhereInput = {};

    if (filter?.status) {
      where.status = filter.status;
    }

    if (filter?.vehicleId) {
      where.vehicleId = filter.vehicleId;
    }

    if (filter?.isAvailable) {
      where.vehicleId = null;
    }

    if (filter?.search) {
      where.OR = [
        { fullName: { contains: filter.search, mode: 'insensitive' } },
        { phone: { contains: filter.search, mode: 'insensitive' } },
        { email: { contains: filter.search, mode: 'insensitive' } },
        { licenseNumber: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    const [drivers, total] = await Promise.all([
      prisma.driver.findMany({
        skip,
        take: limit,
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          vehicle: true,
        },
      }),
      prisma.driver.count({ where }),
    ]);

    return { drivers, total };
  }

  // Güncelle
  async update(id: number, data: UpdateDriverData): Promise<Driver> {
    return prisma.driver.update({
      where: { id },
      data,
      include: {
        vehicle: true,
      },
    });
  }

  // Sil
  async delete(id: number): Promise<Driver> {
    return prisma.driver.delete({
      where: { id },
    });
  }

  // Ehliyet süresi dolanları getir (Raporlama için)
  async findExpiringLicenses(dateThreshold: Date): Promise<Driver[]> {
    return prisma.driver.findMany({
      where: {
        licenseExpiry: {
          lte: dateThreshold, // Less than or equal
        },
        status: DriverStatus.ACTIVE,
      },
    });
  }

  // Atama geçmişi oluştur
  async createAssignmentHistory(data: {
    vehicleId: number;
    driverId: number;
    reason?: string;
    notes?: string;
  }) {
    return prisma.vehicleAssignmentHistory.create({
      data: {
        vehicleId: data.vehicleId,
        driverId: data.driverId,
        reason: data.reason,
        notes: data.notes,
        assignedAt: new Date(),
      },
    });
  }

  // Atama geçmişini kapat (unassignedAt güncelle)
  async closeAssignmentHistory(vehicleId: number, driverId: number, reason?: string) {
    // En son açık atamayı bul ve kapat
    const openAssignment = await prisma.vehicleAssignmentHistory.findFirst({
      where: {
        vehicleId,
        driverId,
        unassignedAt: null, // Henüz kapatılmamış
      },
      orderBy: {
        assignedAt: 'desc',
      },
    });

    if (openAssignment) {
      return prisma.vehicleAssignmentHistory.update({
        where: { id: openAssignment.id },
        data: {
          unassignedAt: new Date(),
          reason: reason || openAssignment.reason,
        },
      });
    }
  }

  // Bir aracın atama geçmişini getir
  async getVehicleAssignmentHistory(vehicleId: number) {
    return prisma.vehicleAssignmentHistory.findMany({
      where: { vehicleId },
      include: {
        driver: true,
      },
      orderBy: {
        assignedAt: 'desc',
      },
    });
  }

  // Bir sürücünün atama geçmişini getir
  async getDriverAssignmentHistory(driverId: number) {
    return prisma.vehicleAssignmentHistory.findMany({
      where: { driverId },
      include: {
        vehicle: true,
      },
      orderBy: {
        assignedAt: 'desc',
      },
    });
  }
}

export default new DriverRepository();
