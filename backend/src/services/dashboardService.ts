import prisma from '../config/database';
import { MaintenanceStatus } from '../../generated/prisma';

class DashboardService {
  async getStats() {
    const today = new Date();
    const next30Days = new Date();
    next30Days.setDate(today.getDate() + 30);

    const [
      totalVehicles,
      activeVehicles,
      totalDrivers,
      activeDrivers,
      activeMaintenances,
      totalFines, 
      upcomingMaintenances,
      recentNotifications
    ] = await Promise.all([
      // 1. Toplam Araç
      prisma.vehicle.count(),
      // 2. Aktif Araç
      prisma.vehicle.count({ where: { status: 'ACTIVE' } }),
      // 3. Toplam Sürücü
      prisma.driver.count(),
      // 4. Aktif Sürücü
      prisma.driver.count({ where: { status: 'ACTIVE' } }),
      // 5. Bakımdaki Araçlar (Maintenance IN_PROGRESS)
      // Note: MaintenanceStatus enumunda IN_PROGRESS var mı kontrol edilmeli. 
      // Veya VehicleStatus 'MAINTENANCE' olanlar.
      prisma.vehicle.count({ where: { status: 'MAINTENANCE' } }),
      
      // 6. Ödenmemiş Cezalar (Tutar ve Sayı)
      prisma.fine.aggregate({
         where: { isPaid: false },
         _sum: { amount: true },
         _count: true
      }),

      // 7. Yaklaşan Bakımlar (Planlanmış ve tarihi yaklaşanlar)
      prisma.maintenance.count({
          where: {
              status: MaintenanceStatus.PLANNED,
              date: {
                  gte: today,
                  lte: next30Days
              }
          }
      }),

      // 8. Son Aktiviteler (Son 5 bildirim)
      prisma.notification.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' }
      })
    ]);

    return {
      stats: {
        totalVehicles,
        activeVehicles,
        maintenanceVehicles: activeMaintenances,
        activeDrivers, 
        pendingFines: totalFines._count,
        pendingFinesAmount: totalFines._sum.amount || 0,
        upcomingMaintenance: upcomingMaintenances
      },
      recentActivities: recentNotifications
    };
  }
}

export default new DashboardService();
