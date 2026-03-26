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
          fontSize: 26, fontWeight: 700, letterSpacing: -0.5,
          lineHeight: 1.3, margin: "0 0 12px",
        }}>
          Queremos que você experimente o Praxis Nutri gratuitamente
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
          background: "var(--ns-accent-bg)",
          display: "flex", alignItems: "center", justifyContent: "center",
          border: "0.5px solid rgba(45,143,94,0.2)",
          boxShadow: "var(--ns-shadow-glow-sm)",
        }}>
          <svg width="32" height="32" viewBox="0 0 52 52" fill="none">
            <path d="M26 8C16 8 8 16.5 8 27c0 8 4.5 14.5 12 17 1.5-6.5 4.5-12.5 10-15.5-4 4.5-6 10.5-6 15.5C32 43 38 37 40 30c2-10.5-5-22-14-22z" fill="var(--ns-accent)" />
            <path d="M26 44c0-7 3-14.5 8-19" stroke="var(--ns-accent-dim)" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>
        <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: -0.3, color: "var(--ns-text-primary)" }}>Praxis Nutri</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center", padding: "0 16px" }}>
          {["Scans ilimitados", "Insights IA", "Plano alimentar"].map(f => (
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
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <rect x="5" y="11" width="14" height="11" rx="2" stroke="var(--ns-success)" strokeWidth="1.8" />
            <path d="M8 11V7a4 4 0 018 0v4" stroke="var(--ns-success)" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          Nao e necessario pagamento agora
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={() => navigate("/onboarding")}
        className="ns-btn ns-btn-primary animate-fade-up stagger-3"
        style={{
          background: "var(--ns-accent)",
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
