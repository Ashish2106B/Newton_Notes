const Database = require('better-sqlite3');
const path = require('path');

const fs = require('fs');

// On Render, use persistent disk at /data. Locally, use the server directory.
let dbDir = process.env.NODE_ENV === 'production' ? '/data' : __dirname;

// Fallback to __dirname if /data doesn't exist (e.g. Render Free Tier)
if (process.env.NODE_ENV === 'production' && !fs.existsSync(dbDir)) {
  console.warn('/data directory not found, falling back to __dirname. Data will be ephemeral!');
  dbDir = __dirname;
}

const dbPath = path.join(dbDir, 'questions.db');
const db = new Database(dbPath);

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    status TEXT DEFAULT 'unsolved',
    tags TEXT,
    notes TEXT,
    topic TEXT DEFAULT 'General',
    subtopic TEXT DEFAULT 'Uncategorized',
    isStarred INTEGER DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Migration: Add columns if they don't exist
try { db.exec("ALTER TABLE questions ADD COLUMN topic TEXT DEFAULT 'General'"); } catch (e) {}
try { db.exec("ALTER TABLE questions ADD COLUMN subtopic TEXT DEFAULT 'Uncategorized'"); } catch (e) {}
try { db.exec("ALTER TABLE questions ADD COLUMN isStarred INTEGER DEFAULT 0"); } catch (e) {}

module.exports = db;
