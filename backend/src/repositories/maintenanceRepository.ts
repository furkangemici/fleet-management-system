import prisma from '../config/database';
import { Maintenance, MaintenanceType, MaintenanceStatus, Prisma } from '../../generated/prisma';

export interface CreateMaintenanceData {
  vehicleId: number;
  type: MaintenanceType;
  description?: string;
  date: Date;
  cost?: number;
  service: string;
  notes?: string;
  status?: MaintenanceStatus;
  nextKm?: number;
  nextDate?: Date;
}

export interface UpdateMaintenanceData {
  vehicleId?: number;
  type?: MaintenanceType;
  description?: string;
  date?: Date;
  cost?: number;
  service?: string;
  notes?: string;
  status?: MaintenanceStatus;
  nextKm?: number;
  nextDate?: Date;
}

export interface MaintenanceFilter {
  status?: MaintenanceStatus;
  vehicleId?: number;
  driverId?: number;
  type?: MaintenanceType;
  search?: string;
  startDate?: Date;
  endDate?: Date;
  isPaid?: boolean;
}

class MaintenanceRepository {
  async create(data: CreateMaintenanceData): Promise<Maintenance> {
    return prisma.maintenance.create({
      data: {
        ...data,
        status: data.status || MaintenanceStatus.PLANNED,
        cost: data.cost || 0,
      },
      include: {
        vehicle: true,
        driver: true
      }
    });
  }

  async findById(id: number): Promise<Maintenance | null> {
    return prisma.maintenance.findUnique({
      where: { id },
      include: {
        vehicle: true,
        driver: true,
      },
    });
  }

  async findAll(page = 1, limit = 10, filter?: MaintenanceFilter): Promise<{ maintenances: Maintenance[]; total: number }> {
    const skip = (page - 1) * limit;
    const where: Prisma.MaintenanceWhereInput = {};

    if (filter?.status) where.status = filter.status;
    if (filter?.vehicleId) where.vehicleId = filter.vehicleId;
    if (filter?.driverId) where.driverId = filter.driverId;
    if (filter?.type) where.type = filter.type;
    if (filter?.isPaid !== undefined) where.isPaid = filter.isPaid;
    
    // Tarih Filtreleme
    if (filter?.startDate || filter?.endDate) {
      where.date = {};
      if (filter.startDate) where.date.gte = filter.startDate;
      if (filter.endDate) where.date.lte = filter.endDate;
    }

    if (filter?.search) {
      where.OR = [
        { description: { contains: filter.search, mode: 'insensitive' } },
        { service: { contains: filter.search, mode: 'insensitive' } },
        { vehicle: { plate: { contains: filter.search, mode: 'insensitive' } } },
        { driver: { fullName: { contains: filter.search, mode: 'insensitive' } } }
      ];
    }

    const [maintenances, total] = await Promise.all([
      prisma.maintenance.findMany({
        skip,
        take: limit,
        where,
        orderBy: { date: 'desc' },
        include: {
          vehicle: true,
          driver: true,
        },
      }),
      prisma.maintenance.count({ where }),
    ]);

    return { maintenances, total };
  }

  // İstatistikler
  async getStats(filter?: MaintenanceFilter) {
    const where: Prisma.MaintenanceWhereInput = {};
    
    if (filter?.status) where.status = filter.status;
    if (filter?.vehicleId) where.vehicleId = filter.vehicleId;
    if (filter?.driverId) where.driverId = filter.driverId;
    if (filter?.type) where.type = filter.type;
    if (filter?.isPaid !== undefined) where.isPaid = filter.isPaid;

    if (filter?.startDate || filter?.endDate) {
      where.date = {};
      if (filter.startDate) where.date.gte = filter.startDate;
      if (filter.endDate) where.date.lte = filter.endDate;
    }

    const [totalCost, paidCost, unpaidCost, totalCount, paidCount, unpaidCount] = await Promise.all([
      // Toplam Tutar
      prisma.maintenance.aggregate({
        _sum: { cost: true },
        where
      }),
      // Ödenen Tutar
      prisma.maintenance.aggregate({
        _sum: { cost: true },
        where: { ...where, isPaid: true }
      }),
      // Ödenmemiş Tutar
      prisma.maintenance.aggregate({
        _sum: { cost: true },
        where: { ...where, isPaid: false }
      }),
      // Toplam Adet
      prisma.maintenance.count({ where }),
      // Ödenen Adet
      prisma.maintenance.count({ where: { ...where, isPaid: true } }),
      // Ödenmemiş Adet
      prisma.maintenance.count({ where: { ...where, isPaid: false } })
    ]);

    return {
      totalCost: totalCost._sum.cost || 0,
      paidCost: paidCost._sum.cost || 0,
      unpaidCost: unpaidCost._sum.cost || 0,
      totalCount,
      paidCount,
      unpaidCount
    };
  }

  async update(id: number, data: UpdateMaintenanceData): Promise<Maintenance> {
    return prisma.maintenance.update({
      where: { id },
      data,
    });
  }

  async delete(id: number): Promise<Maintenance> {
    return prisma.maintenance.delete({
      where: { id },
    });
  }

  // Yaklaşan bakımları getir (Dashboard için)
  async findUpcoming(limit = 5): Promise<Maintenance[]> {
    return prisma.maintenance.findMany({
      where: {
        status: MaintenanceStatus.PLANNED,
        date: { gte: new Date() }, // Gelecek tarihli
      },
      orderBy: { date: 'asc' }, // En yakın tarihli en üstte
      take: limit,
      include: { vehicle: true },
    });
  }
}

export default new MaintenanceRepository();
