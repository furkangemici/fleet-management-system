import { PrismaClient } from '../../generated/prisma';

// Prisma Client Singleton
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Veritabanı bağlantı fonksiyonları
export const connectDatabase = async (): Promise<void> => {
  try {
    await prisma.$connect();
    console.log('PostgreSQL veritabanına bağlanıldı');
  } catch (error) {
    console.error('Veritabanı bağlantı hatası:', error);
    process.exit(1);
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  await prisma.$disconnect();
  console.log('Veritabanı bağlantısı kapatıldı');
};

export default prisma;
