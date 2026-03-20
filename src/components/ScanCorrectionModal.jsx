import React, { useState } from "react";

const CATEGORIES = ["proteina", "carboidrato", "gordura", "fruta", "vegetal", "bebida", "misto"];

export default function ScanCorrectionModal({ scan, onSave, onClose, saving }) {
  const [form, setForm] = useState({
    food_name: scan.food_name || "",
    portion: scan.portion || "",
    calories: scan.calories || 0,
    protein: scan.protein || 0,
    carbs: scan.carbs || 0,
    fat: scan.fat || 0,
    fiber: scan.fiber || 0,
    sugar: scan.sugar || 0,
    sodium: scan.sodium || 0,
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
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(0,0,0,0.7)", display: "flex",
      alignItems: "flex-end", justifyContent: "center",
    }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--ns-bg-card)", borderRadius: "20px 20px 0 0",
          width: "100%", maxWidth: 480, maxHeight: "85vh",
          overflowY: "auto", padding: "20px 20px 32px",
          animation: "slideUp 0.3s ease",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Corrigir analise</h3>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", fontSize: 20, color: "var(--ns-text-muted)", cursor: "pointer", padding: 4 }}
          >
            x
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Food name */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, color: "var(--ns-text-muted)", fontWeight: 600, display: "block", marginBottom: 4 }}>ALIMENTO</label>
            <input
              type="text"
              value={form.food_name}
              onChange={e => handleChange("food_name", e.target.value)}
              className="ns-input"
              style={{ width: "100%", fontSize: 16, fontWeight: 700 }}
              required
            />
          </div>

          {/* Portion */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, color: "var(--ns-text-muted)", fontWeight: 600, display: "block", marginBottom: 4 }}>PORCAO</label>
            <input
              type="text"
              value={form.portion}
              onChange={e => handleChange("portion", e.target.value)}
              className="ns-input"
              style={{ width: "100%" }}
              placeholder="Ex: 1 prato medio ~350g"
            />
          </div>

          {/* Macros grid */}
          <label style={{ fontSize: 11, color: "var(--ns-text-muted)", fontWeight: 600, display: "block", marginBottom: 8 }}>MACRONUTRIENTES</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
            {[
              { key: "calories", label: "Calorias (kcal)", color: "var(--ns-accent)" },
              { key: "protein", label: "Proteina (g)", color: "#6ab87a" },
              { key: "carbs", label: "Carboidratos (g)", color: "#c09050" },
              { key: "fat", label: "Gorduras (g)", color: "var(--purple, #8b5cf6)" },
            ].map(m => (
              <div key={m.key}>
                <label style={{ fontSize: 10, color: m.color, fontWeight: 600, display: "block", marginBottom: 3 }}>{m.label}</label>
                <input
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
            {[
              { key: "fiber", label: "Fibra (g)" },
              { key: "sugar", label: "Acucar (g)" },
              { key: "sodium", label: "Sodio (mg)" },
            ].map(n => (
              <div key={n.key}>
                <label style={{ fontSize: 10, color: "var(--ns-text-muted)", fontWeight: 600, display: "block", marginBottom: 3 }}>{n.label}</label>
                <input
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
            <label style={{ fontSize: 11, color: "var(--ns-text-muted)", fontWeight: 600, display: "block", marginBottom: 4 }}>OBSERVACAO</label>
            <input
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
            <button type="button" onClick={onClose} className="ns-btn ns-btn-secondary" style={{ flex: 1 }}>
              Cancelar
            </button>
            <button type="submit" className="ns-btn ns-btn-primary" style={{ flex: 1 }} disabled={saving || !form.food_name}>
              {saving ? "Salvando..." : "Salvar correcao"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
