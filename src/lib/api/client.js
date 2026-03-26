import { ScanRequestSchema, ScanResponseSchema } from "../validation/schemas";
import { logger } from "../logger";
import { getSupabaseClient } from "../supabase";

const API_URL = import.meta.env.VITE_API_URL || "";

class APIClient {
  /**
   * Retorna o access_token JWT da sessao atual do Supabase.
   * Retorna null se nao houver sessao ativa (usuario nao autenticado).
   */
  async _getAccessToken() {
    try {
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token || null;
    } catch {
      return null;
    }
  }

  async fetch(endpoint, options = {}, timeoutMs = 30000) {
    const url = `${API_URL}${endpoint}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    // Injeta Authorization header com JWT do Supabase quando disponivel
    const token = await this._getAccessToken();
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

    let response;
    try {
      response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
          ...options.headers,
        },
      });
    } catch (err) {
      if (err.name === "AbortError") throw new Error("A requisição demorou demais. Tente novamente.");
      throw err;
    } finally {
      clearTimeout(timer);
    }

    // Handle 401 Unauthorized - token may have expired
    if (response.status === 401) {
      logger.warn("Received 401 Unauthorized - attempting token refresh", { endpoint });
      
      try {
        const supabase = getSupabaseClient();
        const { data, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError || !data.session) {
          logger.error("Token refresh failed", { error: refreshError?.message });
          // Force logout on refresh failure
          await supabase.auth.signOut();
          throw new Error("Session expired. Please sign in again.");
        }

        logger.info("Token refreshed successfully");
        
        // Retry the original request with new token
        return this.fetch(endpoint, options);
      } catch (err) {
        logger.error("Failed to recover from 401", { error: err.message });
        throw new Error("Authentication failed. Please sign in again.");
      }
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Erro desconhecido" }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async scanFood(imageBase64, mediaType, userId = null, imageUrl = null) {
    const payload = {
      imageBase64,
      mediaType,
      ...(userId && { userId }),
      ...(imageUrl && { imageUrl }),
    };

    // Validar payload antes de enviar
    ScanRequestSchema.parse(payload);

    const data = await this.fetch("/api/scan", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    // Validar resposta — se o campo result estiver ausente, o erro deve ser claro
    if (!data.result) {
      logger.error("Scan response missing 'result' field", { data });
      throw new Error("Resposta da IA incompleta. Tente novamente.");
    }

    let validated;
    try {
      validated = ScanResponseSchema.parse(data.result);
    } catch (zodError) {
      const issues = zodError.issues || zodError.errors || [];
      logger.error("Scan response schema validation failed", {
        issues: issues.map((e) => `${e.path.join(".")}: ${e.message}`),
        raw: data.result,
      });
      throw new Error("Formato de resposta inesperado da IA. Tente novamente.");
    }

    return {
      analysis: validated,
      savedScan: data.savedScan || null,
    };
  }
}

export const apiClient = new APIClient();
