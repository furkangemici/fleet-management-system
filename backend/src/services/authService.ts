import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import config from '../config';
import userRepository, { CreateUserData } from '../repositories/userRepository';
import { User, UserRole } from '../../generated/prisma';
import { BadRequestError, UnauthorizedError, ConflictError } from '../utils/ApiError';

export interface RegisterDTO {
  email: string;
  password: string;
  fullName: string;
  role?: UserRole;
  phone?: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: Omit<User, 'password'>;
  token: string;
}

export interface JwtPayload {
  userId: number;
  email: string;
  role: UserRole;
}

class AuthService {
  // Kullanıcı kaydı
  async register(data: RegisterDTO): Promise<AuthResponse> {
    // Email kontrolü
    const existingUser = await userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new ConflictError('Bu email adresi zaten kullanılıyor');
    }

    // Güçlü şifre validasyonu
    this.validateStrongPassword(data.password);

    // Şifreyi hashle
    const hashedPassword = await bcrypt.hash(data.password, config.bcryptRounds);

    // Kullanıcı oluştur
    const user = await userRepository.create({
      ...data,
      password: hashedPassword,
    });

    // JWT token oluştur
    const token = this.generateToken(user);

    // Şifreyi yanıttan çıkar
    const { password, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword as Omit<User, 'password'>,
      token,
    };
  }

  // Kullanıcı girişi
  async login(data: LoginDTO): Promise<AuthResponse> {
    // Kullanıcıyı bul
    const user = await userRepository.findByEmail(data.email);
    if (!user) {
      throw new UnauthorizedError('Email veya şifre hatalı');
    }

    // Hesap kilitli mi kontrol et
    if (user.lockedUntil && new Date() < user.lockedUntil) {
      const remainingMinutes = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
      throw new UnauthorizedError(
        `Hesabınız çok fazla hatalı giriş denemesi nedeniyle kilitlendi. ` +
        `${remainingMinutes} dakika sonra tekrar deneyebilir veya şifrenizi sıfırlayabilirsiniz.`
      );
    }

    // Kilit süresi geçtiyse kilidi kaldır
    if (user.lockedUntil && new Date() >= user.lockedUntil) {
      await userRepository.update(user.id, {
        loginAttempts: 0,
        lockedUntil: null,
      });
    }

    // Hesap aktif mi kontrol et
    if (!user.isActive) {
      throw new UnauthorizedError('Hesabınız devre dışı bırakılmış');
    }

    // Şifre kontrolü
    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) {
      // Hatalı giriş denemesini artır
      const newAttempts = (user.loginAttempts || 0) + 1;
      const maxAttempts = 5;

      if (newAttempts >= maxAttempts) {
        // 5 hatalı denemeden sonra hesabı 15 dakika kilitle
        const lockDuration = 15 * 60 * 1000; // 15 dakika
        const lockedUntil = new Date(Date.now() + lockDuration);
        
        await userRepository.update(user.id, {
          loginAttempts: newAttempts,
          lockedUntil,
        });

        console.log(`⚠️  Hesap kilitlendi: ${user.email} (${newAttempts} hatalı deneme)`);

        throw new UnauthorizedError(
          `Hesabınız ${maxAttempts} hatalı giriş denemesi nedeniyle 15 dakika süreyle kilitlendi. ` +
          `Şifrenizi sıfırlayarak hesabınızı hemen açabilirsiniz.`
        );
      } else {
        // Deneme sayısını artır
        await userRepository.update(user.id, {
          loginAttempts: newAttempts,
        });

        const remainingAttempts = maxAttempts - newAttempts;
        throw new UnauthorizedError(
          `Email veya şifre hatalı. Kalan deneme hakkı: ${remainingAttempts}`
        );
      }
    }

    // Başarılı giriş - deneme sayacını sıfırla
    await userRepository.update(user.id, {
      loginAttempts: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
    });

    // JWT token oluştur
    const token = this.generateToken(user);

    // Şifreyi yanıttan çıkar
    const { password, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword as Omit<User, 'password'>,
      token,
    };
  }

  // JWT token oluştur
  private generateToken(user: User): string {
    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    return jwt.sign({ ...payload }, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn,
    } as jwt.SignOptions);
  }

  // Token doğrula
  verifyToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, config.jwtSecret) as JwtPayload;
    } catch (error) {
      throw new UnauthorizedError('Geçersiz veya süresi dolmuş token');
    }
  }

  // Mevcut kullanıcı bilgilerini getir
  async getCurrentUser(userId: number): Promise<Omit<User, 'password'>> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedError('Kullanıcı bulunamadı');
    }

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword as Omit<User, 'password'>;
  }

  // Şifre değiştir
  async changePassword(userId: number, currentPassword: string, newPassword: string): Promise<void> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedError('Kullanıcı bulunamadı');
    }

    // Mevcut şifre kontrolü
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new BadRequestError('Mevcut şifre hatalı');
    }

    // Güçlü şifre validasyonu
    this.validateStrongPassword(newPassword);

    // Yeni şifreyi hashle ve güncelle
    const hashedPassword = await bcrypt.hash(newPassword, config.bcryptRounds);
    await userRepository.update(userId, { password: hashedPassword });
  }

  // Şifre sıfırlama talebi (Email gönderme yerine console'a yazdır)
  async requestPasswordReset(email: string): Promise<{ message: string }> {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      // Güvenlik için kullanıcı bulunamasa bile başarılı mesaj dön
      return { message: 'Eğer bu email kayıtlıysa, şifre sıfırlama linki gönderildi.' };
    }

    // Rastgele token oluştur (UUID benzeri)
    const token = this.generateResetToken();
    
    // Token'ı veritabanına kaydet (1 saat geçerli)
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 saat
    await userRepository.createPasswordResetToken(user.id, token, expiresAt);

    // Gerçek mail servisi olmadığı için console'a yazdır
    const resetLink = `${config.frontendUrl}/reset-password?token=${token}`;
    console.log('\n' + '='.repeat(80));
    console.log('🔐 ŞİFRE SIFIRLAMA TALEBİ');
    console.log('='.repeat(80));
    console.log(`📧 Email: ${email}`);
    console.log(`👤 Kullanıcı: ${user.fullName}`);
    console.log(`🔑 Token: ${token}`);
    console.log(`🔗 Sıfırlama Linki:\n   ${resetLink}`);
    console.log(`⏰ Geçerlilik Süresi: 1 saat`);
    console.log('='.repeat(80) + '\n');

    return { message: 'Eğer bu email kayıtlıysa, şifre sıfırlama linki gönderildi.' };
  }

  // Şifre sıfırlama (Token ile)
  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    // Token'ı doğrula
    const resetToken = await userRepository.findPasswordResetToken(token);
    
    if (!resetToken) {
      throw new BadRequestError('Geçersiz veya süresi dolmuş token');
    }

    // Token kullanılmış mı kontrol et
    if (resetToken.used) {
      throw new BadRequestError('Bu token zaten kullanılmış');
    }

    // Token süresi dolmuş mu kontrol et
    if (new Date() > resetToken.expiresAt) {
      throw new BadRequestError('Token süresi dolmuş. Lütfen yeni bir sıfırlama talebi oluşturun.');
    }

    // Güçlü şifre validasyonu
    this.validateStrongPassword(newPassword);

    // Şifreyi hashle ve güncelle + hesap kilidini kaldır
    const hashedPassword = await bcrypt.hash(newPassword, config.bcryptRounds);
    await userRepository.update(resetToken.userId, { 
      password: hashedPassword,
      loginAttempts: 0,     
      lockedUntil: null,     
    });

    // Token'ı kullanılmış olarak işaretle
    await userRepository.markTokenAsUsed(token);

    console.log(`\n✅ Şifre başarıyla sıfırlandı ve hesap kilidi kaldırıldı: ${resetToken.user.email}\n`);

    return { message: 'Şifreniz başarıyla sıfırlandı. Giriş yapabilirsiniz.' };
  }

  // Rastgele reset token oluştur
  private generateResetToken(): string {
    // Basit UUID benzeri token (crypto kullanabilirsiniz)
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // Güçlü şifre validasyonu
  private validateStrongPassword(password: string): void {
    // En az 8 karakter
    if (password.length < 8) {
      throw new BadRequestError('Şifre en az 8 karakter olmalıdır');
    }

    // En az 1 büyük harf
    if (!/[A-Z]/.test(password)) {
      throw new BadRequestError('Şifre en az 1 büyük harf içermelidir');
    }

    // En az 1 küçük harf
    if (!/[a-z]/.test(password)) {
      throw new BadRequestError('Şifre en az 1 küçük harf içermelidir');
    }

    // En az 1 rakam
    if (!/[0-9]/.test(password)) {
      throw new BadRequestError('Şifre en az 1 rakam içermelidir');
    }
  }
}

export default new AuthService();
