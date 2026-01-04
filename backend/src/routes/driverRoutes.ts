import { Router } from 'express';
import driverController from '../controllers/DriverController';
import { authMiddleware, managerAccess } from '../middlewares/authMiddleware';

const router = Router();

router.use(authMiddleware);

// Okuma
router.get('/', driverController.getAllDrivers);
router.get('/:id', driverController.getDriverById);

// Yazma (Sadece Yöneticiler)
router.post('/', managerAccess, driverController.createDriver);
router.put('/:id', managerAccess, driverController.updateDriver);
router.delete('/:id', managerAccess, driverController.deleteDriver);

export default router;
