import React, { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useAuth } from "../../auth/hooks/useAuth";
import { useErrorHandler } from "../../../lib/hooks/useErrorHandler";
import { apiClient } from "../../../lib/api/client";
import { analytics } from "../../../lib/analytics";
import { logger } from "../../../lib/logger";
import * as db from "../../../lib/db";
import ScanCorrectionModal from "../../../components/ScanCorrectionModal";
import { useVoiceInput } from "../../../lib/hooks/useVoiceInput";
import VoicePreviewModal from "../components/VoicePreviewModal";
import { haptic } from "../../../lib/haptics";
import MealTemplatesSelector from "../components/MealTemplatesSelector";
import PortionAdjustModal from "../components/PortionAdjustModal";

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
  alta:  "var(--ns-accent)",
  media: "var(--ns-orange)",
  baixa: "var(--ns-danger)",
};
const CONF_LABEL = {
  alta:  "Alta precisão",
  media: "Média precisão",
  baixa: "Baixa precisão",
};

// 5.2 — Categorização de refeições por horário
const MEAL_TYPES = [
  { id: "breakfast", label: "Café da manhã", emoji: "🌅" },
  { id: "lunch",     label: "Almoço",        emoji: "🍽️" },
  { id: "snack",     label: "Lanche",        emoji: "🍎" },
  { id: "dinner",    label: "Jantar",        emoji: "🌙" },
];

function detectMealType() {
  const h = new Date().getHours();
  if (h >= 5  && h < 11) return "breakfast";
  if (h >= 11 && h < 15) return "lunch";
  if (h >= 15 && h < 19) return "snack";
  return "dinner";
}

