/**
 * VoicePreviewModal — Preview dos alimentos identificados por voz
 * Exibido antes de confirmar o registro.
 */

export default function VoicePreviewModal({ foods, transcript, onConfirm, onCancel }) {
  const total = foods.reduce(
    (acc, f) => ({
      kcal: acc.kcal + (f.kcal || 0),
      protein_g: acc.protein_g + (f.protein_g || 0),
      carb_g: acc.carb_g + (f.carb_g || 0),
      fat_g: acc.fat_g + (f.fat_g || 0),
    }),
    { kcal: 0, protein_g: 0, carb_g: 0, fat_g: 0 }
  );

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,0.45)",
      display: "flex", alignItems: "flex-end",
    }}>
      <div style={{
        width: "100%", background: "var(--ns-bg-card)",
        borderRadius: "20px 20px 0 0",
        padding: "24px 20px 36px",
        maxHeight: "85dvh", overflowY: "auto",
      }}>
        {/* Handle */}
        <div style={{
          width: 36, height: 4, borderRadius: 2,
          background: "var(--ns-border-strong)",
          margin: "0 auto 20px",
        }} />

        {/* Titulo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "var(--praxis-green-light, #E8F5EC)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <rect x="9" y="2" width="6" height="11" rx="3" stroke="var(--praxis-green, #1A7F56)" strokeWidth="1.7" />
              <path d="M5 11a7 7 0 0014 0" stroke="var(--praxis-green, #1A7F56)" strokeWidth="1.7" strokeLinecap="round" />
              <line x1="12" y1="18" x2="12" y2="22" stroke="var(--praxis-green, #1A7F56)" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--ns-text-primary)" }}>
              Registrar por voz
            </div>
            <div style={{ fontSize: 12, color: "var(--ns-text-muted)" }}>
              Confirme os alimentos identificados
            </div>
          </div>
        </div>

        {/* Transcrição */}
        {transcript && (
          <div style={{
            background: "var(--ns-bg-elevated)",
            border: "0.5px solid var(--ns-border)",
            borderRadius: 10, padding: "10px 14px",
            marginBottom: 16, marginTop: 12,
            fontSize: 13, color: "var(--ns-text-muted)",
            fontStyle: "italic", lineHeight: 1.5,
          }}>
            "{transcript}"
          </div>
        )}

        {/* Lista de alimentos */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
          {foods.map((food, i) => (
            <div key={i} style={{
              background: "var(--ns-bg-elevated)",
              borderRadius: 12, padding: "12px 14px",
              border: "0.5px solid var(--ns-border)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 15, fontWeight: 600, color: "var(--ns-text-primary)" }}>
                  {food.name}
                </span>
                <span className="mono-num" style={{ fontSize: 15, fontWeight: 700, color: "var(--ns-accent)" }}>
                  {food.kcal} kcal
                </span>
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                {[
                  { label: "Prot", value: food.protein_g, color: "#3B82F6" },
                  { label: "Carb", value: food.carb_g, color: "#F59E0B" },
                  { label: "Gord", value: food.fat_g, color: "#8B5CF6" },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    <span style={{ fontSize: 10, color: "var(--ns-text-muted)", fontWeight: 500 }}>{label}</span>
                    <span className="mono-num" style={{ fontSize: 13, fontWeight: 600, color }}>
                      {value}g
                    </span>
                  </div>
                ))}
                {food.quantity_g && (
                  <div style={{ marginLeft: "auto", display: "flex", flexDirection: "column", gap: 1 }}>
                    <span style={{ fontSize: 10, color: "var(--ns-text-muted)", fontWeight: 500 }}>Porção</span>
                    <span className="mono-num" style={{ fontSize: 13, fontWeight: 600, color: "var(--ns-text-secondary)" }}>
                      {food.quantity_g}g
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Total */}
        {foods.length > 1 && (
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "10px 14px",
            background: "var(--praxis-green-light, #E8F5EC)",
            borderRadius: 10, marginBottom: 20,
          }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ns-text-primary)" }}>
              Total ({foods.length} itens)
            </span>
            <span className="mono-num" style={{ fontSize: 16, fontWeight: 700, color: "var(--praxis-green, #1A7F56)" }}>
              {total.kcal} kcal
            </span>
          </div>
        )}

        {/* Botões */}
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1, height: 50, borderRadius: 12,
              background: "var(--ns-bg-elevated)",
              border: "0.5px solid var(--ns-border)",
              fontSize: 15, fontWeight: 600,
              color: "var(--ns-text-primary)", cursor: "pointer",
            }}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 2, height: 50, borderRadius: 12,
              background: "var(--ns-accent)", border: "none",
              fontSize: 15, fontWeight: 600, color: "#FFF",
              cursor: "pointer",
            }}
          >
            Confirmar registro
          </button>
        </div>
      </div>
    </div>
  );
}
