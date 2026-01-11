import request from 'supertest';
import app from '../src/app';
import { db, dbRun } from '../src/config/database';

describe('Restaurant API', () => {
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
  });

  afterEach(async () => {
    // Clean up after each test
    await dbRun('DELETE FROM restaurants');
  });

  afterAll(async () => {
    db.close();
  });

  describe('POST /api/restaurants', () => {
    it('should create a new restaurant', async () => {
      const restaurant = {
        name: 'Test Restaurant',
        opening_time: '10:00',
        closing_time: '22:00',
        total_tables: 5
      };

      const response = await request(app)
        .post('/api/restaurants')
        .send(restaurant)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(restaurant.name);
      expect(response.body.opening_time).toBe(restaurant.opening_time);
      expect(response.body.closing_time).toBe(restaurant.closing_time);
    });

    it('should return 400 for invalid restaurant data', async () => {
      const restaurant = {
        name: '',
        opening_time: 'invalid',
        closing_time: '22:00'
      };

      const response = await request(app)
        .post('/api/restaurants')
        .send(restaurant)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/restaurants/:id', () => {
    it('should get restaurant by id', async () => {
      // Create a restaurant first
      const createResponse = await request(app)
        .post('/api/restaurants')
        .send({
          name: 'Test Restaurant',
          opening_time: '10:00',
          closing_time: '22:00',
          total_tables: 5
        });

      const restaurantId = createResponse.body.id;

      const response = await request(app)
        .get(`/api/restaurants/${restaurantId}`)
        .expect(200);

      expect(response.body.id).toBe(restaurantId);
      expect(response.body.name).toBe('Test Restaurant');
    });

    it('should return 404 for non-existent restaurant', async () => {
      const response = await request(app)
        .get('/api/restaurants/999')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });
});

