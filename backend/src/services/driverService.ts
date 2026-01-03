import driverRepository, { CreateDriverData, UpdateDriverData, DriverFilter } from '../repositories/driverRepository';
import { Driver, NotificationType } from '../../generated/prisma';
import notificationService from './notificationService';
import { NotFoundError, ConflictError, BadRequestError } from '../utils/ApiError';
import vehicleRepository from '../repositories/vehicleRepository';

class DriverService {
  // Sürücü ve Araç İlişkisi Kontrolü
  private async checkVehicleAvailability(vehicleId: number, currentDriverId?: number) {
    const vehicle = await vehicleRepository.findById(vehicleId) as any;
    if (!vehicle) {
      throw new NotFoundError('Atanmak istenen araç bulunamadı.');
    }

    // Eğer aracın zaten sürücüsü varsa ve bu kişi biz değilsek hata ver
    if (vehicle.driver && vehicle.driver.id !== currentDriverId) {
      throw new ConflictError(`Bu araç zaten ${vehicle.driver.fullName} adlı sürücüye zimmetli.`);
    }
  }

  // Sürücü oluştur
  async createDriver(data: CreateDriverData, currentUserId?: number): Promise<Driver> {
    // Telefon Formatı Kontrolü (TR Formati: 05xx xxx xx xx)
    if (!data.phone) {
        throw new BadRequestError('Telefon numarası zorunludur.');
    }
    const cleanPhone = data.phone.replace(/\D/g, ''); // Sadece rakamları al
    // Kesinlikle 11 hane ve 05 ile başlamalı
    const phoneRegex = /^05[0-9]{9}$/; 

    if (!phoneRegex.test(cleanPhone)) {
        throw new BadRequestError('Geçersiz telefon numarası. Başında 0 olmalı ve 11 hane olmalıdır. (Örn: 05321234567)');
    }
    // Temizlenmiş ve standart formatı kaydet
    data.phone = cleanPhone;

    // Doğum Tarihi Kontrolü
    if (data.birthDate) {
        const birthYear = new Date(data.birthDate).getFullYear();
        const currentYear = new Date().getFullYear();
        if (birthYear < 1900 || birthYear > currentYear - 18) { // 18 yaş altı sürücü olamaz
             throw new BadRequestError('Geçersiz doğum tarihi. Sürücü 18 yaşından büyük ve 1900 yılından sonra doğmuş olmalıdır.');
        }
    }

    // Email kontrolü
    const existingEmail = await driverRepository.findByEmail(data.email);
    if (existingEmail) {
      throw new ConflictError('Bu email adresi zaten kayıtlı.');
    }

    // TC Kimlik No kontrolü (11 Haneli Rakam - Opsiyonel)
    if ((data as any).identityNumber) {
      const identityRegex = /^\d{11}$/;
      if (!identityRegex.test((data as any).identityNumber)) {
        throw new BadRequestError('Geçersiz TC Kimlik numarası. 11 haneli rakam olmalıdır.');
      }
      // TC Kimlik unique kontrolü (repository'de method eklemek gerekebilir)
      // Şimdilik basit kontrol
    }

    // Ehliyet No kontrolü (6 Haneli Rakam)
    const licenseRegex = /^\d{6}$/;
    if (!licenseRegex.test(data.licenseNumber)) {
        throw new BadRequestError('Geçersiz ehliyet numarası. 6 haneli rakam olmalıdır.');
    }

    const existingLicense = await driverRepository.findByLicense(data.licenseNumber);
    if (existingLicense) {
      throw new ConflictError('Bu ehliyet numarası zaten kayıtlı.');
    }

    // Araç ataması varsa kontrol et
    if (data.vehicleId) {
      await this.checkVehicleAvailability(data.vehicleId);
    }
    
    // licenseType'ı licenseClass'a çevir (frontend'den licenseType geliyor)
    const dbData: any = { ...data };
    if ((data as any).licenseType) {
      dbData.licenseClass = (data as any).licenseType;
      delete dbData.licenseType;
    }

    const driver = await driverRepository.create(dbData);

    await notificationService.notifyManagers({
      title: 'Yeni Sürücü',
      message: `${driver.fullName} aramıza katıldı.`,
      type: NotificationType.INFO,
      link: '/drivers'
    }, currentUserId);

    return driver;
  }

