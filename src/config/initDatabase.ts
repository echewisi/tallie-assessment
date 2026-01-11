import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { db, dbRun } from './database';

const schemaPath = path.join(__dirname, '../../database/schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');

// Split schema into individual statements
const statements = schema.split(';').filter(stmt => stmt.trim());

console.log('Initializing database...');

async function initDatabase() {
  try {
    for (const statement of statements) {
      if (statement.trim()) {
        await dbRun(statement);
      }
    }
    console.log('Database initialized successfully!');
    db.close();
    process.exit(0);
  } catch (err) {
    console.error('Error initializing database:', err);
    process.exit(1);
  }
}

initDatabase();

