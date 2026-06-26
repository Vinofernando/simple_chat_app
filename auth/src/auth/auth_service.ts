import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcrypt";
import { pool } from "../config/db.js";
import type { User } from "../interfaces/interface.js";
import type { FastifyInstance, FastifyReply } from "fastify";
import generateUniqueFriendCode from "../utils/friendCodeGenerator.js";
import { getRefreshJwt } from "../types/jwt.js";

const emailRegex: RegExp = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

function isValidEmail(email: string): boolean {
  return emailRegex.test(email);
}

function isValidPass(pass: string): boolean {
  return pass.length >= 8;
}

export const register = async (user: User) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    if (!user.name || !user.password || !user.email) {
      throw new Error("Cannot get body data");
    }
    const existedEmail = await client.query(
      `SELECT * FROM users WHERE email = $1`,
      [user.email],
    );

    if (!isValidEmail(user.email)) {
      throw new Error("Isi email sesuai dengan format email");
    }

    if (!isValidPass(user.password)) {
      throw new Error("Jumlah password minimal 8");
    }

    if (existedEmail.rows.length > 0) {
      throw new Error("Email sudah terdaftar");
    }

    const hashedPass = await bcrypt.hash(user.password, 10);
    const code = await generateUniqueFriendCode(client);

    const result = await client.query(
      `INSERT INTO users(username, email, password, friend_code) VALUES($1, $2, $3, $4) RETURNING *`,
      [user.name, user.email, hashedPass, code],
    );

    if (result.rowCount === 0) {
      throw new Error("Gagal registrasi ");
    }

    await client.query("COMMIT");
    return {
      status: "Success",
      message: "Akun berhasil terdafatar",
      data: result.rows,
    };
  } catch (err) {
    await client.query("ROLLBACK");
    if (err instanceof Error) {
      throw err;
    }

    throw new Error("Unknown error");
  } finally {
    client.release();
  }
};

export const login = async (
  fastify: FastifyInstance,
  reply: FastifyReply,
  user: User,
) => {
  try {
    const result = await pool.query(`SELECT * FROM users WHERE email = $1 `, [
      user.email,
    ]);

    if (result.rows.length <= 0) {
      throw new Error("Email atau password salah");
    }

    const userData = result.rows[0];

    const comparePass = await bcrypt.compare(user.password, userData.password);

    if (!comparePass) {
      throw new Error("Email atau password salah");
    }

    const payload = {
      id: userData.id,
      name: userData.username,
      email: userData.email,
      friendCode: userData.friend_code,
    };
    const token = fastify.jwt.sign(
      {
        id: payload.id,
        name: payload.name,
        email: payload.email,
        friendCode: payload.friendCode,
      },
      { expiresIn: "1d" },
    );

    const refreshJwt = getRefreshJwt(fastify);

    const refreshToken = refreshJwt.sign(
      {
        id: payload.id,
        name: payload.name,
        email: payload.email,
        friendCode: payload.friendCode,
      },
      {
        expiresIn: "7d",
      },
    );
    const refreshTokenResult = await pool.query(
      `UPDATE users SET refresh_token = $1 WHERE email = $2`,
      [refreshToken, user.email],
    );

    if (refreshTokenResult.rowCount === 0) {
      throw new Error("Refresh token gagal di buat, Silahkan login ulang");
    }

    reply.setCookie("access_token", token, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60,
    });

    reply.setCookie("refresh_token", refreshToken, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60,
    });

    return {
      message: "Login berhasil",
    };
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error("Unknown error");
  }
};
