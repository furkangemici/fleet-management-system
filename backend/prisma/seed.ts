import { PrismaClient, UserRole, VehicleStatus, FuelType, DriverStatus, MaintenanceType, MaintenanceStatus, InsuranceType, NotificationType } from '../generated/prisma';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seed islemi basliyor...\n');

  // ==================== KULLANICILAR ====================
  console.log('Kullanicilar olusturuluyor...');
  
  // Guclu sifre: En az 8 karakter, 1 buyuk harf, 1 kucuk harf, 1 rakam
  const hashedPassword = await bcrypt.hash('Reeder2026!', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@reeder.com.tr' },
    update: {},
    create: {
      email: 'admin@reeder.com.tr',
      password: hashedPassword,
      fullName: 'Sistem Yoneticisi',
      role: UserRole.ADMIN,
      phone: '0212 555 00 01',
    },
  });

  const filoYoneticisi = await prisma.user.upsert({
    where: { email: 'ahmet.yilmaz@reeder.com.tr' },
    update: {},
    create: {
      email: 'ahmet.yilmaz@reeder.com.tr',
      password: hashedPassword,
      fullName: 'Ahmet Yilmaz',
      role: UserRole.FLEET_MANAGER,
      phone: '0532 555 00 02',
    },
  });

  const viewer = await prisma.user.upsert({
    where: { email: 'viewer@reeder.com.tr' },
    update: {},
    create: {
      email: 'viewer@reeder.com.tr',
      password: hashedPassword,
      fullName: 'Izleyici Kullanici',
      role: UserRole.VIEWER,
      phone: '0533 555 00 03',
    },
  });

  console.log(`   - ${admin.fullName} (Admin)`);
  console.log(`   - ${filoYoneticisi.fullName} (Filo Yoneticisi)`);
  console.log(`   - ${viewer.fullName} (Goruntuleyici)`);

  // ==================== ARACLAR ====================
  console.log('\nAraclar olusturuluyor...');

  const vehicles = await Promise.all([
    prisma.vehicle.upsert({
      where: { plate: '34 ABC 123' },
      update: {},
      create: {
        plate: '34 ABC 123',
        brand: 'Ford',
        model: 'Transit',
        year: 2022,
        fuelType: FuelType.DIESEL,
        km: 45230,
        color: 'Beyaz',
        chassisNo: 'WF0XXXGCDX1234567',
        status: VehicleStatus.ACTIVE,
        // Samsun - Atakum
        lastLat: 41.3200,
        lastLng: 36.2800,
        lastSpeed: 45,
        lastGpsUpdate: new Date(),
      },
    }),
    prisma.vehicle.upsert({
      where: { plate: '34 DEF 456' },
      update: {},
      create: {
        plate: '34 DEF 456',
        brand: 'Mercedes',
        model: 'Sprinter',
        year: 2021,
        fuelType: FuelType.DIESEL,
        km: 78450,
        color: 'Gri',
        chassisNo: 'WDB9066331S123456',
        status: VehicleStatus.ACTIVE,
        // Samsun - Ilkadim
        lastLat: 41.2867,
        lastLng: 36.3300,
        lastSpeed: 0,
        lastGpsUpdate: new Date(),
      },
    }),
    prisma.vehicle.upsert({
      where: { plate: '34 GHI 789' },
      update: {},
      create: {
        plate: '34 GHI 789',
        brand: 'Volkswagen',
        model: 'Crafter',
        year: 2023,
        fuelType: FuelType.DIESEL,
        km: 12300,
        color: 'Mavi',
        chassisNo: 'WV1ZZZ2EZP1234567',
        status: VehicleStatus.MAINTENANCE,
        lastLat: 40.9923,
        lastLng: 29.0244,
        lastSpeed: 0,
        lastGpsUpdate: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 saat once
      },
    }),
    prisma.vehicle.upsert({
      where: { plate: '34 JKL 012' },
      update: {},
      create: {
        plate: '34 JKL 012',
        brand: 'Fiat',
        model: 'Ducato',
        year: 2020,
        fuelType: FuelType.DIESEL,
        km: 98700,
        color: 'Kirmizi',
        chassisNo: 'ZFA25000001234567',
        status: VehicleStatus.ACTIVE,
        lastLat: 41.0553,
        lastLng: 28.9408,
        lastSpeed: 62,
        lastGpsUpdate: new Date(),
      },
    }),
    prisma.vehicle.upsert({
      where: { plate: '34 MNO 345' },
      update: {},
      create: {
        plate: '34 MNO 345',
        brand: 'Renault',
        model: 'Master',
        year: 2019,
        fuelType: FuelType.DIESEL,
        km: 125000,
        color: 'Beyaz',
        chassisNo: 'VF1MA000012345678',
        status: VehicleStatus.PASSIVE,
        lastLat: 41.0136,
        lastLng: 28.9550,
        lastSpeed: 0,
        lastGpsUpdate: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 gun once
      },
    }),
  ]);

  vehicles.forEach(v => console.log(`   - ${v.plate} - ${v.brand} ${v.model}`));

  // ==================== SURUCULER ====================
  console.log('\nSuruculer olusturuluyor...');

  const drivers = await Promise.all([
    prisma.driver.upsert({
      where: { email: 'mehmet.kaya@reeder.com.tr' },
      update: {},
      create: {
        fullName: 'Mehmet Kaya',
        phone: '0532 111 22 33',
        email: 'mehmet.kaya@reeder.com.tr',
        identityNumber: '12345678901',
        licenseNumber: '123456',
        licenseClass: 'B',
        licenseExpiry: new Date('2027-05-15'),
        birthDate: new Date('1985-03-20'),
        status: DriverStatus.ACTIVE,
        vehicleId: vehicles[0].id, // Ford Transit
      },
    }),
    prisma.driver.upsert({
      where: { email: 'ali.demir@reeder.com.tr' },
      update: {},
      create: {
        fullName: 'Ali Demir',
        phone: '0533 222 33 44',
        email: 'ali.demir@reeder.com.tr',
        identityNumber: '23456789012',
        licenseNumber: '234567',
        licenseClass: 'C',
        licenseExpiry: new Date('2026-08-20'),
        birthDate: new Date('1990-07-10'),
        status: DriverStatus.ACTIVE,
        vehicleId: vehicles[1].id, // Mercedes Sprinter
      },
    }),
    prisma.driver.upsert({
      where: { email: 'huseyin.yildiz@reeder.com.tr' },
      update: {},
      create: {
        fullName: 'Huseyin Yildiz',
        phone: '0534 333 44 55',
        email: 'huseyin.yildiz@reeder.com.tr',
        identityNumber: '34567890123',
        licenseNumber: '345678',
        licenseClass: 'B',
        licenseExpiry: new Date('2025-12-01'),
        birthDate: new Date('1988-11-25'),
        status: DriverStatus.ON_LEAVE,
        vehicleId: null, // Arac atanmamis
      },
    }),
    prisma.driver.upsert({
      where: { email: 'mustafa.celik@reeder.com.tr' },
      update: {},
      create: {
        fullName: 'Mustafa Celik',
        phone: '0535 444 55 66',
        email: 'mustafa.celik@reeder.com.tr',
        identityNumber: '45678901234',
        licenseNumber: '456789',
        licenseClass: 'D',
        licenseExpiry: new Date('2028-02-28'),
        birthDate: new Date('1992-04-15'),
        status: DriverStatus.ACTIVE,
        vehicleId: vehicles[3].id, // Fiat Ducato
      },
    }),
  ]);

  drivers.forEach(d => console.log(`   - ${d.fullName} - ${d.phone}`));

  // ==================== BAKIMLAR ====================
  console.log('\nBakim kayitlari olusturuluyor...');

  const maintenances = await Promise.all([
    prisma.maintenance.create({
      data: {
        vehicleId: vehicles[0].id,
        type: MaintenanceType.PERIODIC,
        description: 'Periyodik Bakim (15.000 km) - Yag ve filtre degisimi',
        date: new Date('2024-12-15'),
        cost: 4000,
        service: 'Ford Yetkili Servis',
        status: MaintenanceStatus.COMPLETED,
        nextKm: 60000,
        nextDate: new Date('2025-06-15'),
      },
    }),
    prisma.maintenance.create({
      data: {
        vehicleId: vehicles[2].id,
        type: MaintenanceType.BRAKE_SYSTEM,
        description: 'Fren Balatasi ve Disk Degisimi (On)',
        date: new Date(),
        cost: 7000,
        service: 'Bosch Car Service',
        status: MaintenanceStatus.IN_PROGRESS,
      },
    }),
    prisma.maintenance.create({
      data: {
        vehicleId: vehicles[1].id,
        type: MaintenanceType.INSPECTION_PREP,
        description: 'TUVTURK Muayene Ucreti',
        date: new Date('2025-01-15'),
        cost: 850,
        service: 'TUVTURK',
        status: MaintenanceStatus.PLANNED,
      },
    }),
    prisma.maintenance.create({
      data: {
        vehicleId: vehicles[3].id,
        type: MaintenanceType.HEAVY_MAINTENANCE,
        description: 'Triger Seti Degisimi (Kayis)',
        date: new Date('2024-11-20'),
        cost: 5500,
        service: 'Fiat Yetkili Servis',
        status: MaintenanceStatus.COMPLETED,
        nextKm: 160000,
      },
    }),
    prisma.maintenance.create({
      data: {
        vehicleId: vehicles[0].id,
        type: MaintenanceType.SEASONAL,
        description: 'Kislik Lastik Degisimi (Takim)',
        date: new Date('2024-11-01'),
        cost: 8500,
        service: 'Lastik Dunyasi',
        status: MaintenanceStatus.COMPLETED,
      },
    }),
  ]);

  console.log(`   - ${maintenances.length} bakim kaydi olusturuldu`);

  // ==================== SIGORTALAR ====================
  console.log('\nSigorta policeleri olusturuluyor...');

  const insurances = await Promise.all([
    prisma.insurance.create({
      data: {
        vehicleId: vehicles[0].id,
        type: InsuranceType.TRAFFIC,
        company: 'Allianz Sigorta',
        policyNo: 'TRF-2024-001234',
        startDate: new Date('2024-06-01'),
        endDate: new Date('2025-06-01'),
        premium: 8500,
        coverage: 500000,
      },
    }),
    prisma.insurance.create({
      data: {
        vehicleId: vehicles[0].id,
        type: InsuranceType.KASKO,
        company: 'Axa Sigorta',
        policyNo: 'KSK-2024-005678',
        startDate: new Date('2024-06-01'),
        endDate: new Date('2025-06-01'),
        premium: 25000,
        coverage: 1500000,
      },
    }),
    prisma.insurance.create({
      data: {
        vehicleId: vehicles[1].id,
        type: InsuranceType.TRAFFIC,
        company: 'Anadolu Sigorta',
        policyNo: 'TRF-2024-002345',
        startDate: new Date('2024-03-15'),
        endDate: new Date('2025-03-15'),
        premium: 9200,
        coverage: 500000,
      },
    }),
    prisma.insurance.create({
      data: {
        vehicleId: vehicles[1].id,
        type: InsuranceType.KASKO,
        company: 'Allianz Sigorta',
        policyNo: 'KSK-2024-006789',
        startDate: new Date('2024-03-15'),
        endDate: new Date('2025-03-15'),
        premium: 32000,
        coverage: 2000000,
      },
    }),
  ]);

  console.log(`   - ${insurances.length} sigorta policesi olusturuldu`);

  // ==================== CEZALAR ====================
  console.log('\nTrafik cezalari olusturuluyor...');

  const fines = await Promise.all([
    prisma.fine.create({
      data: {
        vehicleId: vehicles[0].id,
        driverId: drivers[0].id,
        amount: 1506,
        date: new Date('2024-11-20'),
        type: 'Hiz Ihlali',
        location: 'E-5 Karayolu, Bakirkoy',
        description: '82 km/s hiz siniri asimi (%30)',
        isPaid: false,
        dueDate: new Date('2025-01-20'),
      },
    }),
    prisma.fine.create({
      data: {
        vehicleId: vehicles[1].id,
        driverId: drivers[1].id,
        amount: 690,
        date: new Date('2024-10-05'),
        type: 'Park Yasagi',
        location: 'Kadikoy, Bagdat Caddesi',
        description: 'Duraklama ve Park Etme Yasaklarina Uymamak',
        isPaid: true,
        paidAt: new Date('2024-10-15'),
        paymentMethod: 'CREDIT_CARD',
        invoiceNo: 'GIB20241015-0012',
      },
    }),
    prisma.fine.create({
      data: {
        vehicleId: vehicles[3].id,
        driverId: drivers[3].id,
        amount: 3135,
        date: new Date('2024-12-10'),
        type: 'Kirmizi Isik',
        location: 'Mecidiyekoy Kavsagi',
        description: 'Kirmizi Isik Kuralina Uymamak',
        isPaid: false,
        dueDate: new Date('2025-02-10'),
      },
    }),
    prisma.fine.create({
      data: {
        vehicleId: vehicles[0].id,
        driverId: drivers[0].id,
        amount: 690,
        date: new Date('2025-01-02'),
        type: 'Emniyet Kemeri',
        location: 'TEM Otoyolu, Maslak',
        description: 'Seyir halinde cep telefonu kullanimi',
        isPaid: false,
        dueDate: new Date('2025-02-02'),
      },
    }),
    prisma.fine.create({
      data: {
        vehicleId: vehicles[2].id,
        driverId: drivers[2].id,
        amount: 690,
        date: new Date('2024-09-15'),
        type: 'Muayene',
        location: 'Sariyer',
        description: 'Muayene suresi gecmis aracla trafige cikmak',
        isPaid: true,
        paidAt: new Date('2024-09-20'),
        paymentMethod: 'CASH',
        invoiceNo: 'GIB20240920-5544',
      },
    }),
    prisma.fine.create({
      data: {
        vehicleId: vehicles[1].id,
        driverId: drivers[1].id,
        amount: 1506,
        date: new Date('2024-11-25'),
        type: 'Hiz Ihlali',
        location: 'Kuzey Marmara Otoyolu',
        description: 'Hiz Sinirini %10-30 Asmak',
        isPaid: true,
        paidAt: new Date('2024-12-05'),
        paymentMethod: 'CORPORATE_CARD',
        invoiceNo: 'FTR-2024-9988',
      },
    }),
  ]);

  console.log(`   - ${fines.length} ceza kaydi olusturuldu`);

  // ==================== BILDIRIMLER ====================
  console.log('\nBildirimler olusturuluyor...');

  const notifications = await Promise.all([
    prisma.notification.create({
      data: {
        userId: filoYoneticisi.id,
        title: 'Sigorta Suresi Doluyor',
        message: '34 ABC 123 plakali aracin trafik sigortasi 30 gun icinde sona erecek.',
        type: NotificationType.WARNING,
        isRead: false,
        link: '/insurance',
      },
    }),
    prisma.notification.create({
      data: {
        userId: filoYoneticisi.id,
        title: 'Bakim Hatirlatmasi',
        message: '34 DEF 456 plakali aracin muayene tarihi yaklasiyor.',
        type: NotificationType.INFO,
        isRead: false,
        link: '/maintenance',
      },
    }),
    prisma.notification.create({
      data: {
        userId: filoYoneticisi.id,
        title: 'Yeni Trafik Cezasi',
        message: '34 JKL 012 plakali araca kirmizi isik ihlali cezasi kesildi.',
        type: NotificationType.DANGER,
        isRead: true,
        readAt: new Date(),
        link: '/fines',
      },
    }),
  ]);

  console.log(`   - ${notifications.length} bildirim olusturuldu`);

  // ==================== AKTIVITE LOGLARI ====================
  console.log('\nAktivite loglari olusturuluyor...');

  const activityLogs = await Promise.all([
    prisma.activityLog.create({
      data: {
        userId: filoYoneticisi.id,
        vehicleId: vehicles[0].id,
        action: 'Arac Eklendi',
        description: '34 ABC 123 plakali Ford Transit sisteme eklendi.',
      },
    }),
    prisma.activityLog.create({
      data: {
        userId: filoYoneticisi.id,
        vehicleId: vehicles[2].id,
        action: 'Bakim Basladi',
        description: '34 GHI 789 plakali arac bakima alindi.',
      },
    }),
    prisma.activityLog.create({
      data: {
        userId: filoYoneticisi.id,
        action: 'Surucu Eklendi',
        description: 'Mehmet Kaya surucu olarak sisteme eklendi.',
      },
    }),
  ]);

  console.log(`   - ${activityLogs.length} aktivite logu olusturuldu`);

  // ==================== KONUM GECMISI ====================
  console.log('\nKonum gecmisi olusturuluyor...');

  // Son 1 saat icin sahte GPS verileri
  const locationHistoryData = [];
  const now = Date.now();
  
  for (let i = 0; i < 12; i++) {
    locationHistoryData.push({
      vehicleId: vehicles[0].id,
      lat: 41.0082 + (Math.random() - 0.5) * 0.02,
      lng: 28.9784 + (Math.random() - 0.5) * 0.02,
      speed: 30 + Math.random() * 40,
      heading: Math.random() * 360,
      createdAt: new Date(now - (12 - i) * 5 * 60 * 1000), // 5 dakika araliklarla
    });
  }

  await prisma.locationHistory.createMany({
    data: locationHistoryData,
  });

  console.log(`   - ${locationHistoryData.length} konum kaydi olusturuldu`);

  console.log('\nSeed islemi tamamlandi!\n');
  console.log('Giris bilgileri:');
  console.log('   Admin: admin@reeder.com.tr / 123456');
  console.log('   Filo Yoneticisi: ahmet.yilmaz@reeder.com.tr / 123456');
  console.log('   Goruntuleyici: viewer@reeder.com.tr / 123456\n');
}

main()
  .catch((e) => {
    console.error('Seed hatasi:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
