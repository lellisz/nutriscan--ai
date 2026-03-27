import React, { useState, useMemo } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  BR_MEAL_TEMPLATES,
  getSuggestedTemplates,
} from "../../../data/br-meal-templates";
import MealTemplateCard from "./MealTemplateCard";

const CATEGORIES = [
  { id: "all", label: "Todos" },
  { id: "cafe-da-manha", label: "Café" },
  { id: "almoco", label: "Almoço" },
  { id: "lanche", label: "Lanche" },
  { id: "pos-treino", label: "Pós-treino" },
  { id: "jantar", label: "Jantar" },
];

export default function MealTemplatesSelector({ onSelect, onClose }) {
  const shouldReduce = useReducedMotion();
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");

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

  return (
    /* Overlay */
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        zIndex: 200,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
      }}
    >
      {/* Bottom sheet */}
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={shouldReduce ? { opacity: 0 } : { y: "100%" }}
        animate={shouldReduce ? { opacity: 1 } : { y: 0 }}
        exit={shouldReduce ? { opacity: 0 } : { y: "100%" }}
        transition={{ type: "spring", stiffness: 380, damping: 36 }}
        style={{
          background: "var(--ns-bg-primary)",
          borderRadius: "20px 20px 0 0",
          maxHeight: "80dvh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Handle */}
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 10 }}>
          <div
            style={{
              width: 36,
              height: 4,
              borderRadius: 2,
              background: "var(--ns-border-strong)",
            }}
          />
        </div>

        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 20px 12px",
            flexShrink: 0,
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 700,
              color: "var(--ns-text-primary)",
              letterSpacing: "-0.02em",
            }}
          >
            Templates rápidos
          </h2>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              background: "var(--ns-bg-elevated)",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M1 1l12 12M13 1L1 13"
                stroke="var(--ns-text-muted)"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* Busca */}
        <div style={{ padding: "0 20px 10px", flexShrink: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "var(--ns-bg-input)",
              border: "0.5px solid var(--ns-border)",
              borderRadius: 12,
              padding: "0 12px",
              height: 40,
            }}
          >
            <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
              <circle cx="8.5" cy="8.5" r="5.5" stroke="var(--ns-text-disabled)" strokeWidth="1.6" />
              <path d="M13 13l4 4" stroke="var(--ns-text-disabled)" strokeWidth="1.6" strokeLinecap="round" />
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

        {/* Filtro de categorias */}
        <div
          style={{
            display: "flex",
            gap: 8,
            padding: "0 20px 12px",
            overflowX: "auto",
            flexShrink: 0,
            scrollbarWidth: "none",
          }}
        >
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              style={{
                flexShrink: 0,
                padding: "6px 14px",
                borderRadius: 20,
                border: activeCategory === cat.id
                  ? "1.5px solid var(--ns-accent)"
                  : "1px solid var(--ns-border)",
                background: activeCategory === cat.id
                  ? "var(--ns-accent-bg)"
                  : "var(--ns-bg-card)",
                color: activeCategory === cat.id
                  ? "var(--ns-accent)"
                  : "var(--ns-text-muted)",
                fontSize: 13,
                fontWeight: activeCategory === cat.id ? 600 : 400,
                cursor: "pointer",
                WebkitTapHighlightColor: "transparent",
                letterSpacing: "-0.01em",
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Conteúdo com scroll */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "0 20px 24px",
            scrollbarWidth: "none",
          }}
        >
          {/* Seção sugerida — só aparece sem busca e filtro "Todos" */}
          {!search && activeCategory === "all" && suggested.length > 0 && (
            <section style={{ marginBottom: 20 }}>
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
                  <MealTemplateCard key={tmpl.id} template={tmpl} onSelect={onSelect} />
                ))}
              </div>
            </section>
          )}

          {/* Todos / filtrados */}
          <section>
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
                  padding: "32px 0",
                  color: "var(--ns-text-disabled)",
                  fontSize: 14,
                }}
              >
                Nenhum prato encontrado
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {filtered.map((tmpl) => (
                  <MealTemplateCard key={tmpl.id} template={tmpl} onSelect={onSelect} />
                ))}
              </div>
            )}
          </section>
        </div>
      </motion.div>
    </div>
  );
}
