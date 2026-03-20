/**
 * Debug/Test script para verificar conexão com Supabase
 * Execute: node debug-chat.js
 */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

// Load env vars
config({ path: ".env.claude", override: true });

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log("🔍 Testing Supabase connection...");
console.log("URL:", url ? "✅ Set" : "❌ Missing");
console.log("Service Key:", serviceKey ? "✅ Set" : "❌ Missing");

if (!url || !serviceKey) {
  console.error("❌ Missing Supabase credentials in .env.claude");
  process.exit(1);
}

const supabase = createClient(url, serviceKey);

async function testConnection() {
  try {
    console.log("\n🧪 Testing database connection...");

    // Test 1: Check if tables exist
    const { data: conversations, error: convError } = await supabase
      .from("chat_conversations")
      .select("count")
      .limit(1);

    if (convError) {
      console.error("❌ chat_conversations table:", convError.message);
    } else {
      console.log("✅ chat_conversations table exists");
    }

    const { data: messages, error: msgError } = await supabase
      .from("chat_messages")
      .select("count")
      .limit(1);

    if (msgError) {
      console.error("❌ chat_messages table:", msgError.message);
    } else {
      console.log("✅ chat_messages table exists");
    }

    console.log("\n🎉 Database test completed!");

  } catch (err) {
    console.error("❌ Connection failed:", err.message);
  }
}

testConnection();