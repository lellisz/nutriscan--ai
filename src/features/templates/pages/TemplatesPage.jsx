import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import { useAuth } from "../../auth/hooks/useAuth";
import * as db from "../../../lib/db";
import { haptic } from "../../../lib/haptics";
import {
  BR_MEAL_TEMPLATES,
  getSuggestedTemplates,
} from "../../../data/br-meal-templates";
import MealTemplateCard from "../../scan/components/MealTemplateCard";
import PortionAdjustModal from "../../scan/components/PortionAdjustModal";

const CATEGORIES = [
  { id: "all", label: "Todos" },
  { id: "cafe-da-manha", label: "Café da manhã" },
  { id: "almoco", label: "Almoço" },
  { id: "lanche", label: "Lanche" },
  { id: "pos-treino", label: "Pós-treino" },
  { id: "jantar", label: "Jantar" },
];

function detectMealType() {
  const h = new Date().getHours();
  if (h >= 5 && h < 11) return "breakfast";
  if (h >= 11 && h < 15) return "lunch";
  if (h >= 15 && h < 19) return "snack";
  return "dinner";
}

export default function TemplatesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const shouldReduce = useReducedMotion();

  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [saving, setSaving] = useState(false);
  const [successId, setSuccessId] = useState(null);

  const suggested = useMemo(
    () => getSuggestedTemplates(new Date().getHours()),
    []
  );

  const filtered = useMemo(() => {
    let list =
      activeCategory === "all"
        ? BR_MEAL_TEMPLATES
        : BR_MEAL_TEMPLATES.filter((t) => t.category === activeCategory);

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q)
      );
    }
    return list;
  }, [activeCategory, search]);

  async function handleConfirm({ template, scaledMacros }) {
    setSaving(true);
    try {
      await db.saveScanHistory({
        userId: user?.id,
        analysis: {
          food_name: template.name,
          calories: scaledMacros.calories,
          protein: scaledMacros.protein,
          carbs: scaledMacros.carbs,
          fat: scaledMacros.fat,
          confidence: "alta",
          ai_tip: "Adicionado via template",
          meal_type: detectMealType(),
        },
      });
      setSuccessId(template.id);
      setSelectedTemplate(null);
      haptic("success");
      setTimeout(() => {
        setSuccessId(null);
        navigate(-1);
      }, 900);
    } catch (err) {
      console.error("Erro ao salvar template:", err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100dvh",
        paddingBottom: 90,
        background: "var(--ns-bg-primary)",
      }}
    >
      {/* Header */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "16px 20px 14px",
          background: "var(--ns-bg-primary)",
        }}
        className="animate-fade-up"
      >
        <button
          onClick={() => navigate(-1)}
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: "var(--ns-bg-card)",
            border: "0.5px solid var(--ns-border)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            WebkitTapHighlightColor: "transparent",
            flexShrink: 0,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
            <path
              d="M12 15l-5-5 5-5"
              stroke="var(--ns-text-primary)"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: 22,
              fontWeight: 700,
              color: "var(--ns-text-primary)",
              letterSpacing: "-0.03em",
            }}
          >
            Meus Templates
          </h1>
          <p
            style={{
              margin: "2px 0 0",
              fontSize: 13,
              color: "var(--ns-text-muted)",
            }}
          >
            {BR_MEAL_TEMPLATES.length} pratos brasileiros
          </p>
        </div>
      </header>

      {/* Busca */}
      <div
        style={{ padding: "0 20px 10px" }}
        className="animate-fade-up stagger-1"
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "var(--ns-bg-card)",
            border: "0.5px solid var(--ns-border)",
            borderRadius: 12,
            padding: "0 12px",
            height: 42,
            boxShadow: "var(--ns-shadow-sm)",
          }}
        >
          <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
            <circle
              cx="8.5"
              cy="8.5"
              r="5.5"
              stroke="var(--ns-text-disabled)"
              strokeWidth="1.6"
            />
            <path
              d="M13 13l4 4"
              stroke="var(--ns-text-disabled)"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar prato..."
            style={{
              flex: 1,
              border: "none",
              background: "transparent",
              fontSize: 14,
              color: "var(--ns-text-primary)",
              outline: "none",
            }}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
                display: "flex",
                alignItems: "center",
                color: "var(--ns-text-disabled)",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M1 1l12 12M13 1L1 13"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Filtro categorias */}
      <div
        style={{
          display: "flex",
          gap: 8,
          padding: "0 20px 16px",
          overflowX: "auto",
          scrollbarWidth: "none",
        }}
        className="animate-fade-up stagger-2"
      >
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            style={{
              flexShrink: 0,
              padding: "7px 16px",
              borderRadius: 20,
              border:
                activeCategory === cat.id
                  ? "1.5px solid var(--ns-accent)"
                  : "1px solid var(--ns-border)",
              background:
                activeCategory === cat.id
                  ? "var(--ns-accent-bg)"
                  : "var(--ns-bg-card)",
              color:
                activeCategory === cat.id
                  ? "var(--ns-accent)"
                  : "var(--ns-text-muted)",
              fontSize: 13,
              fontWeight: activeCategory === cat.id ? 600 : 400,
              cursor: "pointer",
              WebkitTapHighlightColor: "transparent",
              letterSpacing: "-0.01em",
              boxShadow:
                activeCategory === cat.id ? "none" : "var(--ns-shadow-sm)",
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div style={{ padding: "0 20px" }}>
        {/* Seção sugerida */}
        {!search && activeCategory === "all" && suggested.length > 0 && (
          <section style={{ marginBottom: 24 }} className="animate-fade-up stagger-3">
            <h3
              style={{
                margin: "0 0 10px",
                fontSize: 12,
                fontWeight: 600,
                color: "var(--ns-text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              Sugerido agora
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {suggested.map((tmpl) => (
                <div key={tmpl.id} style={{ position: "relative" }}>
                  <MealTemplateCard
                    template={tmpl}
                    onSelect={setSelectedTemplate}
                  />
                  {successId === tmpl.id && (
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        borderRadius: 14,
                        background: "var(--ns-accent-bg)",
                        border: "1.5px solid var(--ns-accent)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 13,
                        fontWeight: 600,
                        color: "var(--ns-accent)",
                        gap: 6,
                        pointerEvents: "none",
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                        <path
                          d="M4 10l4 4 8-8"
                          stroke="var(--ns-accent)"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      Adicionado!
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Lista principal */}
        <section className="animate-fade-up stagger-4">
          {(!search && activeCategory === "all") && (
            <h3
              style={{
                margin: "0 0 10px",
                fontSize: 12,
                fontWeight: 600,
                color: "var(--ns-text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              Todos os templates
            </h3>
          )}

          {filtered.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "48px 0",
              }}
            >
              <div
                style={{
                  fontSize: 36,
                  marginBottom: 12,
                }}
              >
                🍽️
              </div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: "var(--ns-text-primary)",
                  marginBottom: 6,
                }}
              >
                Nenhum prato encontrado
              </div>
              <div style={{ fontSize: 14, color: "var(--ns-text-muted)" }}>
                Tente outro termo de busca
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {filtered.map((tmpl) => (
                <div key={tmpl.id} style={{ position: "relative" }}>
                  <MealTemplateCard
                    template={tmpl}
                    onSelect={setSelectedTemplate}
                  />
                  {successId === tmpl.id && (
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        borderRadius: 14,
                        background: "var(--ns-accent-bg)",
                        border: "1.5px solid var(--ns-accent)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 13,
                        fontWeight: 600,
                        color: "var(--ns-accent)",
                        gap: 6,
                        pointerEvents: "none",
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                        <path
                          d="M4 10l4 4 8-8"
                          stroke="var(--ns-accent)"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      Adicionado!
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Modal ajuste de porção */}
      {selectedTemplate && (
        <PortionAdjustModal
          template={selectedTemplate}
          onClose={() => setSelectedTemplate(null)}
          onConfirm={handleConfirm}
        />
      )}

      {/* Overlay de saving */}
      {saving && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 400,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.3)",
          }}
        >
          <div className="ns-spinner ns-spinner-lg" />
        </div>
      )}
    </div>
  );
}