export default function ScanPage() {
  const { user } = useAuth();
  const { handleError, handleRetry } = useErrorHandler();
  const shouldReduce = useReducedMotion();
  const [preview, setPreview]           = useState(null);
  const [loading, setLoading]           = useState(false);
  const [result, setResult]             = useState(null);
  const [scanError, setScanError]       = useState(null);
  const [savedScanId, setSavedScanId]   = useState(null);
  const [showCorrection, setShowCorrection]   = useState(false);
  const [savingCorrection, setSavingCorrection] = useState(false);
  const [retryCount, setRetryCount]     = useState(0);
  const [mealType, setMealType]         = useState(detectMealType);
  const [showTemplates, setShowTemplates]     = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const maxRetries = 3;
  const voice = useVoiceInput();

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
    setScanError(null);
    analytics.trackScanStart();
    try {
      const res = await handleRetry(
        () => apiClient.scanFood(imageBase64, mediaType, user?.id),
        maxRetries
      );
      setResult(res.analysis || res);
      setSavedScanId(res.savedScan?.id || null);
      setRetryCount(0);
      haptic('medium');
      analytics.trackScanSuccess(res.analysis || res);
      logger.info("Scan completed", { userId: user?.id, food: res.analysis?.food_name || res.food_name });
    } catch (err) {
      logger.error("Scan failed", { userId: user?.id, error: err.message });
      analytics.trackScanError(err, retryCount);
      handleError(err, { title: "Erro ao analisar refeição" });
      setScanError(err.message || "Erro ao analisar a refeição. Tente novamente.");
      setRetryCount((prev) => prev + 1);
    } finally {
      setLoading(false);
    }
  }

  function resetScan() {
    setPreview(null);
    setResult(null);
    setScanError(null);
    setRetryCount(0);
    setSavedScanId(null);
    setShowCorrection(false);
  }

  async function handleMealTypeChange(type) {
    setMealType(type);
    if (savedScanId) {
      try {
        await db.updateScanHistory(savedScanId, { meal_type: type });
      } catch {
        // Silently ignore — not critical
      }
    }
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
      handleError(new Error("Erro ao salvar correção. Tente novamente."));
    } finally {
      setSavingCorrection(false);
    }
  }

  /* ── ERRO ───────────────────────────────────────────── */
  if (!loading && !result && scanError) {
    return (
      <div style={{ minHeight: "100dvh", paddingBottom: 90, background: "var(--ns-bg-primary)" }}>
        <header style={{ padding: "16px 20px 12px", background: "var(--ns-bg-primary)" }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "var(--ns-text-primary)", letterSpacing: "-0.02em", margin: 0 }}>
            Escanear
          </h1>
        </header>

        {/* Preview da imagem que falhou */}
        {preview && (
          <div style={{ position: "relative", width: "100%", height: 220, overflow: "hidden" }}>
            <img src={preview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.6)" }} />
          </div>
        )}

        <div style={{ padding: "24px 20px" }}>
          {/* Card de erro */}
          <div style={{
            background: "var(--ns-danger-bg)",
            border: "0.5px solid rgba(196,57,28,0.25)",
            borderRadius: 20,
            padding: "20px",
            marginBottom: 16,
          }}>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 12 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: "rgba(196,57,28,0.12)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 1.5L1 14h14L8 1.5z" stroke="var(--ns-danger)" strokeWidth="1.4" strokeLinejoin="round" />
                  <path d="M8 6.5v3.5" stroke="var(--ns-danger)" strokeWidth="1.4" strokeLinecap="round" />
                  <circle cx="8" cy="12" r="0.8" fill="var(--ns-danger)" />
                </svg>
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: "var(--ns-text-primary)", marginBottom: 4 }}>
                  Erro ao analisar
                </div>
                <div style={{ fontSize: 13, color: "var(--ns-text-muted)", lineHeight: 1.5 }}>
                  {scanError}
                </div>
              </div>
            </div>
          </div>

          {/* Botão tentar novamente com a mesma imagem */}
          {preview && retryCount < maxRetries && (
            <button
              onClick={() => scanFood(preview, "image/jpeg")}
              style={{
                width: "100%", height: 52, borderRadius: 14,
                background: "var(--ns-accent)", border: "none",
                fontSize: 15, fontWeight: 600, color: "#FFF",
                letterSpacing: "-0.02em", cursor: "pointer",
                WebkitTapHighlightColor: "transparent",
                marginBottom: 10,
              }}
            >
              Tentar novamente
            </button>
          )}

          <button
            onClick={resetScan}
            style={{
              width: "100%", height: 52, borderRadius: 14,
              background: "var(--ns-bg-card)",
              border: "0.5px solid var(--ns-border)",
              fontSize: 15, fontWeight: 600, color: "var(--ns-text-primary)",
              letterSpacing: "-0.02em", cursor: "pointer",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            Escolher outra foto
          </button>
        </div>
      </div>
    );
  }

  /* ── UPLOAD ─────────────────────────────────────────── */
  if (!loading && !result) {
    return (
      <div style={{ minHeight: "100dvh", paddingBottom: 90, background: "var(--ns-bg-primary)" }}>
        {/* ── Header contextual ── */}
        <header style={{ padding: '20px 20px 16px', background: 'var(--ns-bg-primary)' }} className="animate-fade-up">
          <h1 style={{
            fontSize: 28, fontWeight: 700,
            color: 'var(--ns-text-primary)',
            letterSpacing: '-0.03em',
            margin: 0, lineHeight: 1.1,
          }}>
            Escanear refeição
          </h1>
          <p style={{
            fontSize: 14, color: 'var(--ns-text-muted)',
            margin: '6px 0 0', lineHeight: 1.4,
          }}>
            Tire uma foto ou selecione da galeria
          </p>
        </header>

        <input
          type="file" accept="image/*" capture="environment"
          onChange={handleImageSelect} style={{ display: "none" }} id="image-input"
        />
        <label
          htmlFor="image-input"
          style={{ display: "block", cursor: "pointer", WebkitTapHighlightColor: "transparent" }}
        >
          <div style={{
            height: "calc(100dvh - 90px - 96px)",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            padding: "0 24px",
          }}>
            {/* Zona de upload — empty state premium */}
            <div style={{
              width: "100%", maxWidth: 320,
              background: "var(--ns-bg-card)",
              border: "1.5px dashed var(--ns-border-strong)",
              borderRadius: 24,
              padding: "40px 24px",
              display: "flex", flexDirection: "column",
              alignItems: "center", gap: 16,
              marginBottom: 28,
              boxShadow: "var(--ns-shadow-sm)",
            }} className="animate-fade-up stagger-1">
              {/* Ícone câmera estilizado — duplo anel + câmera */}
              <div style={{ position: 'relative', width: 80, height: 80 }}>
                {/* Anel externo sutil */}
                <div style={{
                  position: 'absolute', inset: 0, borderRadius: '50%',
                  border: '1.5px solid rgba(45,143,94,0.15)',
                  background: 'rgba(45,143,94,0.04)',
                }} />
                {/* Anel médio */}
                <div style={{
                  position: 'absolute', inset: 8, borderRadius: '50%',
                  border: '1.5px solid rgba(45,143,94,0.20)',
                  background: 'rgba(45,143,94,0.06)',
                }} />
                {/* Círculo central com ícone */}
                <div style={{
                  position: 'absolute', inset: 16, borderRadius: '50%',
                  background: 'var(--ns-accent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 16px rgba(45,143,94,0.35)',
                }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <rect x="2" y="7" width="20" height="14" rx="3" stroke="#FFF" strokeWidth="1.7" />
                    <circle cx="12" cy="14" r="3.5" stroke="#FFF" strokeWidth="1.7" />
                    <path d="M8 7l2-3h4l2 3" stroke="#FFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>

              <div style={{ fontSize: 18, fontWeight: 600, color: "var(--ns-text-primary)", letterSpacing: "-0.02em", textAlign: "center" }}>
                Fotografe seu alimento
              </div>
              <div style={{ fontSize: 14, color: "var(--ns-text-muted)", textAlign: "center", lineHeight: 1.5 }}>
                A IA identifica e calcula os macros automaticamente
              </div>

              <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                {['Frutas', 'Saladas', 'Refeicoes'].map(t => (
                  <span key={t} style={{
                    fontSize: 11, fontWeight: 500, color: 'var(--ns-text-muted)',
                    background: 'var(--ns-bg-elevated)', borderRadius: 6, padding: '3px 8px',
                    border: '0.5px solid var(--ns-border)',
                  }}>{t}</span>
                ))}
              </div>
            </div>

            {/* CTA */}
            <motion.button
              whileTap={{ scale: shouldReduce ? 1 : 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              style={{
                background: "var(--ns-accent)",
                color: "#FFFFFF",
                borderRadius: 14,
                height: 52,
                width: "100%",
                maxWidth: 320,
                fontSize: 16, fontWeight: 600,
                letterSpacing: "-0.01em",
                border: "none",
                cursor: "pointer",
                WebkitTapHighlightColor: "transparent",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <rect x="2" y="7" width="20" height="14" rx="3" stroke="#FFF" strokeWidth="1.7" />
                <circle cx="12" cy="14" r="3.5" stroke="#FFF" strokeWidth="1.7" />
                <path d="M8 7l2-3h4l2 3" stroke="#FFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Analisar Alimento
            </motion.button>

            <p style={{ marginTop: 12, fontSize: 12, color: "var(--ns-text-muted)", letterSpacing: "-0.01em" }}>
              JPG, PNG · até 10MB
            </p>
          </div>
        </label>

        {/* Botão de voz */}
        {voice.isSupported && (
          <div style={{ padding: "0 20px 20px", display: "flex", justifyContent: "center" }}>
            <motion.button
              onClick={(e) => { e.stopPropagation(); voice.isListening ? voice.stop() : voice.start(); }}
              whileTap={{ scale: shouldReduce ? 1 : 0.92 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              animate={voice.isListening ? { scale: [1, 1.05, 1] } : { scale: 1 }}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "10px 20px", borderRadius: 12,
                background: voice.isListening ? "var(--ns-accent)" : "var(--ns-bg-card)",
                border: `1.5px solid ${voice.isListening ? "var(--ns-accent)" : "var(--ns-border)"}`,
                color: voice.isListening ? "#FFF" : "var(--ns-text-primary)",
                fontSize: 14, fontWeight: 600, cursor: "pointer",
                WebkitTapHighlightColor: "transparent",
                boxShadow: voice.isListening ? "0 0 0 4px rgba(26,127,86,0.2)" : "none",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <rect x="9" y="2" width="6" height="11" rx="3"
                  stroke={voice.isListening ? "#FFF" : "var(--ns-accent)"}
                  strokeWidth="1.7" />
                <path d="M5 11a7 7 0 0014 0" stroke={voice.isListening ? "#FFF" : "var(--ns-accent)"}
                  strokeWidth="1.7" strokeLinecap="round" />
                <line x1="12" y1="18" x2="12" y2="22" stroke={voice.isListening ? "#FFF" : "var(--ns-accent)"}
                  strokeWidth="1.7" strokeLinecap="round" />
              </svg>
              {voice.isListening ? "Ouvindo..." : voice.isProcessing ? "Processando..." : "Registrar por voz"}
            </motion.button>
          </div>
        )}
        {/* Modal de preview de voz */}
        {voice.hasResult && (
          <VoicePreviewModal
            foods={voice.foods}
            transcript={voice.transcript}
            onConfirm={async () => {
              for (const food of voice.foods) {
                try {
                  await db.saveScanHistory({
                    userId: user?.id,
                    analysis: {
                      food_name:  food.name,
                      calories:   food.kcal,
                      protein:    food.protein_g,
                      carbs:      food.carb_g,
                      fat:        food.fat_g,
                      confidence: "media",
                      ai_tip:     "Registrado por voz",
                      meal_type:  mealType,
                    },
                  });
                } catch (err) {
                  console.error("Erro ao salvar alimento por voz:", err);
                }
              }
              voice.reset();
            }}
            onCancel={voice.reset}
          />
        )}

        {/* Separador "ou use um template" */}
        <div style={{ padding: "0 20px 8px", display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ flex: 1, height: 1, background: "var(--ns-border)" }} />
          <span style={{ fontSize: 12, color: "var(--ns-text-disabled)", whiteSpace: "nowrap" }}>
            ou use um template
          </span>
          <div style={{ flex: 1, height: 1, background: "var(--ns-border)" }} />
        </div>

        {/* Botão "Usar template rápido" */}
        <div style={{ padding: "0 20px 20px", display: "flex", justifyContent: "center" }}>
          <button
            onClick={() => setShowTemplates(true)}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "10px 20px", borderRadius: 12,
              background: "transparent",
              border: "1.5px solid var(--ns-accent)",
              color: "var(--ns-accent)",
              fontSize: 14, fontWeight: 600, cursor: "pointer",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            🍽️ Usar template rápido
          </button>
        </div>

        {/* Seletor de templates */}
        {showTemplates && (
          <MealTemplatesSelector
            onClose={() => setShowTemplates(false)}
            onSelect={(tmpl) => {
              setShowTemplates(false);
              setSelectedTemplate(tmpl);
            }}
          />
        )}

        {/* Modal de ajuste de porção */}
        {selectedTemplate && (
          <PortionAdjustModal
            template={selectedTemplate}
            onClose={() => setSelectedTemplate(null)}
            onConfirm={async ({ template, scaledMacros }) => {
              try {
                await db.saveScanHistory({
                  userId: user?.id,
                  analysis: {
                    food_name: template.name,
                    calories:  scaledMacros.calories,
                    protein:   scaledMacros.protein,
                    carbs:     scaledMacros.carbs,
                    fat:       scaledMacros.fat,
                    confidence: "alta",
                    ai_tip:    "Adicionado via template",
                    meal_type: mealType,
                  },
                });
                setSelectedTemplate(null);
                haptic("success");
              } catch (err) {
                console.error("Erro ao salvar template:", err);
              }
            }}
          />
        )}
      </div>
    );
  }

  /* ── LOADING ─────────────────────────────────────────── */
  if (loading) {
    return (
      <div style={{
        minHeight: "100dvh", paddingBottom: 90,
        background: "var(--ns-bg-primary)",
        display: "flex", flexDirection: "column",
      }}>
        {/* Imagem com overlay de análise */}
        {preview && (
          <div style={{ position: "relative", width: "100%", height: 320, overflow: "hidden", flexShrink: 0 }}>
            <img src={preview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <div style={{ position: "absolute", inset: 0, background: "rgba(244,245,240,0.72)" }} />
            {/* Linha de scan */}
            <div style={{
              position: "absolute", left: 0, right: 0, height: 2,
              background: "linear-gradient(90deg, transparent 0%, var(--ns-accent) 50%, transparent 100%)",
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
                borderTop: i < 2 ? "2px solid var(--ns-accent)" : "none",
                borderBottom: i >= 2 ? "2px solid var(--ns-accent)" : "none",
                borderLeft: (i === 0 || i === 2) ? "2px solid var(--ns-accent)" : "none",
                borderRight: (i === 1 || i === 3) ? "2px solid var(--ns-accent)" : "none",
              }} />
            ))}
          </div>
        )}

        <div style={{
          flex: 1, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", padding: 32,
        }}>
          {/* Spinner verde */}
          <div style={{
            width: 52, height: 52,
            border: "2.5px solid var(--ns-ring-track)",
            borderTop: "2.5px solid var(--ns-accent)",
            borderRadius: "50%",
            animation: "ns-rotate 0.75s linear infinite",
            marginBottom: 24,
          }} />
          <div style={{
            fontSize: 20, fontWeight: 600, color: "var(--ns-text-primary)", marginBottom: 8,
            letterSpacing: "-0.03em",
          }}>
            {retryCount > 0 ? `Tentativa ${retryCount}/${maxRetries}...` : "Analisando..."}
          </div>
          <div style={{ fontSize: 14, color: "var(--ns-text-muted)", letterSpacing: "-0.01em" }}>
            Identificando nutrientes com IA
          </div>

          {/* Shimmer pills */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 32, width: "100%", maxWidth: 200 }}>
            {[80, 60, 70].map((w, i) => (
              <div key={i} style={{
                height: 8, borderRadius: 4,
                background: "var(--ns-ring-track)",
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
  const confColor   = CONF_COLOR[result.confidence] || "var(--ns-text-muted)";

  const SCAN_MACRO_COLORS = {
    "Proteína":     "var(--ns-macro-protein)",
    "Carboidratos": "var(--ns-macro-carbs)",
    "Gordura":      "var(--ns-macro-fat)",
    "Fibra":        "var(--ns-accent)",
  };

  return (
    <div style={{ background: "var(--ns-bg-primary)", paddingBottom: 90, animation: "ns-fade-up 0.25s ease" }}>

      {/* ── Header resultado ── */}
      <header style={{ padding: '20px 20px 14px', background: 'var(--ns-bg-primary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <h1 style={{
              fontSize: 28, fontWeight: 700,
              color: 'var(--ns-text-primary)',
              letterSpacing: '-0.03em',
              margin: 0, lineHeight: 1.1,
            }}>
              Resultado da analise
            </h1>
            <p style={{
              fontSize: 14, color: 'var(--ns-text-muted)',
              margin: '6px 0 0', lineHeight: 1.4,
            }}>
              {result.food_name || 'Alimento identificado'}
            </p>
          </div>
          {/* Badge de confiança no header */}
          <div style={{
            background: `${confColor}14`,
            border: `0.5px solid ${confColor}40`,
            borderRadius: 100, padding: '6px 12px', flexShrink: 0,
          }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: confColor, letterSpacing: '0.01em' }}>
              {CONF_LABEL[result.confidence]}
            </span>
          </div>
        </div>
      </header>

      {/* 5.2 — Seletor de tipo de refeição */}
      <div style={{ padding: "0 20px 12px", display: "flex", gap: 8, overflowX: "auto", scrollbarWidth: "none" }}>
        {MEAL_TYPES.map(({ id, label, emoji }) => {
          const active = mealType === id;
          return (
            <button
              key={id}
              onClick={() => handleMealTypeChange(id)}
              style={{
                flexShrink: 0,
                padding: "6px 14px",
                borderRadius: 20,
                border: active ? "1.5px solid var(--ns-accent)" : "1px solid var(--ns-border)",
                background: active ? "var(--ns-accent-bg)" : "var(--ns-bg-elevated)",
                color: active ? "var(--ns-accent)" : "var(--ns-text-muted)",
                fontSize: 13,
                fontWeight: active ? 600 : 400,
                cursor: "pointer",
                fontFamily: "inherit",
                display: "flex",
                alignItems: "center",
                gap: 5,
                transition: "all 0.15s ease",
              }}
            >
              <span>{emoji}</span>
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {/* Hero — imagem + nome */}
      {preview && (
        <div style={{ position: "relative", width: "100%", height: 260, overflow: "hidden" }}>
          <img src={preview} alt={result.food_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(to top, rgba(244,245,240,0.97) 0%, rgba(244,245,240,0.2) 55%, transparent 100%)",
          }} />

          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "16px 20px 20px" }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 12 }}>
              <div style={{ minWidth: 0 }}>
                {result.portion && (
                  <div style={{ fontSize: 12, color: "var(--ns-text-muted)", marginBottom: 4, fontWeight: 500 }}>
                    {result.portion}
                  </div>
                )}
                <h2 style={{
                  fontSize: 22, fontWeight: 700, color: "var(--ns-text-primary)",
                  letterSpacing: "-0.03em", margin: 0, lineHeight: 1.1,
                }}>
                  {result.food_name}
                </h2>
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ padding: "16px 16px 0" }}>

        {/* Calorias — destaque hero */}
        <div style={{
          padding: "20px", marginBottom: 10, textAlign: "center",
          background: "var(--ns-bg-card)",
          border: "0.5px solid var(--ns-border)",
          borderRadius: 20,
          boxShadow: "var(--ns-shadow-sm)",
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ns-text-muted)", letterSpacing: "0.05em", marginBottom: 8 }}>
            CALORIAS TOTAIS
          </div>
          <div style={{
            fontSize: 48, fontWeight: 700, color: "var(--ns-text-primary)",
            letterSpacing: "-0.05em", lineHeight: 1,
          }}>
            {result.calories}
          </div>
          <div style={{ fontSize: 14, color: "var(--ns-text-muted)", marginTop: 6 }}>kcal</div>
        </div>

        {/* Grid 2x2 de macros */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
          {[
            { label: "Proteína",     val: result.protein, unit: "g" },
            { label: "Carboidratos", val: result.carbs,   unit: "g" },
            { label: "Gordura",      val: result.fat,     unit: "g" },
            { label: "Fibra",        val: result.fiber,   unit: "g" },
          ].map((m) => {
            const pct   = Math.round((m.val / totalMacros) * 100);
            const color = SCAN_MACRO_COLORS[m.label] || "var(--ns-accent)";
            return (
              <div
                key={m.label}
                style={{
                  background: "var(--ns-bg-card)",
                  border: "0.5px solid var(--ns-border)",
                  borderRadius: 16, padding: "16px 14px",
                  boxShadow: "var(--ns-shadow-sm)",
                }}
              >
                <div style={{ fontSize: 10, color: "var(--ns-text-muted)", letterSpacing: "0.04em", marginBottom: 6, fontWeight: 600, textTransform: "uppercase" }}>
                  {m.label}
                </div>
                <div style={{
                  fontSize: 28, fontWeight: 700, color: "var(--ns-text-primary)",
                  letterSpacing: "-0.04em", lineHeight: 1,
                }}>
                  {m.val}
                  <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ns-text-muted)" }}>{m.unit}</span>
                </div>
                <div style={{
                  height: 3, borderRadius: 3, background: "var(--ns-ring-track)",
                  overflow: "hidden", marginTop: 10,
                }}>
                  <div style={{
                    height: "100%", width: `${pct}%`,
                    background: color,
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
          background: "var(--ns-bg-card)",
          border: "0.5px solid var(--ns-border)",
          borderRadius: 16,
          boxShadow: "var(--ns-shadow-sm)",
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ns-text-primary)", letterSpacing: "-0.02em", marginBottom: 14 }}>
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
                  borderRight: i === 0 ? "0.5px solid var(--ns-border)" : "none",
                  padding: "0 8px",
                }}
              >
                <div style={{ fontSize: 22, fontWeight: 700, color: "var(--ns-text-primary)", letterSpacing: "-0.03em" }}>
                  {n.val}
                  <span style={{ fontSize: 12, fontWeight: 500, color: "var(--ns-text-muted)" }}>{n.unit}</span>
                </div>
                <div style={{ fontSize: 11, color: "var(--ns-text-muted)", marginTop: 3 }}>{n.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scores */}
        <div style={{
          padding: "18px", marginBottom: 10,
          background: "var(--ns-bg-card)",
          border: "0.5px solid var(--ns-border)",
          borderRadius: 16,
          boxShadow: "var(--ns-shadow-sm)",
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 0 }}>
            {[
              { label: "Glicêmico", val: result.glycemic_index },
              { label: "Saciedade", val: `${result.satiety_score}/10` },
              { label: "Cutting",   val: `${result.cutting_score}/10` },
            ].map((s, i) => (
              <div key={s.label} style={{
                textAlign: "center",
                borderRight: i < 2 ? "0.5px solid var(--ns-border)" : "none",
                padding: "0 4px",
              }}>
                <div style={{
                  fontSize: 18, fontWeight: 700, color: "var(--ns-text-primary)",
                  letterSpacing: "-0.03em",
                }}>
                  {s.val}
                </div>
                <div style={{ fontSize: 10, color: "var(--ns-text-muted)", marginTop: 3, lineHeight: 1.3 }}>
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
            background: "var(--ns-bg-card)",
            border: "0.5px solid var(--ns-border)",
            borderRadius: 16,
            boxShadow: "var(--ns-shadow-sm)",
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ns-text-primary)", letterSpacing: "-0.02em", marginBottom: 14 }}>
              Benefícios
            </div>
            {result.benefits.map((b, i) => (
              <div key={i} style={{
                display: "flex", gap: 10, alignItems: "flex-start",
                marginBottom: i < result.benefits.length - 1 ? 12 : 0,
              }}>
                <div style={{
                  width: 20, height: 20, borderRadius: "50%",
                  background: "var(--ns-accent-bg)",
                  border: "0.5px solid rgba(45,143,94,0.25)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, marginTop: 1,
                }}>
                  <svg width="8" height="7" viewBox="0 0 8 7" fill="none">
                    <path d="M1 3.5L3 5.5L7 1.5" stroke="var(--ns-accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span style={{ fontSize: 13, color: "var(--ns-text-primary)", lineHeight: 1.5 }}>{b}</span>
              </div>
            ))}
          </div>
        )}

        {/* Atenção */}
        {result.watch_out && (
          <div style={{
            padding: "14px 18px", marginBottom: 10,
            background: "var(--ns-danger-bg)",
            border: "0.5px solid rgba(196,57,28,0.18)", borderRadius: 16,
          }}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
                <path d="M8 1.5L1 14h14L8 1.5z" stroke="var(--ns-danger)" strokeWidth="1.4" strokeLinejoin="round" />
                <path d="M8 6.5v3.5" stroke="var(--ns-danger)" strokeWidth="1.4" strokeLinecap="round" />
                <circle cx="8" cy="12" r="0.8" fill="var(--ns-danger)" />
              </svg>
              <span style={{ fontSize: 13, color: "var(--ns-text-primary)", lineHeight: 1.5 }}>
                {result.watch_out}
              </span>
            </div>
          </div>
        )}

        {/* Dica da IA */}
        {result.ai_tip && (
          <div style={{
            padding: "16px 18px", marginBottom: 10,
            background: "var(--ns-accent-bg)",
            border: "0.5px solid rgba(45,143,94,0.18)", borderRadius: 16,
          }}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
                <circle cx="8" cy="8" r="6.5" stroke="var(--ns-accent)" strokeWidth="1.4" />
                <path d="M8 5v4" stroke="var(--ns-accent)" strokeWidth="1.4" strokeLinecap="round" />
                <circle cx="8" cy="11" r="0.8" fill="var(--ns-accent)" />
              </svg>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ns-accent)", letterSpacing: "0.04em", marginBottom: 5 }}>
                  DICA DA IA
                </div>
                <span style={{ fontSize: 13, color: "var(--ns-text-primary)", lineHeight: 1.55 }}>
                  {result.ai_tip}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Veredicto contextual — exibido apenas quando o backend retorna os campos */}
        {(result.verdict || result.next_action) && (
          <div style={{
            padding: "18px", marginBottom: 20,
            background: "var(--ns-bg-card)",
            border: "0.5px solid var(--ns-border)",
            borderRadius: 16,
            boxShadow: "var(--ns-shadow-sm)",
          }}>
            {result.verdict && (
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: result.next_action ? 14 : 0 }}>
                {/* Icone check/aviso baseado no conteudo do veredicto */}
                <div style={{
                  width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                  background: "var(--ns-accent-bg)",
                  border: "0.5px solid rgba(45,143,94,0.25)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginTop: 1,
                }}>
                  <svg width="13" height="12" viewBox="0 0 13 12" fill="none">
                    <path d="M1.5 6.5L5 10L11.5 2" stroke="var(--ns-accent)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ns-text-muted)", letterSpacing: "0.04em", marginBottom: 5 }}>
                    VEREDICTO
                  </div>
                  <span style={{ fontSize: 13, color: "var(--ns-text-primary)", lineHeight: 1.55 }}>
                    {result.verdict}
                  </span>
                </div>
              </div>
            )}

            {result.next_action && (
              <div style={{
                display: "flex", gap: 10, alignItems: "flex-start",
                paddingTop: result.verdict ? 14 : 0,
                borderTop: result.verdict ? "0.5px solid var(--ns-border)" : "none",
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                  background: "var(--ns-bg-elevated)",
                  border: "0.5px solid var(--ns-border)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginTop: 1,
                }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2 7h10M8 3l4 4-4 4" stroke="var(--ns-text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ns-text-muted)", letterSpacing: "0.04em", marginBottom: 5 }}>
                    PROXIMO PASSO
                  </div>
                  <span style={{ fontSize: 13, color: "var(--ns-text-primary)", lineHeight: 1.55 }}>
                    {result.next_action}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Ações */}
        <div style={{ display: "flex", gap: 10, marginBottom: 8 }}>
          {savedScanId && (
            <button
              onClick={() => setShowCorrection(true)}
              style={{
                flex: 1, height: 52, borderRadius: 14,
                background: "var(--ns-bg-card)",
                border: "0.5px solid var(--ns-border)",
                cursor: "pointer",
                fontSize: 15, fontWeight: 600, color: "var(--ns-text-primary)",
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
              background: "var(--ns-accent)", border: "none", cursor: "pointer",
              fontSize: 15, fontWeight: 600, color: "#FFF",
              letterSpacing: "-0.02em",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            Escanear outro
          </button>
        </div>

        {result.status === "verified" && (
          <div style={{ textAlign: "center", fontSize: 12, color: "var(--ns-accent)", paddingBottom: 4 }}>
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
