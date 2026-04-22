import "dotenv/config";
import { createServer } from "http";
import app from "./app";
import { setupSocket } from "./socket";
import { logger } from "./lib/logger";

const rawPort = process.env["PORT"] || "4500";

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const httpServer = createServer(app);
setupSocket(httpServer);

httpServer.listen(port, () => {
  logger.info({ port }, "Server listening");
});
