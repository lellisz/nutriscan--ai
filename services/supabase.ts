import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";
import type { Database } from "@/types/database";

// Storage adapter para web usando localStorage diretamente
function createWebStorage() {
  if (typeof window === "undefined") {
    return {
      getItem: async (_key: string) => null,
      setItem: async (_key: string, _value: string) => {},
      removeItem: async (_key: string) => {},
    };
  }
  return {
    getItem: async (key: string) => {
      try { return localStorage.getItem(key); } catch { return null; }
    },
    setItem: async (key: string, value: string) => {
      try { localStorage.setItem(key, value); } catch {}
    },
    removeItem: async (key: string) => {
      try { localStorage.removeItem(key); } catch {}
    },
  };
}

// Native-only: SecureStore + AES encryption for large JWT tokens
async function getNativeStorage() {
  const [SecureStore, aesjs] = await Promise.all([
    import("expo-secure-store"),
    import("aes-js"),
  ]);

  return {
    async getItem(key: string): Promise<string | null> {
      try {
        const encrypted = await AsyncStorage.getItem(key);
        if (!encrypted) return encrypted;
        const encryptionKeyHex = await SecureStore.getItemAsync(key);
        if (!encryptionKeyHex) return encrypted;
        const cipher = new aesjs.ModeOfOperation.ctr(
          aesjs.utils.hex.toBytes(encryptionKeyHex),
          new aesjs.Counter(1)
        );
        const decryptedBytes = cipher.decrypt(aesjs.utils.hex.toBytes(encrypted));
        return aesjs.utils.utf8.fromBytes(decryptedBytes);
      } catch {
        return null;
      }
    },
    async removeItem(key: string): Promise<void> {
      await AsyncStorage.removeItem(key);
      await SecureStore.deleteItemAsync(key);
    },
    async setItem(key: string, value: string): Promise<void> {
      const encryptionKey = crypto.getRandomValues(new Uint8Array(256 / 8));
      const cipher = new aesjs.ModeOfOperation.ctr(encryptionKey, new aesjs.Counter(1));
      const encryptedBytes = cipher.encrypt(aesjs.utils.utf8.toBytes(value));
      await SecureStore.setItemAsync(key, aesjs.utils.hex.fromBytes(encryptionKey));
      await AsyncStorage.setItem(key, aesjs.utils.hex.fromBytes(encryptedBytes));
    },
  };
}

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

const storage = Platform.OS === "web" ? createWebStorage() : undefined;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Tipo do client tipado para reuso em outros módulos
export type SupabaseClient = typeof supabase;

// Upgrade to secure storage on native after init
if (Platform.OS !== "web") {
  getNativeStorage().then((secureStorage) => {
    // @ts-ignore
    supabase.auth.storage = secureStorage;
  });
}
