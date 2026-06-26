import WebSocket from "ws";

// Jalankan login dulu di server auth untuk mengambil token Annie yang valid!
const tokenAnnie =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTEsIm5hbWUiOiJidWRpIiwiZW1haWwiOiJ2aW5vZmVybmFuZG84NEBnbWFpbC5jb20iLCJpYXQiOjE3ODIwNTU1MzcsImV4cCI6MTc4MjE0MTkzN30.Kk9fc60XN_ZijvsMMP-CHljzSsjKwoaaDyOO1dntHPs";
const targetChat = "vino48";

const ws = new WebSocket(
  `ws://localhost:8080/chat?token=${tokenAnnie}&to=${targetChat}`,
);

ws.on("open", () => {
  console.log("[BUDI] Terkoneksi ke server WebSocket. Menunggu pesan...");

  setTimeout(() => {
    console.log("[Budi] Mengirim pesan ke vino48...");
    ws.send(
      JSON.stringify({
        action: "kirim_chat",
        payload: {
          to: "vino48",
          text: "Halo vino48! Ini pesan privat dari Budi berbasis JWT.",
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
