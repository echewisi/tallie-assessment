# Restaurant Table Reservation API

A RESTful API for managing restaurant table reservations built with Node.js, Express, and TypeScript.

## Features

### Core Features
- ✅ **Restaurant Management**: Create restaurants with operating hours and table capacity
- ✅ **Table Management**: Add tables to restaurants with specific capacities
- ✅ **Reservation System**: Create, view, update, and cancel reservations
- ✅ **Availability Checking**: Prevent double-booking and check table availability
- ✅ **Business Logic Validation**: 
  - Reservations only during operating hours
  - Party size must fit table capacity
  - Overlapping reservations prevented
- ✅ **Available Time Slots**: Calculate and display available time slots for a given party size

### Bonus Features
- ✅ **TypeScript**: Full TypeScript implementation with type safety
- ✅ **Reservation Status**: Support for pending, confirmed, completed, and cancelled statuses
- ✅ **Reservation Modification**: Update existing reservations
- ✅ **Cancellation**: Cancel reservations with status update
- ✅ **Confirmation Logging**: Mock email/SMS confirmation logging
- ✅ **Seating Optimization**: Suggests best table for party size

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: SQLite3
- **Testing**: Jest with Supertest
- **Validation**: Custom validation service

## Project Structure

```
restaurant-reservation-api/
├── src/
│   ├── config/
│   │   ├── database.ts          # Database connection and helpers
│   │   └── initDatabase.ts      # Database initialization script
│   ├── models/
│   │   ├── restaurant.ts        # Restaurant data model
│   │   ├── table.ts             # Table data model
│   │   └── reservation.ts       # Reservation data model
│   ├── controllers/
│   │   ├── restaurantController.ts
│   │   ├── tableController.ts
│   │   └── reservationController.ts
│   ├── services/
│   │   ├── availabilityService.ts    # Availability checking logic
│   │   └── validationService.ts      # Input validation
│   ├── routes/
│   │   ├── restaurants.ts
│   │   ├── tables.ts
│   │   ├── reservations.ts
│   │   └── index.ts
│   ├── middleware/
│   │   └── errorHandler.ts      # Error handling middleware
│   ├── types/
│   │   └── index.ts             # TypeScript type definitions
│   ├── app.ts                   # Express app configuration
│   └── server.ts                # Server entry point
├── tests/
│   ├── restaurant.test.ts
│   ├── table.test.ts
│   └── reservation.test.ts
├── database/
│   └── schema.sql               # Database schema
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

## Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd restaurant-reservation-api
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` file:
   ```
   PORT=3000
   NODE_ENV=development
   DB_PATH=./database/reservations.db
   ```

4. **Initialize the database**
   ```bash
   npm run init-db
   ```

5. **Build TypeScript**
   ```bash
   npm run build
   ```

6. **Start the server**
   ```bash
   npm start
   ```
   
   Or for development with hot reload:
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:3000` (or the port specified in `.env`).

## API Documentation

### Base URL
```
http://localhost:3000/api
```

### Endpoints

#### Restaurants

##### Create Restaurant
```http
POST /api/restaurants
Content-Type: application/json

{
  "name": "The Fine Dine",
  "opening_time": "10:00",
  "closing_time": "22:00",
  "total_tables": 10
}
```

**Response:**
```json
{
  "id": 1,
  "name": "The Fine Dine",
  "opening_time": "10:00",
  "closing_time": "22:00",
  "total_tables": 10,
  "created_at": "2024-01-15T10:00:00.000Z"
}
```

##### Get Restaurant by ID
```http
GET /api/restaurants/:id
```

**Response:**
```json
{
  "id": 1,
  "name": "The Fine Dine",
  "opening_time": "10:00",
  "closing_time": "22:00",
  "total_tables": 10,
  "created_at": "2024-01-15T10:00:00.000Z"
}
```

##### Get Available Tables
```http
GET /api/restaurants/:id/available-tables
```

**Response:**
```json
{
  "restaurant": {
    "id": 1,
    "name": "The Fine Dine",
    "opening_time": "10:00",
    "closing_time": "22:00"
  },
  "tables": [
    {
      "id": 1,
      "restaurant_id": 1,
      "table_number": "T1",
      "capacity": 4,
      "created_at": "2024-01-15T10:00:00.000Z"
    }
  ]
}
```

#### Tables

##### Add Table to Restaurant
```http
POST /api/restaurants/:restaurantId/tables
Content-Type: application/json

