import React, { useState } from "react";
import { useAuth } from "../../auth/hooks/useAuth";
import { useErrorHandler } from "../../../lib/hooks/useErrorHandler";
import { apiClient } from "../../../lib/api/client";
import { analytics } from "../../../lib/analytics";
import { logger } from "../../../lib/logger";
import * as db from "../../../lib/db";
import ScanCorrectionModal from "../../../components/ScanCorrectionModal";

function compressImage(dataUrl, maxSize = 800, quality = 0.82) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxSize || height > maxSize) {
        if (width > height) {
          height = Math.round((height * maxSize) / width);
          width = maxSize;
        } else {
          width = Math.round((width * maxSize) / height);
          height = maxSize;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d").drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

const CONF_COLOR = {
  alta:  "#34C759",
  media: "#FF9500",
  baixa: "#FF3B30",
};
const CONF_LABEL = {
  alta:  "Alta precisão",
  media: "Média precisão",
  baixa: "Baixa precisão",
};

export default function ScanPage() {
  const { user } = useAuth();
  const { handleError, handleRetry } = useErrorHandler();
  const [preview, setPreview]           = useState(null);
  const [loading, setLoading]           = useState(false);
  const [result, setResult]             = useState(null);
  const [savedScanId, setSavedScanId]   = useState(null);
  const [showCorrection, setShowCorrection]   = useState(false);
  const [savingCorrection, setSavingCorrection] = useState(false);
  const [retryCount, setRetryCount]     = useState(0);
  const maxRetries = 3;

  function handleImageSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      handleError(new Error("Imagem muito grande (máximo 10MB)"));
      return;
    }
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const compressed = await compressImage(event.target.result);
        setPreview(compressed);
        setRetryCount(0);
        setResult(null);
        await scanFood(compressed, "image/jpeg");
      } catch {
        handleError(new Error("Erro ao processar imagem"));
      }
    };
    reader.onerror = () => handleError(new Error("Erro ao ler arquivo"));
    reader.readAsDataURL(file);
  }

  async function scanFood(imageBase64, mediaType) {
    setLoading(true);
    analytics.trackScanStart();
    try {
      const res = await handleRetry(
        () => apiClient.scanFood(imageBase64, mediaType, user?.id),
        maxRetries
      );
      setResult(res.analysis || res);
      setSavedScanId(res.savedScan?.id || null);
      setRetryCount(0);
      analytics.trackScanSuccess(res.analysis || res);
      logger.info("Scan completed", { userId: user?.id, food: res.analysis?.food_name || res.food_name });
    } catch (err) {
      logger.error("Scan failed", { userId: user?.id, error: err.message });
      analytics.trackScanError(err, retryCount);
      handleError(err, { title: "Erro ao analisar alimento" });
      setRetryCount((prev) => prev + 1);
    } finally {
      setLoading(false);
    }
  }

  function resetScan() {
    setPreview(null);
    setResult(null);
    setRetryCount(0);
    setSavedScanId(null);
    setShowCorrection(false);
  }

  async function handleCorrection(updates) {
    if (!savedScanId) return;
    setSavingCorrection(true);
    try {
      await db.updateScanHistory(savedScanId, updates);
      setResult((prev) => ({ ...prev, ...updates, status: "verified" }));
      setShowCorrection(false);
    } catch (err) {
      console.error("Erro ao corrigir scan:", err);
    } finally {
      setSavingCorrection(false);
    }
  }

  /* ── UPLOAD ─────────────────────────────────────────── */
  if (!loading && !result) {
    return (
      <div style={{ minHeight: "100vh", paddingBottom: 90, background: "var(--ns-bg)" }}>
        <input
          type="file" accept="image/*" capture="environment"
          onChange={handleImageSelect} style={{ display: "none" }} id="image-input"
        />
        <label htmlFor="image-input" style={{ display: "block", cursor: "pointer" }}>
          <div style={{
            height: "calc(100vh - 90px)",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            padding: "0 32px",
          }}>
            {/* Ícone */}
            <div style={{
              width: 96, height: 96, borderRadius: 28,
              background: "var(--ns-bg-1)",
              display: "flex", alignItems: "center", justifyContent: "center",
              marginBottom: 28,
            }}>
              <svg width="42" height="38" viewBox="0 0 42 38" fill="none">
                <path d="M15 4L12 9H4C2 9 0 11 0 13V34C0 36 2 38 4 38H38C40 38 42 36 42 34V13C42 11 40 9 38 9H30L27 4H15Z" fill="var(--ns-bg-3)" />
                <circle cx="21" cy="23" r="8" fill="var(--ns-bg)" />
                <circle cx="21" cy="23" r="5.5" fill="var(--ns-t-2)" />
              </svg>
            </div>

            <h1 style={{
              fontSize: 28, fontWeight: 700, letterSpacing: -0.6,
              color: "var(--ns-t-primary)", marginBottom: 10, textAlign: "center",
            }}>
              Fotografe seu prato
            </h1>
            <p style={{
              fontSize: 15, color: "var(--ns-t-3)", textAlign: "center",
              lineHeight: 1.55, maxWidth: 260,
            }}>
              A IA identifica o alimento e calcula os macros automaticamente
            </p>

            {/* CTA */}
            <div style={{
              marginTop: 44,
              background: "var(--ns-t-primary)",
              borderRadius: 16, padding: "15px 48px",
            }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: "#000" }}>
                Escanear alimento
              </span>
            </div>

            <p style={{ marginTop: 14, fontSize: 12, color: "var(--ns-t-5)" }}>
              JPG, PNG · até 10MB
            </p>
          </div>
        </label>
      </div>
    );
  }

  /* ── LOADING ─────────────────────────────────────────── */
  if (loading) {
    return (
      <div style={{
        minHeight: "100vh", paddingBottom: 90,
        background: "var(--ns-bg)",
        display: "flex", flexDirection: "column",
      }}>
        {/* Imagem com overlay de análise */}
        {preview && (
          <div style={{ position: "relative", width: "100%", height: 300, overflow: "hidden", flexShrink: 0 }}>
            <img src={preview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)" }} />
            {/* Linha de scan */}
            <div style={{
              position: "absolute", left: 0, right: 0, height: 1.5,
              background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.8) 50%, transparent 100%)",
              animation: "ns-scan-line 1.8s ease-in-out infinite",
            }} />
          </div>
        )}

        <div style={{
          flex: 1, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", padding: 32,
        }}>
          {/* Spinner */}
          <div style={{
            width: 44, height: 44,
            border: "2px solid var(--ns-bg-3)",
            borderTop: "2px solid var(--ns-t-primary)",
            borderRadius: "50%",
            animation: "ns-rotate 0.75s linear infinite",
            marginBottom: 22,
          }} />
          <div style={{ fontSize: 20, fontWeight: 700, color: "var(--ns-t-primary)", marginBottom: 6 }}>
            {retryCount > 0 ? `Tentativa ${retryCount}/${maxRetries}...` : "Analisando..."}
          </div>
          <div style={{ fontSize: 14, color: "var(--ns-t-4)" }}>
            Identificando nutrientes
          </div>
        </div>
      </div>
    );
  }

  /* ── RESULTADO ───────────────────────────────────────── */
  const totalMacros = (result.protein || 0) + (result.carbs || 0) + (result.fat || 0) || 1;
  const confColor   = CONF_COLOR[result.confidence] || "#aeaeb2";

  return (
    <div style={{ background: "var(--ns-bg)", paddingBottom: 90, animation: "ns-fade-up 0.25s ease" }}>

      {/* Hero — imagem + nome */}
      {preview && (
        <div style={{ position: "relative", width: "100%", height: 280, overflow: "hidden" }}>
          <img src={preview} alt={result.food_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.1) 55%, transparent 100%)",
          }} />

          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "18px 18px 22px" }}>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 5, fontWeight: 500 }}>
                  {result.portion}
                </div>
                <h2 style={{
                  fontSize: 22, fontWeight: 800, color: "#fff",
                  letterSpacing: -0.4, margin: 0, lineHeight: 1.2,
                }}>
                  {result.emoji} {result.food_name}
                </h2>
              </div>

              {/* Badge de confiança */}
              <div style={{
                background: `${confColor}22`,
                border: `1px solid ${confColor}55`,
                borderRadius: 8, padding: "5px 10px", flexShrink: 0,
              }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: confColor }}>
                  {CONF_LABEL[result.confidence]}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ padding: "16px 16px 0" }}>

        {/* Calorias — destaque */}
        <div className="ns-card ns-shimmer" style={{ padding: "22px 20px", marginBottom: 10, textAlign: "center" }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: "var(--ns-t-4)", letterSpacing: 0.8, marginBottom: 8 }}>
            CALORIAS TOTAIS
          </div>
          <div style={{
            fontSize: 64, fontWeight: 800, color: "var(--ns-t-primary)",
            letterSpacing: -3, lineHeight: 1,
          }}>
            {result.calories}
          </div>
          <div style={{ fontSize: 13, color: "var(--ns-t-4)", marginTop: 6 }}>kcal</div>
        </div>

        {/* Macros com barras */}
        <div className="ns-card" style={{ padding: "18px 18px", marginBottom: 10 }}>
          <div className="ns-label" style={{ marginBottom: 16 }}>Macronutrientes</div>
          {[
            { label: "Proteína",     val: result.protein, color: "var(--ns-macro-prot)" },
            { label: "Carboidratos", val: result.carbs,   color: "var(--ns-macro-carb)" },
            { label: "Gordura",      val: result.fat,     color: "var(--ns-macro-fat)"  },
          ].map((m, i, arr) => {
            const pct = Math.round((m.val / totalMacros) * 100);
            return (
              <div key={m.label} style={{ marginBottom: i < arr.length - 1 ? 14 : 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                  <span style={{ fontSize: 13, color: "var(--ns-t-3)" }}>{m.label}</span>
                  <span style={{ fontSize: 15, fontWeight: 700, color: m.color }}>{m.val}g</span>
                </div>
                <div style={{ height: 3, background: "var(--ns-bg-2)", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{
                    height: "100%", width: `${pct}%`,
                    background: m.color, borderRadius: 3,
                    transition: "width 0.7s cubic-bezier(.4,0,.2,1)",
                  }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Micronutrientes */}
        <div className="ns-card" style={{ padding: "18px", marginBottom: 10 }}>
          <div className="ns-label" style={{ marginBottom: 16 }}>Micronutrientes</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 0 }}>
            {[
              { label: "Fibra",   val: result.fiber,  unit: "g"  },
              { label: "Açúcar",  val: result.sugar,  unit: "g"  },
              { label: "Sódio",   val: result.sodium, unit: "mg" },
            ].map((n, i) => (
              <div key={n.label} style={{
                textAlign: "center",
                borderRight: i < 2 ? "0.5px solid var(--ns-sep)" : "none",
              }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: "var(--ns-t-1)" }}>
                  {n.val}
                  <span style={{ fontSize: 11, fontWeight: 500, color: "var(--ns-t-4)" }}>{n.unit}</span>
                </div>
                <div style={{ fontSize: 10, color: "var(--ns-t-4)", marginTop: 3 }}>{n.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scores */}
        <div className="ns-card" style={{ padding: "18px", marginBottom: 10 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 0 }}>
            {[
              { label: "Índice Glicêmico", val: result.glycemic_index },
              { label: "Saciedade",        val: `${result.satiety_score}/10` },
              { label: "Cutting",          val: `${result.cutting_score}/10` },
            ].map((s, i) => (
              <div key={s.label} style={{
                textAlign: "center",
                borderRight: i < 2 ? "0.5px solid var(--ns-sep)" : "none",
                padding: "0 4px",
              }}>
                <div style={{
                  fontSize: 18, fontWeight: 700, color: "var(--ns-t-1)",
                  textTransform: "capitalize",
                }}>
                  {s.val}
                </div>
                <div style={{ fontSize: 10, color: "var(--ns-t-4)", marginTop: 3, lineHeight: 1.3 }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Benefícios */}
        {result.benefits?.length > 0 && (
          <div className="ns-card" style={{ padding: "18px", marginBottom: 10 }}>
            <div className="ns-label" style={{ marginBottom: 14 }}>Benefícios</div>
            {result.benefits.map((b, i) => (
              <div key={i} style={{
                display: "flex", gap: 10, alignItems: "flex-start",
                marginBottom: i < result.benefits.length - 1 ? 12 : 0,
              }}>
                <div style={{
                  width: 18, height: 18, borderRadius: "50%",
                  background: "var(--ns-bg-2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, marginTop: 1,
                }}>
                  <svg width="8" height="7" viewBox="0 0 8 7" fill="none">
                    <path d="M1 3.5L3 5.5L7 1.5" stroke="var(--ns-t-2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span style={{ fontSize: 13, color: "var(--ns-t-2)", lineHeight: 1.45 }}>{b}</span>
              </div>
            ))}
          </div>
        )}

        {/* Atenção */}
        {result.watch_out && (
          <div className="ns-card" style={{ padding: "14px 18px", marginBottom: 10 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span style={{ fontSize: 15, flexShrink: 0, marginTop: 1 }}>⚠️</span>
              <span style={{ fontSize: 13, color: "var(--ns-t-3)", lineHeight: 1.45 }}>
                {result.watch_out}
              </span>
            </div>
          </div>
        )}

        {/* Dica da IA */}
        {result.ai_tip && (
          <div className="ns-card" style={{ padding: "16px 18px", marginBottom: 20 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span style={{ fontSize: 15, flexShrink: 0, marginTop: 2 }}>💡</span>
              <div>
                <div style={{ fontSize: 10, fontWeight: 600, color: "var(--ns-t-4)", letterSpacing: 0.6, marginBottom: 5 }}>
                  DICA
                </div>
                <span style={{ fontSize: 13, color: "var(--ns-t-2)", lineHeight: 1.5 }}>
                  {result.ai_tip}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Ações */}
        <div style={{ display: "flex", gap: 10, marginBottom: 8 }}>
          {savedScanId && (
            <button
              onClick={() => setShowCorrection(true)}
              style={{
                flex: 1, padding: "15px", borderRadius: 14,
                background: "var(--ns-bg-1)", border: "none", cursor: "pointer",
                fontSize: 14, fontWeight: 600, color: "var(--ns-t-2)",
              }}
            >
              ✏️ Corrigir
            </button>
          )}
          <button
            onClick={resetScan}
            style={{
              flex: 1, padding: "15px", borderRadius: 14,
              background: "var(--ns-t-primary)", border: "none", cursor: "pointer",
              fontSize: 14, fontWeight: 700, color: "#000",
            }}
          >
            Escanear outro
          </button>
        </div>

        {result.status === "verified" && (
          <div style={{ textAlign: "center", fontSize: 12, color: "var(--ns-t-4)", paddingBottom: 4 }}>
            ✓ Corrigido manualmente
          </div>
        )}
      </div>

      {showCorrection && result && (
        <ScanCorrectionModal
          scan={result}
          onSave={handleCorrection}
          onClose={() => setShowCorrection(false)}
          saving={savingCorrection}
        />
      )}
    </div>
  );
}
