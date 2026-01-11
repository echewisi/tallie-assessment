import request from 'supertest';
import app from '../src/app';
import { db, dbRun } from '../src/config/database';

describe('Table API', () => {
  let restaurantId: number;

  beforeAll(async () => {
    // Initialize test database
    await dbRun(`
      CREATE TABLE IF NOT EXISTS restaurants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        opening_time TEXT NOT NULL,
        closing_time TEXT NOT NULL,
        total_tables INTEGER NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await dbRun(`
      CREATE TABLE IF NOT EXISTS tables (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        restaurant_id INTEGER NOT NULL,
        table_number TEXT NOT NULL,
        capacity INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
        UNIQUE(restaurant_id, table_number)
      )
    `);

    // Create test restaurant
    const restaurantResult = await dbRun(
      'INSERT INTO restaurants (name, opening_time, closing_time, total_tables) VALUES (?, ?, ?, ?)',
      ['Test Restaurant', '10:00', '22:00', 0]
    );
    restaurantId = restaurantResult.lastID!;
  });

  afterEach(async () => {
    // Clean up tables after each test
    await dbRun('DELETE FROM tables');
  });

  afterAll(async () => {
    await dbRun('DELETE FROM restaurants');
    db.close();
  });

  describe('POST /api/restaurants/:restaurantId/tables', () => {
    it('should create a new table', async () => {
      const table = {
        table_number: 'T1',
        capacity: 4
      };

      const response = await request(app)
        .post(`/api/restaurants/${restaurantId}/tables`)
        .send(table)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.table_number).toBe('T1');
      expect(response.body.capacity).toBe(4);
      expect(response.body.restaurant_id).toBe(restaurantId);
    });

    it('should return 409 for duplicate table number', async () => {
      const table = {
        table_number: 'T1',
        capacity: 4
      };

      // Create first table
      await request(app)
        .post(`/api/restaurants/${restaurantId}/tables`)
        .send(table)
        .expect(201);

      // Try to create duplicate
      const response = await request(app)
        .post(`/api/restaurants/${restaurantId}/tables`)
        .send(table)
        .expect(409);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for invalid table data', async () => {
      const table = {
        table_number: '',
        capacity: -1
      };

      const response = await request(app)
        .post(`/api/restaurants/${restaurantId}/tables`)
        .send(table)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/restaurants/:restaurantId/tables', () => {
    it('should get all tables for a restaurant', async () => {
      // Create some tables
      await dbRun(
        'INSERT INTO tables (restaurant_id, table_number, capacity) VALUES (?, ?, ?)',
        [restaurantId, 'T1', 4]
      );
      await dbRun(
        'INSERT INTO tables (restaurant_id, table_number, capacity) VALUES (?, ?, ?)',
        [restaurantId, 'T2', 6]
      );

      const response = await request(app)
        .get(`/api/restaurants/${restaurantId}/tables`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
    });
  });
});

