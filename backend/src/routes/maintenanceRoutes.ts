import { Router } from 'express';
import maintenanceController from '../controllers/MaintenanceController';
import { authMiddleware, managerAccess } from '../middlewares/authMiddleware';

const router = Router();

router.use(authMiddleware);

// Okuma
// Okuma
router.get('/stats', maintenanceController.getStats);
router.get('/', maintenanceController.getAllMaintenances);
router.get('/:id', maintenanceController.getMaintenanceById);

// Yazma (Sadece Yöneticiler)
router.post('/', managerAccess, maintenanceController.createMaintenance);
router.put('/:id', managerAccess, maintenanceController.updateMaintenance);
router.delete('/:id', managerAccess, maintenanceController.deleteMaintenance);

export default router;
