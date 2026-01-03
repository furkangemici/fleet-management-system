import vehicleRepository, { CreateVehicleData, UpdateVehicleData, VehicleFilter } from '../repositories/vehicleRepository';
import driverRepository from '../repositories/driverRepository';
import { Vehicle } from '../../generated/prisma';
import { NotFoundError, ConflictError, BadRequestError } from '../utils/ApiError';

class VehicleService {
  // Araç oluştur
  async createVehicle(data: CreateVehicleData & { driverId?: number }): Promise<Vehicle> {
    // driverId'yi ayır (Vehicle tablosunda yok)
    const { driverId, ...vehicleData } = data;
    // Plaka Validasyonu (TR Plaka Formatı: 34 ABC 123)
    const plateRegex = /^(0[1-9]|[1-7][0-9]|8[01])\s[A-Z]{1,3}\s\d{2,4}$/;
    if (!plateRegex.test(data.plate)) {
      throw new BadRequestError('Geçersiz plaka formatı. Örnek: 34 ABC 123');
    }

    // Plaka kontrolü (Unique)
    const existingPlate = await vehicleRepository.findByPlate(data.plate);
    if (existingPlate) {
      throw new ConflictError(`'${data.plate}' plakalı araç zaten mevcut.`);
    }

    // Şasi no kontrolü (eğer girildiyse)
    if (data.chassisNo) {
      // Şasi Validasyonu (17 Karakter, I, O, Q yasak)
      const chassisRegex = /^[A-HJ-NPR-Z0-9]{17}$/;
      if (!chassisRegex.test(data.chassisNo)) {
        throw new BadRequestError('Geçersiz şasi numarası. 17 karakter olmalı ve I, O, Q harflerini içermemelidir.');
      }

      const existingChassis = await vehicleRepository.findByChassisNo(data.chassisNo);
      if (existingChassis) {
        throw new ConflictError(`'${data.chassisNo}' şasi numaralı araç zaten mevcut.`);
      }
    }

    const vehicle = await vehicleRepository.create(vehicleData);

    // Eğer sürücü seçildiyse ata
    if (driverId) {
      await driverRepository.update(driverId, { vehicleId: vehicle.id });
    }

    return vehicle;
  }

  // Tüm araçları getir
  async getAllVehicles(page: number, limit: number, filter: VehicleFilter) {
    return vehicleRepository.findAll(page, limit, filter);
  }

  // ID ile araç getir
  async getVehicleById(id: number): Promise<Vehicle> {
    const vehicle = await vehicleRepository.findById(id);
    if (!vehicle) {
      throw new NotFoundError('Araç bulunamadı.');
    }
    return vehicle;
  }

  // Araç güncelle
  async updateVehicle(id: number, data: UpdateVehicleData & { driverId?: number | null }): Promise<Vehicle> {
    const { driverId, ...vehicleData } = data;
    
    const vehicle: any = await vehicleRepository.findById(id);
    if (!vehicle) {
      throw new NotFoundError('Araç bulunamadı.');
    }

    // Plaka değişiyorsa, yeni plaka kullanımda mı ve formatı uygun mu kontrol et
    if (data.plate && data.plate !== vehicle.plate) {
      // Validasyon
      const plateRegex = /^(0[1-9]|[1-7][0-9]|8[01])\s[A-Z]{1,3}\s\d{2,4}$/;
      if (!plateRegex.test(data.plate)) {
        throw new BadRequestError('Geçersiz plaka formatı. Örnek: 34 ABC 123');
      }
      
      const existingPlate = await vehicleRepository.findByPlate(data.plate);
      if (existingPlate) {
        throw new ConflictError(`'${data.plate}' plakalı araç zaten mevcut.`);
      }
    }

    // Şasi değişiyorsa kontrol et
    if (data.chassisNo && data.chassisNo !== vehicle.chassisNo) {
      // Şasi Validasyonu
      const chassisRegex = /^[A-HJ-NPR-Z0-9]{17}$/;
      if (!chassisRegex.test(data.chassisNo)) {
        throw new BadRequestError('Geçersiz şasi numarası. 17 karakter olmalı ve I, O, Q harflerini içermemelidir.');
      }

      const existingChassis = await vehicleRepository.findByChassisNo(data.chassisNo);
      if (existingChassis) {
        throw new ConflictError(`'${data.chassisNo}' şasi numaralı araç zaten mevcut.`);
      }
    }

    const updatedVehicle = await vehicleRepository.update(id, vehicleData);

    // Sürücü ataması değiştiyse
    if (driverId !== undefined) {
       // Eğer null ise mevcut sürücüyü çıkar
       if (driverId === null) {
          if (vehicle.driver) {
             await driverRepository.update(vehicle.driver.id, { vehicleId: null });
          }
       } 
       // Yeni sürücü ata
       else {
          // Önce eski sürücüyü boşa çıkar (Opsiyonel: zaten unique constraint halledebilir ama temiz olsun)
          if (vehicle.driver && vehicle.driver.id !== driverId) {
             await driverRepository.update(vehicle.driver.id, { vehicleId: null });
          }
           await driverRepository.update(driverId, { vehicleId: updatedVehicle.id });
       }
    }

    return updatedVehicle;
  }

  // Araç sil
  async deleteVehicle(id: number): Promise<Vehicle> {
    const vehicle = await vehicleRepository.findById(id);
    if (!vehicle) {
      throw new NotFoundError('Araç bulunamadı.');
    }

    return vehicleRepository.delete(id);
  }
}

export default new VehicleService();
