import React, { useState, useMemo } from "react";
import { motion, useReducedMotion } from "motion/react";
import { scaleMacros } from "../../../data/br-meal-templates";

export default function PortionAdjustModal({ template, onConfirm, onClose }) {
  const shouldReduce = useReducedMotion();
  const [portion, setPortion] = useState(template.defaultPortion);

  const scaled = useMemo(() => scaleMacros(template, portion), [template, portion]);

  const minPortion = template.portionStep || template.defaultPortion;
  const maxPortion = template.defaultPortion * 5;

  function increment() {
    setPortion((prev) => Math.min(prev + (template.portionStep || 50), maxPortion));
  }

  function decrement() {
    setPortion((prev) =>
      Math.max(prev - (template.portionStep || 50), minPortion)
    );
  }

  function handleConfirm() {
    onConfirm({ template, portion, scaledMacros: scaled });
  }

  const MACRO_PILLS = [
    { label: "kcal", value: scaled.calories, color: "var(--ns-accent)" },
    { label: "prot", value: `${scaled.protein}g`, color: "var(--ns-macro-protein)" },
    { label: "carb", value: `${scaled.carbs}g`, color: "var(--ns-macro-carb)" },
    { label: "gord", value: `${scaled.fat}g`, color: "var(--ns-macro-fat)" },
  ];

  return (
    /* Overlay */
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        zIndex: 300,
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
          padding: "0 0 32px",
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
            padding: "14px 20px 16px",
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: 17,
                fontWeight: 700,
                color: "var(--ns-text-primary)",
                letterSpacing: "-0.02em",
              }}
            >
              {template.name}
            </h2>
            <p
              style={{
                margin: "3px 0 0",
                fontSize: 13,
                color: "var(--ns-text-muted)",
              }}
            >
              {template.description}
            </p>
          </div>
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
              flexShrink: 0,
              marginLeft: 12,
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

        <div style={{ padding: "0 20px" }}>
          {/* Porção atual — com ou sem ajuste */}
          {template.adjustable ? (
            <div
              style={{
                background: "var(--ns-bg-card)",
                borderRadius: 16,
                padding: "16px 18px",
                marginBottom: 16,
                border: "0.5px solid var(--ns-border)",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--ns-text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: 12,
                }}
              >
                Porção
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 16,
                }}
              >
                {/* Botão - */}
                <button
                  onClick={decrement}
                  disabled={portion <= minPortion}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    border: "1.5px solid var(--ns-border-strong)",
                    background: portion <= minPortion ? "var(--ns-bg-elevated)" : "var(--ns-bg-card)",
                    cursor: portion <= minPortion ? "not-allowed" : "pointer",
                    fontSize: 22,
                    color: portion <= minPortion ? "var(--ns-text-disabled)" : "var(--ns-text-primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    WebkitTapHighlightColor: "transparent",
                    flexShrink: 0,
                  }}
                >
                  −
                </button>

                {/* Valor da porção */}
                <div style={{ textAlign: "center" }}>
                  <span
                    style={{
                      fontSize: 28,
                      fontWeight: 700,
                      color: "var(--ns-text-primary)",
                      fontVariantNumeric: "tabular-nums",
                      letterSpacing: "-0.03em",
                    }}
                    className="mono-num"
                  >
                    {portion}
                  </span>
                  <span
                    style={{
                      fontSize: 14,
                      color: "var(--ns-text-muted)",
                      marginLeft: 4,
                    }}
                  >
                    g
                  </span>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--ns-text-disabled)",
                      marginTop: 2,
                    }}
                  >
                    {template.portionLabel}
                  </div>
                </div>

                {/* Botão + */}
                <button
                  onClick={increment}
                  disabled={portion >= maxPortion}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    border: "1.5px solid var(--ns-border-strong)",
                    background: portion >= maxPortion ? "var(--ns-bg-elevated)" : "var(--ns-bg-card)",
                    cursor: portion >= maxPortion ? "not-allowed" : "pointer",
                    fontSize: 22,
                    color: portion >= maxPortion ? "var(--ns-text-disabled)" : "var(--ns-accent)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    WebkitTapHighlightColor: "transparent",
                    flexShrink: 0,
                  }}
                >
                  +
                </button>
              </div>
            </div>
          ) : (
            <div
              style={{
                background: "var(--ns-bg-card)",
                borderRadius: 16,
                padding: "14px 18px",
                marginBottom: 16,
                border: "0.5px solid var(--ns-border)",
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  color: "var(--ns-text-muted)",
                  marginBottom: 4,
                }}
              >
                Porção padrão
              </div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: "var(--ns-text-primary)",
                }}
              >
                {template.portionLabel} ({template.defaultPortion}g)
              </div>
            </div>
          )}

          {/* Pills de macros */}
          <div
            style={{
              display: "flex",
              gap: 8,
              marginBottom: 20,
            }}
          >
            {MACRO_PILLS.map((pill) => (
              <div
                key={pill.label}
                style={{
                  flex: 1,
                  background: "var(--ns-bg-card)",
                  border: "0.5px solid var(--ns-border)",
                  borderRadius: 12,
                  padding: "10px 8px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: pill.color,
                    fontVariantNumeric: "tabular-nums",
                    letterSpacing: "-0.02em",
                  }}
                  className="mono-num"
                >
                  {pill.value}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: "var(--ns-text-muted)",
                    marginTop: 2,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  {pill.label}
                </div>
              </div>
            ))}
          </div>

          {/* Botão confirmar */}
          <motion.button
            whileTap={{ scale: shouldReduce ? 1 : 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            onClick={handleConfirm}
            style={{
              width: "100%",
              height: 52,
              borderRadius: 14,
              background: "var(--ns-accent)",
              border: "none",
              color: "#FFFFFF",
              fontSize: 15,
              fontWeight: 600,
              letterSpacing: "-0.01em",
              cursor: "pointer",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            Adicionar ao diário
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
