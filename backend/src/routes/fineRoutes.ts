import { Router } from 'express';
import fineController from '../controllers/FineController';
import { authMiddleware, managerAccess } from '../middlewares/authMiddleware';

const router = Router();

router.use(authMiddleware);

// Okuma
router.get('/', fineController.getAllFines);
router.get('/:id', fineController.getFineById);

// Yazma (Sadece Yöneticiler)
router.post('/', managerAccess, fineController.createFine);
router.put('/:id', managerAccess, fineController.updateFine);
router.delete('/:id', managerAccess, fineController.deleteFine);

export default router;
