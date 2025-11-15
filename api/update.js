import { redis } from "../lib/kv.js";

const SECRET = process.env.UPDATE_SECRET;

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  if (req.query.secret !== SECRET) {
    return res.status(403).json({ error: "Forbidden" });
  }

const API_KEY = process.env.SOCIALDATA_API_KEY;
const COMMUNITY_ID = "1951903018464772103";

const BASE_URL = `https://api.socialdata.tools/twitter/community/${COMMUNITY_ID}/tweets`;

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  if (!API_KEY) {
    return res.status(500).json({ error: "SOCIALDATA_API_KEY missing" });
  }

  try {
    const allTweets = await collectAllTweets();
    const leaderboard = buildLeaderboard(allTweets);

    // save to KV
    await redis.set("all_tweets", allTweets);
    await redis.set("leaderboard", leaderboard);

    return res.status(200).json({
      ok: true,
      tweets: allTweets.length,
      leaderboard: leaderboard.length
    });

  } catch (err) {
    console.error("UPDATE ERROR:", err);
    return res.status(500).json({ ok: false, error: String(err) });
  }
}

/* -----------------------------
   FUNCTIONS
----------------------------- */

async function fetchTweets(cursor = null, limit = 50) {
  const params = new URLSearchParams({
    type: "Latest",
    limit: String(limit),
  });

  if (cursor) params.append("cursor", cursor);

  const r = await fetch(`${BASE_URL}?${params.toString()}`, {
    headers: { Authorization: `Bearer ${API_KEY}` }
  });

  if (!r.ok) {
    throw new Error(`API error ${r.status}: ${await r.text()}`);
  }

  return r.json();
}

async function collectAllTweets() {
  let allTweets = [];
  let seenIds = new Set();

  let cursor = null;
  let total = 0;

  while (true) {
    const data = await fetchTweets(cursor);
    const tweets = data.tweets || [];
    cursor = data.next_cursor;

    if (!tweets.length) break;

    const newTweets = tweets.filter(t => !seenIds.has(t.id_str));

    if (!newTweets.length) break;

    allTweets.push(...newTweets);

    for (const t of newTweets) seenIds.add(t.id_str);

    total += newTweets.length;

    console.log(`Fetched ${newTweets.length} tweets (total: ${total})`);

    if (!cursor) break;

    await sleep(3000); // rate limit sleep
  }

  return allTweets;
}

function buildLeaderboard(tweets) {
  const leaderboard = {};

  for (const t of tweets) {
    const user = t.user;
    if (!user) continue;

    const name = user.screen_name;
    if (!name) continue;

    const stats = leaderboard[name] || {
      posts: 0,
      likes: 0,
      retweets: 0,
      comments: 0,
      quotes: 0,
      views: 0
    };

    stats.posts += 1;
    stats.likes += t.favorite_count || 0;
    stats.retweets += t.retweet_count || 0;
    stats.comments += t.reply_count || 0;
    stats.quotes += t.quote_count || 0;
    stats.views += t.views_count || 0;

    leaderboard[name] = stats;
  }

  return Object.entries(leaderboard); 
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}
