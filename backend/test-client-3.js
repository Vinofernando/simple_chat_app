import WebSocket from "ws";

const ws = new WebSocket("ws://localhost:8080/chat?from=budi&to=annie");

// ws.on("open", () => {
//   console.log("Koneksi berhasil dibuka. Melakukan registrasi...");

//   // 1. WAJIB REGISTER DULU agar server tahu siapa nama client ini
//   ws.send(
//     JSON.stringify({
//       action: "register",
//       payload: { from: "annie", to: "", text: "" }, // Daftarkan diri sebagai 'annie'
//     }),
//   );

//   // 2. Simulasi sedang mengetik yang ditujukan ke 'budi'
//   setTimeout(() => {
//     ws.send(
//       JSON.stringify({
//         action: "sedang_ketik",
//         payload: { from: "annie", to: "budi", text: "" },
//       }),
//     );
//   }, 1500);

//   // 3. Simulasi berhenti mengetik ke 'budi'
//   setTimeout(() => {
//     ws.send(
//       JSON.stringify({
//         action: "berhenti_mengetik",
//         payload: { from: "annie", to: "budi", text: "" },
//       }),
//     );
//   }, 3000);

//   // 4. Simulasi mengirim private chat ke 'budi'
//   setTimeout(() => {
//     ws.send(
//       JSON.stringify({
//         action: "kirim_chat",
//         payload: {
//           from: "annie",
//           to: "budi",
//           text: "Halo Budi! Ini chat private dari annie.",
//         },
//       }),
//     );
//   }, 4000);
// });

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
