import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/hooks/useAuth";
import { updatePremiumStatus } from "../../../lib/db";

const PLANS = [
  {
    id: "monthly",
    name: "MENSAL",
    price: "R$29,90",
    period: "/mês",
    badge: "POPULAR",
    badgeColor: "var(--ns-accent)",
    highlight: false,
  },
  {
    id: "annual",
    name: "ANUAL",
    price: "R$10,90",
    period: "/mês",
    badge: "MELHOR PREÇO",
    badgeColor: "var(--ns-success)",
    sub: "R$130,90 cobrado anualmente",
    trial: "3 DIAS GRÁTIS",
    highlight: true,
  },
];

export default function SubscriptionPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selected, setSelected] = useState("annual");
  const [loading, setLoading] = useState(false);

  async function handleSubscribe() {
    setLoading(true);
    try {
      await updatePremiumStatus(user.id, true);
      navigate("/dashboard");
    } catch (err) {
      console.error("Erro ao ativar premium:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      padding: 24, maxWidth: 480, margin: "0 auto",
      minHeight: "100dvh", display: "flex", flexDirection: "column",
    }}>
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="animate-fade-up"
        style={{
          alignSelf: "flex-start", background: "none", fontSize: 14,
          color: "var(--ns-accent)", fontWeight: 600, padding: "8px 0",
          marginBottom: 16,
        }}
      >
        ← Voltar
      </button>

      {/* Heading */}
      <div className="animate-fade-up" style={{ textAlign: "center", marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.5, margin: "0 0 8px" }}>
          Conquiste seus objetivos
        </h1>
        <p style={{ fontSize: 14, color: "var(--ns-text-secondary)", margin: 0 }}>
          Desbloqueie todos os recursos premium
        </p>
      </div>

      {/* Timeline */}
      <div className="ns-card animate-fade-up stagger-1" style={{ padding: "20px 24px", marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative" }}>
          <div style={{
            position: "absolute", top: 16, left: 32, right: 32,
            height: 3, background: "linear-gradient(90deg, var(--ns-success), var(--ns-warning), var(--ns-accent))",
            borderRadius: 2,
          }} />
          {[
            { day: "Hoje", icon: "🔓", label: "Acesso completo", color: "var(--ns-success)" },
            { day: "2 dias", icon: "🔔", label: "Lembrete", color: "var(--ns-warning)" },
            { day: "3 dias", icon: "💳", label: "Cobrança", color: "var(--ns-accent)" },
          ].map((step, i) => (
            <div key={i} style={{ textAlign: "center", position: "relative", zIndex: 1, flex: 1 }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                background: step.color, display: "flex",
                alignItems: "center", justifyContent: "center",
                margin: "0 auto 8px", fontSize: 16,
                boxShadow: `0 4px 12px ${step.color}40`,
              }}>
                {step.icon}
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ns-text-primary)" }}>{step.day}</div>
              <div style={{ fontSize: 10, color: "var(--ns-text-muted)", marginTop: 2 }}>{step.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Plan Cards */}
      <div className="animate-fade-up stagger-2" style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
        {PLANS.map((plan) => (
          <button
            key={plan.id}
            onClick={() => setSelected(plan.id)}
            style={{
              position: "relative", padding: 18, textAlign: "left",
              borderRadius: "var(--radius-sm)",
              background: "var(--ns-bg-card)",
              border: selected === plan.id
                ? `2px solid ${plan.highlight ? "var(--ns-success)" : "var(--ns-accent)"}`
                : "2px solid var(--ns-border)",
              boxShadow: selected === plan.id ? "var(--ns-shadow-sm)" : "none",
              transition: "all 0.2s ease",
            }}
          >
            {/* Badge */}
            <span style={{
              position: "absolute", top: -10, right: 16,
              fontSize: 10, fontWeight: 800, padding: "3px 10px",
              borderRadius: "var(--radius-full)",
              background: plan.badgeColor, color: "#fff",
              letterSpacing: 0.3,
            }}>
              {plan.badge}
            </span>

            {/* Trial badge */}
            {plan.trial && (
              <span className="ns-badge ns-badge-success" style={{
                position: "absolute", top: -10, left: 16, fontSize: 9,
              }}>
                {plan.trial}
              </span>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 4 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "var(--ns-text-secondary)" }}>{plan.name}</span>
              <div>
                <span style={{ fontSize: 24, fontWeight: 900, letterSpacing: -0.5 }}>{plan.price}</span>
                <span style={{ fontSize: 13, color: "var(--ns-text-muted)" }}>{plan.period}</span>
              </div>
            </div>
            {plan.sub && (
              <div style={{ fontSize: 12, color: "var(--ns-text-muted)", marginTop: 6 }}>{plan.sub}</div>
            )}
          </button>
        ))}
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* CTA */}
      <button
        onClick={handleSubscribe}
        disabled={loading}
        className="ns-btn ns-btn-primary animate-fade-up stagger-3"
        style={{
          background: "linear-gradient(135deg, var(--ns-success), #28A745)",
          marginBottom: 16,
        }}
      >
        {loading ? (
          <>
            <div className="ns-spinner ns-spinner-sm" style={{ borderColor: "rgba(255,255,255,0.3)", borderTopColor: "white" }} />
            Ativando...
          </>
        ) : selected === "annual"
          ? "Começar teste gratuito de 3 dias"
          : "Assinar agora"}
      </button>

      {/* Footer */}
      <div style={{
        display: "flex", justifyContent: "center", gap: 16,
        fontSize: 11, color: "var(--ns-text-muted)", paddingBottom: 20,
      }}>
        <span style={{ textDecoration: "underline", cursor: "pointer" }}>Termos</span>
        <span style={{ textDecoration: "underline", cursor: "pointer" }}>Privacidade</span>
        <span style={{ textDecoration: "underline", cursor: "pointer" }}>Restaurar</span>
      </div>
    </div>
  );
}
