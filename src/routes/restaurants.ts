import { Router } from 'express';
import { RestaurantController } from '../controllers/restaurantController';

const router = Router();

router.post('/', RestaurantController.create);
router.get('/:id', RestaurantController.getById);
router.get('/:id/available-tables', RestaurantController.getAvailableTables);

export default router;

