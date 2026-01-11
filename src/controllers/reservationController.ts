import { Request, Response } from 'express';
import { ReservationModel } from '../models/reservation';
import { TableModel } from '../models/table';
import { RestaurantModel } from '../models/restaurant';
import { AvailabilityService } from '../services/availabilityService';
import { ValidationService } from '../services/validationService';
import { Reservation } from '../types';

export class ReservationController {
  static async create(req: Request, res: Response): Promise<void> {
    try {
      const reservation: Reservation = req.body;

      // Validate reservation data
      const validation = ValidationService.validateReservation(reservation);
      if (!validation.valid) {
        res.status(400).json({ error: 'Validation failed', details: validation.errors });
        return;
      }

      // Check if restaurant exists
      const restaurant = await RestaurantModel.findById(reservation.restaurant_id);
      if (!restaurant) {
        res.status(404).json({ error: 'Restaurant not found' });
        return;
      }

      // Check if table exists and belongs to restaurant
      const table = await TableModel.findById(reservation.table_id);
      if (!table) {
        res.status(404).json({ error: 'Table not found' });
        return;
      }

      if (table.restaurant_id !== reservation.restaurant_id) {
        res.status(400).json({ error: 'Table does not belong to the specified restaurant' });
        return;
      }

      // Check if table capacity is sufficient
      if (table.capacity < reservation.party_size) {
        res.status(400).json({
          error: `Table capacity (${table.capacity}) is insufficient for party size (${reservation.party_size})`
        });
        return;
      }

      // Validate reservation time is within operating hours
      const timeValidation = await AvailabilityService.validateReservationTime(
        reservation.restaurant_id,
        reservation.reservation_date,
        reservation.reservation_time,
        reservation.duration_hours
      );
      if (!timeValidation.valid) {
        res.status(400).json({ error: timeValidation.error });
        return;
      }

      // Check for overlapping reservations
      const isAvailable = await AvailabilityService.checkTableAvailability(
        reservation.table_id,
        reservation.reservation_date,
        reservation.reservation_time,
        reservation.duration_hours
      );
      if (!isAvailable) {
        res.status(409).json({ error: 'Table is already reserved for this time slot' });
        return;
      }

      // Create reservation
      const id = await ReservationModel.create(reservation);
      const created = await ReservationModel.findById(id);

      // Log confirmation (mock email/SMS)
      console.log(`📧 Reservation Confirmation:
        Customer: ${reservation.customer_name}
        Phone: ${reservation.customer_phone}
        Date: ${reservation.reservation_date}
        Time: ${reservation.reservation_time}
        Duration: ${reservation.duration_hours} hours
        Party Size: ${reservation.party_size}
        Table: ${table.table_number}
      `);

      res.status(201).json(created);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getByRestaurantAndDate(req: Request, res: Response): Promise<void> {
    try {
      const restaurantId = parseInt(req.params.restaurantId);
      const date = req.query.date as string;

      if (isNaN(restaurantId)) {
        res.status(400).json({ error: 'Invalid restaurant ID' });
        return;
      }

      if (!date || !ValidationService.validateDate(date)) {
        res.status(400).json({ error: 'Valid date is required (YYYY-MM-DD format)' });
        return;
      }

      const restaurant = await RestaurantModel.findById(restaurantId);
      if (!restaurant) {
        res.status(404).json({ error: 'Restaurant not found' });
        return;
      }

      const reservations = await ReservationModel.findByRestaurantAndDate(restaurantId, date);
      res.json(reservations);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid reservation ID' });
        return;
      }

      const reservation = await ReservationModel.findById(id);
      if (!reservation) {
        res.status(404).json({ error: 'Reservation not found' });
        return;
      }

      res.json(reservation);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async update(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid reservation ID' });
        return;
      }

      const existing = await ReservationModel.findById(id);
      if (!existing) {
        res.status(404).json({ error: 'Reservation not found' });
        return;
      }

      const updates: Partial<Reservation> = req.body;

      // If updating time/date/duration, check for conflicts
      if (updates.reservation_time || updates.reservation_date || updates.duration_hours) {
        const time = updates.reservation_time || existing.reservation_time;
        const date = updates.reservation_date || existing.reservation_date;
        const duration = updates.duration_hours || existing.duration_hours;
        const tableId = updates.table_id || existing.table_id;

        const isAvailable = await AvailabilityService.checkTableAvailability(
          tableId,
          date,
          time,
          duration
        );
        if (!isAvailable) {
          res.status(409).json({ error: 'Table is already reserved for this time slot' });
          return;
        }
      }

      // If updating table, validate it
      if (updates.table_id) {
        const table = await TableModel.findById(updates.table_id);
        if (!table) {
          res.status(404).json({ error: 'Table not found' });
          return;
        }
        if (table.restaurant_id !== existing.restaurant_id) {
          res.status(400).json({ error: 'Table does not belong to the restaurant' });
          return;
        }
        if (table.capacity < (updates.party_size || existing.party_size)) {
          res.status(400).json({ error: 'Table capacity is insufficient' });
          return;
        }
      }

      await ReservationModel.update(id, updates);
      const updated = await ReservationModel.findById(id);

      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async cancel(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid reservation ID' });
        return;
      }

      const reservation = await ReservationModel.findById(id);
      if (!reservation) {
        res.status(404).json({ error: 'Reservation not found' });
        return;
      }

      await ReservationModel.update(id, { status: 'cancelled' });
      const cancelled = await ReservationModel.findById(id);

      console.log(`❌ Reservation Cancelled: ID ${id}, Customer: ${reservation.customer_name}`);

      res.json(cancelled);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getAvailableSlots(req: Request, res: Response): Promise<void> {
    try {
      const restaurantId = parseInt(req.params.restaurantId);
      const partySize = parseInt(req.query.partySize as string);
      const date = req.query.date as string;
      const durationHours = parseFloat(req.query.durationHours as string) || 2;

      if (isNaN(restaurantId)) {
        res.status(400).json({ error: 'Invalid restaurant ID' });
        return;
      }

      if (!partySize || partySize < 1) {
        res.status(400).json({ error: 'Valid party size is required' });
        return;
      }

      if (!date || !ValidationService.validateDate(date)) {
        res.status(400).json({ error: 'Valid date is required (YYYY-MM-DD format)' });
        return;
      }

      const restaurant = await RestaurantModel.findById(restaurantId);
      if (!restaurant) {
        res.status(404).json({ error: 'Restaurant not found' });
        return;
      }

      const slots = await AvailabilityService.getAvailableTimeSlots(
        restaurantId,
        date,
        partySize,
        durationHours
      );

      res.json({
        restaurant_id: restaurantId,
        date,
        party_size: partySize,
        duration_hours: durationHours,
        available_slots: slots
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

