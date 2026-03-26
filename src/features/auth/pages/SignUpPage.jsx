import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { getSupabaseClient } from "../../../lib/supabase";
import { SignUpSchema } from "../../../lib/validation/schemas";
import { analytics } from "../../../lib/analytics";
import { logger } from "../../../lib/logger";

const SUPABASE_ERROR_MAP = {
  "email rate limit exceeded": "Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.",
  "user already registered": "Este email ja esta cadastrado. Tente fazer login.",
  "signup is disabled": "Cadastro temporariamente desativado. Tente mais tarde.",
  "password should be at least 6 characters": "A senha precisa ter no minimo 6 caracteres.",
  "provider is not enabled": "Login social nao esta habilitado. Tente email e senha.",
  "access denied": "Acesso negado pelo provedor. Tente novamente.",
};

function translateAuthError(message) {
  const key = Object.keys(SUPABASE_ERROR_MAP).find((k) =>
    message.toLowerCase().includes(k)
  );
  return key ? SUPABASE_ERROR_MAP[key] : message;
}

// ── SVG Icons ──────────────────────────────────────────────
const IconSprout = () => (
  <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
    <path d="M18 30V18" stroke="var(--ns-accent)" strokeWidth="2" strokeLinecap="round" />
    <path d="M18 22c-4-3-8-2-10 2 3 1 7 1 10-2z" fill="var(--ns-accent)" />
    <path d="M18 18c4-4 9-4 10 0-3 2-7 3-10 0z" fill="var(--ns-accent-dim)" />
    <circle cx="18" cy="12" r="5" fill="var(--ns-accent-bg)" stroke="var(--ns-accent)" strokeWidth="1.5" />
    <path d="M16 12c0-1 1-2 2-2s2 1 2 2-1 2-2 2-2-1-2-2z" fill="var(--ns-accent)" />
  </svg>
);

const IconWarning = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
    <path d="M8 2L14.5 13H1.5L8 2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    <path d="M8 6v3.5M8 11.5v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

// Logotipo oficial do Google em SVG (cores exatas da marca)
const IconGoogle = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
    <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" />
    <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335" />
  </svg>
);

// Logotipo oficial da Apple em SVG
const IconApple = () => (
  <svg width="16" height="18" viewBox="0 0 16 18" fill="none" aria-hidden="true">
    <path d="M13.196 9.56c-.022-2.184 1.787-3.243 1.868-3.295-1.019-1.489-2.601-1.693-3.163-1.716-1.343-.136-2.624.793-3.305.793-.68 0-1.724-.774-2.839-.752-1.455.022-2.8.847-3.547 2.148C.814 9.338 1.948 13.7 3.432 16.04c.726 1.047 1.589 2.22 2.72 2.178 1.097-.045 1.51-.703 2.836-.703 1.326 0 1.696.703 2.847.68 1.178-.022 1.922-1.065 2.642-2.114a10.02 10.02 0 0 0 1.196-2.44c-.028-.013-2.29-.877-2.313-3.48-.022-2.003 1.375-3.089 1.57-3.242l-.734-.359zM10.87 2.906c.594-.724.997-1.726.888-2.728-.859.035-1.907.573-2.524 1.296-.551.641-1.037 1.666-.908 2.649.96.074 1.944-.488 2.544-1.217z" fill="currentColor" />
  </svg>
);

