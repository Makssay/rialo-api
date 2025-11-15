import { redis } from "../lib/kv";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  // Проверяем KV
  const pong = await redis.ping();

  res.status(200).json({
    ok: true,
    kv: pong,
  });
}
