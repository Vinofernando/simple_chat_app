import type { FastifyInstance } from "fastify";
import { WebsocketService } from "./websocket_service.js";

interface UserTokenPayload {
  id: string;
  email: string;
  name: string;
  friendCode: string;
}

interface IncomingData {
  action:
    | "register"
    | "kirim_chat"
    | "sedang_ketik"
    | "berhenti_mengetik"
    | "riwayat_chat";
  payload: {
    toCode: string;
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

      const token = req.cookies.access_token;

      try {
        const decoded = (await fastifyInstance.jwt.verify(
          token || "",
        )) as UserTokenPayload;

        const username = decoded.name;
        const friendCode = decoded.friendCode;

        service.registerUser(friendCode, socket);

        console.log("Decoded token:", decoded);
        socket.on("message", async (rawData) => {
          try {
            const data: IncomingData = JSON.parse(rawData.toString());
            switch (data.action) {
              case "riwayat_chat":
                const targetFriendCode =
                  data.payload.toCode || (req.query as any).to;
                if (targetFriendCode) {
                  const riwayatPesan = await service.getChatHistory(
                    friendCode,
                    targetFriendCode,
                  );
                  console.log(targetFriendCode);
                  socket.send(
                    JSON.stringify({
                      action: "riwayat_chat",
                      payload: {
                        friendCode: targetFriendCode,
                        messages: riwayatPesan,
                      },
                    }),
                  );
                }
                break;
              case "register":
                service.registerUser(username, socket);
                break;
              case "kirim_chat":
                service.sendPrivateMessage(
                  friendCode,
                  data.payload.toCode,
                  username,
                  data.payload.to,
                  data.payload.text,
                );
                break;

              case "sedang_ketik":
              case "berhenti_mengetik":
                service.sendTypingStatus(
                  data.action,
                  friendCode,
                  data.payload.to,
                );
                break;
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
        console.error("ALASAN WEBSOCKET DITUTUP:", err);
        socket.close(4001, "Unauthorized or Initialization Failed");
      }
    });
  });
}
