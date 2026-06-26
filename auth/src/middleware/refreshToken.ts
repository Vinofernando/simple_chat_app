import type { FastifyRequest, FastifyReply, FastifyInstance } from "fastify";
import { getRefreshJwt } from "../types/jwt.js";
import { pool } from "../config/db.js";

export default async function getRefreshToken(
  req: FastifyRequest,
  res: FastifyReply,
  app: FastifyInstance,
) {
  const refreshToken = req.cookies.refresh_token;
  if (!refreshToken) {
    return res.status(401).send("Token tidak ditemukan");
  }

  try {
    const refreshJwt = getRefreshJwt(app);

    console.log("COOKIE:");
    console.log(refreshToken);
    const decode = refreshJwt.verify<{
      id: number;
      email: string;
      name: string;
    }>(refreshToken);

    const userResult = await pool.query(
      `SELECT id, username, email, refresh_token, friend_code FROM users WHERE email = $1`,
      [decode.email],
    );

    const user = userResult.rows[0];

    if (!user || user.refresh_token !== refreshToken) {
      return res
        .status(403)
        .send({ message: "Refresh token tidak valid / sudah dicabut" });
    }

    const newAccesToken = app.jwt.sign(
      {
        id: user.id,
        name: user.username,
        email: user.email,
        friendCode: user.friend_code,
      },
      { expiresIn: "15m" },
    );

    res.setCookie("access_token", newAccesToken, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60,
    });

    return {
      message: "Token berhasil diperbarui",
    };
  } catch (err: any) {
    return res.status(403).send({
      message: "Refresh token rusak atau tidak valid",
      reason: err.message,
    });
  }
}
