import sqlite3 from 'sqlite3';

// open database in memory
export const db = new sqlite3.Database(
  './wcms.db',
  sqlite3.OPEN_READWRITE,
  (err) => {
    if (err) {
      return console.error(err.message);
    }
    console.log('Connected to the in-memory SQlite database.');
  },
);
