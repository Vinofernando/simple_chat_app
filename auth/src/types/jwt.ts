// jwt.ts

import type { FastifyInstance } from "fastify";

type JwtNamespace = FastifyInstance["jwt"] & {
  refresh: FastifyInstance["jwt"];
};

export function getRefreshJwt(fastify: FastifyInstance) {
  return (fastify.jwt as JwtNamespace).refresh;
}
