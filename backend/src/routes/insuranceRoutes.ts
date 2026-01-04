import { Router } from 'express';
import insuranceController from '../controllers/InsuranceController';
import { authMiddleware, managerAccess } from '../middlewares/authMiddleware';

const router = Router();

router.use(authMiddleware);

// Okuma
router.get('/', insuranceController.getAllInsurances);
router.get('/:id', insuranceController.getInsuranceById);

// Yazma (Sadece Yöneticiler)
router.post('/', managerAccess, insuranceController.createInsurance);
router.put('/:id', managerAccess, insuranceController.updateInsurance);
router.delete('/:id', managerAccess, insuranceController.deleteInsurance);

export default router;
