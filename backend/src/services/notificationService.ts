import prisma from '../config/database';
import { NotificationType, UserRole } from '../../generated/prisma';
import { getSocketIo } from './socketService';
import cron from 'node-cron';

class NotificationService {
  // Senkron Kilit (Race Condition Önleyici)
  private processingKeys = new Set<string>();

  /**
   * Yeni bildirim oluşturur, veritabanına kaydeder ve Socket.io ile iletir.
   */
  async createNotification(data: { userId: number, title: string, message: string, type: NotificationType, link?: string }) {
    // 0. RAM Lock (Race Condition & Spam Protection)
    // Node.js single-thread yapısı sayesinde bu kontrol atomiktir (race condition olmaz).
    const lockKey = `${data.userId}-${data.message}`;
    if (this.processingKeys.has(lockKey)) {
        return null as any;
    }
    this.processingKeys.add(lockKey);
    // 5 saniye boyunca aynı mesajı engelle
    setTimeout(() => this.processingKeys.delete(lockKey), 5000);

    // 1. Veritabanı Dedup Kontrolü (Son 10 saniye içinde aynı mesaj var mı?)
    // Bu yöntem RAM cache'den daha güvenlidir (restartlar ve çoklu processler için)
    const existing = await prisma.notification.findFirst({
        where: {
            userId: data.userId,
            message: data.message,
            createdAt: { gt: new Date(Date.now() - 10000) }
        }
    });
    
    if (existing) {
        return existing; // Mükerrer kayıt yaratma, varolanı dön
    }

    // 2. Veritabanına kaydet
    const notification = await prisma.notification.create({
      data: {
        ...data,
        isRead: false
      }
    });

    // 2. Socket.io ile gönder (Real-time)
    try {
      const io = getSocketIo();
      // Belirli bir kullanıcıya gönder (Frontend'de 'notification:user:1' dinlenmeli)
      io.emit(`notification:user:${data.userId}`, notification);
    } catch (err) {
      console.error('Socket notification error:', err);
    }

    return notification;
  }

  /**
   * Kullanıcının bildirimlerini getirir
   */
  async getUserNotifications(userId: number, limit = 20) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
  }

  /**
   * Bildirimi okundu olarak işaretler
   */
  async markAsRead(id: number) {
    return prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() }
    });
  }

  /**
   * Bildirimi siler
   */
  async deleteNotification(id: number) {
    return prisma.notification.delete({ where: { id } });
  }

  /**
   * Kullanıcının tüm bildirimlerini siler
   */
  async deleteAllNotifications(userId: number) {
    return prisma.notification.deleteMany({ where: { userId } });
  }

  /**
   * Tüm bildirimleri okundu yapar
   */
  async markAllAsRead(userId: number) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() }
    });
  }

  /**
   * Yöneticilere (Admin ve Filo Yöneticisi) toplu bildirim gönderir
   * @param data Bildirim verileri
   * @param excludeUserId Bildirimin gitmemesi gereken kullanıcı ID'si (genelde işlemi yapan kişi)
   */
  async notifyManagers(data: { title: string; message: string; type: NotificationType; link?: string }, excludeUserId?: number) {
    const managers = await prisma.user.findMany({
      where: { role: { in: [UserRole.ADMIN, UserRole.FLEET_MANAGER] } },
    });

    for (const manager of managers) {
      // Hariç tutulan kullanıcıya (işlemi yapana) gönderme
      if (excludeUserId && manager.id === excludeUserId) continue;

      await this.createNotification({ ...data, userId: manager.id });
    }
  }

  // ==================== CRON JOBS ====================
  
  startCronJobs() {
    console.log('⏰ Cron jobları başlatılıyor...');
    
    // Her gün saat 09:00'da çalışır
    cron.schedule('0 9 * * *', async () => {
        console.log('🔄 Günlük sistem kontrolleri başladı...');
        await this.checkInsurances();
    });
  }

  // Sigorta Kontrolü
  private async checkInsurances() {
      const today = new Date();
      const warningDate = new Date();
      warningDate.setDate(today.getDate() + 30); // 30 gün sonrası
      
      // Bitiş tarihi yaklaşan, pasif olmayan sigortalar
      const expiringInsurances = await prisma.insurance.findMany({
          where: {
              endDate: {
                  gte: today, 
                  lte: warningDate
              }
          },
          include: { vehicle: true }
      });

      if (expiringInsurances.length === 0) return;

      // Yöneticileri bul
      const managers = await prisma.user.findMany({
          where: { role: { in: [UserRole.ADMIN, UserRole.FLEET_MANAGER] } }
      });

      for (const ins of expiringInsurances) {
          const daysLeft = Math.ceil((ins.endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          
          // Bildirim oluştur (Spam önleme mantığı eklenebilir ama şimdilik her gün hatırlat)
          for (const manager of managers) {
              await this.createNotification({
                  userId: manager.id,
                  title: 'Sigorta Süresi Yaklaşıyor',
                  message: `${ins.vehicle.plate} plakalı aracın ${ins.company} ${ins.type} sigortası ${daysLeft} gün sonra bitecek.`,
                  type: daysLeft < 7 ? NotificationType.DANGER : NotificationType.WARNING,
                  link: '/insurances'
              });
          }
      }
  }
}

export default new NotificationService();
