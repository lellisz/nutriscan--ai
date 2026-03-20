/**
 * Test Chat Tables Setup
 * Run this to verify chat tables exist and have correct configuration
 */
import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load env vars
config({ path: resolve(__dirname, ".env") });
config({ path: resolve(__dirname, ".env.local"), override: true });
config({ path: resolve(__dirname, ".env.claude"), override: true });

console.log("=== TESTE DE SETUP DO CHAT IA ===\n");

// Test 1: Environment variables
console.log("1. Variáveis de ambiente:");
console.log("- SUPABASE_URL:", process.env.SUPABASE_URL ? "✅" : "❌");
console.log("- SUPABASE_SERVICE_ROLE_KEY:", process.env.SUPABASE_SERVICE_ROLE_KEY ? "✅" : "❌");

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("\n❌ Variáveis de Supabase não configuradas!");
  process.exit(1);
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Test 2: Check tables exist
console.log("\n2. Verificando tabelas...");

try {
  const { data: convData, error: convError } = await supabase
    .from("chat_conversations")
    .select("id")
    .limit(1);

  if (convError?.code === "PGRST116") {
    console.log("❌ Tabela chat_conversations NÃO EXISTE");
    console.log("   Solução: Execute em Supabase SQL Editor:");
    console.log("   \`\`\`sql");
    console.log("   -- Run: supabase/migrations/20260317_coach_ia.sql");
    console.log("   \`\`\`");
  } else if (convError) {
    console.log("❌ Erro ao verificar chat_conversations:", convError.message);
  } else {
    console.log("✅ Tabela chat_conversations OK");
  }
} catch (err) {
  console.log("❌ Erro fatal:", err.message);
  process.exit(1);
}

try {
  const { data: msgData, error: msgError } = await supabase
    .from("chat_messages")
    .select("id")
    .limit(1);

  if (msgError?.code === "PGRST116") {
    console.log("❌ Tabela chat_messages NÃO EXISTE");
  } else if (msgError) {
    console.log("❌ Erro ao verificar chat_messages:", msgError.message);
  } else {
    console.log("✅ Tabela chat_messages OK");
  }
} catch (err) {
  console.log("❌ Erro ao verificar chat_messages:", err.message);
}

// Test 3: Try to create a test conversation (if tables exist)
console.log("\n3. Testando inserção de conversa...");

const testUserId = "00000000-0000-0000-0000-000000000000"; // Fake UUID for testing

try {
  const { data, error } = await supabase
    .from("chat_conversations")
    .insert({
      user_id: testUserId,
      title: "Test Conversation",
    })
    .select()
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      console.log("❌ Tabelas não existem - não foi possível testar");
    } else if (error.message.includes("violates foreign key constraint")) {
      console.log("✅ Tabela OK (erro esperado com usuário fake)");
    } else {
      console.log("⚠️  Erro:", error.message);
    }
  } else {
    console.log("✅ Inserção bem-sucedida (ID:", data.id + ")");
    // Clean up
    await supabase
      .from("chat_conversations")
      .delete()
      .eq("id", data.id);
    console.log("✅ Limpeza realizada");
  }
} catch (err) {
  console.log("❌ Erro ao testar inserção:", err.message);
}

console.log("\n=== FIM DOS TESTES ===");
console.log("\nPróximos passos:");
console.log("1. Se tables não existem: Execute supabase/migrations/20260317_coach_ia.sql");
console.log("2. Rodando: npm run dev");
console.log("3. Teste o chat no app");
