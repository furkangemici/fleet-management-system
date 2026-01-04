import { Router } from 'express';
import authRoutes from './authRoutes';
import userRoutes from './userRoutes';
import vehicleRoutes from './vehicleRoutes';
import driverRoutes from './driverRoutes';
import maintenanceRoutes from './maintenanceRoutes';
import fineRoutes from './fineRoutes';
import insuranceRoutes from './insuranceRoutes';
import dashboardRoutes from './dashboardRoutes';
import notificationRoutes from './notificationRoutes';

const router = Router();

// API Routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/vehicles', vehicleRoutes);
router.use('/drivers', driverRoutes);
router.use('/maintenances', maintenanceRoutes); 
router.use('/fines', fineRoutes);
router.use('/insurances', insuranceRoutes);
router.use('/notifications', notificationRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Reeder Fleet API çalışıyor',
    timestamp: new Date().toISOString(),
  });
});

export default router;
