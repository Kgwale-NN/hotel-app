import "dotenv/config";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || undefined,
  connectionTimeoutMillis: 5000,
});

pool.on("error", () => {
  console.error("An idle PostgreSQL connection encountered an error.");
});

export default pool;