import { dbGet, dbAll, dbRun } from '../config/database';
import { Restaurant, RestaurantWithTables } from '../types';
import { TableModel } from './table';

export class RestaurantModel {
  static async create(restaurant: Restaurant): Promise<number> {
    const sql = `
      INSERT INTO restaurants (name, opening_time, closing_time, total_tables)
      VALUES (?, ?, ?, ?)
    `;
    const result = await dbRun(sql, [
      restaurant.name,
      restaurant.opening_time,
      restaurant.closing_time,
      restaurant.total_tables
    ]);
    return result.lastID!;
  }

  static async findById(id: number): Promise<Restaurant | undefined> {
    const sql = 'SELECT * FROM restaurants WHERE id = ?';
    return await dbGet<Restaurant>(sql, [id]);
  }

  static async findByIdWithTables(id: number): Promise<RestaurantWithTables | undefined> {
    const restaurant = await this.findById(id);
    if (!restaurant) return undefined;

    const tables = await TableModel.findByRestaurantId(id);
    return {
      ...restaurant,
      tables
    };
  }

  static async updateTotalTables(id: number, count: number): Promise<void> {
    const sql = 'UPDATE restaurants SET total_tables = ? WHERE id = ?';
    await dbRun(sql, [count, id]);
  }
}

