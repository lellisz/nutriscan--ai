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
  alta:  "#16A34A",
  media: "#D97706",
  baixa: "#DC2626",
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
      <div style={{ minHeight: "100dvh", paddingBottom: 90, background: "#FFFFFF" }}>
        <input
          type="file" accept="image/*" capture="environment"
          onChange={handleImageSelect} style={{ display: "none" }} id="image-input"
        />
        <label
          htmlFor="image-input"
          style={{ display: "block", cursor: "pointer", WebkitTapHighlightColor: "transparent" }}
        >
          <div style={{
            height: "calc(100dvh - 90px)",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            padding: "0 24px",
          }}>
            {/* Zona de upload */}
            <div style={{
              width: "100%", maxWidth: 320,
              background: "#F5F5F5",
              border: "1.5px dashed rgba(0,0,0,0.15)",
              borderRadius: 24,
              padding: "40px 24px",
              display: "flex", flexDirection: "column",
              alignItems: "center", gap: 16,
              marginBottom: 32,
            }}>
              {/* Ícone câmera */}
              <div style={{
                width: 64, height: 64, borderRadius: 16,
                background: "#000000",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <rect x="2" y="7" width="20" height="14" rx="3" stroke="#FFF" strokeWidth="1.7" />
                  <circle cx="12" cy="14" r="3.5" stroke="#FFF" strokeWidth="1.7" />
                  <path d="M8 7l2-3h4l2 3" stroke="#FFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              <div style={{ fontSize: 18, fontWeight: 700, color: "#000", letterSpacing: "-0.03em", textAlign: "center" }}>
                Fotografe seu alimento
              </div>
              <div style={{ fontSize: 14, color: "#6B6B6B", textAlign: "center", lineHeight: 1.5 }}>
                A IA identifica e calcula os macros automaticamente
              </div>

              <div style={{ fontSize: 26 }}>🍎 🥗 🍗</div>
            </div>

            {/* CTA */}
            <button style={{
              background: "#000000",
              color: "#FFFFFF",
              borderRadius: 14,
              height: 52,
              width: "100%",
              maxWidth: 320,
              fontSize: 16, fontWeight: 700,
              letterSpacing: "-0.01em",
              border: "none",
              cursor: "pointer",
              WebkitTapHighlightColor: "transparent",
            }}>
              📸 Analisar Alimento
            </button>

            <p style={{ marginTop: 12, fontSize: 12, color: "#B0B0B0", letterSpacing: "-0.01em" }}>
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
        minHeight: "100dvh", paddingBottom: 90,
        background: "#FFFFFF",
        display: "flex", flexDirection: "column",
      }}>
        {/* Imagem com overlay de análise */}
        {preview && (
          <div style={{ position: "relative", width: "100%", height: 320, overflow: "hidden", flexShrink: 0 }}>
            <img src={preview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.7)" }} />
            {/* Linha de scan */}
            <div style={{
              position: "absolute", left: 0, right: 0, height: 2,
              background: "linear-gradient(90deg, transparent 0%, #16A34A 50%, transparent 100%)",
              animation: "ns-scan-line 1.8s ease-in-out infinite",
            }} />
            {/* Cantos do viewfinder */}
            {[
              { top: 24, left: 24 },
              { top: 24, right: 24 },
              { bottom: 24, left: 24 },
              { bottom: 24, right: 24 },
            ].map((pos, i) => (
              <div key={i} style={{
                position: "absolute", ...pos,
                width: 20, height: 20,
                borderTop: i < 2 ? "2px solid #000" : "none",
                borderBottom: i >= 2 ? "2px solid #000" : "none",
                borderLeft: (i === 0 || i === 2) ? "2px solid #000" : "none",
                borderRight: (i === 1 || i === 3) ? "2px solid #000" : "none",
              }} />
            ))}
          </div>
        )}

        <div style={{
          flex: 1, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", padding: 32,
        }}>
          {/* Spinner preto */}
          <div style={{
            width: 52, height: 52,
            border: "2px solid #E8E8E8",
            borderTop: "2.5px solid #000",
            borderRadius: "50%",
            animation: "ns-rotate 0.75s linear infinite",
            marginBottom: 24,
          }} />
          <div style={{
            fontSize: 22, fontWeight: 800, color: "#000", marginBottom: 8,
            letterSpacing: "-0.04em",
          }}>
            {retryCount > 0 ? `Tentativa ${retryCount}/${maxRetries}...` : "Analisando..."}
          </div>
          <div style={{ fontSize: 14, color: "#6B6B6B", letterSpacing: "-0.02em" }}>
            Identificando nutrientes com IA
          </div>

          {/* Shimmer pills */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 32, width: "100%", maxWidth: 200 }}>
            {[80, 60, 70].map((w, i) => (
              <div key={i} style={{
                height: 8, borderRadius: 4,
                background: "#F0F0F0",
                width: `${w}%`,
                alignSelf: "center",
                animation: `ns-pulse ${1.2 + i * 0.2}s ease-in-out infinite`,
              }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ── RESULTADO ───────────────────────────────────────── */
  const totalMacros = (result.protein || 0) + (result.carbs || 0) + (result.fat || 0) || 1;
  const confColor   = CONF_COLOR[result.confidence] || "#6B6B6B";

  return (
    <div style={{ background: "#FFFFFF", paddingBottom: 90, animation: "ns-fade-up 0.25s ease" }}>

      {/* Hero — imagem + nome */}
      {preview && (
        <div style={{ position: "relative", width: "100%", height: 300, overflow: "hidden" }}>
          <img src={preview} alt={result.food_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(to top, rgba(255,255,255,0.97) 0%, rgba(255,255,255,0.2) 55%, transparent 100%)",
          }} />

          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "20px 20px 26px" }}>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12, color: "#B0B0B0", marginBottom: 6, fontWeight: 500 }}>
                  {result.portion}
                </div>
                <h2 style={{
                  fontSize: 26, fontWeight: 800, color: "#000",
                  letterSpacing: "-0.04em", margin: 0, lineHeight: 1.1,
                }}>
                  {result.emoji} {result.food_name}
                </h2>
              </div>

              {/* Badge de confiança */}
              <div style={{
                background: `${confColor}14`,
                border: `0.5px solid ${confColor}44`,
                borderRadius: 10, padding: "6px 12px", flexShrink: 0,
              }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: confColor, letterSpacing: "-0.01em" }}>
                  {CONF_LABEL[result.confidence]}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ padding: "16px 16px 0" }}>

        {/* Calorias — destaque hero */}
        <div style={{
          padding: "24px 20px", marginBottom: 10, textAlign: "center",
          background: "#F5F5F5", borderRadius: 20,
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#B0B0B0", letterSpacing: "0.06em", marginBottom: 8 }}>
            CALORIAS TOTAIS
          </div>
          <div style={{
            fontSize: 52, fontWeight: 800, color: "#000",
            letterSpacing: "-0.06em", lineHeight: 1,
          }}>
            {result.calories}
          </div>
          <div style={{ fontSize: 14, color: "#6B6B6B", marginTop: 6 }}>kcal</div>
        </div>

        {/* Grid 2x2 de macros */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
          {[
            { label: "Proteína",     val: result.protein, unit: "g" },
            { label: "Carboidratos", val: result.carbs,   unit: "g" },
            { label: "Gordura",      val: result.fat,     unit: "g" },
            { label: "Fibra",        val: result.fiber,   unit: "g" },
          ].map((m) => {
            const pct = Math.round((m.val / totalMacros) * 100);
            return (
              <div
                key={m.label}
                style={{
                  background: "#F5F5F5",
                  borderRadius: 16, padding: "16px 14px",
                }}
              >
                <div style={{ fontSize: 11, color: "#B0B0B0", letterSpacing: "0.03em", marginBottom: 6, fontWeight: 600, textTransform: "uppercase" }}>
                  {m.label}
                </div>
                <div style={{
                  fontSize: 32, fontWeight: 800, color: "#000",
                  letterSpacing: "-0.05em", lineHeight: 1,
                }}>
                  {m.val}
                  <span style={{ fontSize: 14, fontWeight: 500, color: "#B0B0B0" }}>{m.unit}</span>
                </div>
                <div style={{
                  height: 3, borderRadius: 3, background: "#E8E8E8",
                  overflow: "hidden", marginTop: 10,
                }}>
                  <div style={{
                    height: "100%", width: `${pct}%`,
                    background: "#000",
                    borderRadius: 3,
                    transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)",
                  }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Micronutrientes */}
        <div style={{
          padding: "18px", marginBottom: 10,
          background: "#F5F5F5", borderRadius: 16,
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#000", letterSpacing: "-0.03em", marginBottom: 14 }}>
            Micronutrientes
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
            {[
              { label: "Açúcar",  val: result.sugar,  unit: "g"  },
              { label: "Sódio",   val: result.sodium, unit: "mg" },
            ].map((n, i) => (
              <div
                key={n.label}
                style={{
                  textAlign: "center",
                  borderRight: i === 0 ? "0.5px solid rgba(0,0,0,0.08)" : "none",
                  padding: "0 8px",
                }}
              >
                <div style={{ fontSize: 24, fontWeight: 800, color: "#000", letterSpacing: "-0.04em" }}>
                  {n.val}
                  <span style={{ fontSize: 12, fontWeight: 500, color: "#B0B0B0" }}>{n.unit}</span>
                </div>
                <div style={{ fontSize: 11, color: "#6B6B6B", marginTop: 3 }}>{n.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scores */}
        <div style={{
          padding: "18px", marginBottom: 10,
          background: "#F5F5F5", borderRadius: 16,
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 0 }}>
            {[
              { label: "Glicêmico", val: result.glycemic_index },
              { label: "Saciedade", val: `${result.satiety_score}/10` },
              { label: "Cutting",   val: `${result.cutting_score}/10` },
            ].map((s, i) => (
              <div key={s.label} style={{
                textAlign: "center",
                borderRight: i < 2 ? "0.5px solid rgba(0,0,0,0.08)" : "none",
                padding: "0 4px",
              }}>
                <div style={{
                  fontSize: 20, fontWeight: 800, color: "#000",
                  letterSpacing: "-0.04em",
                }}>
                  {s.val}
                </div>
                <div style={{ fontSize: 10, color: "#6B6B6B", marginTop: 3, lineHeight: 1.3 }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Benefícios */}
        {result.benefits?.length > 0 && (
          <div style={{
            padding: "18px", marginBottom: 10,
            background: "#F5F5F5", borderRadius: 16,
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#000", letterSpacing: "-0.03em", marginBottom: 14 }}>
              Benefícios
            </div>
            {result.benefits.map((b, i) => (
              <div key={i} style={{
                display: "flex", gap: 10, alignItems: "flex-start",
                marginBottom: i < result.benefits.length - 1 ? 12 : 0,
              }}>
                <div style={{
                  width: 20, height: 20, borderRadius: "50%",
                  background: "#F0FDF4",
                  border: "0.5px solid rgba(22,163,74,0.25)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, marginTop: 1,
                }}>
                  <svg width="8" height="7" viewBox="0 0 8 7" fill="none">
                    <path d="M1 3.5L3 5.5L7 1.5" stroke="#16A34A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span style={{ fontSize: 13, color: "#000", lineHeight: 1.5 }}>{b}</span>
              </div>
            ))}
          </div>
        )}

        {/* Atenção */}
        {result.watch_out && (
          <div style={{
            padding: "14px 18px", marginBottom: 10,
            background: "#FEF2F2",
            border: "0.5px solid rgba(220,38,38,0.20)", borderRadius: 16,
          }}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>⚠️</span>
              <span style={{ fontSize: 13, color: "#000", lineHeight: 1.5 }}>
                {result.watch_out}
              </span>
            </div>
          </div>
        )}

        {/* Dica da IA */}
        {result.ai_tip && (
          <div style={{
            padding: "16px 18px", marginBottom: 20,
            background: "#F0FDF4",
            border: "0.5px solid rgba(22,163,74,0.18)", borderRadius: 16,
          }}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>💡</span>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#16A34A", letterSpacing: "0.04em", marginBottom: 5 }}>
                  DICA DA IA
                </div>
                <span style={{ fontSize: 13, color: "#000", lineHeight: 1.55 }}>
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
                flex: 1, height: 52, borderRadius: 14,
                background: "#F5F5F5",
                border: "0.5px solid rgba(0,0,0,0.10)",
                cursor: "pointer",
                fontSize: 15, fontWeight: 600, color: "#000",
                letterSpacing: "-0.02em",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              Corrigir
            </button>
          )}
          <button
            onClick={resetScan}
            style={{
              flex: 1, height: 52, borderRadius: 14,
              background: "#000000", border: "none", cursor: "pointer",
              fontSize: 15, fontWeight: 700, color: "#FFF",
              letterSpacing: "-0.03em",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            Escanear outro
          </button>
        </div>

        {result.status === "verified" && (
          <div style={{ textAlign: "center", fontSize: 12, color: "#16A34A", paddingBottom: 4 }}>
            Corrigido manualmente
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
