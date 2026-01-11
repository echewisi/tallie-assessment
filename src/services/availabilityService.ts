import { TableModel } from '../models/table';
import { ReservationModel } from '../models/reservation';
import { RestaurantModel } from '../models/restaurant';
import { AvailableSlot, Table } from '../types';
import { ValidationService } from './validationService';

export class AvailabilityService {
  static async checkTableAvailability(
    tableId: number,
    date: string,
    time: string,
    durationHours: number
  ): Promise<boolean> {
    const overlapping = await ReservationModel.findOverlappingReservations(
      tableId,
      date,
      time,
      durationHours
    );
    return overlapping.length === 0;
  }

  static async findAvailableTables(
    restaurantId: number,
    date: string,
    time: string,
    durationHours: number,
    partySize: number
  ): Promise<Table[]> {
    // Get all tables that can accommodate the party size
    const suitableTables = await TableModel.findAvailableByCapacity(restaurantId, partySize);
    
    // Check availability for each table
    const availableTables: Table[] = [];
    
    for (const table of suitableTables) {
      const isAvailable = await this.checkTableAvailability(
        table.id!,
        date,
        time,
        durationHours
      );
      if (isAvailable) {
        availableTables.push(table);
      }
    }

    return availableTables;
  }

  static async getAvailableTimeSlots(
    restaurantId: number,
    date: string,
    partySize: number,
    durationHours: number = 2
  ): Promise<AvailableSlot[]> {
    const restaurant = await RestaurantModel.findById(restaurantId);
    if (!restaurant) {
      throw new Error('Restaurant not found');
    }

    const slots: AvailableSlot[] = [];
    const [openHour, openMin] = restaurant.opening_time.split(':').map(Number);
    const [closeHour, closeMin] = restaurant.closing_time.split(':').map(Number);
    
    const openMinutes = openHour * 60 + openMin;
    const closeMinutes = closeHour * 60 + closeMin;
    const durationMinutes = durationHours * 60;

    // Generate time slots every 30 minutes
    for (let minutes = openMinutes; minutes + durationMinutes <= closeMinutes; minutes += 30) {
      const hour = Math.floor(minutes / 60);
      const min = minutes % 60;
      const time = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;

      const availableTables = await this.findAvailableTables(
        restaurantId,
        date,
        time,
        durationHours,
        partySize
      );

      if (availableTables.length > 0) {
        slots.push({
          time,
          available_tables: availableTables.map(t => t.id!)
        });
      }
    }

    return slots;
  }

  static async suggestBestTable(
    restaurantId: number,
    date: string,
    time: string,
    durationHours: number,
    partySize: number
  ): Promise<Table | null> {
    const availableTables = await this.findAvailableTables(
      restaurantId,
      date,
      time,
      durationHours,
      partySize
    );

    if (availableTables.length === 0) {
      return null;
    }

    // Find the table with the smallest capacity that still fits the party
    // This optimizes table utilization
    return availableTables.reduce((best, current) => {
      if (!best) return current;
      if (current.capacity < best.capacity) return current;
      return best;
    }, availableTables[0]);
  }

  static async validateReservationTime(
    restaurantId: number,
    date: string,
    time: string,
    durationHours: number
  ): Promise<{ valid: boolean; error?: string }> {
    const restaurant = await RestaurantModel.findById(restaurantId);
    if (!restaurant) {
      return { valid: false, error: 'Restaurant not found' };
    }

    if (!ValidationService.isReservationWithinOperatingHours(
      { reservation_time: time, duration_hours: durationHours } as any,
      restaurant.opening_time,
      restaurant.closing_time
    )) {
      return {
        valid: false,
        error: `Reservation must be within operating hours (${restaurant.opening_time} - ${restaurant.closing_time})`
      };
    }

    // Check if reservation date is not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const reservationDate = new Date(date);
    reservationDate.setHours(0, 0, 0, 0);

    if (reservationDate < today) {
      return { valid: false, error: 'Cannot make reservations for past dates' };
    }

    return { valid: true };
  }
}

