/**
 * Validação de Configuração do Chat IA
 * Verifica se todas as variáveis necessárias estão corretas
 */
import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load env vars
config({ path: resolve(__dirname, ".env") });
config({ path: resolve(__dirname, ".env.local"), override: true });
config({ path: resolve(__dirname, ".env.claude"), override: true });

console.log("=== VALIDAÇÃO DE CONFIGURAÇÃO ===\n");

const required = {
  "ANTHROPIC_API_KEY": {
    value: process.env.ANTHROPIC_API_KEY,
    pattern: /^sk-ant-/,
    example: "sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
  },
  "SUPABASE_URL": {
    value: process.env.SUPABASE_URL,
    pattern: /^https:\/\/.*\.supabase\.co/,
    example: "https://your-project.supabase.co"
  },
  "SUPABASE_SERVICE_ROLE_KEY": {
    value: process.env.SUPABASE_SERVICE_ROLE_KEY,
    pattern: /^eyJ/,
    example: "eyJ0eXAiOiJKV1QiLCJhbGc..."
  },
};

let allValid = true;

for (const [key, config] of Object.entries(required)) {
  console.log(`\n${key}:`);
  
  if (!config.value) {
    console.log(`  ❌ NÃO DEFINIDA`);
    console.log(`  Exemplo: ${config.example}`);
    allValid = false;
    continue;
  }
  
  if (config.value.includes("SUA_CHAVE") || config.value.includes("seu_")) {
    console.log(`  ❌ VALOR PLACEHOLDER (fake)`);
    console.log(`  Você precisa colocar um valor real!`);
    console.log(`  Exemplo: ${config.example}`);
    allValid = false;
    continue;
  }
  
  if (config.pattern && !config.pattern.test(config.value)) {
    console.log(`  ⚠️  Formato pode estar errado`);
    console.log(`  Deve começar com: ${config.pattern}`);
    console.log(`  Seu valor: ${config.value.substring(0, 30)}...`);
    allValid = false;
  } else {
    console.log(`  ✅ OK (${config.value.substring(0, 20)}...)`);
  }
}

console.log("\n" + "=".repeat(50));

if (allValid) {
  console.log("✅ Todas as configurações estão corretas!");
  console.log("\nPróximos passos:");
  console.log("1. npm run dev");
  console.log("2. Teste o chat");
} else {
  console.log("❌ Existem configurações faltando ou inválidas!");
  console.log("\nComo corrigir:");
  console.log("1. Abra .env (na raiz do projeto)");
  console.log("2. Adicione as variáveis corretas");
  console.log("3. Salve");
  console.log("4. npm run dev");
}
