import { applyTestEnv, closeTestPool, dropTestDatabase } from "./helpers/db.js";

export default async function globalTeardown(): Promise<void> {
  applyTestEnv();
  await closeTestPool();
  await dropTestDatabase();
}