  // Tüm sürücüleri getir
  async getAllDrivers(page: number, limit: number, filter: DriverFilter) {
    return driverRepository.findAll(page, limit, filter);
  }

  // ID ile getir
  async getDriverById(id: number): Promise<Driver> {
    const driver = await driverRepository.findById(id);
    if (!driver) {
      throw new NotFoundError('Sürücü bulunamadı.');
    }
    return driver;
  }

  // Güncelle
  async updateDriver(id: number, data: UpdateDriverData): Promise<Driver> {
    const driver = await driverRepository.findById(id);
    if (!driver) {
      throw new NotFoundError('Sürücü bulunamadı.');
    }

    // Telefon değişiyorsa kontrol
    if (data.phone && data.phone !== driver.phone) {
        const cleanPhone = data.phone.replace(/\D/g, '');
        const phoneRegex = /^05[0-9]{9}$/;
        if (!phoneRegex.test(cleanPhone)) {
             throw new BadRequestError('Geçersiz telefon numarası. 11 haneli olmalı ve 05 ile başlamalıdır. (Örn: 0545 054 73 87)');
        }
        // Formatlanmış halde kaydet: 0545 054 73 87
        data.phone = `${cleanPhone.slice(0, 4)} ${cleanPhone.slice(4, 7)} ${cleanPhone.slice(7, 9)} ${cleanPhone.slice(9, 11)}`;
    }

    // Doğum tarihi kontrolü
    if (data.birthDate) {
        const birthYear = new Date(data.birthDate).getFullYear();
        const currentYear = new Date().getFullYear();
        if (birthYear < 1900 || birthYear > currentYear - 18) {
             throw new BadRequestError('Geçersiz doğum tarihi. Sürücü 18 yaşından büyük ve 1900 yılından sonra doğmuş olmalıdır.');
        }
    }

    // Email değişiyorsa kontrol
    if (data.email && data.email !== driver.email) {
      const existingEmail = await driverRepository.findByEmail(data.email);
      if (existingEmail) {
        throw new ConflictError('Bu email adresi başka bir sürücüde kayıtlı.');
      }
    }

    // Ehliyet değişiyorsa kontrol
    if (data.licenseNumber && data.licenseNumber !== driver.licenseNumber) {
      const licenseRegex = /^\d{6}$/;
      if (!licenseRegex.test(data.licenseNumber)) {
          throw new BadRequestError('Geçersiz ehliyet numarası. 6 haneli rakam olmalıdır.');
      }

      const existingLicense = await driverRepository.findByLicense(data.licenseNumber);
      if (existingLicense) {
        throw new ConflictError('Bu ehliyet numarası başka bir sürücüde kayıtlı.');
      }
    }

    // Araç değişiyorsa kontrol ve loglama
    if (data.vehicleId !== undefined && data.vehicleId !== driver.vehicleId) {
      // Yeni araç atanıyorsa kontrol et
      if (data.vehicleId) {
        await this.checkVehicleAvailability(data.vehicleId, id);
      }
      
      // Eski atamanın bitiş tarihini güncelle (eğer varsa)
      if (driver.vehicleId) {
        await driverRepository.closeAssignmentHistory(driver.vehicleId, id, 'Araç Değişimi');
      }
      
      // Yeni atama kaydı oluştur (eğer yeni araç varsa)
      if (data.vehicleId) {
        await driverRepository.createAssignmentHistory({
          vehicleId: data.vehicleId,
          driverId: id,
          reason: 'Yeni Atama',
          notes: 'Sürücü güncelleme ile araç atandı'
        });
      }
    }

    // licenseType'ı licenseClass'a çevir (frontend'den licenseType geliyor)
    const dbData: any = { ...data };
    if ((data as any).licenseType) {
      dbData.licenseClass = (data as any).licenseType;
      delete dbData.licenseType;
    }

    return driverRepository.update(id, dbData);
  }

  // Sil
  async deleteDriver(id: number): Promise<Driver> {
    const driver = await driverRepository.findById(id);
    if (!driver) {
      throw new NotFoundError('Sürücü bulunamadı.');
    }
    
    // Araç ataması varsa, atama geçmişini kapat
    if (driver.vehicleId) {
      await driverRepository.closeAssignmentHistory(driver.vehicleId, id, 'Sürücü Silindi');
    }
    
    return driverRepository.delete(id);
  }
}

export default new DriverService();
