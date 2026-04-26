import {
  closeTestPool,
  applyTestEnv,
  truncateUserTables,
} from "./helpers/db.js";

applyTestEnv();

const maybeBeforeEach = (globalThis as any).beforeEach as
  | ((fn: () => Promise<void> | void) => void)
  | undefined;
const maybeAfterAll = (globalThis as any).afterAll as
  | ((fn: () => Promise<void> | void) => void)
  | undefined;

if (typeof maybeBeforeEach === "function") {
  maybeBeforeEach(async () => {
    await truncateUserTables();
  });

  maybeAfterAll?.(async () => {
    await closeTestPool();
  });
}
