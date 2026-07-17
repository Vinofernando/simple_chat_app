import WebSocket from "ws";

// Jalankan login dulu di server auth untuk mengambil token Vino yang valid!
const tokenVino =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MjEsIm5hbWUiOiJ2aW5vNDgiLCJlbWFpbCI6InZpbm9mZXJuYW5kbzQ4QGdtYWlsLmNvbSIsImZyaWVuZENvZGUiOiIjSFgxWDFMIiwiaWF0IjoxNzgzMTcxOTEyLCJleHAiOjE3ODMyNTgzMTJ9.zg6uA84NL6y29g-SwkaFnkvv9R2bdy8EeUpSR5RrX_4";
const targetChat = "#FMR051";

const ws = new WebSocket(`ws://localhost:3000/chat?token=${tokenVino}`);

ws.on("open", () => {
  console.log("Terhubung ke server WebSocket.");

  ws.send(
    JSON.stringify({
      action: "riwayat_chat",
      payload: {
        toCode: targetChat,
      },
    }),
  );

  ws.send();
});

ws.on("message", (rawData) => {
  const data = JSON.parse(rawData.toString());

  try {
    switch (data.action) {
      case "riwayat_chat":
        console.log("==================");
        data.payload.forEach((pesan) => {
          console.log(`[${pesan.from}]: ${pesan.text}`);
        });
        console.log("==================");
        break;

      case "terima_chat_private":
        console.log(
          `[PESAN PRIVATE] ${data.payload.from}: ${data.payload.text}`,
        );
        break;
      case "sedang_ketik":
        console.log(`[INFO] ${data.payload.name} sedang mengetik...`);
        break;
      case "berhenti_mengetik":
        console.log(`[INFO] ${data.payload.name} berhenti mengetik.`);
        break;

      default:
        console.log("Aksi tidak diketahui:", rawData.toString());
    }
  } catch (error) {
    console.log("pesan yang diterima serve bukan JSON", error);
  }
});
