import websocket from "@fastify/websocket";
import type { FastifyInstance } from "fastify";

export const registerWebSocket = async (app: FastifyInstance) => {
  await app.register(websocket);
};
