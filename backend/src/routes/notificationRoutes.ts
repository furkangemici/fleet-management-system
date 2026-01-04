import { Router } from 'express';
import notificationController from '../controllers/NotificationController';
import authMiddleware from '../middlewares/authMiddleware';

const router = Router();

// Tüm rotalar için authentication gerekli
router.use(authMiddleware);

router.get('/', notificationController.getUserNotifications);
router.put('/read-all', notificationController.markAllAsRead); // ID çakışmaması için önce tanımla
router.delete('/delete-all', notificationController.deleteAllNotifications);
router.put('/:id/read', notificationController.markAsRead);
router.delete('/:id', notificationController.deleteNotification);

export default router;
