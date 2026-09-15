import fs from 'fs';
import path from 'path';
import pg from 'pg';
import { PGlite } from '@electric-sql/pglite';
import { SCHEMA_SQL } from './schema.ts';

export interface QueryResult<T = any> {
  rows: T[];
  rowCount?: number;
}

export interface DatabaseClient {
  query<T = any>(text: string, params?: any[]): Promise<QueryResult<T>>;
  transaction<T>(callback: (client: { query<R = any>(text: string, params?: any[]): Promise<QueryResult<R>> }) => Promise<T>): Promise<T>;
  init(): Promise<void>;
  close(): Promise<void>;
}

class PostgresDatabase implements DatabaseClient {
  private pglite: PGlite | null = null;
  private pgPool: pg.Pool | null = null;
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;
  private dataDir: string;

  constructor() {
    this.dataDir = path.resolve(process.cwd(), 'data', 'postgres_db');
  }

  async init(options?: { forceAutoMigrate?: boolean; skipAutoMigrate?: boolean }): Promise<void> {
    if (this.isInitialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      const databaseUrl = process.env.DATABASE_URL;
      let poolConnected = false;

      // Only attempt external PostgreSQL if explicitly specified with USE_EXTERNAL_PG=true
      if (process.env.USE_EXTERNAL_PG === 'true' && databaseUrl) {
        try {
          const pool = new pg.Pool({
            connectionString: databaseUrl,
            connectionTimeoutMillis: 2000,
          });
          await pool.query('SELECT 1');
          this.pgPool = pool;
          poolConnected = true;
          console.log('Connected to external PostgreSQL database via DATABASE_URL');
        } catch (err: any) {
          console.warn('External PostgreSQL connection failed, using embedded PostgreSQL engine (PGlite)');
        }
      }

      if (!poolConnected && !this.pglite) {
        let initialized = false;

        // Step 1: Pre-sanitize directory if it has corrupted state or stale locks
        try {
          if (fs.existsSync(this.dataDir)) {
            const pidFile = path.join(this.dataDir, 'postmaster.pid');
            if (fs.existsSync(pidFile)) {
              try {
                fs.unlinkSync(pidFile);
                console.log('Removed stale postmaster.pid lock file');
              } catch {}
            }
            const versionFile = path.join(this.dataDir, 'PG_VERSION');
            const confFile = path.join(this.dataDir, 'postgresql.conf');
            if (fs.existsSync(versionFile) && !fs.existsSync(confFile)) {
              console.warn('Detected incomplete PostgreSQL cluster (PG_VERSION without postgresql.conf). Recreating data directory...');
              fs.rmSync(this.dataDir, { recursive: true, force: true });
            }
          }
        } catch (dirErr: any) {
          console.warn('Directory pre-sanitize note:', dirErr.message);
        }

        // Step 2: Try initializing with dataDir
        try {
          if (!fs.existsSync(this.dataDir)) {
            fs.mkdirSync(this.dataDir, { recursive: true });
          }
          const instance = new PGlite(this.dataDir);
          await instance.waitReady;
          this.pglite = instance;
          initialized = true;
          console.log(`PostgreSQL engine (PGlite) ready at: ${this.dataDir}`);
        } catch (firstErr: any) {
          console.warn('PGlite initialization failed on persistent path:', firstErr.message);
          // Step 3: Clean corrupted directory and re-try fresh
          try {
            console.log('Cleaning corrupted directory and re-attempting fresh PGlite initialization...');
            fs.rmSync(this.dataDir, { recursive: true, force: true });
            fs.mkdirSync(this.dataDir, { recursive: true });
            const retryInstance = new PGlite(this.dataDir);
            await retryInstance.waitReady;
            this.pglite = retryInstance;
            initialized = true;
            console.log(`PostgreSQL engine (PGlite) recovered fresh at: ${this.dataDir}`);
          } catch (retryErr: any) {
            console.warn('PGlite filesystem retry failed:', retryErr.message);
          }
        }

        // Step 4: Fallback to in-memory mode if filesystem is restricted or failing
        if (!initialized || !this.pglite) {
          console.warn('Falling back to in-memory PGlite instance...');
          try {
            const memInstance = new PGlite();
            await memInstance.waitReady;
            this.pglite = memInstance;
            initialized = true;
            console.log('PostgreSQL engine (PGlite) running in in-memory mode');
          } catch (memErr: any) {
            console.error('Fatal PGlite memory initialization error:', memErr);
            throw new Error(`PGlite failed to initialize: ${memErr.message}`);
          }
        }
      }

      this.isInitialized = true;

      // Auto-ensure schema tables exist so applet never crashes in production/cloud containers
      try {
        const tableCheck = await this.rawQuery<{ table_name: string }>(
          "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
        );
        const existingTables = tableCheck.rows.map((r) => r.table_name);

        if (existingTables.includes('users') && existingTables.includes('business_units')) {
          console.log(`PostgreSQL database ready with ${existingTables.length} tables`);
        } else {
          console.log('PostgreSQL tables missing, auto-applying schema...');
          await this.applySchema();
          console.log('PostgreSQL schema initialized successfully');
        }
      } catch (checkErr: any) {
        console.warn('Database schema auto-check note:', checkErr.message);
      }
    })();

