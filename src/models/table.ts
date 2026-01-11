import { dbGet, dbAll, dbRun } from '../config/database';
import { Table } from '../types';

export class TableModel {
  static async create(table: Table): Promise<number> {
    const sql = `
      INSERT INTO tables (restaurant_id, table_number, capacity)
      VALUES (?, ?, ?)
    `;
    const result = await dbRun(sql, [
      table.restaurant_id,
      table.table_number,
      table.capacity
    ]);
    return result.lastID!;
  }

  static async findByRestaurantId(restaurantId: number): Promise<Table[]> {
    const sql = 'SELECT * FROM tables WHERE restaurant_id = ? ORDER BY table_number';
    return await dbAll<Table>(sql, [restaurantId]);
  }

  static async findById(id: number): Promise<Table | undefined> {
    const sql = 'SELECT * FROM tables WHERE id = ?';
    return await dbGet<Table>(sql, [id]);
  }

  static async findByRestaurantAndNumber(restaurantId: number, tableNumber: string): Promise<Table | undefined> {
    const sql = 'SELECT * FROM tables WHERE restaurant_id = ? AND table_number = ?';
    return await dbGet<Table>(sql, [restaurantId, tableNumber]);
  }

  static async findAvailableByCapacity(restaurantId: number, capacity: number): Promise<Table[]> {
    const sql = 'SELECT * FROM tables WHERE restaurant_id = ? AND capacity >= ? ORDER BY capacity ASC';
    return await dbAll<Table>(sql, [restaurantId, capacity]);
  }
}

