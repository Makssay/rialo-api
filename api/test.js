import { redis } from "../lib/kv.js";

export default async function handler(req, res) {
  try {
    res.setHeader("Access-Control-Allow-Origin", "*");

    const pong = await redis.ping();

    res.status(200).json({
      ok: true,
      kv: pong,
    });
  } catch (err) {
    console.error("KV error:", err);
    res.status(500).json({ ok: false, error: String(err) });
  }
}
