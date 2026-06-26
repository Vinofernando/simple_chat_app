import { pool } from "../config/db.js";

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
      throw new Error("Sudah membuat permintaan, silahkan tunggu");
    } else if (
      connectionData.status === "rejected" ||
      connectionData.status === "accepted"
    ) {
      throw new Error("Hubungan user sudah ditentukan");
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
  status: string,
) => {
  const client = await pool.connect();
  try {
    const updateResult = await pool.query(
      `UPDATE user_connection SET status = $1 WHERE from_id = $2 AND to_id = $3`,
      [status, to, from],
    );

    console.log(updateResult);
    if (updateResult.rowCount === 0) {
      throw new Error("Gagal mengupdate permintaan");
    }

    const existedConnection = await pool.query(
      `SELECT user_connection_id WHERE from_id = $1 AND status = $2 OR $3`,
      [to, "accepted", "rejected"],
    );

    if (status === "accepted" && updateResult.rowCount !== 0) {
      await client.query("BEGIN");
      await client.query(
        "UPDATE user_connection set status = $1 WHERE from_id = $2 AND to_id = $3",
        [status, to, from],
      );

      await client.query(
        "INSERT INTO user_connection(from_id, to_id, status) VALUES($1, $2, $3)",
        [from, to, status],
      );

      await client.query("COMMIT");
    } else if (status === "rejected" && updateResult.rowCount !== 0) {
      await client.query(
        "UPDATE user_connection set status = $1 WHERE from_id = $2 AND to_id = $3",
        [status, from, to],
      );
    }

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
