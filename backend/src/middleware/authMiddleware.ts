import type { FastifyRequest, FastifyReply } from "fastify";

export default async function verifyAuth(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const token = request.cookies.access_token;

  if (!token) {
    return reply.status(401).send("Unauthorized");
  }

  try {
    const decoded = request.server.jwt.verify(token);
    request.user = decoded as any;
  } catch (err) {
    return reply
      .status(401)
      .send({ message: "Token kedaluwarsa atau tidak valid" });
  }
}
