import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure backend/data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = process.env.NODE_ENV === 'test'
  ? ':memory:'
  : path.join(dataDir, 'debates.db');
const db = new Database(dbPath);


// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');

// Initialize database tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS debates (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    topic TEXT NOT NULL,
    transcript TEXT NOT NULL,
    verdict TEXT NOT NULL,
    created_at TEXT NOT NULL,
    language TEXT DEFAULT 'English',
    duration_ms INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS translations (
    debate_id TEXT NOT NULL,
    target_language TEXT NOT NULL,
    translated_transcript TEXT NOT NULL,
    translated_verdict TEXT NOT NULL,
    PRIMARY KEY (debate_id, target_language),
    FOREIGN KEY (debate_id) REFERENCES debates(id)
  );
`);

// Check if tables need migrations (e.g. if debates was created without user_id or language)
try {
  const pragma = db.prepare("PRAGMA table_info(debates)").all();
  const columns = pragma.map(col => col.name);
  if (!columns.includes('user_id')) {
    db.exec("ALTER TABLE debates ADD COLUMN user_id TEXT REFERENCES users(id)");
  }
  if (!columns.includes('language')) {
    db.exec("ALTER TABLE debates ADD COLUMN language TEXT DEFAULT 'English'");
  }
  if (!columns.includes('duration_ms')) {
    db.exec("ALTER TABLE debates ADD COLUMN duration_ms INTEGER DEFAULT 0");
  }
} catch (migrationErr) {
  console.error('[DB Schema] Migration warning:', migrationErr);
}

// ==========================================
// USER DATABASE HELPERS
// ==========================================

export function insertUser({ id, email, password_hash, created_at }) {
  const stmt = db.prepare(`
    INSERT INTO users (id, email, password_hash, created_at)
    VALUES (?, ?, ?, ?)
  `);
  stmt.run(id, email, password_hash, created_at);
}

export function getUserByEmail(email) {
  const stmt = db.prepare('SELECT id, email, password_hash, created_at FROM users WHERE email = ?');
  return stmt.get(email) || null;
}

export function getUserById(id) {
  const stmt = db.prepare('SELECT id, email, created_at FROM users WHERE id = ?');
  return stmt.get(id) || null;
}

// ==========================================
// DEBATE DATABASE HELPERS
// ==========================================

export function insertDebate({ id, user_id, topic, transcript, verdict, created_at, language, duration_ms }) {
  const stmt = db.prepare(`
    INSERT INTO debates (id, user_id, topic, transcript, verdict, created_at, language, duration_ms)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(id, user_id || null, topic, transcript, verdict, created_at, language || 'English', duration_ms || 0);
}

export function getDebateById(id) {
  const stmt = db.prepare('SELECT id, user_id, topic, transcript, verdict, created_at, language, duration_ms FROM debates WHERE id = ?');
  return stmt.get(id) || null;
}

/**
 * Returns all debates belonging to a specific user.
 */
export function getAllDebates(userId) {
  if (!userId) return [];
  const stmt = db.prepare('SELECT id, user_id, topic, verdict, created_at, language FROM debates WHERE user_id = ? ORDER BY created_at DESC');
  const rows = stmt.all(userId);

  return rows.map((row) => {
    let winner = 'N/A';
    try {
      const parsedVerdict = JSON.parse(row.verdict);
      winner = parsedVerdict.winner || 'N/A';
    } catch (err) {
      console.error(`[DB Error] Failed to parse verdict JSON for debate ${row.id}`, err);
    }

    return {
      id: row.id,
      topic: row.topic,
      winner,
      created_at: row.created_at,
      language: row.language,
    };
  });
}

/**
 * Counts the number of debates a user has run in the last 24 hours (UTC).
 */
export function getDebatesCountToday(userId) {
  if (!userId) return 0;
  // Get start of today (UTC)
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  const stmt = db.prepare(`
    SELECT COUNT(*) as count 
    FROM debates 
    WHERE user_id = ? AND created_at >= ?
  `);
  const result = stmt.get(userId, todayStart.toISOString());
  return result ? result.count : 0;
}

// ==========================================
// TRANSLATION DATABASE HELPERS (CACHE)
// ==========================================

export function insertTranslation({ debate_id, target_language, translated_transcript, translated_verdict }) {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO translations (debate_id, target_language, translated_transcript, translated_verdict)
    VALUES (?, ?, ?, ?)
  `);
  stmt.run(debate_id, target_language, translated_transcript, translated_verdict);
}

export function getTranslation(debate_id, target_language) {
  const stmt = db.prepare('SELECT translated_transcript, translated_verdict FROM translations WHERE debate_id = ? AND target_language = ?');
  return stmt.get(debate_id, target_language) || null;
}

// ==========================================
// METRICS DATABASE HELPERS
// ==========================================

export function getDatabaseMetrics() {
  const totalCount = db.prepare('SELECT COUNT(*) as count FROM debates').get().count;
  const avgDuration = db.prepare('SELECT AVG(duration_ms) as avg_dur FROM debates').get().avg_dur || 0;
  
  // Aggregate winner metrics
  const rows = db.prepare('SELECT verdict, language FROM debates').all();
  let winSplit = { A: 0, B: 0, Draw: 0 };
  let languageUsage = {};

  rows.forEach((row) => {
    // Winner tally
    try {
      const parsed = JSON.parse(row.verdict);
      const winner = parsed.winner;
      if (winner === 'A' || winner === 'B') {
        winSplit[winner]++;
      } else {
        winSplit.Draw++;
      }
    } catch (e) {
      winSplit.Draw++;
    }

    // Language usage
    const lang = row.language || 'English';
    languageUsage[lang] = (languageUsage[lang] || 0) + 1;
  });

  return {
    total_debates: totalCount,
    avg_duration_ms: avgDuration,
    win_split: winSplit,
    languages: languageUsage
  };
}
