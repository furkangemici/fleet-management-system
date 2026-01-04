import { Request, Response } from 'express';
import notificationService from '../services/notificationService';

// AuthRequest interface'ini normalde auth middleware'den almalıyız ama hızlı çözüm için:
interface AuthRequest extends Request {
  user: {
    id: number;
    email: string;
    role: string;
  };
}

class NotificationController {
  async getUserNotifications(req: Request, res: Response) {
    const userId = (req as AuthRequest).user.id;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const notifications = await notificationService.getUserNotifications(userId, limit);
    res.json({ success: true, data: notifications });
  }

  async markAsRead(req: Request, res: Response) {
    const id = parseInt(req.params.id);
    await notificationService.markAsRead(id);
    res.json({ success: true, message: 'Bildirim okundu.' });
  }

  async markAllAsRead(req: Request, res: Response) {
    const userId = (req as AuthRequest).user.id;
    await notificationService.markAllAsRead(userId);
    res.json({ success: true, message: 'Tümü okundu.' });
  }

  async deleteNotification(req: Request, res: Response) {
    const id = parseInt(req.params.id);
    await notificationService.deleteNotification(id);
    res.json({ success: true, message: 'Bildirim silindi.' });
  }

  async deleteAllNotifications(req: Request, res: Response) {
    const userId = (req as AuthRequest).user.id;
    await notificationService.deleteAllNotifications(userId);
    res.json({ success: true, message: 'Tüm bildirimler silindi.' });
  }
}

export default new NotificationController();
