import type { FastifyInstance } from "fastify";
import type { InjectOptions } from "light-my-request";
import { applyTestEnv } from "./db.js";

applyTestEnv();

export const buildTestApp = async (): Promise<FastifyInstance> => {
  const { buildApp } = await import("../../src/app.js");
  const app = await buildApp();
  await app.ready();
  return app;
};

export const randomIp = (): string =>
  `10.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`;

export const inject = (
  app: FastifyInstance,
  request: InjectOptions,
  ipAddress?: string,
) => {
  return app.inject({
    remoteAddress: ipAddress || randomIp(),
    ...request,
  });
};

export const authHeaders = (
  accessToken: string,
  extraHeaders: Record<string, string> = {},
): Record<string, string> => ({
  authorization: `Bearer ${accessToken}`,
  ...extraHeaders,
});
