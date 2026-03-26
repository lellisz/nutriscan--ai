import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/hooks/useAuth";
import { logger } from "../../../lib/logger";

const PLANS = [
  {
    id: "monthly",
    name: "MENSAL",
    price: "R$29,90",
    period: "/mes",
    badge: "POPULAR",
    badgeColor: "var(--ns-accent)",
    highlight: false,
  },
  {
    id: "annual",
    name: "ANUAL",
    price: "R$10,90",
    period: "/mes",
    badge: "MELHOR PRECO",
    badgeColor: "var(--ns-success)",
    sub: "R$130,90 cobrado anualmente",
    trial: "3 DIAS GRATIS",
    highlight: true,
  },
];

export default function SubscriptionPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selected, setSelected] = useState("annual");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubscribe() {
    setLoading(true);
    setError(null);
    try {
      // TODO: Integrar com gateway de pagamento (Stripe, RevenueCat, etc.)
      // A ativacao de premium deve ser feita APENAS pelo backend via webhook de pagamento.
      // O fluxo correto e:
      // 1. Frontend abre checkout do gateway de pagamento
      // 2. Gateway processa pagamento e envia webhook para o backend
      // 3. Backend valida webhook e ativa premium via service_role (bypassa RLS)
      //
      // SEGURANCA: A RLS policy do Supabase agora impede que o cliente altere is_premium diretamente.
      // A chamada abaixo e temporaria e sera substituida pelo fluxo de pagamento real.
      setError("Pagamento ainda nao integrado. Em breve!");
    } catch (err) {
      logger.error("Erro ao processar assinatura", { error: err.message });
      setError("Erro ao processar assinatura. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      maxWidth: 480,
      margin: "0 auto",
      minHeight: "100dvh",
      display: "flex",
      flexDirection: "column",
      background: "var(--ns-bg-primary)",
    }}>
      {/* ── Header ── */}
      <header style={{ padding: '16px 20px 12px', background: 'var(--ns-bg-primary)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{
            fontSize: 28, fontWeight: 700,
            color: 'var(--ns-text-primary)',
            letterSpacing: '-0.02em',
            margin: 0,
          }}>
            Planos
          </h1>
          <p style={{
            fontSize: 14, color: 'var(--ns-text-muted)',
            margin: '4px 0 0',
          }}>
            Escolha o melhor para voce
          </p>
        </div>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: 'var(--ns-bg-elevated)',
            border: '0.5px solid var(--ns-border)',
            borderRadius: 10,
            padding: '6px 12px',
            fontSize: 13, fontWeight: 600,
            color: 'var(--ns-text-muted)',
            cursor: 'pointer',
            marginTop: 2,
          }}
        >
          Voltar
        </button>
      </header>

      <div style={{ padding: '0 24px', display: 'flex', flexDirection: 'column', flex: 1 }}>

      {/* Timeline */}
      <div className="ns-card animate-fade-up stagger-1" style={{ padding: "20px 24px", marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative" }}>
          <div style={{
            position: "absolute",
            top: 16,
            left: 32,
            right: 32,
            height: 3,
            background: "linear-gradient(90deg, var(--ns-success), var(--ns-warning), var(--ns-accent))",
            borderRadius: 2,
          }} />
          {[
            { day: "Hoje",   label: "Acesso completo", color: "var(--ns-success)", n: 1 },
            { day: "2 dias", label: "Lembrete",         color: "var(--ns-warning)", n: 2 },
            { day: "3 dias", label: "Cobranca",         color: "var(--ns-accent)",  n: 3 },
          ].map((stepItem, i) => (
            <div key={i} style={{ textAlign: "center", position: "relative", zIndex: 1, flex: 1 }}>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: stepItem.color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 8px",
                boxShadow: `0 4px 12px ${stepItem.color}40`,
              }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ns-bg-primary)" }}>
                  {stepItem.n}
                </span>
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ns-text-primary)" }}>{stepItem.day}</div>
              <div style={{ fontSize: 10, color: "var(--ns-text-muted)", marginTop: 2 }}>{stepItem.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Plan Cards */}
      <div className="animate-fade-up stagger-2" style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
        {PLANS.map((plan) => {
          const isSelected = selected === plan.id;
          return (
            <button
              key={plan.id}
              onClick={() => setSelected(plan.id)}
              aria-pressed={isSelected}
              style={{
                position: "relative",
                padding: 18,
                textAlign: "left",
                borderRadius: "var(--ns-radius-md)",
                background: "var(--ns-bg-card)",
                border: isSelected
                  ? `2px solid ${plan.highlight ? "var(--ns-success)" : "var(--ns-accent)"}`
                  : "2px solid var(--ns-border)",
                boxShadow: isSelected ? "var(--ns-shadow-sm)" : "none",
                transition: "all 0.2s ease",
                cursor: "pointer",
              }}
            >
              {/* Badge */}
              <span style={{
                position: "absolute",
                top: -10,
                right: 16,
                fontSize: 10,
                fontWeight: 700,
                padding: "3px 10px",
                borderRadius: "var(--ns-radius-full)",
                background: plan.badgeColor,
                color: "var(--ns-bg-primary)",
                letterSpacing: 0.3,
              }}>
                {plan.badge}
              </span>

              {/* Trial badge */}
              {plan.trial && (
                <span className="ns-badge ns-badge-success" style={{
                  position: "absolute",
                  top: -10,
                  left: 16,
                  fontSize: 9,
                }}>
                  {plan.trial}
                </span>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 4 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: "var(--ns-text-muted)" }}>{plan.name}</span>
                <div>
                  <span style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.5, color: "var(--ns-text-primary)" }}>
                    {plan.price}
                  </span>
                  <span style={{ fontSize: 13, color: "var(--ns-text-muted)" }}>{plan.period}</span>
                </div>
              </div>
              {plan.sub && (
                <div style={{ fontSize: 12, color: "var(--ns-text-muted)", marginTop: 6 }}>{plan.sub}</div>
              )}
            </button>
          );
        })}
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Error */}
      {error && (
        <div style={{
          background: "var(--ns-danger-bg)",
          border: "1px solid var(--ns-danger)",
          borderRadius: "var(--ns-radius-md)",
          padding: "10px 14px",
          marginBottom: 12,
          fontSize: 13,
          color: "var(--ns-danger)",
          textAlign: "center",
        }}>
          {error}
        </div>
      )}

      {/* CTA */}
      <button
        onClick={handleSubscribe}
        disabled={loading}
        className="ns-btn ns-btn-primary animate-fade-up stagger-3"
        style={{
          background: "linear-gradient(135deg, var(--ns-success), var(--ns-accent-dim))",
          marginBottom: 16,
        }}
      >
        {loading ? (
          <>
            <div className="ns-spinner ns-spinner-sm" style={{ borderColor: "rgba(255,255,255,0.3)", borderTopColor: "white" }} />
            Ativando...
          </>
        ) : selected === "annual"
          ? "Comecar teste gratuito de 3 dias"
          : "Assinar agora"}
      </button>

      {/* Footer */}
      <div style={{
        display: "flex",
        justifyContent: "center",
        gap: 16,
        fontSize: 11,
        color: "var(--ns-text-muted)",
        paddingBottom: 20,
      }}>
        <button
          style={{
            background: "none",
            border: "none",
            padding: 0,
            fontSize: 11,
            color: "var(--ns-text-muted)",
            textDecoration: "underline",
            cursor: "pointer",
          }}
        >
          Termos
        </button>
        <button
          style={{
            background: "none",
            border: "none",
            padding: 0,
            fontSize: 11,
            color: "var(--ns-text-muted)",
            textDecoration: "underline",
            cursor: "pointer",
          }}
        >
          Privacidade
        </button>
        <button
          style={{
            background: "none",
            border: "none",
            padding: 0,
            fontSize: 11,
            color: "var(--ns-text-muted)",
            textDecoration: "underline",
            cursor: "pointer",
          }}
        >
          Restaurar
        </button>
      </div>

      </div>
    </div>
  );
}
