/**
 * Chat Diagnostic Endpoint
 * Testa toda a stack do Coach IA: env vars, Supabase, tabelas, Anthropic
 *
 * Usage: GET /api/chat-test  (no browser or curl)
 */
import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const result = {
    timestamp: new Date().toISOString(),
    env: {},
    supabase: {},
    anthropic: {},
    summary: [],
  };

  // ── 1. Env vars ──────────────────────────────────────────
  const supabaseUrl    = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anthropicKey   = process.env.ANTHROPIC_API_KEY;
  const aiProvider     = process.env.AI_PROVIDER || "anthropic_with_fallback";
  const apiPort        = process.env.API_DEV_PORT || 3002;

  result.env = {
    SUPABASE_URL:              supabaseUrl     ? "✅ definida" : "❌ AUSENTE",
    SUPABASE_SERVICE_ROLE_KEY: serviceRoleKey  ? `✅ definida (${serviceRoleKey.substring(0, 12)}...)` : "❌ AUSENTE",
    ANTHROPIC_API_KEY:         anthropicKey    ? `✅ definida (${anthropicKey.substring(0, 12)}...)` : "❌ AUSENTE",
    AI_PROVIDER:               aiProvider,
    API_DEV_PORT:              String(apiPort),
  };

  if (!supabaseUrl)    result.summary.push("❌ SUPABASE_URL não definida");
  if (!serviceRoleKey) result.summary.push("❌ SUPABASE_SERVICE_ROLE_KEY não definida");
  if (!anthropicKey)   result.summary.push("❌ ANTHROPIC_API_KEY não definida");

  // ── 2. Supabase: conexão + tabelas ───────────────────────
  if (supabaseUrl && serviceRoleKey) {
    try {
      const supabase = createClient(supabaseUrl, serviceRoleKey);

      // Test chat_conversations
      const { error: convErr } = await supabase
        .from("chat_conversations").select("id").limit(1);
      result.supabase.chat_conversations = convErr
        ? `❌ ${convErr.message}`
        : "✅ existe";

      if (convErr) result.summary.push(`❌ Tabela chat_conversations: ${convErr.message}`);

      // Test chat_messages
      const { error: msgErr } = await supabase
        .from("chat_messages").select("id").limit(1);
      result.supabase.chat_messages = msgErr
        ? `❌ ${msgErr.message}`
        : "✅ existe";

      if (msgErr) result.summary.push(`❌ Tabela chat_messages: ${msgErr.message}`);

      // Test INSERT permission (service role bypasses RLS)
      const testUserId = "00000000-0000-0000-0000-000000000001";
      const { error: insertErr } = await supabase
        .from("chat_conversations")
        .insert({ user_id: testUserId, title: "__diag_test__" })
        .select("id")
        .single();

      if (insertErr) {
        result.supabase.insert_test = `❌ ${insertErr.message}`;
        result.summary.push(`❌ INSERT falhou (provável: service role key incorreta ou RLS): ${insertErr.message}`);
      } else {
        result.supabase.insert_test = "✅ INSERT funciona (service role OK)";
        // Cleanup
        await supabase.from("chat_conversations")
          .delete().eq("user_id", testUserId);
      }

      // Test profiles table (baseline)
      const { error: profErr } = await supabase
        .from("profiles").select("user_id").limit(1);
      result.supabase.profiles = profErr ? `❌ ${profErr.message}` : "✅ existe";

    } catch (err) {
      result.supabase.error = err.message;
      result.summary.push(`❌ Erro ao conectar ao Supabase: ${err.message}`);
    }
  } else {
    result.supabase.skipped = "⚠️ Credenciais ausentes, teste ignorado";
  }

  // ── 3. Anthropic API ─────────────────────────────────────
  if (anthropicKey) {
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type":      "application/json",
          "x-api-key":         anthropicKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model:      "claude-sonnet-4-6",
          max_tokens: 10,
          messages:   [{ role: "user", content: "ping" }],
        }),
      });

      const data = await response.json();

      if (response.ok) {
        result.anthropic.status = "✅ API respondeu com sucesso";
        result.anthropic.model  = data.model || "claude-sonnet-4-6";
      } else {
        result.anthropic.status = `❌ ${response.status}: ${data.error?.message || JSON.stringify(data)}`;
        result.summary.push(`❌ Anthropic API: ${data.error?.message || response.status}`);
      }
    } catch (err) {
      result.anthropic.status = `❌ Erro de rede: ${err.message}`;
      result.summary.push(`❌ Erro ao chamar Anthropic: ${err.message}`);
    }
  } else {
    result.anthropic.skipped = "⚠️ ANTHROPIC_API_KEY ausente, teste ignorado";
  }

  // ── 4. Summary ───────────────────────────────────────────
  if (result.summary.length === 0) {
    result.summary.push("✅ Tudo OK — Coach IA deve funcionar");
  }

  return res.status(200).json(result);
}