export default function SignUpPage() {
  const navigate = useNavigate();
  const { signUp, loading } = useAuth();
  const [formData, setFormData] = useState({ email: "", password: "", confirmPassword: "" });
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState("");
  const [oauthLoading, setOauthLoading] = useState(null); // 'google' | 'apple' | null

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors({});
    setGeneralError("");

    try {
      SignUpSchema.parse(formData);
      logger.info("Signup attempt", { email: formData.email });
      await signUp(formData.email, formData.password);
      analytics.trackSignup("email");
      logger.info("Signup successful", { email: formData.email });
      navigate("/paywall-welcome");
    } catch (err) {
      logger.error("Signup failed", { email: formData.email, error: err.message });
      analytics.trackEvent("signup_error", { error: err.message });
      const issues = err.issues || err.errors;
      if (issues) {
        const fieldErrors = {};
        issues.forEach((e) => {
          fieldErrors[e.path[0]] = e.message;
        });
        setErrors(fieldErrors);
      } else {
        setGeneralError(translateAuthError(err.message));
      }
    }
  }

  async function handleOAuthSignUp(provider) {
    setGeneralError("");
    setOauthLoading(provider);
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          // Novos usuarios via OAuth sao redirecionados para onboarding.
          // O Supabase cria a conta automaticamente se o email nao existir.
          redirectTo: `${window.location.origin}/onboarding`,
        },
      });
      if (error) throw error;
      // O navegador sera redirecionado para o provedor OAuth.
      // O retorno e capturado pelo AuthContext via onAuthStateChange.
      analytics.trackSignup(provider);
      logger.info("OAuth signup initiated", { provider });
    } catch (err) {
      logger.error("OAuth signup failed", { provider, error: err.message });
      analytics.trackEvent("signup_error", { error: err.message, provider });
      setGeneralError(translateAuthError(err.message));
      setOauthLoading(null);
    }
  }

  return (
    <div style={{
      padding: "20px",
      maxWidth: "420px",
      margin: "0 auto",
      minHeight: "100dvh",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
    }}>
      {/* Logo & App Name */}
      <div className="animate-fade-up" style={{ textAlign: "center", marginBottom: 40 }}>
        <div style={{
          width: 72,
          height: 72,
          borderRadius: "var(--ns-radius-lg)",
          background: "var(--ns-accent-bg)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 16px",
        }}>
          <IconSprout />
        </div>
        <h1 style={{
          margin: "0 0 4px",
          fontSize: 28,
          fontWeight: 700,
          letterSpacing: -0.5,
          color: "var(--ns-text-primary)",
        }}>
          Criar Conta
        </h1>
        <p style={{ margin: 0, fontSize: 14, color: "var(--ns-text-muted)" }}>
          Comece sua jornada nutricional
        </p>
      </div>

      {generalError && (
        <div className="ns-error-banner animate-scale-in" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <IconWarning />
          <span>{generalError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="animate-fade-up stagger-2">
        <div style={{ marginBottom: 16 }}>
          <label htmlFor="signup-email" className="ns-label-field">Email</label>
          <input
            id="signup-email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className={`ns-input ${errors.email ? "ns-input-error" : ""}`}
            placeholder="seu@email.com"
            autoComplete="email"
          />
          {errors.email && <div className="ns-error-text">{errors.email}</div>}
        </div>

        <div style={{ marginBottom: 16 }}>
          <label htmlFor="signup-password" className="ns-label-field">Senha</label>
          <input
            id="signup-password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className={`ns-input ${errors.password ? "ns-input-error" : ""}`}
            placeholder="Minimo 6 caracteres"
            autoComplete="new-password"
          />
          {errors.password && <div className="ns-error-text">{errors.password}</div>}
        </div>

        <div style={{ marginBottom: 28 }}>
          <label htmlFor="signup-confirm" className="ns-label-field">Confirmar Senha</label>
          <input
            id="signup-confirm"
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            className={`ns-input ${errors.confirmPassword ? "ns-input-error" : ""}`}
            placeholder="Repita a senha"
            autoComplete="new-password"
          />
          {errors.confirmPassword && <div className="ns-error-text">{errors.confirmPassword}</div>}
        </div>

        <button type="submit" disabled={loading} className="ns-btn ns-btn-primary">
          {loading ? (
            <>
              <div className="ns-spinner" />
              Criando...
            </>
          ) : "Criar Conta"}
        </button>
      </form>

      {/* Separador "ou cadastre-se com" */}
      <div className="animate-fade-up stagger-3" style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        margin: "28px 0 0",
      }}>
        <div style={{ flex: 1, height: 1, background: "var(--ns-border)" }} />
        <span style={{ fontSize: 12, color: "var(--ns-text-muted)", whiteSpace: "nowrap", letterSpacing: 0.2 }}>
          ou cadastre-se com
        </span>
        <div style={{ flex: 1, height: 1, background: "var(--ns-border)" }} />
      </div>

      {/* Botoes de cadastro social */}
      <div className="animate-fade-up stagger-4" style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 16 }}>
        {/* Google */}
        <button
          type="button"
          onClick={() => handleOAuthSignUp("google")}
          disabled={oauthLoading !== null || loading}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            width: "100%",
            padding: "13px 20px",
            border: "1.5px solid var(--ns-border-strong)",
            borderRadius: "var(--ns-radius)",
            background: "#FFFFFF",
            color: "#1A2E23",
            fontSize: 15,
            fontWeight: 600,
            cursor: oauthLoading !== null || loading ? "not-allowed" : "pointer",
            opacity: oauthLoading !== null || loading ? 0.6 : 1,
            transition: "opacity 0.15s, background 0.15s",
            fontFamily: "var(--ns-font-base)",
          }}
          aria-label="Cadastrar com Google"
        >
          {oauthLoading === "google" ? (
            <div className="ns-spinner" style={{ width: 18, height: 18, borderWidth: 2, borderColor: "rgba(26,46,35,0.2)", borderTopColor: "#1A2E23" }} />
          ) : (
            <IconGoogle />
          )}
          Cadastrar com Google
        </button>

        {/* Apple */}
        <button
          type="button"
          onClick={() => handleOAuthSignUp("apple")}
          disabled={oauthLoading !== null || loading}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            width: "100%",
            padding: "13px 20px",
            border: "1.5px solid #000000",
            borderRadius: "var(--ns-radius)",
            background: "#000000",
            color: "#FFFFFF",
            fontSize: 15,
            fontWeight: 600,
            cursor: oauthLoading !== null || loading ? "not-allowed" : "pointer",
            opacity: oauthLoading !== null || loading ? 0.6 : 1,
            transition: "opacity 0.15s",
            fontFamily: "var(--ns-font-base)",
          }}
          aria-label="Cadastrar com Apple"
        >
          {oauthLoading === "apple" ? (
            <div className="ns-spinner" style={{ width: 18, height: 18, borderWidth: 2, borderColor: "rgba(255,255,255,0.3)", borderTopColor: "#FFFFFF" }} />
          ) : (
            <IconApple />
          )}
          Cadastrar com Apple
        </button>
      </div>

      <div className="animate-fade-up stagger-5" style={{ textAlign: "center", marginTop: 28, fontSize: 14 }}>
        <span style={{ color: "var(--ns-text-muted)" }}>Ja tem conta? </span>
        <Link to="/signin" style={{ color: "var(--ns-accent)", textDecoration: "none", fontWeight: 600 }}>
          Entrar
        </Link>
      </div>
    </div>
  );
}
