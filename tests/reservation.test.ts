import request from 'supertest';
import app from '../src/app';
import { db, dbRun } from '../src/config/database';

describe('Reservation API', () => {
  let restaurantId: number;
  let tableId: number;

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

    await dbRun(`
      CREATE TABLE IF NOT EXISTS reservations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        restaurant_id INTEGER NOT NULL,
        table_id INTEGER NOT NULL,
        customer_name TEXT NOT NULL,
        customer_phone TEXT NOT NULL,
        party_size INTEGER NOT NULL,
        reservation_date TEXT NOT NULL,
        reservation_time TEXT NOT NULL,
        duration_hours REAL NOT NULL,
        status TEXT NOT NULL DEFAULT 'confirmed',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
        FOREIGN KEY (table_id) REFERENCES tables(id) ON DELETE CASCADE
      )
    `);

    // Create test restaurant
    const restaurantResult = await dbRun(
      'INSERT INTO restaurants (name, opening_time, closing_time, total_tables) VALUES (?, ?, ?, ?)',
      ['Test Restaurant', '10:00', '22:00', 1]
    );
    restaurantId = restaurantResult.lastID!;

    // Create test table
    const tableResult = await dbRun(
      'INSERT INTO tables (restaurant_id, table_number, capacity) VALUES (?, ?, ?)',
      [restaurantId, 'T1', 4]
    );
    tableId = tableResult.lastID!;
  });

  afterEach(async () => {
    // Clean up reservations after each test
    await dbRun('DELETE FROM reservations');
  });

  afterAll(async () => {
    await dbRun('DELETE FROM tables');
    await dbRun('DELETE FROM restaurants');
    db.close();
  });

  describe('POST /api/reservations', () => {
    it('should create a new reservation', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];

      const reservation = {
        restaurant_id: restaurantId,
        table_id: tableId,
        customer_name: 'John Doe',
        customer_phone: '1234567890',
        party_size: 2,
        reservation_date: dateStr,
        reservation_time: '19:00',
        duration_hours: 2
      };

      const response = await request(app)
        .post('/api/reservations')
        .send(reservation)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.customer_name).toBe('John Doe');
      expect(response.body.party_size).toBe(2);
    });

    it('should prevent double-booking', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];

      const reservation1 = {
        restaurant_id: restaurantId,
        table_id: tableId,
        customer_name: 'John Doe',
        customer_phone: '1234567890',
        party_size: 2,
        reservation_date: dateStr,
        reservation_time: '19:00',
        duration_hours: 2
      };

      // Create first reservation
      await request(app)
        .post('/api/reservations')
        .send(reservation1)
        .expect(201);

      // Try to create overlapping reservation
      const reservation2 = {
        ...reservation1,
        customer_name: 'Jane Doe',
        reservation_time: '20:00' // Overlaps with first reservation
      };

      const response = await request(app)
        .post('/api/reservations')
        .send(reservation2)
        .expect(409);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('already reserved');
    });

    it('should reject reservation for party size exceeding table capacity', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];

      const reservation = {
        restaurant_id: restaurantId,
        table_id: tableId,
        customer_name: 'John Doe',
        customer_phone: '1234567890',
        party_size: 6, // Table capacity is 4
        reservation_date: dateStr,
        reservation_time: '19:00',
        duration_hours: 2
      };

      const response = await request(app)
        .post('/api/reservations')
        .send(reservation)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('insufficient');
    });

    it('should reject reservation outside operating hours', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];

      const reservation = {
        restaurant_id: restaurantId,
        table_id: tableId,
        customer_name: 'John Doe',
        customer_phone: '1234567890',
        party_size: 2,
        reservation_date: dateStr,
        reservation_time: '23:00', // Outside operating hours (10:00-22:00)
        duration_hours: 2
      };

      const response = await request(app)
        .post('/api/reservations')
        .send(reservation)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('operating hours');
    });
  });

  describe('GET /api/restaurants/:restaurantId/reservations', () => {
    it('should get reservations for a specific date', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];

      // Create a reservation
      await request(app)
        .post('/api/reservations')
        .send({
          restaurant_id: restaurantId,
          table_id: tableId,
          customer_name: 'John Doe',
          customer_phone: '1234567890',
          party_size: 2,
          reservation_date: dateStr,
          reservation_time: '19:00',
          duration_hours: 2
        })
        .expect(201);

      const response = await request(app)
        .get(`/api/restaurants/${restaurantId}/reservations`)
        .query({ date: dateStr })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });
  });

  describe('DELETE /api/reservations/:id', () => {
    it('should cancel a reservation', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];

      // Create a reservation
      const createResponse = await request(app)
        .post('/api/reservations')
        .send({
          restaurant_id: restaurantId,
          table_id: tableId,
          customer_name: 'John Doe',
          customer_phone: '1234567890',
          party_size: 2,
          reservation_date: dateStr,
          reservation_time: '19:00',
          duration_hours: 2
        })
        .expect(201);

      const reservationId = createResponse.body.id;

      // Cancel the reservation
      const response = await request(app)
        .delete(`/api/reservations/${reservationId}`)
        .expect(200);

      expect(response.body.status).toBe('cancelled');
    });
  });
});

