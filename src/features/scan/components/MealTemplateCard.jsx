import React from "react";

export default function MealTemplateCard({ template, onSelect }) {
  const isBr = template.tags.includes("tipico-br");
  const isHighProtein = template.tags.includes("high-protein");

  return (
    <button
      onClick={() => onSelect(template)}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        minHeight: 72,
        background: "var(--ns-bg-card)",
        border: "0.5px solid var(--ns-border)",
        borderRadius: 14,
        padding: "12px 14px",
        cursor: "pointer",
        textAlign: "left",
        WebkitTapHighlightColor: "transparent",
        boxShadow: "var(--ns-shadow-sm)",
        gap: 12,
      }}
    >
      {/* Esquerda: nome + descrição + tags */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: "var(--ns-text-primary)",
            letterSpacing: "-0.01em",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            marginBottom: 2,
          }}
        >
          {template.name}
        </div>
        <div
          style={{
            fontSize: 12,
            color: "var(--ns-text-muted)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            marginBottom: 4,
          }}
        >
          {template.description}
        </div>
        {(isBr || isHighProtein) && (
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {isBr && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: "var(--ns-accent)",
                  background: "var(--ns-accent-bg)",
                  border: "0.5px solid rgba(45,143,94,0.2)",
                  borderRadius: 20,
                  padding: "2px 7px",
                  whiteSpace: "nowrap",
                }}
              >
                🇧🇷 típico
              </span>
            )}
            {isHighProtein && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: "var(--ns-orange)",
                  background: "var(--ns-orange-bg)",
                  border: "0.5px solid rgba(217,119,6,0.2)",
                  borderRadius: 20,
                  padding: "2px 7px",
                  whiteSpace: "nowrap",
                }}
              >
                💪 proteico
              </span>
            )}
          </div>
        )}
      </div>

      {/* Direita: calorias + macros */}
      <div style={{ flexShrink: 0, textAlign: "right" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 2, justifyContent: "flex-end" }}>
          <span
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: "var(--ns-accent)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {template.macros.calories}
          </span>
          <span style={{ fontSize: 11, color: "var(--ns-text-muted)" }}>kcal</span>
        </div>
        <div
          style={{
            display: "flex",
            gap: 6,
            marginTop: 3,
            fontSize: 11,
            color: "var(--ns-text-muted)",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          <span style={{ color: "var(--ns-macro-protein)" }}>{template.macros.protein}p</span>
          <span style={{ color: "var(--ns-macro-carb)" }}>{template.macros.carbs}c</span>
          <span style={{ color: "var(--ns-macro-fat)" }}>{template.macros.fat}g</span>
        </div>
      </div>
    </button>
  );
}
