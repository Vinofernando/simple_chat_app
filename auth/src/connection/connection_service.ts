import { pool } from "../config/db.js";
import type {
  FriendListQuery,
  FriendRequestStatus,
} from "../types/connection.js";

export const addFriend = async (from: number, friendCode: string) => {
  try {
    if (!from) {
      throw new Error("User belum login");
    }
    if (friendCode.trim().length <= 0) {
      throw new Error("User tidak ditemukan");
    }
    const findUser = await pool.query(
      `SELECT friend_code, id FROM users WHERE friend_code = $1`,
      [friendCode],
    );

    if (findUser.rows.length <= 0) {
      throw new Error("User not found");
    }

    const userData = findUser.rows[0];

    const existedData = await pool.query(
      `SELECT * FROM user_connection WHERE from_id = $1 AND to_id = $2`,
      [from, userData.id],
    );

    const connectionData = existedData.rows[0];

    if (existedData.rows.length > 0 && connectionData.status === "pending") {
      throw new Error("Permintaan sudah dikirim, silahkan tunggu");
    }

    await pool.query(
      `INSERT INTO user_connection(from_id, to_id) values($1, $2)`,
      [from, userData.id],
    );

    return {
      message: "Berhasil membuat permintaan teman",
    };
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }

    throw new Error("Unknown error");
  }
};

export const handleFriendRequest = async (
  from: number,
  to: number,
  status: FriendRequestStatus,
) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const findId = await client.query(
      `SELECT user_connection_id FROM user_connection WHERE from_id = $1 AND to_id = $2`,
      [from, to],
    );

    if (findId.rows.length > 0 && status === "accept") {
      throw new Error("Permintaan sudah ada");
    }

    if (findId.rows.length === 0 && status === "accept") {
      throw new Error("Permintaan ditolak: Membuat permintaan ke akun sendiri");
    }

    if (from === to) {
      throw new Error("Permintaan ditolak: Membuat permintaan ke akun sendiri");
    }

    switch (status) {
      case "accept":
        await client.query(
          "UPDATE user_connection set status = $1 WHERE from_id = $2 AND to_id = $3",
          ["friend", to, from],
        );

        await client.query(
          "INSERT INTO user_connection(from_id, to_id, status) VALUES($1, $2, $3)",
          [from, to, "friend"],
        );
        break;

      case "cancel":
        await client.query(
          "DELETE FROM user_connection WHERE from_id = $1 AND to_id = $2",
          [from, to],
        );
        break;
      case "delete":
        await client.query(
          `DELETE FROM user_connection WHERE (from_id = $1 AND to_id = $2) OR (from_id = $2 AND to_id = $1)`,
          [from, to],
        );
        break;
      case "block":
        await client.query(
          `UPDATE user_connection SET status = $1 WHERE from_id = $2 AND to_id = $3`,
          ["block", from, to],
        );
        break;
      case "unblock":
        await client.query(
          `UPDATE user_connection SET status = $1 WHERE from_id = $2 AND to_id = $3`,
          ["friend", from, to],
        );
        break;
    }
    await client.query("COMMIT");

    return {
      message: "Berhasil mengupdate permintaan",
    };
  } catch (err) {
    if (err instanceof Error) {
      await client.query("ROLLBACK");
      throw err;
    }
    throw new Error("Unknown error");
  } finally {
    client.release();
  }
};

export const friendList = async (
  username: string,
  searchByName: FriendListQuery,
) => {
  try {
    let query =
      "select u.username AS from_user, friend.username AS to_user, friend.friend_code, uc.status FROM user_connection uc LEFT JOIN users u on u.id = uc.from_id LEFT JOIN users friend on friend.id = uc.to_id";

    const condition = [];
    const values = [];

    values.push(username, "friend");

    query += ` WHERE u.username = $${values.length - 1} AND uc.status = $${values.length}`;

    if (searchByName.searchByName) {
      values.push(`%${searchByName.searchByName}%`);
      condition.push(`friend.username ILIKE $${values.length}`);
      query += " AND " + condition.join();
    }

    const result = await pool.query(query, values);
    return {
      message: "Berhasil mendapatkan friend list",
      data: result.rows,
    };
  } catch (err) {
    if (err instanceof Error) {
      await pool.query("ROLLBACK");
      throw err;
    }
    throw new Error("Unknown error");
  }
};
