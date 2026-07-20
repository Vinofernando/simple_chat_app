import type { FastifyInstance } from "fastify";
import multipart from "@fastify/multipart";
import fastifyStatic from "@fastify/static";
import path from "path";
import fs from "fs";
import { pipeline } from "stream/promises";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

export default function uploadImage(app: FastifyInstance) {
  app.register(multipart, {
    limits: {
      fileSize: 5 * 1024 * 1024, // 5 MB
    },
  });
  const uploadsDir = path.join(__dirname, "uploads");

  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  app.register(fastifyStatic, {
    root: uploadsDir,
    prefix: "/uploads/",
  });

  app.post("/api/upload", async (request, reply) => {
    const data = await request.file();

    if (!data) {
      return reply.status(400).send({
        success: false,
        message: "Tidak ada file yang diunggah.",
      });
    }

    if (!ALLOWED_MIME_TYPES.includes(data.mimetype)) {
      return reply.status(400).send({
        success: false,
        message: "Hanya file gambar yang diperbolehkan",
      });
    }

    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(data.filename);
    const fileName = `img-${uniqueSuffix}${ext}`;
    const savetoPath = path.join(uploadsDir, fileName);

    await pipeline(data.file, fs.createWriteStream(savetoPath));

    const mediaUrl = `${request.protocol}://${request.host}/uploads/${fileName}`;

    return reply.status(200).send({
      success: true,
      mediaUrl: mediaUrl,
    });
  });
}
