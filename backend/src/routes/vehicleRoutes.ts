import { Router } from 'express';
import vehicleController from '../controllers/VehicleController';
import { authMiddleware, managerAccess } from '../middlewares/authMiddleware';

const router = Router();

// Tüm araç rotaları korumalıdır (Login gerektirir)
router.use(authMiddleware);

// Okuma işlemleri (Herkes yapabilir - Driver dahil)
router.get('/', vehicleController.getAllVehicles);
router.get('/:id', vehicleController.getVehicleById);

// Yazma işlemleri (Sadece Yönetici ve Filo Yöneticisi)
router.post('/', managerAccess, vehicleController.createVehicle);
router.put('/:id', managerAccess, vehicleController.updateVehicle);
router.delete('/:id', managerAccess, vehicleController.deleteVehicle);

export default router;
