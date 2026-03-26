import React, { useState } from "react";

const MACRO_FIELDS = [
  { key: "calories", label: "Calorias (kcal)", color: "var(--ns-accent)" },
  { key: "protein",  label: "Proteína (g)",    color: "var(--ns-text-secondary)" },
  { key: "carbs",    label: "Carboidratos (g)", color: "var(--ns-text-secondary)" },
  { key: "fat",      label: "Gorduras (g)",     color: "var(--ns-text-secondary)" },
];

const EXTRA_FIELDS = [
  { key: "fiber",  label: "Fibra (g)"  },
  { key: "sugar",  label: "Açúcar (g)" },
  { key: "sodium", label: "Sódio (mg)" },
];

// ── Close icon ─────────────────────────────────────────────
const IconClose = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
    <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

export default function ScanCorrectionModal({ scan, onSave, onClose, saving }) {
  const [form, setForm] = useState({
    food_name:  scan.food_name  || "",
    portion:    scan.portion    || "",
    calories:   scan.calories   || 0,
    protein:    scan.protein    || 0,
    carbs:      scan.carbs      || 0,
    fat:        scan.fat        || 0,
    fiber:      scan.fiber      || 0,
    sugar:      scan.sugar      || 0,
    sodium:     scan.sodium     || 0,
    user_notes: scan.user_notes || "",
  });

  function handleChange(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function handleNumberChange(field, value) {
    const num = parseInt(value) || 0;
    setForm(prev => ({ ...prev, [field]: Math.max(0, num) }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSave(form);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="correction-modal-title"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--ns-bg-card)",
          borderRadius: "20px 20px 0 0",
          width: "100%",
          maxWidth: 480,
          maxHeight: "85vh",
          overflowY: "auto",
          padding: "20px 20px 32px",
          animation: "slideUp 0.3s ease",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3
            id="correction-modal-title"
            style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "var(--ns-text-primary)" }}
          >
            Corrigir análise
          </h3>
          <button
            onClick={onClose}
            aria-label="Fechar"
            style={{
              background: "var(--ns-bg-elevated)",
              border: "none",
              borderRadius: "var(--ns-radius-full)",
              width: 32,
              height: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--ns-text-muted)",
              cursor: "pointer",
            }}
          >
            <IconClose />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Food name */}
          <div style={{ marginBottom: 14 }}>
            <label
              htmlFor="correction-food-name"
              style={{ fontSize: 11, color: "var(--ns-text-muted)", fontWeight: 600, display: "block", marginBottom: 4, letterSpacing: "0.05em" }}
            >
              ALIMENTO
            </label>
            <input
              id="correction-food-name"
              type="text"
              value={form.food_name}
              onChange={e => handleChange("food_name", e.target.value)}
              className="ns-input"
              style={{ width: "100%", fontSize: 16, fontWeight: 600 }}
              required
            />
          </div>

          {/* Portion */}
          <div style={{ marginBottom: 14 }}>
            <label
              htmlFor="correction-portion"
              style={{ fontSize: 11, color: "var(--ns-text-muted)", fontWeight: 600, display: "block", marginBottom: 4, letterSpacing: "0.05em" }}
            >
              PORÇÃO
            </label>
            <input
              id="correction-portion"
              type="text"
              value={form.portion}
              onChange={e => handleChange("portion", e.target.value)}
              className="ns-input"
              style={{ width: "100%" }}
              placeholder="Ex: 1 prato medio ~350g"
            />
          </div>

          {/* Macros grid */}
          <p
            id="correction-macros-label"
            style={{ fontSize: 11, color: "var(--ns-text-muted)", fontWeight: 600, display: "block", marginBottom: 8, letterSpacing: "0.05em" }}
          >
            MACRONUTRIENTES
          </p>
          <div
            role="group"
            aria-labelledby="correction-macros-label"
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}
          >
            {MACRO_FIELDS.map(m => (
              <div key={m.key}>
                <label
                  htmlFor={`correction-${m.key}`}
                  style={{ fontSize: 10, color: m.color, fontWeight: 600, display: "block", marginBottom: 3 }}
                >
                  {m.label}
                </label>
                <input
                  id={`correction-${m.key}`}
                  type="number"
                  min="0"
                  value={form[m.key]}
                  onChange={e => handleNumberChange(m.key, e.target.value)}
                  className="ns-input"
                  style={{ width: "100%", textAlign: "center", fontSize: 16, fontWeight: 700 }}
                />
              </div>
            ))}
          </div>

          {/* Extra nutrients */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
            {EXTRA_FIELDS.map(n => (
              <div key={n.key}>
                <label
                  htmlFor={`correction-${n.key}`}
                  style={{ fontSize: 10, color: "var(--ns-text-muted)", fontWeight: 600, display: "block", marginBottom: 3 }}
                >
                  {n.label}
                </label>
                <input
                  id={`correction-${n.key}`}
                  type="number"
                  min="0"
                  value={form[n.key]}
                  onChange={e => handleNumberChange(n.key, e.target.value)}
                  className="ns-input"
                  style={{ width: "100%", textAlign: "center" }}
                />
              </div>
            ))}
          </div>

          {/* User notes */}
          <div style={{ marginBottom: 20 }}>
            <label
              htmlFor="correction-notes"
              style={{ fontSize: 11, color: "var(--ns-text-muted)", fontWeight: 600, display: "block", marginBottom: 4, letterSpacing: "0.05em" }}
            >
              OBSERVAÇÃO
            </label>
            <input
              id="correction-notes"
              type="text"
              value={form.user_notes}
              onChange={e => handleChange("user_notes", e.target.value)}
              className="ns-input"
              style={{ width: "100%" }}
              placeholder="Ex: era uma porcao menor"
              maxLength={200}
            />
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="button"
              onClick={onClose}
              className="ns-btn ns-btn-secondary"
              style={{ flex: 1 }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="ns-btn ns-btn-primary"
              style={{ flex: 1 }}
              disabled={saving || !form.food_name}
            >
              {saving ? "Salvando..." : "Salvar correção"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
