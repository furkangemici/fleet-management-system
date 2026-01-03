import fineRepository, { CreateFineData, UpdateFineData, FineFilter } from '../repositories/fineRepository';
import vehicleRepository from '../repositories/vehicleRepository';
import driverRepository from '../repositories/driverRepository';
import { Fine, NotificationType } from '../../generated/prisma';
import notificationService from './notificationService';
import { NotFoundError } from '../utils/ApiError';

class FineService {
  async createFine(data: CreateFineData): Promise<Fine> {
    // Araç kontrolü
    const vehicle = await vehicleRepository.findById(data.vehicleId);
    if (!vehicle) {
      throw new NotFoundError('Araç bulunamadı.');
    }

    // Sürücü kontrolü (varsa)
    if (data.driverId) {
      const driver = await driverRepository.findById(data.driverId);
      if (!driver) {
        throw new NotFoundError('Sürücü bulunamadı.');
      }
    }

    const fine = await fineRepository.create(data);

    if (vehicle) {
      await notificationService.notifyManagers({
        title: 'Yeni Trafik Cezası',
        message: `${vehicle.plate} plakalı araca ${data.amount} TL tutarında ${data.type} cezası girildi.`,
        type: NotificationType.DANGER,
        link: '/fines'
      });
    }

    return fine;
  }

  async getAllFines(page: number, limit: number, filter: FineFilter) {
    return fineRepository.findAll(page, limit, filter);
  }

  async getFineById(id: number): Promise<Fine> {
    const fine = await fineRepository.findById(id);
    if (!fine) {
      throw new NotFoundError('Ceza kaydı bulunamadı.');
    }
    return fine;
  }

  async updateFine(id: number, data: UpdateFineData): Promise<Fine> {
    const fine = await fineRepository.findById(id);
    if (!fine) {
      throw new NotFoundError('Ceza kaydı bulunamadı.');
    }

    return fineRepository.update(id, data);
  }

  async deleteFine(id: number): Promise<Fine> {
    const fine = await fineRepository.findById(id);
    if (!fine) {
      throw new NotFoundError('Ceza kaydı bulunamadı.');
    }
    return fineRepository.delete(id);
  }

  async getStats(filter: FineFilter) {
    return fineRepository.getStats(filter);
  }
}

export default new FineService();
