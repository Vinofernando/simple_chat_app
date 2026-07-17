import { Pool } from "pg";
import type { PoolConfig } from "pg";
import dotenv from "dotenv";
dotenv.config();

const poolConfig: PoolConfig = {
  user: process.env.DATABASE_USER,
  host: process.env.DATABASE_HOST,
  password: process.env.DATABASE_PASS,
  database: process.env.DATABASE_NAME,
  port: Number(process.env.DATABASE_PORT),
};

export const pool = new Pool(poolConfig);
