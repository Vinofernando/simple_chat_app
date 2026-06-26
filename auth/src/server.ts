import Fastify from "fastify";
import fastifyJwt from "@fastify/jwt";
import dotenv from "dotenv";
import authRoutes from "./auth/auth_routes.js";
import connectionRoute from "./connection/connection_route.js";
import fastifyCookie from "@fastify/cookie";
dotenv.config();

const app = Fastify({ logger: true });

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
// console.log(app.jwt);
// console.log(app.refresh);
app.register(authRoutes, { prefix: "/auth" });
app.register(connectionRoute, { prefix: "/connection" });

console.log("JWT_SECRET:", JWT_SECRET);
console.log("REFRESH_SECRET:", REFRESH_TOKEN_SECRET);

try {
  app.listen({ port: 3000, host: "127.0.0.1" });
  console.log("Server running at 127.0.0.1:3000");
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
