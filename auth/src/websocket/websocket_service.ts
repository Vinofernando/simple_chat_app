import WebSocket from "ws";
import { Collection } from "mongodb";

export interface PrivateMessage {
  from: string;
  to: string;
  text: string;
  createdAt: Date;
}

export class WebsocketService {
  private activeUsers = new Map<string, WebSocket>();
  private messageCollection: Collection<PrivateMessage>;

  constructor(messageCollection: Collection<PrivateMessage>) {
    this.messageCollection = messageCollection;
    this.activeUsers = new Map();
  }

  registerUser(username: string, socket: WebSocket) {
    this.activeUsers.set(username, socket);
    console.log(`[INFO] ${username} otomatis terdaftar lewat verifikasi.`);
  }

  removeUserBySocket(socket: WebSocket): string | null {
    for (let [username, savedSocket] of this.activeUsers.entries()) {
      if (savedSocket === socket) {
        console.log(socket);
        console.log(savedSocket);
        this.activeUsers.delete(username);
        return username;
      }
    }
    return null;
  }

  async getChatHistory(username: string, to: string) {
    return await this.messageCollection
      .find({
        $or: [
          { from: username, to: to },
          { from: to, to: username },
        ],
      })
      .sort({ createdAt: 1 })
      .toArray();
  }

  async sendPrivateMessage(from: string, to: string, text: string) {
    await this.messageCollection.insertOne({
      from,
      to,
      text,
      createdAt: new Date(),
    });

    const recipientSocket = this.activeUsers.get(to);
    if (recipientSocket && recipientSocket?.readyState === 1) {
      recipientSocket.send(
        JSON.stringify({
          action: "terima_chat_private",
          payload: { from, text },
        }),
      );
    }
  }

  sendTypingStatus(
    action: "sedang_ketik" | "berhenti_mengetik",
    from: string,
    to: string,
  ) {
    const recipientSocket = this.activeUsers.get(to);
    if (recipientSocket && recipientSocket.readyState === 1) {
      recipientSocket.send(
        JSON.stringify({
          action,
          payload: { name: from },
        }),
      );
    }
  }
}
