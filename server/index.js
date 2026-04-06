const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for Chrome Extension and Frontend
app.use(cors());
app.use(express.json());

// Routes

/**
 * GET /api/questions
 * Returns questions, optionally filtered by status, search, topic, and starred
 */
app.get('/api/questions', (req, res) => {
  try {
    const { status, search, topic, starred } = req.query;
    let query = 'SELECT * FROM questions';
    const params = [];

    const conditions = [];
    if (status && status !== 'all') {
      conditions.push('status = ?');
      params.push(status);
    }
    if (search) {
      conditions.push('title LIKE ?');
      params.push(`%${search}%`);
    }
    if (topic && topic !== 'all') {
      conditions.push('topic = ?');
      params.push(topic);
    }
    if (starred === 'true') {
      conditions.push('isStarred = 1');
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    // Sorting Logic
    const { sortBy } = req.query;
    if (sortBy === 'starred') {
      query += ' ORDER BY isStarred DESC, createdAt DESC';
    } else if (sortBy === 'unsolved') {
      query += ' ORDER BY status ASC, createdAt DESC'; // 'unsolved' comes before 'solved' alphabetically
    } else {
      query += ' ORDER BY createdAt DESC';
    }

    const questions = db.prepare(query).all(...params);
    res.json(questions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/stats
 * Returns question counts per topic for the Home Screen
 */
app.get('/api/stats', (req, res) => {
  try {
    const counts = db.prepare(`
      SELECT topic, COUNT(*) as count 
      FROM questions 
      GROUP BY topic
    `).all();
    
    // Map to a cleaner object: { "DSA": 5, "WAP": 12, ... }
    const stats = {};
    counts.forEach(row => {
      stats[row.topic || 'General'] = row.count;
    });
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/topics
 * Returns a list of all unique topics
 */
app.get('/api/topics', (req, res) => {
  try {
    const topics = db.prepare('SELECT DISTINCT topic FROM questions WHERE topic IS NOT NULL').all();
    res.json(topics.map(t => t.topic));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/subtopics
 * Returns a list of unique subtopics for a given topic
 */
app.get('/api/subtopics', (req, res) => {
  try {
    const { topic } = req.query;
    let query = "SELECT DISTINCT subtopic FROM questions WHERE subtopic IS NOT NULL AND subtopic != ''";
    const params = [];
    
    if (topic && topic !== 'all' && topic !== 'starred') {
       query += ' AND topic = ?';
       params.push(topic);
    }
    
    query += ' ORDER BY subtopic ASC';
    const rows = db.prepare(query).all(...params);
    res.json(rows.map(r => r.subtopic));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/save
 * Saves a new question with optional topic/subtopic
 */
app.post('/api/save', (req, res) => {
  try {
    const { title, url, tags, notes, topic, subtopic } = req.body;
    if (!title || !url) {
      return res.status(400).json({ error: 'Title and URL are required' });
    }

    const stmt = db.prepare(`
      INSERT INTO questions (title, url, tags, notes, topic, subtopic)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      title, 
      url, 
      JSON.stringify(tags || []), 
      notes || '', 
      topic || 'General', 
      subtopic || 'Uncategorized'
    );
    res.status(201).json({ id: result.lastInsertRowid, title, url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PATCH /api/question/:id
 * Updates question fields (status, star, topic, subtopic)
 */
app.patch('/api/question/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { status, isStarred, topic, subtopic } = req.body;

    const updates = [];
    const params = [];

    if (status !== undefined) {
      if (!['solved', 'unsolved'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }
      updates.push('status = ?');
      params.push(status);
    }

    if (isStarred !== undefined) {
      updates.push('isStarred = ?');
      params.push(isStarred ? 1 : 0);
    }

    if (topic !== undefined) {
      updates.push('topic = ?');
      params.push(topic);
    }

    if (subtopic !== undefined) {
      updates.push('subtopic = ?');
      params.push(subtopic);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(id);
    const stmt = db.prepare(`UPDATE questions SET ${updates.join(', ')} WHERE id = ?`);
    const result = stmt.run(...params);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Question not found' });
    }

    res.json({ success: true, id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/question/:id
 * Deletes a question
 */
app.delete('/api/question/:id', (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM questions WHERE id = ?');
    const result = stmt.run(id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Question not found' });
    }

    res.json({ success: true, id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/topic/:topic
 * Deletes all questions belonging to a specific topic
 */
app.delete('/api/topic/:topic', (req, res) => {
  try {
    const { topic } = req.params;
    const stmt = db.prepare('DELETE FROM questions WHERE topic = ?');
    const result = stmt.run(topic);

    res.json({ success: true, deleted: result.changes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/topic/:topic/subtopic/:subtopic
 * Deletes all questions belonging to a specific subtopic
 */
app.delete('/api/topic/:topic/subtopic/:subtopic', (req, res) => {
  try {
    const { topic, subtopic } = req.params;
    const stmt = db.prepare('DELETE FROM questions WHERE topic = ? AND subtopic = ?');
    const result = stmt.run(topic, subtopic);

    res.json({ success: true, deleted: result.changes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
