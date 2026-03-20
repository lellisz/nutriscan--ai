/**
 * Dev server para rodar as serverless functions localmente.
 * Usado como proxy pelo Vite dev server.
 *
 * Uso: node api/dev-server.js
 */
import { createServer } from "http";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "..");

// Carregar env vars (.env.claude tem as keys reais, carrega primeiro com override)
config({ path: resolve(rootDir, ".env") });
config({ path: resolve(rootDir, ".env.local"), override: true });
config({ path: resolve(rootDir, ".env.claude"), override: true });

const PORT = process.env.API_DEV_PORT || 3002;

async function handleRequest(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.url === "/api/scan" && req.method === "POST") {
    try {
      // Ler body
      let body = "";
      for await (const chunk of req) {
        body += chunk;
      }

      // Importar handler da serverless function
      const scanModule = await import("./scan.js");
      const handler = scanModule.default;

      // Simular req/res do Vercel
      const fakeReq = {
        method: "POST",
        body: JSON.parse(body),
        headers: req.headers,
      };

      const fakeRes = {
        _status: 200,
        _body: null,
        _headers: {},
        status(code) {
          this._status = code;
          return this;
        },
        setHeader(key, val) {
          this._headers[key] = val;
          return this;
        },
        json(data) {
          this._body = data;
          return this;
        },
      };

      await handler(fakeReq, fakeRes);

      res.writeHead(fakeRes._status, {
        "Content-Type": "application/json",
        ...fakeRes._headers,
      });
      res.end(JSON.stringify(fakeRes._body));
    } catch (err) {
      console.error("API Error:", err);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: err.message }));
    }
  } else if (req.url === "/api/chat" && req.method === "POST") {
    try {
      // Ler body
      let body = "";
      for await (const chunk of req) {
        body += chunk;
      }

      // Importar handler da serverless function chat
      const chatModule = await import("./chat.js");
      const handler = chatModule.default;

      // Simular req/res do Vercel
      const fakeReq = {
        method: "POST",
        body: JSON.parse(body),
        headers: req.headers,
      };

      const fakeRes = {
        _status: 200,
        _body: null,
        _headers: {},
        status(code) {
          this._status = code;
          return this;
        },
        setHeader(key, val) {
          this._headers[key] = val;
          return this;
        },
        json(data) {
          this._body = data;
          return this;
        },
      };

      await handler(fakeReq, fakeRes);

      res.writeHead(fakeRes._status, {
        "Content-Type": "application/json",
        ...fakeRes._headers,
      });
      res.end(JSON.stringify(fakeRes._body));
    } catch (err) {
      console.error("Chat API Error:", err);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: err.message }));
    }
  } else if (req.url === "/api/chat-test" && req.method === "GET") {
    try {
      const chatTestModule = await import("./chat-test.js");
      const handler = chatTestModule.default;

      const fakeReq = { method: "GET", headers: req.headers };
      const fakeRes = {
        _status: 200, _body: null,
        status(code) { this._status = code; return this; },
        json(data)   { this._body = data; return this; },
      };

      await handler(fakeReq, fakeRes);
      res.writeHead(fakeRes._status, { "Content-Type": "application/json" });
      res.end(JSON.stringify(fakeRes._body));
    } catch (err) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: err.message }));
    }
  } else {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found" }));
  }
}

const server = createServer(handleRequest);
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`[API] Porta ${PORT} já em uso — servidor já está rodando. OK!`);
    process.exit(0); // Sai sem erro, concurrently não mata o Vite
  } else {
    throw err;
  }
});
server.listen(PORT, () => {
  console.log(`API dev server running on http://localhost:${PORT}`);
});
