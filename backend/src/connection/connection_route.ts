import type { FastifyInstance } from "fastify";
import {
  addFriendControl,
  handleRequestController,
  friendListControl,
  getHandleRequestControl,
  getSendedRequestControl,
  getFriendByCodeControl,
} from "./connection_controller.js";
import verifyAuth from "../middleware/authMiddleware.js";

export default function connectionRoute(app: FastifyInstance) {
  app.post("/add-friend", { preHandler: [verifyAuth] }, addFriendControl);
  app.post(
    "/friend-request",
    { preHandler: [verifyAuth] },
    handleRequestController,
  );
  app.get("/friend-list", { preHandler: [verifyAuth] }, friendListControl);
  app.get(
    "/get-friend-request",
    { preHandler: verifyAuth },
    getHandleRequestControl,
  );
  app.get(
    "/sended-request",
    { preHandler: [verifyAuth] },
    getSendedRequestControl,
  );
  app.get(
    "/get-profile-by-code",
    { preHandler: [verifyAuth] },
    getFriendByCodeControl,
  );
}
