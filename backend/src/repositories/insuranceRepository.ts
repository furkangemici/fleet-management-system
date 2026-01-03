import prisma from '../config/database';
import { Insurance, InsuranceType, Prisma } from '../../generated/prisma';

export interface CreateInsuranceData {
  vehicleId: number;
  type: InsuranceType;
  company: string;
  policyNo: string;
  startDate: Date;
  endDate: Date;
  premium?: number;
  coverage?: number;
  notes?: string;
}

export interface UpdateInsuranceData {
  vehicleId?: number;
  type?: InsuranceType;
  company?: string;
  policyNo?: string;
  startDate?: Date;
  endDate?: Date;
  premium?: number;
  coverage?: number;
  notes?: string;
}

export interface InsuranceFilter {
  vehicleId?: number;
  type?: InsuranceType;
  search?: string;
  isExpiringSoon?: boolean; // Süresi yaklaşanları getir
}

class InsuranceRepository {
  async create(data: CreateInsuranceData): Promise<Insurance> {
    return prisma.insurance.create({
      data,
    });
  }

  async findById(id: number): Promise<Insurance | null> {
    return prisma.insurance.findUnique({
      where: { id },
      include: {
        vehicle: true,
      },
    });
  }

  async findByPolicyNo(policyNo: string): Promise<Insurance | null> {
    return prisma.insurance.findUnique({
      where: { policyNo },
    });
  }

  async findAll(page = 1, limit = 10, filter?: InsuranceFilter): Promise<{ insurances: Insurance[]; total: number }> {
    const skip = (page - 1) * limit;
    const where: Prisma.InsuranceWhereInput = {};

    if (filter?.vehicleId) where.vehicleId = filter.vehicleId;
    if (filter?.type) where.type = filter.type;

    if (filter?.search) {
      where.OR = [
        { company: { contains: filter.search, mode: 'insensitive' } },
        { policyNo: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    if (filter?.isExpiringSoon) {
      // 30 gün içinde bitecekler
      const thirtyDaysLater = new Date();
      thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
      
      where.endDate = {
        gte: new Date(),
        lte: thirtyDaysLater,
      };
    }

    const [insurances, total] = await Promise.all([
      prisma.insurance.findMany({
        skip,
        take: limit,
        where,
        orderBy: { endDate: 'asc' }, // Bitiş tarihi yakın olanlar en üstte
        include: {
          vehicle: true,
        },
      }),
      prisma.insurance.count({ where }),
    ]);

    return { insurances, total };
  }

  async update(id: number, data: UpdateInsuranceData): Promise<Insurance> {
    return prisma.insurance.update({
      where: { id },
      data,
    });
  }

  async delete(id: number): Promise<Insurance> {
    return prisma.insurance.delete({
      where: { id },
    });
  }
}

export default new InsuranceRepository();
