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
    const user = (req as any).user;

    console.log(user);
    if (!user) {
      return res
        .status(401)
        .send({ message: "User harus login untuk menggunakan fitur ini" });
    }

    console.log("User terdeteksi:", user);

    // Gunakan user.id yang sudah pasti aman dari hulu middleware
    const result = await connectionService.addFriend(user.id, friendCode);
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

    const { toId, status } = req.body as {
      toId: number;
      status: FriendRequestStatus;
    };

    console.log(toId, status);
    const result = await connectionService.handleFriendRequest(
      req.user.id,
      toId,
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
