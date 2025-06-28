import fs from 'fs';
import path from 'path';
import process from 'process';
import sqlite3 from 'sqlite3';

// Define the database file path
const dbPath = path.join('wcms.db');

// Ensure the directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Connect to SQLite database
export const db = new sqlite3.Database(
  dbPath,
  sqlite3.OPEN_READWRITE | sqlite3.OPEN_FULLMUTEX, // Full mutex mode for concurrency safety
  (err) => {
    if (err) {
      console.error('❌ Database Connection Error:', err.message);
    } else {
      console.log(`✅ Connected to the SQLite database: ${dbPath}`);
    }
  },
);

// Improve performance & concurrency handling
db.serialize(() => {
  db.run('PRAGMA journal_mode=WAL;'); // ✅ Enable Write-Ahead Logging (WAL)
  db.run('PRAGMA busy_timeout = 5000;'); // ✅ Set busy timeout (5 seconds)
  db.run('PRAGMA synchronous = NORMAL;'); // ✅ Optimize write performance
});

// Graceful shutdown (prevents "Database is closed" errors)
process.on('SIGINT', () => {
  console.log('⚠️ Closing database connection...');
  db.close((err) => {
    if (err) {
      console.error('❌ Error closing database:', err.message);
    } else {
      console.log('🔒 Database connection closed.');
    }
    process.exit(0);
  });
});
