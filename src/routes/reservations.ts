import { Router } from 'express';
import { ReservationController } from '../controllers/reservationController';

const router = Router();

router.post('/', ReservationController.create);
router.get('/:id', ReservationController.getById);
router.put('/:id', ReservationController.update);
router.delete('/:id', ReservationController.cancel);

export default router;