{
  "table_number": "T1",
  "capacity": 4
}
```

**Response:**
```json
{
  "id": 1,
  "restaurant_id": 1,
  "table_number": "T1",
  "capacity": 4,
  "created_at": "2024-01-15T10:00:00.000Z"
}
```

##### Get All Tables for Restaurant
```http
GET /api/restaurants/:restaurantId/tables
```

**Response:**
```json
[
  {
    "id": 1,
    "restaurant_id": 1,
    "table_number": "T1",
    "capacity": 4,
    "created_at": "2024-01-15T10:00:00.000Z"
  }
]
```

#### Reservations

##### Create Reservation
```http
POST /api/reservations
Content-Type: application/json

{
  "restaurant_id": 1,
  "table_id": 1,
  "customer_name": "John Doe",
  "customer_phone": "1234567890",
  "party_size": 2,
  "reservation_date": "2024-01-20",
  "reservation_time": "19:00",
  "duration_hours": 2
}
```

**Response:**
```json
{
  "id": 1,
  "restaurant_id": 1,
  "table_id": 1,
  "customer_name": "John Doe",
  "customer_phone": "1234567890",
  "party_size": 2,
  "reservation_date": "2024-01-20",
  "reservation_time": "19:00",
  "duration_hours": 2,
  "status": "confirmed",
  "created_at": "2024-01-15T10:00:00.000Z"
}
```

##### Get Reservations by Restaurant and Date
```http
GET /api/restaurants/:restaurantId/reservations?date=2024-01-20
```

**Response:**
```json
[
  {
    "id": 1,
    "restaurant_id": 1,
    "table_id": 1,
    "customer_name": "John Doe",
    "customer_phone": "1234567890",
    "party_size": 2,
    "reservation_date": "2024-01-20",
    "reservation_time": "19:00",
    "duration_hours": 2,
    "status": "confirmed",
    "created_at": "2024-01-15T10:00:00.000Z"
  }
]
```

##### Get Reservation by ID
```http
GET /api/reservations/:id
```

##### Update Reservation
```http
PUT /api/reservations/:id
Content-Type: application/json

