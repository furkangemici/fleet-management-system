import { Server } from 'socket.io';
import prisma from '../config/database';

class SimulationService {
  private io: Server | null = null;
  private intervalId: NodeJS.Timeout | null = null;
  
  // Samsun Koordinatları (Merkez)
  private readonly CENTER_LAT = 41.2867;
  private readonly CENTER_LNG = 36.33;
  
  // Simülasyon Sınırları (Samsun Çevresi)
  private readonly BOUNDS = {
    minLat: 41.20,
    maxLat: 41.35,
    minLng: 36.20,
    maxLng: 36.45
  };

  // Araçların anlık hedefleri
  private vehicleTargets: Map<number, { lat: number; lng: number }> = new Map();

  setSocketIo(io: Server) {
    this.io = io;
  }

  startSimulation() {
    if (this.intervalId) return;

    console.log('Arac simulasyonu baslatiliyor...');

    // Her 3 saniyede bir araçları hareket ettir
    this.intervalId = setInterval(async () => {
      await this.moveVehicles();
    }, 3000);
  }

  stopSimulation() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('Arac simulasyonu durduruldu.');
    }
  }

  private async moveVehicles() {
    try {
      // Aktif ve GPS verisi olan araçları getir
      const vehicles = await prisma.vehicle.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true, plate: true, lastLat: true, lastLng: true, lastSpeed: true }
      });

      if (vehicles.length === 0) return;

      const updates = [];

      for (const vehicle of vehicles) {
        // Eğer aracın koordinatı yoksa Samsun merkezden başlat
        let currentLat = vehicle.lastLat || this.CENTER_LAT + (Math.random() - 0.5) * 0.05;
        let currentLng = vehicle.lastLng || this.CENTER_LNG + (Math.random() - 0.5) * 0.05;

        // Araca bir hedef belirle (eğer yoksa veya hedefe ulaştıysa)
        let target = this.vehicleTargets.get(vehicle.id);
        
        if (!target || this.hasReachedTarget(currentLat, currentLng, target.lat, target.lng)) {
          target = this.generateRandomTarget();
          this.vehicleTargets.set(vehicle.id, target);
        }

        // Hedefe doğru ilerle
        const speed = 0.0001 + Math.random() * 0.0002; // Rastgele hız
        const angle = Math.atan2(target.lat - currentLat, target.lng - currentLng);
        
        const newLat = currentLat + Math.sin(angle) * speed;
        const newLng = currentLng + Math.cos(angle) * speed;

        // Hızı hesapla (km/h cinsinden yaklaşık)
        const currentSpeed = Math.round(speed * 100000 * 3.6); // Basit bir dönüşüm

        updates.push({
          id: vehicle.id,
          plate: vehicle.plate,
          lat: newLat,
          lng: newLng,
          speed: currentSpeed,
          heading: (angle * 180 / Math.PI) // Derece cinsinden yön
        });

        // Veritabanını güncelle
        await prisma.vehicle.update({
          where: { id: vehicle.id },
          data: {
            lastLat: newLat,
            lastLng: newLng,
            lastSpeed: currentSpeed,
            lastGpsUpdate: new Date()
          }
        });
      }

      // Socket.io ile frontend'e gönder
      if (this.io) {
        this.io.emit('vehicle:locations', updates);
        console.log(`${updates.length} arac konumu guncellendi.`);
      }

    } catch (error) {
      console.error('Simulasyon hatasi:', error);
    }
  }

  private hasReachedTarget(lat1: number, lng1: number, lat2: number, lng2: number): boolean {
    const threshold = 0.001; // Yaklaşık 100 metre
    return Math.abs(lat1 - lat2) < threshold && Math.abs(lng1 - lng2) < threshold;
  }

  private generateRandomTarget() {
    return {
      lat: this.BOUNDS.minLat + Math.random() * (this.BOUNDS.maxLat - this.BOUNDS.minLat),
      lng: this.BOUNDS.minLng + Math.random() * (this.BOUNDS.maxLng - this.BOUNDS.minLng)
    };
  }
}

export default new SimulationService();
