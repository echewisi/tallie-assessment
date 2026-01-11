import { Router } from 'express';
import { TableController } from '../controllers/tableController';

const router = Router();

router.post('/:restaurantId/tables', TableController.create);
router.get('/:restaurantId/tables', TableController.getAll);

export default router;

