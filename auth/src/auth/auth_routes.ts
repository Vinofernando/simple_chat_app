import type { FastifyInstance } from "fastify";
import { registerControl, loginControl } from "./auth_controller.js";
import verifyAuth from "../middleware/authMiddleware.js";
import getRefreshToken from "../middleware/refreshToken.js";

export default async function authRoutes(app: FastifyInstance) {
  app.post("/register", registerControl);
  app.post("/login", loginControl);
  app.get("/profile", { preHandler: [verifyAuth] }, async (req, res) => {
    return { user: req.user };
  });
  app.get("/refresh", async (req, res) => {
    const result = getRefreshToken(req, res, app);
    return result;
  });
}
