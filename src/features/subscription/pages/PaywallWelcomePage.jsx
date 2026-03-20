import React from "react";
import { useNavigate } from "react-router-dom";

export default function PaywallWelcomePage() {
  const navigate = useNavigate();

  return (
    <div style={{
      padding: 24, maxWidth: 480, margin: "0 auto",
      minHeight: "100dvh", display: "flex", flexDirection: "column",
      justifyContent: "center", textAlign: "center",
    }}>
      {/* Header */}
      <div className="animate-fade-up">
        <h1 style={{
          fontSize: 26, fontWeight: 800, letterSpacing: -0.5,
          lineHeight: 1.3, margin: "0 0 12px",
        }}>
          Queremos que você experimente o NutriScan gratuitamente
        </h1>
        <p style={{ fontSize: 15, color: "var(--ns-text-secondary)", margin: "0 0 32px" }}>
          Conheça todos os recursos premium sem compromisso
        </p>
      </div>

      {/* App Mockup */}
      <div className="animate-fade-up stagger-1" style={{
        width: 200, height: 280, margin: "0 auto 32px",
        borderRadius: 24, background: "var(--ns-bg-elevated)",
        border: "2px solid var(--ns-border-subtle)",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 12,
        boxShadow: "var(--ns-shadow-md)",
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: 18,
          background: "linear-gradient(135deg, var(--ns-success), var(--ns-accent))",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 8px 24px rgba(52, 199, 89, 0.3)",
        }}>
          <span style={{ fontSize: 32 }}>🍎</span>
        </div>
        <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: -0.3 }}>NutriScan</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center", padding: "0 16px" }}>
          {["📸 Scans ilimitados", "📊 Insights IA", "🥗 Plano alimentar"].map(f => (
            <span key={f} className="ns-badge ns-badge-success" style={{ fontSize: 10, padding: "3px 8px" }}>{f}</span>
          ))}
        </div>
      </div>

      {/* No payment message */}
      <div className="animate-fade-up stagger-2" style={{ marginBottom: 24 }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          gap: 8, fontSize: 14, color: "var(--ns-success)", fontWeight: 600,
        }}>
          <span>🔓</span>
          Não é necessário pagamento agora
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={() => navigate("/onboarding")}
        className="ns-btn ns-btn-primary animate-fade-up stagger-3"
        style={{
          background: "linear-gradient(135deg, var(--ns-success), #28A745)",
          marginBottom: 16,
        }}
      >
        Experimente por R$0,00
      </button>

      {/* Skip */}
      <button
        onClick={() => navigate("/onboarding")}
        className="animate-fade-up stagger-4"
        style={{
          background: "none", color: "var(--ns-text-muted)", fontSize: 14,
          fontWeight: 500, marginBottom: 32,
        }}
      >
        Pular por agora
      </button>

      {/* Footer links */}
      <div className="animate-fade-up stagger-5" style={{
        display: "flex", justifyContent: "center", gap: 20,
        fontSize: 12, color: "var(--ns-text-muted)",
      }}>
        <span style={{ textDecoration: "underline", cursor: "pointer" }}>Política de Privacidade</span>
        <span style={{ textDecoration: "underline", cursor: "pointer" }}>Restaurar Compra</span>
        <span style={{ textDecoration: "underline", cursor: "pointer" }}>Termos de Uso</span>
      </div>
    </div>
  );
}
