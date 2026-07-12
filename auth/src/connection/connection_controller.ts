import type { FastifyRequest, FastifyReply } from "fastify";
import * as connectionService from "./connection_service.js";
import type {
  FriendListQuery,
  FriendRequestStatus,
} from "../types/connection.js";

export const addFriendControl = async (
  req: FastifyRequest,
  res: FastifyReply,
) => {
  try {
    const { friendCode } = req.body as { friendCode: string };

    // Ambil dari context alternatif yang kita buat

    if (!req.user) {
      return res
        .status(401)
        .send({ message: "User harus login untuk menggunakan fitur ini" });
    }

    console.log(req.user.id);
    console.log(friendCode);
    // Gunakan user.id yang sudah pasti aman dari hulu middleware
    const result = await connectionService.addFriend(req.user.id, friendCode);
    res.status(201).send(result);
  } catch (err) {
    if (err instanceof Error) {
      return res.status(500).send({ error: err.message });
    }
    res.status(500).send({ error: "Unknown error" });
  }
};

export const handleRequestController = async (
  req: FastifyRequest,
  res: FastifyReply,
) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .send({ message: "User harus login untuk menggunakan fitur ini" });
    }

    const { fromId, toCode, status } = req.body as {
      fromId: number;
      toCode: string;
      status: FriendRequestStatus;
    };

    console.log(fromId);
    const result = await connectionService.handleFriendRequest(
      fromId,
      toCode,
      req.user.id,
      status,
    );

    console.log(result);
    res.status(201).send(result);
  } catch (err) {
    if (err instanceof Error) {
      return res.status(500).send({ error: err.message });
    }
    res.status(500).send({ error: "Unknown error" });
  }
};

export const friendListControl = async (
  req: FastifyRequest,
  res: FastifyReply,
) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .send({ message: "User harus login untuk menggunakan fitur ini" });
    }

    const searchByName = req.query as FriendListQuery;
    const result = await connectionService.friendList(
      req.user.name,
      searchByName ?? null,
    );
    res.status(200).send(result);
  } catch (err) {
    if (err instanceof Error) {
      return res.status(500).send({ error: err.message });
    }
    res.status(500).send({ error: "Unknown error" });
  }
};

export const getHandleRequestControl = async (
  req: FastifyRequest,
  res: FastifyReply,
) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .send({ message: "User harus login untuk menggunakan fitur ini" });
    }

    console.log(req.user.friendCode);
    const result = await connectionService.getFriendRequest(
      req.user.friendCode,
    );

    res.status(200).send(result);
  } catch (err) {
    if (err instanceof Error) {
      return res.status(500).send({ error: err.message });
    }
    res.status(500).send({ error: "Unknown error" });
  }
};

export const getSendedRequestControl = async (
  req: FastifyRequest,
  res: FastifyReply,
) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .send({ message: "User harus login untuk menggunakan fitur ini" });
    }

    const result = await connectionService.getSendedRequest(req.user.id);

    res.status(200).send(result);
  } catch (err) {
    if (err instanceof Error) {
      return res.status(500).send({ error: err.message });
    }
    res.status(500).send({ error: "Unknown error" });
  }
};

export const getFriendByCodeControl = async (
  req: FastifyRequest,
  res: FastifyReply,
) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .send({ message: "User harus login untuk menggunakan fitur ini" });
    }

    const { friendCode } = req.query as { friendCode: string };

    const decodedFriendCode = friendCode ? decodeURIComponent(friendCode) : "";
    const result = await connectionService.getFriendByCode(decodedFriendCode);

    res.status(200).send(result);
  } catch (err) {
    if (err instanceof Error) {
      return res.status(500).send({ error: err.message });
    }
    res.status(500).send({ error: "Unknown error" });
  }
};
