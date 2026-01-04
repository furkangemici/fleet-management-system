import { Router } from 'express';
import userController from '../controllers/UserController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

// Tüm route'lar korumalı (authentication gerekli)
router.use(authMiddleware);

// Profil işlemleri
router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);
router.put('/change-password', userController.changePassword);

export default router;
