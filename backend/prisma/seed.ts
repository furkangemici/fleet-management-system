import { PrismaClient, UserRole, VehicleStatus, FuelType, DriverStatus, MaintenanceType, MaintenanceStatus, InsuranceType, NotificationType } from '../generated/prisma';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seed işlemi başlıyor...\n');

  // ==================== KULLANICILAR ====================
  console.log('👤 Kullanıcılar oluşturuluyor...');
  
  const hashedPassword = await bcrypt.hash('123456', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@reeder.com.tr' },
    update: {},
    create: {
      email: 'admin@reeder.com.tr',
      password: hashedPassword,
      fullName: 'Sistem Yöneticisi',
      role: UserRole.ADMIN,
      phone: '0212 555 0001',
    },
  });

  const filoYoneticisi = await prisma.user.upsert({
    where: { email: 'ahmet.yilmaz@reeder.com.tr' },
    update: {},
    create: {
      email: 'ahmet.yilmaz@reeder.com.tr',
      password: hashedPassword,
      fullName: 'Ahmet Yılmaz',
      role: UserRole.FLEET_MANAGER,
      phone: '0532 555 0002',
    },
  });

  const viewer = await prisma.user.upsert({
    where: { email: 'viewer@reeder.com.tr' },
    update: {},
    create: {
      email: 'viewer@reeder.com.tr',
      password: hashedPassword,
      fullName: 'İzleyici Kullanıcı',
      role: UserRole.VIEWER,
      phone: '0533 555 0003',
    },
  });

  console.log(`   ✅ ${admin.fullName} (Admin)`);
  console.log(`   ✅ ${filoYoneticisi.fullName} (Filo Yöneticisi)`);
  console.log(`   ✅ ${viewer.fullName} (Görüntüleyici)`);

  // ==================== ARAÇLAR ====================
  console.log('\n🚗 Araçlar oluşturuluyor...');

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
        lastLat: 41.0082,
        lastLng: 28.9784,
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
        lastLat: 41.0422,
        lastLng: 29.0083,
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
        lastGpsUpdate: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 saat önce
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
        color: 'Kırmızı',
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
        lastGpsUpdate: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 gün önce
      },
    }),
  ]);

  vehicles.forEach(v => console.log(`   ✅ ${v.plate} - ${v.brand} ${v.model}`));

  // ==================== SÜRÜCÜLER ====================
  console.log('\n👨‍✈️ Sürücüler oluşturuluyor...');

  const drivers = await Promise.all([
    prisma.driver.upsert({
      where: { email: 'mehmet.kaya@reeder.com.tr' },
      update: {},
      create: {
        fullName: 'Mehmet Kaya',
        phone: '0532 111 2233',
        email: 'mehmet.kaya@reeder.com.tr',
        licenseNumber: '34DRV001234',
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
        phone: '0533 222 3344',
        email: 'ali.demir@reeder.com.tr',
        licenseNumber: '34DRV002345',
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
        fullName: 'Hüseyin Yıldız',
        phone: '0534 333 4455',
        email: 'huseyin.yildiz@reeder.com.tr',
        licenseNumber: '34DRV003456',
        licenseExpiry: new Date('2025-12-01'),
        birthDate: new Date('1988-11-25'),
        status: DriverStatus.ON_LEAVE,
        vehicleId: null, // Araç atanmamış
      },
    }),
    prisma.driver.upsert({
      where: { email: 'mustafa.celik@reeder.com.tr' },
      update: {},
      create: {
        fullName: 'Mustafa Çelik',
        phone: '0535 444 5566',
        email: 'mustafa.celik@reeder.com.tr',
        licenseNumber: '34DRV004567',
        licenseExpiry: new Date('2028-02-28'),
        birthDate: new Date('1992-04-15'),
        status: DriverStatus.ACTIVE,
        vehicleId: vehicles[3].id, // Fiat Ducato
      },
    }),
  ]);

  drivers.forEach(d => console.log(`   ✅ ${d.fullName} - ${d.phone}`));

  // ==================== BAKIMLAR ====================
  console.log('\n🔧 Bakım kayıtları oluşturuluyor...');

  const maintenances = await Promise.all([
    prisma.maintenance.create({
      data: {
        vehicleId: vehicles[0].id,
        type: MaintenanceType.PERIODIC,
        description: 'Periyodik Bakım (15.000 km) - Yağ ve filtre değişimi',
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
        description: 'Fren Balatası ve Disk Değişimi (Ön)',
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
        description: 'TÜVTÜRK Muayene Ücreti',
        date: new Date('2025-01-15'),
        cost: 850,
        service: 'TÜVTÜRK',
        status: MaintenanceStatus.PLANNED,
      },
    }),
    prisma.maintenance.create({
      data: {
        vehicleId: vehicles[3].id,
        type: MaintenanceType.HEAVY_MAINTENANCE,
        description: 'Triger Seti Değişimi (Kayış)',
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
        description: 'Kışlık Lastik Değişimi (Takım)',
        date: new Date('2024-11-01'),
        cost: 8500,
        service: 'Lastik Dünyası',
        status: MaintenanceStatus.COMPLETED,
      },
    }),
  ]);

  console.log(`   ✅ ${maintenances.length} bakım kaydı oluşturuldu`);

  // ==================== SİGORTALAR ====================
  console.log('\n📋 Sigorta poliçeleri oluşturuluyor...');

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

  console.log(`   ✅ ${insurances.length} sigorta poliçesi oluşturuldu`);

  // ==================== CEZALAR ====================
  console.log('\n⚠️ Trafik cezaları oluşturuluyor...');

  const fines = await Promise.all([
    prisma.fine.create({
      data: {
        vehicleId: vehicles[0].id,
        driverId: drivers[0].id,
        amount: 1506,
        date: new Date('2024-11-20'),
        type: 'Hız İhlali',
        location: 'E-5 Karayolu, Bakırköy',
        description: '82 km/s hız sınırı aşımı (%30)',
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
        type: 'Park Yasağı',
        location: 'Kadıköy, Bağdat Caddesi',
        description: 'Duraklama ve Park Etme Yasaklarına Uymamak',
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
        type: 'Kırmızı Işık',
        location: 'Mecidiyeköy Kavşağı',
        description: 'Kırmızı Işık Kuralına Uymamak',
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
        description: 'Seyir halinde cep telefonu kullanımı',
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
        location: 'Sarıyer',
        description: 'Muayene süresi geçmiş araçla trafiğe çıkmak',
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
        type: 'Hız İhlali',
        location: 'Kuzey Marmara Otoyolu',
        description: 'Hız Sınırını %10-30 Aşmak',
        isPaid: true,
        paidAt: new Date('2024-12-05'),
        paymentMethod: 'CORPORATE_CARD',
        invoiceNo: 'FTR-2024-9988',
      },
    }),
  ]);

  console.log(`   ✅ ${fines.length} ceza kaydı oluşturuldu`);

  // ==================== BİLDİRİMLER ====================
  console.log('\n🔔 Bildirimler oluşturuluyor...');

  const notifications = await Promise.all([
    prisma.notification.create({
      data: {
        userId: filoYoneticisi.id,
        title: 'Sigorta Süresi Doluyor',
        message: '34 ABC 123 plakalı aracın trafik sigortası 30 gün içinde sona erecek.',
        type: NotificationType.WARNING,
        isRead: false,
        link: '/insurance',
      },
    }),
    prisma.notification.create({
      data: {
        userId: filoYoneticisi.id,
        title: 'Bakım Hatırlatması',
        message: '34 DEF 456 plakalı aracın muayene tarihi yaklaşıyor.',
        type: NotificationType.INFO,
        isRead: false,
        link: '/maintenance',
      },
    }),
    prisma.notification.create({
      data: {
        userId: filoYoneticisi.id,
        title: 'Yeni Trafik Cezası',
        message: '34 JKL 012 plakalı araca kırmızı ışık ihlali cezası kesildi.',
        type: NotificationType.DANGER,
        isRead: true,
        readAt: new Date(),
        link: '/fines',
      },
    }),
  ]);

  console.log(`   ✅ ${notifications.length} bildirim oluşturuldu`);

  // ==================== AKTİVİTE LOGLARI ====================
  console.log('\n📝 Aktivite logları oluşturuluyor...');

  const activityLogs = await Promise.all([
    prisma.activityLog.create({
      data: {
        userId: filoYoneticisi.id,
        vehicleId: vehicles[0].id,
        action: 'Araç Eklendi',
        description: '34 ABC 123 plakalı Ford Transit sisteme eklendi.',
      },
    }),
    prisma.activityLog.create({
      data: {
        userId: filoYoneticisi.id,
        vehicleId: vehicles[2].id,
        action: 'Bakım Başladı',
        description: '34 GHI 789 plakalı araç bakıma alındı.',
      },
    }),
    prisma.activityLog.create({
      data: {
        userId: filoYoneticisi.id,
        action: 'Sürücü Eklendi',
        description: 'Mehmet Kaya sürücü olarak sisteme eklendi.',
      },
    }),
  ]);

  console.log(`   ✅ ${activityLogs.length} aktivite logu oluşturuldu`);

  // ==================== KONUM GEÇMİŞİ ====================
  console.log('\n📍 Konum geçmişi oluşturuluyor...');

  // Son 1 saat için sahte GPS verileri
  const locationHistoryData = [];
  const now = Date.now();
  
  for (let i = 0; i < 12; i++) {
    locationHistoryData.push({
      vehicleId: vehicles[0].id,
      lat: 41.0082 + (Math.random() - 0.5) * 0.02,
      lng: 28.9784 + (Math.random() - 0.5) * 0.02,
      speed: 30 + Math.random() * 40,
      heading: Math.random() * 360,
      createdAt: new Date(now - (12 - i) * 5 * 60 * 1000), // 5 dakika aralıklarla
    });
  }

  await prisma.locationHistory.createMany({
    data: locationHistoryData,
  });

  console.log(`   ✅ ${locationHistoryData.length} konum kaydı oluşturuldu`);

  console.log('\n✨ Seed işlemi tamamlandı!\n');
  console.log('📧 Giriş bilgileri:');
  console.log('   Admin: admin@reeder.com.tr / 123456');
  console.log('   Filo Yöneticisi: ahmet.yilmaz@reeder.com.tr / 123456');
  console.log('   Görüntüleyici: viewer@reeder.com.tr / 123456\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed hatası:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
