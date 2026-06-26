import Fastify from "fastify";
import fastifyWebsocket from "@fastify/websocket";
import { MongoClient, Collection } from "mongodb";
import dotenv from "dotenv";
import WebSocket from "ws";
import fastifyJwt from "@fastify/jwt";

dotenv.config();

const fastify = Fastify({ logger: true });
fastify.register(fastifyWebsocket);

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is missing");
}

fastify.register(fastifyJwt, {
  secret: JWT_SECRET,
});

interface UserTokenPayload {
  id: number;
  name: string;
  email: string;
}

interface PrivateMessage {
  from: string;
  to: string;
  text: string;
  createdAt: Date;
}

interface IncomingData {
  action: "register" | "kirim_chat" | "sedang_ketik" | "berhenti_mengetik";
  payload: {
    from: string;
    to: string;
    text: string;
  };
}

const MONGO_URI = "mongodb://127.0.0.1:27017";
const mongoClient = new MongoClient(MONGO_URI);

async function start() {
  try {
    await mongoClient.connect();
    const db = mongoClient.db("chat_app");
    const privateMessageCollection: Collection<PrivateMessage> =
      db.collection("private_mesage");
    fastify.log.info("MongoDB Connected Successfully via Fastify backend");

    const activeUsers = new Map<string, WebSocket>();

    fastify.register(async function (fastifyInstance) {
      fastifyInstance.get("/chat", { websocket: true }, async (socket, req) => {
        const ip = req.ip;
        fastify.log.info(`User terhubung via Fastify WebSocket: ${ip}`);

        const { token, to } = req.query as { token?: string; to?: string };

        const decoded = (await fastifyInstance.jwt.verify(
          token || "",
        )) as UserTokenPayload;

        console.log("[DEBUG DECODED JWT]:", decoded);
        const username = decoded.name;
        const formId = decoded.id;
        try {
          const riwayatPesan = await privateMessageCollection
            .find({
              $or: [
                { from: username, to: to },
                { from: to, to: username },
              ],
            })
            .sort({ createdAt: 1 })
            .toArray();

          socket.send(
            JSON.stringify({
              action: "riwayat_chat",
              payload: riwayatPesan,
            }),
          );

          // Otomatis daftarkan ke activeUsers begitu token terverifikasi
          activeUsers.set(username, socket);
          fastify.log.info(
            `[INFO] ${username} otomatis terdaftar lewat verifikasi JWT.`,
          );
        } catch (err) {
          fastify.log.error("Gagal mengambil riwayat dari MongoDB");
        }

        socket.on("message", async (rawData) => {
          try {
            const data: IncomingData = JSON.parse(rawData.toString());

            switch (data.action) {
              case "register":
                // const username = data.payload.from;
                activeUsers.set(username, socket);
                console.log(
                  `[INFO] ${username} terdaftar dengan socket private`,
                );
                break;

              case "kirim_chat":
                const { to, text } = data.payload;

                await privateMessageCollection.insertOne({
                  from: username,
                  to,
                  text,
                  createdAt: new Date(),
                });

                const recipientSocket = activeUsers.get(to);

                if (recipientSocket && recipientSocket.readyState === 1) {
                  recipientSocket.send(
                    JSON.stringify({
                      action: "terima_chat_private",
                      payload: { from: username, text },
                    }),
                  );
                }
                break;

              case "sedang_ketik":
                const recipientSocket2 = activeUsers.get(data.payload.to);
                if (recipientSocket2 && recipientSocket2.readyState === 1) {
                  recipientSocket2.send(
                    JSON.stringify({
                      action: "sedang_ketik",
                      payload: { name: username },
                    }),
                  );
                }
                break;

              case "berhenti_mengetik":
                const recipientSocket3 = activeUsers.get(data.payload.to);
                if (recipientSocket3 && recipientSocket3.readyState === 1) {
                  recipientSocket3.send(
                    JSON.stringify({
                      action: "berhenti_mengetik",
                      payload: { name: data.payload.from },
                    }),
                  );
                }
                break;

              default:
                fastify.log.warn("Action tidak dikenali oleh Fastify Server");
            }
          } catch (error) {
            fastify.log.error("Error memproses data atau format data salah");
          }
        });

        socket.on("close", () => {
          for (let [username, savedSocket] of activeUsers.entries()) {
            if (savedSocket === socket) {
              activeUsers.delete(username);
              fastify.log.info(`[INFO] ${username} terputus (koneksi ditutup)`);
              break;
            }
          }
        });
      });
    });

    await fastify.listen({ port: 8080, host: "0.0.0.0" });
  } catch (error) {
    fastify.log.error(error);
    process.exit(1);
  }
}

start();
