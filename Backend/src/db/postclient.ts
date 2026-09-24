import { Pool } from "pg";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on("error", (err) => {

  console.error("Unexpected PostgreSQL client error", err);
  process.exit(1);
});

export async function query<T = any>(text: string, params?: any[]) {
  const start = Date.now();
  const result = await pool.query(text, params);
  
  return result as { rows: T[]; rowCount: number };
}

