import { Request, Response } from 'express';
import { RestaurantModel } from '../models/restaurant';
import { TableModel } from '../models/table';
import { ValidationService } from '../services/validationService';
import { Restaurant } from '../types';

export class RestaurantController {
  static async create(req: Request, res: Response): Promise<void> {
    try {
      const restaurant: Restaurant = req.body;
      
      const validation = ValidationService.validateRestaurant(restaurant);
      if (!validation.valid) {
        res.status(400).json({ error: 'Validation failed', details: validation.errors });
        return;
      }

      const id = await RestaurantModel.create(restaurant);
      const created = await RestaurantModel.findById(id);
      
      res.status(201).json(created);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid restaurant ID' });
        return;
      }

      const restaurant = await RestaurantModel.findById(id);
      if (!restaurant) {
        res.status(404).json({ error: 'Restaurant not found' });
        return;
      }

      res.json(restaurant);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getAvailableTables(req: Request, res: Response): Promise<void> {
    try {
      const restaurantId = parseInt(req.params.id);
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
      res.json({
        restaurant: {
          id: restaurant.id,
          name: restaurant.name,
          opening_time: restaurant.opening_time,
          closing_time: restaurant.closing_time
        },
        tables
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

