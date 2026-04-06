const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, 'questions.db');
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
