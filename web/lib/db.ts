import sqlite3 from 'sqlite3';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';

const DB_PATH = process.env.DATABASE_PATH || './data/agent-manager.db';

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Create database connection
const db = new sqlite3.Database(DB_PATH);

// Promisify database methods
const run = promisify(db.run.bind(db));
const get = promisify(db.get.bind(db));
const all = promisify(db.all.bind(db));

// Initialize tables
export async function initDatabase(): Promise<void> {
  await run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS bots (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      status TEXT DEFAULT 'draft',
      
      persona_name TEXT,
      persona_profession TEXT,
      persona_description TEXT,
      persona_photo_url TEXT,
      
      service_name TEXT,
      service_description TEXT,
      service_category TEXT,
      
      prompt TEXT,
      llm_model TEXT DEFAULT 'gpt-5.4-mini',
      temperature REAL DEFAULT 0.2,
      
      mcp_services TEXT DEFAULT '[]',
      
      rag_enabled BOOLEAN DEFAULT 0,
      rag_docs_path TEXT,
      
      deployed_at DATETIME,
      public_url TEXT,
      k8s_deployment_name TEXT,
      
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS bot_documents (
      id TEXT PRIMARY KEY,
      bot_id TEXT NOT NULL,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      mime_type TEXT,
      size INTEGER,
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (bot_id) REFERENCES bots(id) ON DELETE CASCADE
    )
  `);

  await run(`CREATE INDEX IF NOT EXISTS idx_bots_user_id ON bots(user_id)`);
  await run(`CREATE INDEX IF NOT EXISTS idx_bots_status ON bots(status)`);
}

// User operations
export const UserDB = {
  create: async (email: string, password: string, name: string) => {
    const id = uuidv4();
    const hashedPassword = bcrypt.hashSync(password, 10);
    await run(
      'INSERT INTO users (id, email, password, name) VALUES (?, ?, ?, ?)',
      [id, email, hashedPassword, name]
    );
    return { id, email, name };
  },

  findByEmail: async (email: string) => {
    const row = await get('SELECT * FROM users WHERE email = ?', [email]);
    return row as any;
  },

  findById: async (id: string) => {
    const row = await get('SELECT id, email, name, created_at FROM users WHERE id = ?', [id]);
    return row as any;
  },

  validatePassword: (user: any, password: string) => {
    return bcrypt.compareSync(password, user.password);
  },
};

// Bot operations
export const BotDB = {
  create: async (userId: string, data: any) => {
    const id = uuidv4();
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    await run(
      `INSERT INTO bots (
        id, user_id, name, slug, persona_name, persona_profession, 
        persona_description, persona_photo_url, service_name, service_description,
        service_category, prompt, llm_model, temperature, mcp_services, 
        rag_enabled, rag_docs_path
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, userId, data.name, slug, data.personaName, data.personaProfession,
        data.personaDescription, data.personaPhotoUrl, data.serviceName,
        data.serviceDescription, data.serviceCategory, data.prompt, data.llmModel,
        data.temperature, JSON.stringify(data.mcpServices || []), 
        data.ragEnabled ? 1 : 0, data.ragDocsPath
      ]
    );
    return { id, slug };
  },

  update: async (id: string, userId: string, data: any) => {
    const setClause: string[] = [];
    const values: any[] = [];
    
    const fields = [
      'name', 'persona_name', 'persona_profession', 'persona_description',
      'persona_photo_url', 'service_name', 'service_description', 'service_category',
      'prompt', 'llm_model', 'temperature', 'rag_enabled', 'rag_docs_path'
    ];
    
    fields.forEach(field => {
      if (data[field] !== undefined) {
        setClause.push(`${field} = ?`);
        values.push(data[field]);
      }
    });
    
    if (data.mcpServices !== undefined) {
      setClause.push('mcp_services = ?');
      values.push(JSON.stringify(data.mcpServices));
    }
    
    setClause.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id, userId);
    
    await run(`UPDATE bots SET ${setClause.join(', ')} WHERE id = ? AND user_id = ?`, values);
  },

  findById: async (id: string, userId: string) => {
    const bot = await get('SELECT * FROM bots WHERE id = ? AND user_id = ?', [id, userId]) as any;
    if (bot) {
      bot.mcp_services = JSON.parse(bot.mcp_services || '[]');
      bot.rag_enabled = Boolean(bot.rag_enabled);
    }
    return bot;
  },

  findByUserId: async (userId: string) => {
    const bots = await all('SELECT * FROM bots WHERE user_id = ? ORDER BY created_at DESC', [userId]) as any[];
    return bots.map(bot => ({
      ...bot,
      mcp_services: JSON.parse(bot.mcp_services || '[]'),
      rag_enabled: Boolean(bot.rag_enabled),
    }));
  },

  updateStatus: async (id: string, userId: string, status: string, deploymentData?: any) => {
    await run(
      `UPDATE bots SET 
        status = ?, 
        deployed_at = CASE WHEN ? = 'published' THEN CURRENT_TIMESTAMP ELSE deployed_at END,
        public_url = ?,
        k8s_deployment_name = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?`,
      [
        status, 
        status,
        deploymentData?.publicUrl || null,
        deploymentData?.deploymentName || null,
        id, 
        userId
      ]
    );
  },

  delete: async (id: string, userId: string) => {
    await run('DELETE FROM bots WHERE id = ? AND user_id = ?', [id, userId]);
  },
};

// Document operations
export const DocumentDB = {
  create: async (botId: string, filename: string, originalName: string, mimeType: string, size: number) => {
    const id = uuidv4();
    await run(
      'INSERT INTO bot_documents (id, bot_id, filename, original_name, mime_type, size) VALUES (?, ?, ?, ?, ?, ?)',
      [id, botId, filename, originalName, mimeType, size]
    );
    return { id, filename };
  },

  findByBotId: async (botId: string) => {
    const rows = await all('SELECT * FROM bot_documents WHERE bot_id = ? ORDER BY uploaded_at DESC', [botId]);
    return rows as any[];
  },

  delete: async (id: string, botId: string) => {
    await run('DELETE FROM bot_documents WHERE id = ? AND bot_id = ?', [id, botId]);
  },
};

export default db;
