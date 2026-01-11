import { Request, Response } from 'express';
import { TableModel } from '../models/table';
import { RestaurantModel } from '../models/restaurant';
import { Table } from '../types';

export class TableController {
  static async create(req: Request, res: Response): Promise<void> {
    try {
      const restaurantId = parseInt(req.params.restaurantId);
      if (isNaN(restaurantId)) {
        res.status(400).json({ error: 'Invalid restaurant ID' });
        return;
      }

      const restaurant = await RestaurantModel.findById(restaurantId);
      if (!restaurant) {
        res.status(404).json({ error: 'Restaurant not found' });
        return;
      }

      const table: Table = {
        ...req.body,
        restaurant_id: restaurantId
      };

      if (!table.table_number || !table.capacity) {
        res.status(400).json({ error: 'Table number and capacity are required' });
        return;
      }

      if (table.capacity < 1) {
        res.status(400).json({ error: 'Table capacity must be at least 1' });
        return;
      }

      // Check if table number already exists
      const existing = await TableModel.findByRestaurantAndNumber(restaurantId, table.table_number);
      if (existing) {
        res.status(409).json({ error: 'Table number already exists for this restaurant' });
        return;
      }

      const id = await TableModel.create(table);
      const created = await TableModel.findById(id);

      // Update restaurant total_tables count
      const allTables = await TableModel.findByRestaurantId(restaurantId);
      await RestaurantModel.updateTotalTables(restaurantId, allTables.length);

      res.status(201).json(created);
    } catch (error: any) {
      if (error.message.includes('UNIQUE constraint')) {
        res.status(409).json({ error: 'Table number already exists for this restaurant' });
        return;
      }
      res.status(500).json({ error: error.message });
    }
  }

  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const restaurantId = parseInt(req.params.restaurantId);
      if (isNaN(restaurantId)) {
        res.status(400).json({ error: 'Invalid restaurant ID' });
        return;
      }

      const restaurant = await RestaurantModel.findById(restaurantId);
      if (!restaurant) {
        res.status(404).json({ error: 'Restaurant not found' });
        return;
      }

      const tables = await TableModel.findByRestaurantId(restaurantId);
      res.json(tables);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

