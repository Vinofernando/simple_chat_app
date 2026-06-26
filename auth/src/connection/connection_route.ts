import type { FastifyInstance } from "fastify";
import {
  addFriendControl,
  handleRequestController,
} from "./connection_controller.js";
import verifyAuth from "../middleware/authMiddleware.js";

export default function connectionRoute(app: FastifyInstance) {
  app.post("/add-friend", { preHandler: [verifyAuth] }, addFriendControl);
  app.post(
    "/friend-request",
    { preHandler: [verifyAuth] },
    handleRequestController,
  );
}
