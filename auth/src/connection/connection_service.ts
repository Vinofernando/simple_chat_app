import { pool } from "../config/db.js";
import type {
  FriendListQuery,
  FriendRequestStatus,
} from "../types/connection.js";

export const addFriend = async (
  from: number,
  friendCode: string,
  userCode: string,
) => {
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

    // const findUser = await pool.query(
    //   `SELECT id FROM users WHERE friend_code = $1`,
    //   [friendCode],
    // );

    const findUserFromCode = await pool.query(
      `SELECT to_code FROM user_connection WHERE from_id = $1 AND to_code = $2`,
      [findUser.rows[0].id, userCode],
    );

    if (findUserFromCode.rows.length > 0) {
      const updateConnection = await pool.query(
        `UPDATE user_connection SET status = $1 WHERE from_id = $2 AND to_code = $3`,
        ["friend", findUser.rows[0].id, userCode],
      );
      const insertConnection = await pool.query(
        `INSERT INTO user_connection(from_id, to_code, status, from_code) VALUES($1,$2,$3, $4) `,
        [from, friendCode, "friend", userCode],
      );

      return {
        message:
          "Berhasil membuat permintaan teman, user lain sudah mengirim permintaan yang sama",
      };
    }
    const findSelfCode = await pool.query(
      `SELECT friend_code FROM users WHERE id = $1`,
      [from],
    );

    if (findSelfCode.rows[0].friend_code === friendCode) {
      throw new Error("Permintaan ditolak! Membuat permintaan ke diri sendiri");
    }
    if (findUser.rows.length <= 0) {
      throw new Error("User not found");
    }

    const userData = findUser.rows[0];

    const existedData = await pool.query(
      `SELECT * FROM user_connection WHERE from_id = $1 AND to_code = $2`,
      [from, friendCode],
    );

    const connectionData = existedData.rows[0];

    if (existedData.rows.length > 0 && connectionData.status === "pending") {
      throw new Error("Permintaan sudah dikirim, silahkan tunggu");
    }

    await pool.query(
      `INSERT INTO user_connection(from_id, to_code, from_code) values($1, $2, $3)`,
      [from, friendCode, userCode],
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
  fromId: number,
  toCode: string,
  fromCode: string,
  status: FriendRequestStatus,
) => {
  const client = await pool.connect();
  const getFromCode = await pool.query(
    `SELECT friend_code FROM users WHERE friend_code = $1`,
    [fromCode],
  );

  if (getFromCode.rows.length === 0) {
    throw new Error("User tidak ditemukan");
  }

  try {
    await client.query("BEGIN");
    const findUser = await client.query(
      `SELECT user_connection_id, status FROM user_connection WHERE from_code = $1 AND to_code = $2`,
      [fromCode, toCode],
    );

    if (findUser.rows.length > 0 && findUser.rows[0].status === "accept") {
      throw new Error("Sudah berteman");
    }

    switch (status) {
      case "accept":
        await client.query(
          "UPDATE user_connection set status = $1 WHERE from_code = $2 AND to_code = $3",
          ["friend", fromCode, toCode],
        );

        await client.query(
          "INSERT INTO user_connection(from_id, to_code, status, from_code) VALUES($1, $2, $3, $4)",
          [fromId, fromCode, "friend", toCode],
        );
        break;

      case "cancel":
        const result = await client.query(
          "DELETE FROM user_connection WHERE (from_code = $1 AND to_code = $2) OR (from_code = $2 AND to_code = $1)",
          [fromCode, toCode],
        );
        console.log(result.rows);
        break;
      // need rebuilt
      case "delete":
        await client.query(
          `DELETE FROM user_connection WHERE (from_id = $1 AND to_code = $2) OR (from_id = $2 AND to_code = $1)`,
          [fromId, toCode],
        );
        break;
      // need rebuilt
      case "block":
        await client.query(
          `UPDATE user_connection SET status = $1 WHERE from_id = $2 AND to_code = $3`,
          ["block", fromId, toCode],
        );
        break;
      // need rebuilt
      case "unblock":
        await client.query(
          `UPDATE user_connection SET status = $1 WHERE from_id = $2 AND to_code = $3`,
          ["friend", fromId, toCode],
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
      "select u.username AS from_user, friend.username AS to_name, friend.friend_code, uc.status FROM user_connection uc LEFT JOIN users u on u.id = uc.from_id LEFT JOIN users friend on friend.friend_code = uc.to_code";

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

export const getFriendRequest = async (userId: string) => {
  try {
    const getRequest = await pool.query(
      `select u.username AS from_user, friend.username AS to_name, friend.friend_code, uc.status, u.friend_code AS from_code FROM user_connection uc LEFT JOIN users u on u.id = uc.from_id LEFT JOIN users friend on friend.friend_code = uc.to_code WHERE to_code = $1 AND status = $2`,
      [userId, "pending"],
    );

    console.log(getRequest);
    return {
      message: "Berhasil mendapatkan permintaan teman",
      data: getRequest.rows,
    };
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error("Unknown error");
  }
};

export const getSendedRequest = async (userId: number) => {
  try {
    const getRequest = await pool.query(
      `select u.username AS from_user, friend.username AS to_name, friend.friend_code, uc.status FROM user_connection uc LEFT JOIN users u on u.id = uc.from_id LEFT JOIN users friend on friend.friend_code = uc.to_code WHERE from_id = $1 AND status = $2`,
      [userId, "pending"],
    );

    return {
      message: "Berhasil mendapatkan list request user",
      data: getRequest.rows,
    };
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error("Unknown error");
  }
};

export const getFriendByCode = async (friendCode: string) => {
  try {
    const getFriendProfile = await pool.query(
      `SELECT username, friend_code FROM users WHERE friend_code = $1`,
      [friendCode],
    );

    return {
      message: "Berhasil mendapatkan profile user",
      data: getFriendProfile.rows,
    };
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error("Unknown error");
  }
};
