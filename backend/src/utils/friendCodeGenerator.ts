import type { PoolClient } from "../../node_modules/@types/pg/index.js";

const w = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

function friendCodeGenerator() {
  let temp = "#";

  while (temp.length < 7) {
    temp += w[Math.floor(Math.random() * w.length)];
  }

  return temp;
}

export default async function generateUniqueFriendCode(client: PoolClient) {
  while (true) {
    const code = friendCodeGenerator();

    const { rows } = await client.query(
      "SELECT 1 FROM users WHERE friend_code = $1",
      [code],
    );

    if (rows.length === 0) {
      return code;
    }
  }
}
