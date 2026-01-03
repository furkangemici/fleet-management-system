import insuranceRepository, { CreateInsuranceData, UpdateInsuranceData, InsuranceFilter } from '../repositories/insuranceRepository';
import vehicleRepository from '../repositories/vehicleRepository';
import { Insurance, NotificationType } from '../../generated/prisma';
import notificationService from './notificationService';
import { NotFoundError, ConflictError } from '../utils/ApiError';

class InsuranceService {
  async createInsurance(data: CreateInsuranceData): Promise<Insurance> {
    // Araç kontrolü
    const vehicle = await vehicleRepository.findById(data.vehicleId);
    if (!vehicle) {
      throw new NotFoundError('Araç bulunamadı.');
    }

    // Poliçe no kontrolü
    const existingPolicy = await insuranceRepository.findByPolicyNo(data.policyNo);
    if (existingPolicy) {
      throw new ConflictError('Bu poliçe numarası zaten kayıtlı.');
    }

    const insurance = await insuranceRepository.create(data);

    if (vehicle) {
      await notificationService.notifyManagers({
        title: 'Yeni Sigorta Eklendi',
        message: `${vehicle.plate} plakalı araca ${data.company} firmasından sigorta eklendi.`,
        type: NotificationType.INFO,
        link: '/insurances'
      });
    }

    return insurance;
  }

  async getAllInsurances(page: number, limit: number, filter: InsuranceFilter) {
    return insuranceRepository.findAll(page, limit, filter);
  }

  async getInsuranceById(id: number): Promise<Insurance> {
    const insurance = await insuranceRepository.findById(id);
    if (!insurance) {
      throw new NotFoundError('Sigorta kaydı bulunamadı.');
    }
    return insurance;
  }

  async updateInsurance(id: number, data: UpdateInsuranceData): Promise<Insurance> {
    const insurance = await insuranceRepository.findById(id);
    if (!insurance) {
      throw new NotFoundError('Sigorta kaydı bulunamadı.');
    }

    // Poliçe no değişiyorsa kontrol
    if (data.policyNo && data.policyNo !== insurance.policyNo) {
      const existingPolicy = await insuranceRepository.findByPolicyNo(data.policyNo);
      if (existingPolicy) {
        throw new ConflictError('Bu poliçe numarası zaten kayıtlı.');
      }
    }

    return insuranceRepository.update(id, data);
  }

  async deleteInsurance(id: number): Promise<Insurance> {
    const insurance = await insuranceRepository.findById(id);
    if (!insurance) {
      throw new NotFoundError('Sigorta kaydı bulunamadı.');
    }
    return insuranceRepository.delete(id);
  }
}

export default new InsuranceService();
