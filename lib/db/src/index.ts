import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 10, // Maximum number of clients in the pool
  idleTimeoutMillis: 10000, // How long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 5000, // How long to wait when connecting a new client
  // Add connection timeout to prevent hanging
  query_timeout: 10000, // Query timeout in milliseconds
});
export const db = drizzle(pool, { schema });

export * from "./schema";
