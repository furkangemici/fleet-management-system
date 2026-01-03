import prisma from '../config/database';
import { Fine, Prisma } from '../../generated/prisma';

export interface CreateFineData {
  vehicleId: number;
  driverId?: number; // Sürücü o an kimse o
  amount: number;
  date: Date;
  type: string;
  location?: string;
  description?: string;
  isPaid?: boolean;
  dueDate?: Date;
  paidAt?: Date;
  paymentMethod?: string;
  invoiceNo?: string;
}

export interface UpdateFineData {
  vehicleId?: number;
  driverId?: number;
  amount?: number;
  date?: Date;
  type?: string;
  location?: string;
  description?: string;
  isPaid?: boolean;
  dueDate?: Date;
  paidAt?: Date;
  paymentMethod?: string;
  invoiceNo?: string;
}

export interface FineFilter {
  vehicleId?: number;
  driverId?: number;
  isPaid?: boolean;
  search?: string;
  startDate?: Date;
  endDate?: Date;
}

class FineRepository {
  async create(data: CreateFineData): Promise<Fine> {
    return prisma.fine.create({
      data: {
        ...data,
        isPaid: data.isPaid || false,
      },
      include: {
        vehicle: true,
        driver: true
      }
    });
  }

  async findById(id: number): Promise<Fine | null> {
    return prisma.fine.findUnique({
      where: { id },
      include: {
        vehicle: true,
        driver: true,
      },
    });
  }

  async findAll(page = 1, limit = 10, filter?: FineFilter): Promise<{ fines: Fine[]; total: number }> {
    const skip = (page - 1) * limit;
    const where: Prisma.FineWhereInput = {};

    if (filter?.vehicleId) where.vehicleId = filter.vehicleId;
    if (filter?.driverId) where.driverId = filter.driverId;
    if (filter?.isPaid !== undefined) where.isPaid = filter.isPaid;

    // Tarih Filtreleme
    if (filter?.startDate || filter?.endDate) {
      where.date = {};
      if (filter.startDate) where.date.gte = filter.startDate;
      if (filter.endDate) where.date.lte = filter.endDate;
    }

    if (filter?.search) {
      where.OR = [
        { type: { contains: filter.search, mode: 'insensitive' } },
        { location: { contains: filter.search, mode: 'insensitive' } },
        { vehicle: { plate: { contains: filter.search, mode: 'insensitive' } } },
        { driver: { fullName: { contains: filter.search, mode: 'insensitive' } } }
      ];
    }

    const [fines, total] = await Promise.all([
      prisma.fine.findMany({
        skip,
        take: limit,
        where,
        orderBy: { date: 'desc' },
        include: {
          vehicle: true,
          driver: true,
        },
      }),
      prisma.fine.count({ where }),
    ]);

    return { fines, total };
  }

  async update(id: number, data: UpdateFineData): Promise<Fine> {
    const updateData: any = { ...data };
    
    // Eğer ödendi olarak işaretlenirse ve ödeme tarihi yoksa şu anı ata
    if (data.isPaid === true && !data.paidAt) {
        updateData.paidAt = new Date();
    }
    
    // Eğer ödenmedi olarak işaretlenirse
    if (data.isPaid === false) {
        updateData.paidAt = null;
        updateData.paymentMethod = null;
        updateData.invoiceNo = null;
    }

    return prisma.fine.update({
      where: { id },
      data: updateData,
      include: {
        vehicle: true,
        driver: true
      }
    });
  }

  async delete(id: number): Promise<Fine> {
    return prisma.fine.delete({
      where: { id },
    });
  }

  // İstatistikler
  async getStats(filter?: FineFilter) {
    const where: Prisma.FineWhereInput = {};
    
    if (filter?.vehicleId) where.vehicleId = filter.vehicleId;
    if (filter?.driverId) where.driverId = filter.driverId;
    if (filter?.startDate || filter?.endDate) {
      where.date = {};
      if (filter.startDate) where.date.gte = filter.startDate;
      if (filter.endDate) where.date.lte = filter.endDate;
    }

    const [totalCost, paidCost, unpaidCost, totalCount, paidCount, unpaidCount] = await Promise.all([
      // Toplam Tutar
      prisma.fine.aggregate({
        _sum: { amount: true },
        where
      }),
      // Ödenen Tutar
      prisma.fine.aggregate({
        _sum: { amount: true },
        where: { ...where, isPaid: true }
      }),
      // Ödenmemiş Tutar
      prisma.fine.aggregate({
        _sum: { amount: true },
        where: { ...where, isPaid: false }
      }),
      // Toplam Adet
      prisma.fine.count({ where }),
      // Ödenen Adet
      prisma.fine.count({ where: { ...where, isPaid: true } }),
      // Ödenmemiş Adet
      prisma.fine.count({ where: { ...where, isPaid: false } })
    ]);

    return {
      totalCost: totalCost._sum.amount || 0,
      paidCost: paidCost._sum.amount || 0,
      unpaidCost: unpaidCost._sum.amount || 0,
      totalCount,
      paidCount,
      unpaidCount
    };
  }
}

export default new FineRepository();
