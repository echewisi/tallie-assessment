import { Restaurant, Reservation } from '../types';

export class ValidationService {
  static validateTime(time: string): boolean {
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  }

  static validateDate(date: string): boolean {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) return false;
    
    const d = new Date(date);
    return d instanceof Date && !isNaN(d.getTime());
  }

  static isTimeWithinOperatingHours(time: string, openingTime: string, closingTime: string): boolean {
    if (!this.validateTime(time) || !this.validateTime(openingTime) || !this.validateTime(closingTime)) {
      return false;
    }

    const [timeHour, timeMin] = time.split(':').map(Number);
    const [openHour, openMin] = openingTime.split(':').map(Number);
    const [closeHour, closeMin] = closingTime.split(':').map(Number);

    const timeMinutes = timeHour * 60 + timeMin;
    const openMinutes = openHour * 60 + openMin;
    const closeMinutes = closeHour * 60 + closeMin;

    // Handle case where closing time is next day (e.g., 22:00 to 02:00)
    if (closeMinutes < openMinutes) {
      return timeMinutes >= openMinutes || timeMinutes <= closeMinutes;
    }

    return timeMinutes >= openMinutes && timeMinutes <= closeMinutes;
  }

  static isReservationWithinOperatingHours(
    reservation: Reservation,
    openingTime: string,
    closingTime: string
  ): boolean {
    if (!this.isTimeWithinOperatingHours(reservation.reservation_time, openingTime, closingTime)) {
      return false;
    }

    // Check if end time is within operating hours
    const [startHour, startMin] = reservation.reservation_time.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = startMinutes + (reservation.duration_hours * 60);
    const endHour = Math.floor(endMinutes / 60) % 24;
    const endMin = endMinutes % 60;
    const endTime = `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`;

    return this.isTimeWithinOperatingHours(endTime, openingTime, closingTime);
  }

  static validatePhone(phone: string): boolean {
    // Basic phone validation - allows digits, spaces, dashes, parentheses
    const phoneRegex = /^[\d\s\-\(\)\+]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
  }

  static validateRestaurant(restaurant: Partial<Restaurant>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!restaurant.name || restaurant.name.trim().length === 0) {
      errors.push('Restaurant name is required');
    }

    if (!restaurant.opening_time || !this.validateTime(restaurant.opening_time)) {
      errors.push('Valid opening time is required (HH:MM format)');
    }

    if (!restaurant.closing_time || !this.validateTime(restaurant.closing_time)) {
      errors.push('Valid closing time is required (HH:MM format)');
    }

    if (restaurant.total_tables !== undefined && restaurant.total_tables < 0) {
      errors.push('Total tables must be a non-negative number');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  static validateReservation(reservation: Partial<Reservation>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!reservation.customer_name || reservation.customer_name.trim().length === 0) {
      errors.push('Customer name is required');
    }

    if (!reservation.customer_phone || !this.validatePhone(reservation.customer_phone)) {
      errors.push('Valid customer phone is required');
    }

    if (!reservation.party_size || reservation.party_size < 1) {
      errors.push('Party size must be at least 1');
    }

    if (!reservation.reservation_date || !this.validateDate(reservation.reservation_date)) {
      errors.push('Valid reservation date is required (YYYY-MM-DD format)');
    }

    if (!reservation.reservation_time || !this.validateTime(reservation.reservation_time)) {
      errors.push('Valid reservation time is required (HH:MM format)');
    }

    if (!reservation.duration_hours || reservation.duration_hours <= 0) {
      errors.push('Duration must be greater than 0');
    }

    if (reservation.duration_hours && reservation.duration_hours > 8) {
      errors.push('Reservation duration cannot exceed 8 hours');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

