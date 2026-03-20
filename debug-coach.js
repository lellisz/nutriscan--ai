/**
 * Debug script para testar configuração do Coach IA
 */
import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Carregar env vars
config({ path: resolve(__dirname, ".env") });
config({ path: resolve(__dirname, ".env.local"), override: true });
config({ path: resolve(__dirname, ".env.claude"), override: true });

console.log("=== TESTE DE CONFIGURAÇÃO DO COACH IA ===\n");

// Test 1: Environment variables
console.log("1. Variáveis de ambiente:");
console.log("- SUPABASE_URL:", process.env.SUPABASE_URL ? "✅ Definida" : "❌ Não definida");
console.log("- SUPABASE_SERVICE_ROLE_KEY:", process.env.SUPABASE_SERVICE_ROLE_KEY ?
  `✅ Definida (${process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 20)}...)` : "❌ Não definida");
console.log("- ANTHROPIC_API_KEY:", process.env.ANTHROPIC_API_KEY ?
  `✅ Definida (${process.env.ANTHROPIC_API_KEY.substring(0, 15)}...)` : "❌ Não definida");
console.log("");

// Test 2: Supabase connection
try {
  const { createClient } = await import("@supabase/supabase-js");
  console.log("2. Import Supabase: ✅ Sucesso");

  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    const { data, error } = await supabase
      .from("chat_conversations")
      .select("count")
      .limit(1);

    if (error) {
      console.log("3. Teste tabela chat_conversations: ❌ Erro:", error.message);
      console.log("   Detalhes:", error.details || "Sem detalhes");
      console.log("   Hint:", error.hint || "Sem dicas");
    } else {
      console.log("3. Teste tabela chat_conversations: ✅ Sucesso");
    }
  } else {
    console.log("3. Teste Supabase: ❌ Variáveis não definidas");
  }
} catch (err) {
  console.log("2. Import/Conexão Supabase: ❌ Erro:", err.message);
}

console.log("\n=== FIM DOS TESTES ===");