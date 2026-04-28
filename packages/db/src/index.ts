import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { friendships, groupMembers, groups, users } from "./schema.js";

const connectionString =
	process.env.DATABASE_URL ?? "postgres://dev:dev@localhost:5432/discord";

export const pool = new Pool({ connectionString });

export const db = drizzle(pool, {
	schema: { users, groups, groupMembers, friendships },
});

export { users, groups, groupMembers, friendships };

export async function closeDbPool() {
	await pool.end();
}
