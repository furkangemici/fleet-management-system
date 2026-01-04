import { Router } from 'express';
import dashboardController from '../controllers/DashboardController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

router.use(authMiddleware);

router.get('/stats', dashboardController.getStats);

export default router;
