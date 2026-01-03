import prisma from '../config/database';
import { Vehicle, VehicleStatus, FuelType, Prisma } from '../../generated/prisma';

export interface CreateVehicleData {
  plate: string;
  brand: string;
  model: string;
  year: number;
  fuelType: FuelType;
  km?: number;
  color?: string;
  chassisNo?: string;
  engineNo?: string;
  status?: VehicleStatus;
}

export interface UpdateVehicleData {
  plate?: string;
  brand?: string;
  model?: string;
  year?: number;
  fuelType?: FuelType;
  km?: number;
  color?: string;
  chassisNo?: string;
  engineNo?: string;
  status?: VehicleStatus;
}

export interface VehicleFilter {
  status?: VehicleStatus;
  search?: string; // Plaka, marka veya modelde arama
  isAvailable?: boolean; // Sürücüsü olmayan araçlar
}

class VehicleRepository {
  // Araç oluştur
  async create(data: CreateVehicleData): Promise<Vehicle> {
    return prisma.vehicle.create({
      data: {
        ...data,
        status: data.status || VehicleStatus.ACTIVE,
      },
      include: {
        driver: true
      }
    });
  }

  // ID ile bul
  async findById(id: number): Promise<Vehicle | null> {
    return prisma.vehicle.findUnique({
      where: { id },
      include: {
        driver: true,
        maintenances: {
          orderBy: { date: 'desc' },
          take: 5
        }
      }
    });
  }

  // Plaka ile bul
  async findByPlate(plate: string): Promise<Vehicle | null> {
    return prisma.vehicle.findUnique({
      where: { plate }
    });
  }

  // Şasi no ile bul
  async findByChassisNo(chassisNo: string): Promise<Vehicle | null> {
    return prisma.vehicle.findUnique({
      where: { chassisNo }
    });
  }

  // Tüm araçları getir (Filtreleme ve Pagination ile)
  async findAll(page = 1, limit = 10, filter?: VehicleFilter): Promise<{ vehicles: Vehicle[]; total: number }> {
    const skip = (page - 1) * limit;

    const where: Prisma.VehicleWhereInput = {};

    // Status filtresi
    if (filter?.status) {
      where.status = filter.status;
    }

    // Sürücüsü olmayan araçlar filtresi
    if (filter?.isAvailable) {
        where.driver = {
            is: null
        };
    }

    // Arama filtresi (Plaka, Marka, Model)
    if (filter?.search) {
      where.OR = [
        { plate: { contains: filter.search, mode: 'insensitive' } },
        { brand: { contains: filter.search, mode: 'insensitive' } },
        { model: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    const [vehicles, total] = await Promise.all([
      prisma.vehicle.findMany({
        skip,
        take: limit,
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          driver: true, // Listede sürücüyü de gösterelim
        },
      }),
      prisma.vehicle.count({ where }),
    ]);

    return { vehicles, total };
  }

  // Güncelle
  async update(id: number, data: UpdateVehicleData): Promise<Vehicle> {
    return prisma.vehicle.update({
      where: { id },
      data,
    });
  }

  // Sil
  async delete(id: number): Promise<Vehicle> {
    return prisma.vehicle.delete({
      where: { id },
    });
  }

  // KM Güncelle
  async updateKm(id: number, km: number): Promise<Vehicle> {
    return prisma.vehicle.update({
      where: { id },
      data: { km },
    });
  }

  // Konum Güncelle
  async updateLocation(id: number, lat: number, lng: number, speed: number): Promise<Vehicle> {
    return prisma.vehicle.update({
      where: { id },
      data: {
        lastLat: lat,
        lastLng: lng,
        lastSpeed: speed,
        lastGpsUpdate: new Date(),
      },
    });
  }
}

export default new VehicleRepository();