{
  "party_size": 3,
  "reservation_time": "20:00"
}
```

##### Cancel Reservation
```http
DELETE /api/reservations/:id
```

**Response:**
```json
{
  "id": 1,
  "status": "cancelled",
  ...
}
```

##### Get Available Time Slots
```http
GET /api/restaurants/:restaurantId/available-slots?date=2024-01-20&partySize=4&durationHours=2
```

**Response:**
```json
{
  "restaurant_id": 1,
  "date": "2024-01-20",
  "party_size": 4,
  "duration_hours": 2,
  "available_slots": [
    {
      "time": "10:00",
      "available_tables": [1, 2]
    },
    {
      "time": "10:30",
      "available_tables": [1, 2]
    }
  ]
}
```

### Error Responses

All error responses follow this format:
```json
{
  "error": "Error message description"
}
```

Common HTTP status codes:
- `400` - Bad Request (validation errors)
- `404` - Not Found (resource doesn't exist)
- `409` - Conflict (e.g., double-booking, duplicate table number)
- `500` - Internal Server Error

## Testing

Run tests:
```bash
npm test
```

Run tests with coverage:
```bash
npm test -- --coverage
```

### Test Coverage

The test suite includes:
- Restaurant creation and retrieval
- Table management
- Reservation creation with validation
- Double-booking prevention
- Capacity validation
- Operating hours validation
- Reservation cancellation

## Design Decisions and Assumptions

### Database Design
- **SQLite**: Chosen for simplicity and ease of setup. Can be easily migrated to PostgreSQL/MySQL for production.
- **Foreign Keys**: Enabled to maintain referential integrity.
- **Indexes**: Added on frequently queried columns (restaurant_id, reservation_date, table_id) for performance.

### Business Logic
- **Time Format**: Using 24-hour format (HH:MM) for consistency.
- **Date Format**: Using ISO 8601 format (YYYY-MM-DD).
- **Duration**: Stored as decimal hours (e.g., 2.5 for 2 hours 30 minutes).
- **Operating Hours**: Assumed to be within the same day (no overnight operations).
- **Reservation Status**: Defaults to 'confirmed' for new reservations.

### Overlap Detection
- Reservations are considered overlapping if their time ranges intersect.
- Cancelled reservations are excluded from availability checks.
- The algorithm checks if the new reservation's start/end time overlaps with any existing reservation's time range.

### Table Capacity
- Tables must have capacity >= party size (exact match not required).
- The system suggests the smallest suitable table to optimize utilization.

### Validation
- Phone numbers: Basic validation (at least 10 digits, allows common formatting).
- Dates: Must be valid dates and not in the past.
- Times: Must be valid 24-hour format and within operating hours.

## Known Limitations

1. **No Authentication/Authorization**: All endpoints are publicly accessible. In production, implement authentication.
2. **No Rate Limiting**: API endpoints are not rate-limited. Consider adding rate limiting for production.
3. **Single Database**: Currently uses SQLite. For production with multiple restaurants, consider PostgreSQL/MySQL.
4. **No Transaction Management**: Some operations could benefit from database transactions.
5. **Time Zone Handling**: All times are assumed to be in the same timezone. No timezone conversion.
6. **No Waitlist**: When no tables are available, the system doesn't offer a waitlist (mentioned as bonus feature).
7. **No Peak Hours Handling**: All time slots are treated equally (peak hours limitation mentioned as bonus).
8. **Mock Confirmations**: Email/SMS confirmations are only logged to console, not actually sent.

## What I Would Improve with More Time

1. **Authentication & Authorization**
   - Implement JWT-based authentication
   - Role-based access control (admin, restaurant owner, customer)

2. **Database Improvements**
   - Migrate to PostgreSQL for better concurrency
   - Add database migrations system (e.g., Knex.js)
   - Implement connection pooling

3. **Caching**
   - Add Redis caching for availability checks
   - Cache restaurant and table data

4. **Advanced Features**
   - Waitlist functionality when no tables available
   - Peak hours handling with dynamic pricing/duration limits
   - Email/SMS integration for confirmations
   - Reservation reminders

5. **API Improvements**
   - Add pagination for list endpoints
   - Implement filtering and sorting
   - Add API versioning
   - OpenAPI/Swagger documentation

6. **Testing**
   - Increase test coverage to >90%
   - Add integration tests
   - Add load testing

7. **Monitoring & Logging**
   - Structured logging (Winston, Pino)
   - Error tracking (Sentry)
   - Performance monitoring

8. **Docker Support**
   - Dockerfile for containerization
   - Docker Compose for local development
   - Kubernetes deployment configs

## Scaling for Multiple Restaurants

The current architecture already supports multiple restaurants. To scale further:

1. **Database Sharding**: Partition data by restaurant_id or region
2. **Microservices**: Split into separate services (restaurant service, reservation service, notification service)
3. **Caching Layer**: Use Redis for frequently accessed data
4. **Load Balancing**: Use nginx or cloud load balancer
5. **CDN**: Serve static content through CDN
6. **Message Queue**: Use RabbitMQ/Kafka for async operations (notifications, analytics)
7. **Read Replicas**: Use database read replicas for availability queries
8. **Horizontal Scaling**: Run multiple API instances behind load balancer

## Sample Scenarios

### Scenario 1: Restaurant opens 10 AM - 10 PM
```bash
POST /api/restaurants
{
  "name": "Bistro 10",
  "opening_time": "10:00",
  "closing_time": "22:00",
  "total_tables": 5
}
```

### Scenario 2: Table for 4 people, reservation at 7 PM for 2 hours
```bash
# First, create a table
POST /api/restaurants/1/tables
{
  "table_number": "T1",
  "capacity": 4
}

# Then create reservation
POST /api/reservations
{
  "restaurant_id": 1,
  "table_id": 1,
  "customer_name": "Alice",
  "customer_phone": "5551234",
  "party_size": 4,
  "reservation_date": "2024-01-20",
  "reservation_time": "19:00",
  "duration_hours": 2
}
```

### Scenario 3: Another party tries to book same table at 8 PM (should fail - overlap)
```bash
POST /api/reservations
{
  "restaurant_id": 1,
  "table_id": 1,
  "customer_name": "Bob",
  "customer_phone": "5555678",
  "party_size": 2,
  "reservation_date": "2024-01-20",
  "reservation_time": "20:00",  # Overlaps with 7-9 PM reservation
  "duration_hours": 2
}
# Returns 409 Conflict
```

### Scenario 4: Party of 6 tries to book a table with capacity 4 (should fail)
```bash
POST /api/reservations
{
  "restaurant_id": 1,
  "table_id": 1,  # Table capacity is 4
  "customer_name": "Charlie",
  "customer_phone": "5559012",
  "party_size": 6,  # Exceeds capacity
  "reservation_date": "2024-01-20",
  "reservation_time": "18:00",
  "duration_hours": 2
}
# Returns 400 Bad Request with capacity error
```

## License

MIT

