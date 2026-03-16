import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/hooks/useAuth";
import { useErrorHandler } from "../../../lib/hooks/useErrorHandler";
import * as db from "../../../lib/db";
import { apiClient } from "../../../lib/api/client";
import { analytics } from "../../../lib/analytics";
import { logger } from "../../../lib/logger";

const T = {
  bg: "#F2F2F7",
  surface: "#FFFFFF",
  surface2: "#F7F7FA",
  border: "#E5E5EA",
  text: "#1C1C1E",
  text2: "#636366",
  text3: "#AEAEB2",
  blue: "#007AFF",
  green: "#34C759",
  red: "#FF3B30",
  r: "18px",
  shadow: "0 2px 24px rgba(0,0,0,0.07)",
};

export default function ScanPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { handleError, handleRetry } = useErrorHandler();
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  function handleImageSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tamanho
    if (file.size > 10 * 1024 * 1024) {
      handleError(new Error("Imagem muito grande (máximo 10MB)"));
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target.result;
      setImage(base64);
      setPreview(base64);
      setRetryCount(0);
      await scanFood(base64, file.type);
    };
    reader.onerror = () => {
      handleError(new Error("Erro ao ler arquivo"));
    };
    reader.readAsDataURL(file);
  }

  async function scanFood(imageBase64, mediaType) {
    setLoading(true);
    analytics.trackScanStart();
    try {
      const result = await handleRetry(
        () => apiClient.scanFood(imageBase64, mediaType, user.id),
        maxRetries
      );
      console.log("Scan successful:", result);
      setResult(result.result || result);
      setRetryCount(0);
      analytics.trackScanSuccess(result.result || result);
      logger.info("Scan completed successfully", {
        userId: user.id,
        food: (result.result?.food_name || result.food_name),
        confidence: (result.result?.confidence || result.confidence),
      });
    } catch (err) {
      logger.error("Scan failed", {
        userId: user.id,
        error: err.message,
        retryCount,
      });
      analytics.trackScanError(err, retryCount);
      handleError(err, {
        title: "Erro ao analisar alimento",
      });
      setRetryCount((prev) => prev + 1);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto", minHeight: "100vh" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <h1>Analisar Alimento</h1>
        <button
          onClick={() => navigate("/history")}
          style={{
            padding: "8px 16px",
            background: T.surface2,
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: 500,
          }}
        >
          Histórico
        </button>
      </div>

      <div
        style={{
          border: `2px dashed ${T.border}`,
          borderRadius: T.r,
          padding: "40px 20px",
          textAlign: "center",
          cursor: "pointer",
          background: T.surface2,
          marginBottom: "20px",
        }}
      >
        <input
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          style={{ display: "none" }}
          id="image-input"
          disabled={loading}
        />
        <label
          htmlFor="image-input"
          style={{
            display: "block",
            cursor: loading ? "wait" : "pointer",
            opacity: loading ? 0.6 : 1,
          }}
        >
          <div style={{ fontSize: "48px", marginBottom: "12px" }}>📸</div>
          <div style={{ fontSize: "16px", fontWeight: 600, marginBottom: "4px" }}>Clique ou arraste uma imagem</div>
          <div style={{ fontSize: "14px", color: T.text2 }}>JPG, PNG até 10MB</div>
        </label>
      </div>

      {loading && (
        <div style={{ textAlign: "center", padding: "20px" }}>
          <div style={{ fontSize: "14px", color: T.text2, marginBottom: "12px" }}>
            {retryCount > 0 ? `Tentando... (${retryCount}/${maxRetries})` : "Analisando alimento..."}
          </div>
          <div style={{
            width: "40px",
            height: "40px",
            border: `3px solid ${T.blue}30`,
            borderTop: `3px solid ${T.blue}`,
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
            margin: "0 auto",
          }} />
        </div>
      )}

      {/* Erro agora é mostrado via Toast (useErrorHandler) */}

      {preview && !loading && (
        <div style={{ marginBottom: "20px", borderRadius: T.r, overflow: "hidden", boxShadow: T.shadow }}>
          <img src={preview} alt="Alimento" style={{ width: "100%", display: "block" }} />
        </div>
      )}

      {result && (
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.r, padding: "20px", boxShadow: T.shadow }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: "16px" }}>
            <span style={{ fontSize: "32px", marginRight: "12px" }}>{result.emoji}</span>
            <div>
              <h2 style={{ margin: "0 0 4px 0", fontSize: "20px" }}>{result.food_name}</h2>
              <div style={{ fontSize: "12px", color: T.text3 }}>Confiança: {result.confidence}</div>
            </div>
          </div>

          <div style={{ background: T.surface2, padding: "16px", borderRadius: "12px", marginBottom: "16px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
              <div>
                <div style={{ fontSize: "12px", color: T.text2, marginBottom: "4px" }}>Porção</div>
                <div style={{ fontSize: "14px", fontWeight: 600 }}>{result.portion}</div>
              </div>
              <div>
                <div style={{ fontSize: "12px", color: T.text2, marginBottom: "4px" }}>Categoría</div>
                <div style={{ fontSize: "14px", fontWeight: 600 }}>{result.category}</div>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <div style={{ fontSize: "12px", fontWeight: 600, color: T.text2, marginBottom: "8px", textTransform: "uppercase" }}>Macronutrientes</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
              <div style={{ background: T.surface2, padding: "12px", borderRadius: "8px", textAlign: "center" }}>
                <div style={{ fontSize: "18px", fontWeight: 700, color: T.blue }}>{result.calories}</div>
                <div style={{ fontSize: "12px", color: T.text2 }}>kcal</div>
              </div>
              <div style={{ background: T.surface2, padding: "12px", borderRadius: "8px", textAlign: "center" }}>
                <div style={{ fontSize: "18px", fontWeight: 700, color: T.green }}>{result.protein}g</div>
                <div style={{ fontSize: "12px", color: T.text2 }}>Proteína</div>
              </div>
              <div style={{ background: T.surface2, padding: "12px", borderRadius: "8px", textAlign: "center" }}>
                <div style={{ fontSize: "18px", fontWeight: 700, color: "#FF9500" }}>{result.carbs}g</div>
                <div style={{ fontSize: "12px", color: T.text2 }}>Carbos</div>
              </div>
            </div>
          </div>

          {result.ai_tip && (
            <div style={{ background: T.blue + "08", border: `1px solid ${T.blue}30`, borderRadius: "8px", padding: "12px", fontSize: "13px", lineHeight: 1.5 }}>
              <strong>Dica:</strong> {result.ai_tip}
            </div>
          )}

          <button
            onClick={() => {
              setImage(null);
              setPreview(null);
              setResult(null);
            }}
            style={{
              width: "100%",
              padding: "12px",
              background: T.surface2,
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              marginTop: "16px",
            }}
          >
            Analisar Outro
          </button>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}
