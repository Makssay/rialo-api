import { redis } from "../lib/kv.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  try {
    const data = await redis.get("all_tweets");

    if (!data) {
      return res.status(404).json({ error: "tweets not found" });
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error("tweets error:", err);
    return res.status(500).json({ error: String(err) });
  }
}
