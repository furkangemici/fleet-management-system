import maintenanceRepository, { CreateMaintenanceData, UpdateMaintenanceData, MaintenanceFilter } from '../repositories/maintenanceRepository';
import vehicleRepository from '../repositories/vehicleRepository';
import { Maintenance, VehicleStatus } from '../../generated/prisma';
import { NotFoundError, BadRequestError } from '../utils/ApiError';

class MaintenanceService {
  async createMaintenance(data: CreateMaintenanceData): Promise<Maintenance> {
    const vehicle = await vehicleRepository.findById(data.vehicleId);
    if (!vehicle) {
      throw new NotFoundError('Araç bulunamadı.');
    }

    // Eğer bakım başladıysa aracın durumunu MAINTENANCE yapabiliriz (Opsiyonel business logic)
    // Şimdilik sadece kaydı oluşturuyoruz.

    return maintenanceRepository.create(data);
  }

  async getAllMaintenances(page: number, limit: number, filter: MaintenanceFilter) {
    return maintenanceRepository.findAll(page, limit, filter);
  }

  async getMaintenanceById(id: number): Promise<Maintenance> {
    const maintenance = await maintenanceRepository.findById(id);
    if (!maintenance) {
      throw new NotFoundError('Bakım kaydı bulunamadı.');
    }
    return maintenance;
  }

  async updateMaintenance(id: number, data: UpdateMaintenanceData): Promise<Maintenance> {
    const maintenance = await maintenanceRepository.findById(id);
    if (!maintenance) {
      throw new NotFoundError('Bakım kaydı bulunamadı.');
    }

    if (data.vehicleId && data.vehicleId !== maintenance.vehicleId) {
       const vehicle = await vehicleRepository.findById(data.vehicleId);
       if (!vehicle) {
         throw new NotFoundError('Yeni atanan araç bulunamadı.');
       }
    }

    return maintenanceRepository.update(id, data);
  }

  async deleteMaintenance(id: number): Promise<Maintenance> {
    const maintenance = await maintenanceRepository.findById(id);
    if (!maintenance) {
      throw new NotFoundError('Bakım kaydı bulunamadı.');
    }
    return maintenanceRepository.delete(id);
  }

  async getStats(filter: MaintenanceFilter) {
    return maintenanceRepository.getStats(filter);
  }
}

export default new MaintenanceService();
