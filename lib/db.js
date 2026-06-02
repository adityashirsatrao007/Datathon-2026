import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';

const dbPath = path.join(process.cwd(), 'data', 'ksp_crime.db');

let dbInstance = null;

function getDB() {
  if (!dbInstance) {
    if (!fs.existsSync(dbPath)) {
      throw new Error(`Database file not found at ${dbPath}. Please run seeding first.`);
    }
    dbInstance = new DatabaseSync(dbPath);
  }
  return dbInstance;
}

export function query(sql, params = []) {
  try {
    const db = getDB();
    const stmt = db.prepare(sql);
    return stmt.all(...params);
  } catch (error) {
    console.error("Database query error:", error);
    throw error;
  }
}

export function run(sql, params = []) {
  try {
    const db = getDB();
    const stmt = db.prepare(sql);
    return stmt.run(...params);
  } catch (error) {
    console.error("Database execution error:", error);
    throw error;
  }
}

export { getDB };
