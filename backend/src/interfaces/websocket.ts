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
