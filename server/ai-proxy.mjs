import http from "http";
import { URL } from "url";

const PORT = process.env.DONIA_AI_PROXY_PORT || 8787;

// Simple proxy endpoint: POST /api/ai/deepseek
// For production: place behind nginx and restrict origin; do not log request bodies.
const server = http.createServer(async (req, res) => {
  try {
    if (req.method !== "POST" || req.url !== "/api/ai/deepseek") {
      res.writeHead(404); res.end("Not Found"); return;
    }

    const auth = req.headers["authorization"] || "";
    if (!auth.toString().startsWith("Bearer ")) {
      res.writeHead(401); res.end("Missing Bearer"); return;
    }

    const chunks = [];
    for await (const c of req) chunks.push(c);
    const body = Buffer.concat(chunks).toString("utf8");

    const upstream = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": auth.toString()
      },
      body
    });

    const text = await upstream.text();
    res.writeHead(upstream.status, { "Content-Type": "application/json" });
    res.end(text);
  } catch (e) {
    res.writeHead(500);
    res.end("Proxy error");
  }
});

server.listen(PORT, () => {
  console.log("DONIA AI proxy listening on", PORT);
});
