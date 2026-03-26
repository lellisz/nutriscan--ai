/**
 * Dev server para rodar as serverless functions localmente.
 * Usado como proxy pelo Vite dev server.
 *
 * Uso: node api/dev-server.js
 */
import { createServer } from "http";
import { execSync } from "child_process";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "..");

// Protecao: dev-server NUNCA deve rodar em producao
if (process.env.NODE_ENV === "production") {
  console.error("[FATAL] dev-server.js nao deve rodar em producao. Use Vercel serverless functions.");
  process.exit(1);
}

// Carregar env vars (.env.claude tem as keys reais, carrega primeiro com override)
config({ path: resolve(rootDir, ".env") });
config({ path: resolve(rootDir, ".env.local"), override: true });
config({ path: resolve(rootDir, ".env.claude"), override: true });

const PORT = process.env.API_DEV_PORT || 3002;

async function handleRequest(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

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
        _ended: false,
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
        end() {
          this._ended = true;
          return this;
        },
      };

      await handler(fakeReq, fakeRes);

      res.writeHead(fakeRes._status, {
        "Content-Type": "application/json",
        ...fakeRes._headers,
      });
      res.end(fakeRes._ended && fakeRes._body === null ? "" : JSON.stringify(fakeRes._body));
    } catch (err) {
      console.error("API Error:", err);
      res.writeHead(500, { "Content-Type": "application/json" });
      // Em dev, expor mensagem de erro e util; em producao, este servidor nao roda (guard na linha 17)
      res.end(JSON.stringify({ error: process.env.NODE_ENV === "production" ? "Internal server error" : err.message }));
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
        _ended: false,
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
        end() {
          this._ended = true;
          return this;
        },
      };

      await handler(fakeReq, fakeRes);

      res.writeHead(fakeRes._status, {
        "Content-Type": "application/json",
        ...fakeRes._headers,
      });
      res.end(fakeRes._ended && fakeRes._body === null ? "" : JSON.stringify(fakeRes._body));
    } catch (err) {
      console.error("Chat API Error:", err);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: process.env.NODE_ENV === "production" ? "Internal server error" : err.message }));
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

/**
 * Tenta matar o processo que esta ocupando a porta informada.
 * Cross-platform: usa taskkill no Windows e fuser/lsof no Unix.
 * Retorna true se conseguiu matar, false se falhou silenciosamente.
 */
function killProcessOnPort(port) {
  try {
    if (process.platform === "win32") {
      // Passo 1: encontrar o PID via netstat
      const output = execSync(
        `netstat -ano | findstr :${port} | findstr LISTENING`,
        { encoding: "utf8", stdio: ["pipe", "pipe", "ignore"] }
      ).trim();
      // Extrair PID da ultima coluna (ex: "TCP  0.0.0.0:3002  0.0.0.0:0  LISTENING  24268")
      const lines = output.split("\n").filter(Boolean);
      const pids = new Set();
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && /^\d+$/.test(pid) && pid !== "0") pids.add(pid);
      }
      // Passo 2: matar cada PID encontrado
      for (const pid of pids) {
        try {
          execSync(`taskkill /PID ${pid} /F`, { stdio: "ignore" });
          console.log(`[API] Processo ${pid} encerrado`);
        } catch { /* pode ja ter morrido */ }
      }
      return pids.size > 0;
    } else {
      // fuser e disponivel na maioria dos sistemas Linux/macOS
      execSync(`fuser -k ${port}/tcp`, { stdio: "ignore" });
      return true;
    }
  } catch {
    // Processo pode ter morrido sozinho ou nenhum encontrado
    return false;
  }
}

/**
 * Exibe log de inicializacao com status dos providers de IA e variaveis de ambiente.
 * Ajuda a diagnosticar rapidamente problemas de configuracao sem precisar abrir o .env.
 */
function logStartupInfo(port) {
  const groqOk      = !!process.env.GROQ_API_KEY;
  const anthropicOk = !!process.env.ANTHROPIC_API_KEY;
  const geminiOk    = !!process.env.GEMINI_API_KEY;
  const supabaseOk  = !!process.env.SUPABASE_URL;
  const aiProvider  = process.env.AI_PROVIDER || "groq_with_fallback";
  const corsOrigin  = process.env.ALLOWED_ORIGIN || "(nao configurado)";

  // Monta linha de providers no formato: Groq ✓ | Anthropic ✗ | Gemini ✓ | Ollama (local)
  const providerStatus = [
    `Groq ${groqOk ? "OK" : "X"}`,
    `Anthropic ${anthropicOk ? "OK" : "X"}`,
    `Gemini ${geminiOk ? "OK" : "X"}`,
    "Ollama (local)",
  ].join(" | ");

  console.log("[API] Praxis Nutri — Dev Server");
  console.log(`[API] Porta: ${port}`);
  console.log(`[API] Providers: ${providerStatus}`);
  console.log(`[API] AI_PROVIDER: ${aiProvider}`);
  console.log(`[API] CORS: ${corsOrigin}`);
  console.log(`[API] Supabase: ${supabaseOk ? "OK configurado" : "X nao configurado"}`);
}

const server = createServer(handleRequest);
server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.warn(`[API] Porta ${PORT} em uso — tentando matar processo anterior...`);
    const killed = killProcessOnPort(PORT);

    if (killed) {
      // Aguarda o SO liberar a porta antes de tentar subir de novo
      setTimeout(() => {
        server.listen(PORT, () => {
          logStartupInfo(PORT);
        });
      }, 800);
    } else {
      console.error(`[API] Nao foi possivel liberar a porta ${PORT}. Encerre o processo manualmente e tente novamente.`);
      process.exit(1);
    }
  } else {
    throw err;
  }
});
server.listen(PORT, () => {
  logStartupInfo(PORT);
});
