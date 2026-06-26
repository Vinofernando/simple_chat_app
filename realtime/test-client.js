import WebSocket from "ws";

// Jalankan login dulu di server auth untuk mengambil token Vino yang valid!
const tokenVino =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTMsIm5hbWUiOiJ2aW5vNDgiLCJlbWFpbCI6InZpbm9mZXJuYW5kbzQ4QGdtYWlsLmNvbSIsImlhdCI6MTc4MjA1NTUzNSwiZXhwIjoxNzgyMTQxOTM1fQ.eVELfVqyvXlTyEXxUH7bcQuT-6oEwfHNG1jrbhWN6zs";
const targetChat = "budi";

const ws = new WebSocket(
  `ws://localhost:8080/chat?token=${tokenVino}&to=${targetChat}`,
);

ws.on("open", () => {
  console.log("[VINO48] Terkoneksi ke server WebSocket.");

  // Kirim chat ke Annie setelah 3 detik terhubung
  setTimeout(() => {
    console.log("[VINO] Mengirim pesan ke Budi...");
    ws.send(
      JSON.stringify({
        action: "kirim_chat",
        payload: {
          to: "budi",
          text: "Halo Budi! Ini pesan privat dari Vino berbasis JWT.",
        },
      }),
    );
  }, 3000);
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
