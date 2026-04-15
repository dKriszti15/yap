import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { users } from "./schema.js";

const connectionString =
	process.env.DATABASE_URL ?? "postgres://dev:dev@localhost:5432/discord";

export const pool = new Pool({ connectionString });

export const db = drizzle(pool, {
	schema: { users },
});

export { users };

export async function closeDbPool() {
	await pool.end();
}
