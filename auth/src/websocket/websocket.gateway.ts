import type { FastifyInstance } from "fastify";
import { WebsocketService } from "./websocket_service.js";

interface UserTokenPayload {
  id: string;
  email: string;
  name: string;
}

interface IncomingData {
  action: "register" | "kirim_chat" | "sedang_ketik" | "berhenti_mengetik";
  payload: {
    from: string;
    to: string;
    text: string;
  };
}

export function registerWebSocketGateway(
  fastify: FastifyInstance,
  service: WebsocketService,
) {
  fastify.register(async function (fastifyInstance) {
    fastifyInstance.get("/chat", { websocket: true }, async (socket, req) => {
      const ip = req.ip;
      fastify.log.info(`User terhubung via websocket ${ip}`);

      try {
        const { token, to } = req.query as { token?: string; to?: string };

        const decoded = (await fastifyInstance.jwt.verify(
          token || "",
        )) as UserTokenPayload;

        const username = decoded.name;

        if (to) {
          const riwayatPesan = await service.getChatHistory(username, to);
          socket.send(
            JSON.stringify({
              action: "riwayat_chat",
              payload: riwayatPesan,
            }),
          );
        }

        service.registerUser(username, socket);

        socket.on("message", async (rawData) => {
          try {
            const data: IncomingData = JSON.parse(rawData.toString());

            switch (data.action) {
              case "register":
                service.registerUser(username, socket);
                break;
              case "kirim_chat":
                service.sendPrivateMessage(
                  username,
                  data.payload.to,
                  data.payload.text,
                );
                break;

              case "sedang_ketik":
              case "berhenti_mengetik":
                service.sendTypingStatus(
                  data.action,
                  username,
                  data.payload.to,
                );

              default:
                fastify.log.warn("Action tidak dikenali oleh fastify server");
            }
          } catch (err) {
            fastify.log.error("Error memproses data atau format data salah");
          }
        });

        socket.on("close", () => {
          const disconectUser = service.removeUserBySocket(socket);
          if (disconectUser) {
            fastify.log.info(
              `[INFO] ${disconectUser} terputus (koneksi tertutup)`,
            );
          }
        });
      } catch (err) {
        fastify.log.error(
          "Autentikasi gagal atau error pada inisialisasi koneksi",
        );
        socket.close(4001, "Unauthorized or Initialization Failed");
      }
    });
  });
}
