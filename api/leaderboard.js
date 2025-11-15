import { redis } from "../lib/kv.js"

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  try {
    const data = await redis.get("leaderboard");

    if (!data) {
      return res.status(404).json({ error: "leaderboard not found" });
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error("leaderboard error:", err);
    return res.status(500).json({ error: String(err) });
  }
}