    await this.initPromise;
  }

  async applySchema(): Promise<void> {
    let sql = SCHEMA_SQL;
    try {
      const schemaPath = path.resolve(process.cwd(), 'server', 'src', 'db', 'schema.sql');
      if (fs.existsSync(schemaPath)) {
        sql = fs.readFileSync(schemaPath, 'utf8');
      }
    } catch {}

    if (this.pgPool) {
      await this.pgPool.query(sql);
    } else if (this.pglite) {
      await this.pglite.exec(sql);
    }
  }

  async exec(sql: string): Promise<void> {
    if (!this.isInitialized) {
      await this.init({ skipAutoMigrate: true });
    }
    if (this.pgPool) {
      await this.pgPool.query(sql);
    } else if (this.pglite) {
      await this.pglite.exec(sql);
    } else {
      throw new Error('Database not initialized');
    }
  }

  async getMigrationStatus(): Promise<{ migrated: boolean; tables: string[]; userCount: number }> {
    try {
      const tableCheck = await this.rawQuery<{ table_name: string }>(
        "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
      );
      const tables = tableCheck.rows.map((r) => r.table_name);
      const hasCoreTables = tables.includes('users') && tables.includes('business_units') && tables.includes('orders');

      let userCount = 0;
      if (tables.includes('users')) {
        const userRes = await this.rawQuery('SELECT COUNT(*) as count FROM users');
        userCount = Number(userRes.rows[0]?.count || 0);
      }

      return {
        migrated: hasCoreTables,
        tables,
        userCount,
      };
    } catch (err) {
      return {
        migrated: false,
        tables: [],
        userCount: 0,
      };
    }
  }

  private async rawQuery<T = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
    if (this.pgPool) {
      const res = await this.pgPool.query(text, params);
      return { rows: res.rows as T[], rowCount: res.rowCount ?? res.rows.length };
    }
    if (this.pglite) {
      const res = await this.pglite.query(text, params);
      return { rows: res.rows as T[], rowCount: res.rows.length };
    }
    throw new Error('Database not initialized');
  }

  async query<T = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
    if (!this.isInitialized) {
      await this.init();
    }
    return this.rawQuery<T>(text, params);
  }

  async transaction<T>(callback: (client: { query<R = any>(text: string, params?: any[]): Promise<QueryResult<R>> }) => Promise<T>): Promise<T> {
    if (!this.isInitialized) {
      await this.init();
    }

    if (this.pgPool) {
      const client = await this.pgPool.connect();
      try {
        await client.query('BEGIN');
        const res = await callback({
          query: async (sql, params) => {
            const r = await client.query(sql, params);
            return { rows: r.rows, rowCount: r.rowCount ?? r.rows.length };
          },
        });
        await client.query('COMMIT');
        return res;
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    }

    if (this.pglite) {
      return await this.pglite.transaction(async (tx) => {
        return await callback({
          query: async <R = any>(sql: string, params?: any[]): Promise<QueryResult<R>> => {
            const r = await tx.query(sql, params);
            return { rows: r.rows as R[], rowCount: r.rows.length };
          },
        });
      });
    }

    throw new Error('Database not initialized');
  }

  async close(): Promise<void> {
    if (this.pgPool) {
      await this.pgPool.end();
      this.pgPool = null;
    }
    if (this.pglite) {
      await this.pglite.close();
      this.pglite = null;
    }
    this.isInitialized = false;
    this.initPromise = null;
  }
}

export const db = new PostgresDatabase();
