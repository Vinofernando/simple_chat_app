import Fastify from "fastify";
import fastifyJwt from "@fastify/jwt";
import dotenv from "dotenv";
import authRoutes from "./auth/auth_routes.js";
import connectionRoute from "./connection/connection_route.js";
import fastifyCookie from "@fastify/cookie";
import cors from "@fastify/cors";
import { connectMongo } from "./config/mongodb.js";
import { registerWebSocket } from "./config/websocket.js";
import { WebsocketService } from "./websocket/websocket_service.js";
import type { PrivateMessage } from "./websocket/websocket_service.js";
import { registerWebSocketGateway } from "./websocket/websocket.gateway.js";
dotenv.config();

const app = Fastify({ logger: true });
const db = await connectMongo();

await registerWebSocket(app);

await app.register(cors, {
  // Allow single domain, multiple domains, or regex
  origin: true,

  // Explicitly allow specific HTTP methods
  methods: ["GET", "POST", "PUT", "DELETE"],

  // Allow specific custom headers from the frontend
  allowedHeaders: ["Content-Type", "Authorization"],

  // Set to true if your client sends cookies or authorization headers
  credentials: true,
});

const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;
const COOKIE_SECRET = process.env.COOKIE_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT SECRET is missing");
}
if (!REFRESH_TOKEN_SECRET) {
  throw new Error("REFRESH TOKEN SECRET is missing");
}

if (!COOKIE_SECRET) {
  throw new Error("COOKIE SECRET is missing");
}

await app.register(fastifyJwt, {
  secret: JWT_SECRET,
});

await app.register(fastifyJwt, {
  secret: REFRESH_TOKEN_SECRET,
  namespace: "refresh",
});

await app.register(fastifyCookie, {
  secret: COOKIE_SECRET, // Berikan secret untuk menandai (sign) cookie agar tidak bisa dimanipulasi
});

const privateMessageCollection =
  db.collection<PrivateMessage>("private_message");
const webSocketService = new WebsocketService(privateMessageCollection);

registerWebSocketGateway(app, webSocketService);
app.register(authRoutes, { prefix: "/auth" });
app.register(connectionRoute, { prefix: "/connection" });

try {
  app.listen({ port: 3000, host: "0.0.0.0" });
  console.log("Server running at 127.0.0.1:3000");
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
