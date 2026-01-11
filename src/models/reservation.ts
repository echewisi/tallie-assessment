import { dbGet, dbAll, dbRun } from '../config/database';
import { Reservation } from '../types';

export class ReservationModel {
  static async create(reservation: Reservation): Promise<number> {
    const sql = `
      INSERT INTO reservations (
        restaurant_id, table_id, customer_name, customer_phone,
        party_size, reservation_date, reservation_time, duration_hours, status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const result = await dbRun(sql, [
      reservation.restaurant_id,
      reservation.table_id,
      reservation.customer_name,
      reservation.customer_phone,
      reservation.party_size,
      reservation.reservation_date,
      reservation.reservation_time,
      reservation.duration_hours,
      reservation.status || 'confirmed'
    ]);
    return result.lastID!;
  }

  static async findById(id: number): Promise<Reservation | undefined> {
    const sql = 'SELECT * FROM reservations WHERE id = ?';
    return await dbGet<Reservation>(sql, [id]);
  }

  static async findByRestaurantAndDate(restaurantId: number, date: string): Promise<Reservation[]> {
    const sql = `
      SELECT * FROM reservations
      WHERE restaurant_id = ? AND reservation_date = ?
      ORDER BY reservation_time
    `;
    return await dbAll<Reservation>(sql, [restaurantId, date]);
  }

  static async findOverlappingReservations(
    tableId: number,
    date: string,
    time: string,
    durationHours: number
  ): Promise<Reservation[]> {
    // Calculate end time
    const [startHour, startMinute] = time.split(':').map(Number);
    const startMinutes = startHour * 60 + startMinute;
    const durationMinutes = durationHours * 60;
    const endMinutes = startMinutes + durationMinutes;
    const endHour = Math.floor(endMinutes / 60);
    const endMin = endMinutes % 60;
    const endTime = `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`;

    // Find reservations that overlap
    // Overlap occurs when:
    // - New start time is between existing start and end
    // - New end time is between existing start and end
    // - New reservation completely contains existing reservation
    const sql = `
      SELECT * FROM reservations
      WHERE table_id = ? 
        AND reservation_date = ?
        AND status != 'cancelled'
        AND (
          (reservation_time <= ? AND 
           datetime(reservation_date || ' ' || reservation_time, '+' || duration_hours || ' hours') > datetime(?, ?))
          OR
          (reservation_time < datetime(?, ?, '+' || ? || ' hours') AND
           datetime(reservation_date || ' ' || reservation_time, '+' || duration_hours || ' hours') > ?)
        )
    `;
    
    // Simplified overlap check using time comparison
    const sqlSimple = `
      SELECT * FROM reservations
      WHERE table_id = ? 
        AND reservation_date = ?
        AND status != 'cancelled'
        AND (
          (reservation_time <= ? AND 
           time(datetime(reservation_date || ' ' || reservation_time, '+' || duration_hours || ' hours')) > ?)
          OR
          (reservation_time < time(datetime(?, '+' || ? || ' hours')) AND
           time(datetime(reservation_date || ' ' || reservation_time, '+' || duration_hours || ' hours')) > ?)
        )
    `;

    // More reliable approach: check all reservations for the table on that date
    // and filter in application code
    const allReservations = await dbAll<Reservation>(
      'SELECT * FROM reservations WHERE table_id = ? AND reservation_date = ? AND status != ?',
      [tableId, date, 'cancelled']
    );

    return allReservations.filter(res => {
      const resStart = this.timeToMinutes(res.reservation_time);
      const resEnd = resStart + (res.duration_hours * 60);
      const newStart = this.timeToMinutes(time);
      const newEnd = newStart + (durationHours * 60);

      return (newStart < resEnd && newEnd > resStart);
    });
  }

  static async update(id: number, updates: Partial<Reservation>): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && key !== 'id' && key !== 'created_at') {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (fields.length === 0) return;

    values.push(id);
    const sql = `UPDATE reservations SET ${fields.join(', ')} WHERE id = ?`;
    await dbRun(sql, values);
  }

  static async delete(id: number): Promise<void> {
    const sql = 'DELETE FROM reservations WHERE id = ?';
    await dbRun(sql, [id]);
  }

  private static timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }
}

