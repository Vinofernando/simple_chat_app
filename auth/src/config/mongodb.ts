import { MongoClient } from "mongodb";
import dotenv from "dotenv";
dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  throw new Error("Mongo URI not found");
}

const mongoClient = new MongoClient(MONGO_URI);

export const connectMongo = async () => {
  await mongoClient.connect();

  console.log("MongoDB connected");

  return mongoClient.db(process.env.DB_NAME);
};
