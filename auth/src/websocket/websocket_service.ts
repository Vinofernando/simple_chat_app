import WebSocket from "ws";
import { Collection } from "mongodb";

export interface PrivateMessage {
  fromCode: string;
  toCode: string;
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

  registerUser(frienCode: string, socket: WebSocket) {
    this.activeUsers.set(frienCode, socket);
    console.log(`[INFO] ${frienCode} otomatis terdaftar lewat verifikasi.`);
  }

  removeUserBySocket(socket: WebSocket): string | null {
    for (let [frienCode, savedSocket] of this.activeUsers.entries()) {
      if (savedSocket === socket) {
        console.log(socket);
        console.log(savedSocket);
        this.activeUsers.delete(frienCode);
        return frienCode;
      }
    }
    return null;
  }

  async getChatHistory(currentUserCode: string, targetFriendCode: string) {
    return await this.messageCollection
      .find({
        $or: [
          { fromCode: currentUserCode, toCode: targetFriendCode },
          { fromCode: targetFriendCode, toCode: currentUserCode },
        ],
      })
      .sort({ createdAt: 1 })
      .toArray();
  }

  async sendPrivateMessage(
    fromCode: string,
    toCode: string,
    from: string,
    to: string,
    text: string,
  ) {
    // await this.messageCollection.insertOne({
    //   fromCode,
    //   toCode,
    //   from,
    //   to,
    //   text,
    //   createdAt: new Date(),
    // });

    const newMessage = {
      fromCode,
      toCode,
      from,
      to,
      text,
      createdAt: new Date(),
    };

    await this.messageCollection.insertOne(newMessage);

    const recipientSocket = this.activeUsers.get(toCode);
    if (recipientSocket && recipientSocket?.readyState === 1) {
      recipientSocket.send(
        JSON.stringify({
          action: "terima_chat_private",
          payload: newMessage,
        }),
      );
    }
  }

  sendTypingStatus(
    action: "sedang_ketik" | "berhenti_mengetik",
    fromCode: string,
    to: string,
  ) {
    const recipientSocket = this.activeUsers.get(to);
    if (recipientSocket && recipientSocket.readyState === 1) {
      recipientSocket.send(
        JSON.stringify({
          action,
          payload: { fromCode },
        }),
      );
    }
  }

  // sendOnlineStatus(
  //   action: "online" | "offline",
  //   fromCode: string
  // ) {
  //   const
  // }
}
