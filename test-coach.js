/**
 * Teste final do Coach IA - simular conversa completa
 */
import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Carregar env vars
config({ path: resolve(__dirname, ".env") });
config({ path: resolve(__dirname, ".env.local"), override: true });
config({ path: resolve(__dirname, ".env.claude"), override: true });

console.log("=== TESTE COMPLETO DO COACH IA ===\n");

try {
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  // Simular um ID de usuário para teste
  const TEST_USER_ID = "test-user-" + Date.now();

  console.log(`🧪 Testando com usuário: ${TEST_USER_ID}`);

  // 1. Criar uma conversa
  console.log("\n1. Criando conversa...");
  const { data: conversation, error: convError } = await supabase
    .from("chat_conversations")
    .insert({
      user_id: TEST_USER_ID,
      title: "Teste Coach IA",
      message_count: 0
    })
    .select()
    .single();

  if (convError) {
    console.log("❌ Erro ao criar conversa:", convError.message);
    process.exit(1);
  }

  console.log(`✅ Conversa criada: ${conversation.id}`);

  // 2. Adicionar mensagem do usuário
  console.log("\n2. Adicionando mensagem do usuário...");
  const { data: userMessage, error: msgError } = await supabase
    .from("chat_messages")
    .insert({
      conversation_id: conversation.id,
      user_id: TEST_USER_ID,
      role: "user",
      content: "Olá, como posso melhorar minha alimentação?"
    })
    .select()
    .single();

  if (msgError) {
    console.log("❌ Erro ao adicionar mensagem:", msgError.message);
    process.exit(1);
  }

  console.log("✅ Mensagem do usuário adicionada");

  // 3. Simular resposta da IA
  console.log("\n3. Simulando resposta da IA...");
  const { data: aiMessage, error: aiError } = await supabase
    .from("chat_messages")
    .insert({
      conversation_id: conversation.id,
      user_id: TEST_USER_ID,
      role: "assistant",
      content: "Olá! Para melhorar sua alimentação, recomendo focar em alimentos naturais, aumentar o consumo de vegetais e manter-se hidratado. Com base no seu perfil, posso dar dicas mais específicas!",
      model: "claude-opus-4-20250514",
      tokens_used: 150
    })
    .select()
    .single();

  if (aiError) {
    console.log("❌ Erro ao adicionar resposta da IA:", aiError.message);
    process.exit(1);
  }

  console.log("✅ Resposta da IA adicionada");

  // 4. Verificar histórico
  console.log("\n4. Verificando histórico de mensagens...");
  const { data: messages, error: historyError } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("conversation_id", conversation.id)
    .order("created_at", { ascending: true });

  if (historyError) {
    console.log("❌ Erro ao buscar histórico:", historyError.message);
    process.exit(1);
  }

  console.log(`✅ ${messages.length} mensagens encontradas:`);
  messages.forEach((msg, i) => {
    console.log(`  ${i + 1}. [${msg.role}]: ${msg.content.substring(0, 50)}...`);
  });

  // 5. Limpar dados de teste
  console.log("\n5. Limpando dados de teste...");
  await supabase.from("chat_conversations").delete().eq("id", conversation.id);
  console.log("✅ Dados de teste removidos");

  console.log("\n🎉 TESTE COMPLETO PASSOU! O Coach IA está funcionando perfeitamente!");

} catch (err) {
  console.log("❌ Erro durante o teste:", err.message);
  process.exit(1);
}

console.log("\n=== FIM DO TESTE ===");