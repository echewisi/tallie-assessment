import { Router } from 'express';
import restaurantRoutes from './restaurants';
import tableRoutes from './tables';
import reservationRoutes from './reservations';
import { ReservationController } from '../controllers/reservationController';

const router = Router();

// Restaurant routes
router.use('/restaurants', restaurantRoutes);

// Table routes (nested under restaurants)
router.use('/restaurants', tableRoutes);

// Reservation routes
router.use('/reservations', reservationRoutes);

// Additional reservation routes
router.get('/restaurants/:restaurantId/reservations', ReservationController.getByRestaurantAndDate);
router.get('/restaurants/:restaurantId/available-slots', ReservationController.getAvailableSlots);

export default router;

