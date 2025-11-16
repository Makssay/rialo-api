import { redis } from "../lib/kv.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  try {
    const status = await redis.get("status");

    if (!status) {
      return res.status(200).json({
        ok: false,
        message: "No status stored yet. Run /api/update first."
      });
    }

    const updatedAt = status.updated_at;

    const iso = new Date(updatedAt).toISOString();
    const human = timeAgo(updatedAt);

    return res.status(200).json({
      ok: true,
      updated_at: updatedAt,
      updated_at_iso: iso,
      updated_at_human: human,
      tweets: status.tweets,
      users: status.users
    });

  } catch (err) {
    console.error("STATUS ERROR:", err);
    return res.status(500).json({ ok: false, error: String(err) });
  }
}

function timeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);

  const units = [
    { label: "year", secs: 31536000 },
    { label: "month", secs: 2592000 },
    { label: "day", secs: 86400 },
    { label: "hour", secs: 3600 },
    { label: "minute", secs: 60 },
    { label: "second", secs: 1 }
  ];

  for (const unit of units) {
    const count = Math.floor(seconds / unit.secs);
    if (count >= 1) {
      return `${count} ${unit.label}${count > 1 ? "s" : ""} ago`;
    }
  }

  return "just now";
}
