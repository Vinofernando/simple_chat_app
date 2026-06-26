import type { FastifyRequest, FastifyReply } from "fastify";
import * as authService from "./auth_service.js";
import type { User } from "../interfaces/interface.js";

export const registerControl = async (
  req: FastifyRequest<{
    Body: User;
  }>,
  res: FastifyReply,
) => {
  try {
    const body = req.body;
    const result = await authService.register(body);

    res.status(201).send(result);
  } catch (err) {
    if (err instanceof Error) {
      res.status(400).send({
        message: err.message,
      });
    } else {
      res.status(500).send({
        message: "Unexpected error",
      });
    }
  }
};

export const loginControl = async (
  req: FastifyRequest<{
    Body: User;
  }>,
  res: FastifyReply,
) => {
  try {
    const body = req.body;
    const result = await authService.login(req.server, res, body);
    res.status(200).send(result);
  } catch (err) {
    if (err instanceof Error) {
      res.status(400).send({
        message: err.message,
      });
    } else {
      res.status(500).send({
        message: "Unexpecter error",
      });
    }
  }
};
