import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { SignInSchema } from "../../../lib/validation/schemas";
import { analytics } from "../../../lib/analytics";
import { logger } from "../../../lib/logger";

const SUPABASE_ERROR_MAP = {
  "invalid login credentials": "Email ou senha incorretos.",
  "email not confirmed": "Confirme seu email antes de fazer login.",
  "email rate limit exceeded": "Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.",
  "too many requests": "Muitas tentativas. Aguarde alguns minutos.",
};

function translateAuthError(message) {
  const key = Object.keys(SUPABASE_ERROR_MAP).find((k) =>
    message.toLowerCase().includes(k)
  );
  return key ? SUPABASE_ERROR_MAP[key] : message;
}

export default function SignInPage() {
  const navigate = useNavigate();
  const { signIn, loading } = useAuth();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors({});
    setGeneralError("");

    try {
      SignInSchema.parse(formData);
      logger.info("Signin attempt", { email: formData.email });
      await signIn(formData.email, formData.password);
      analytics.trackSignin("email");
      logger.info("Signin successful", { email: formData.email });
      navigate("/onboarding");
    } catch (err) {
      logger.error("Signin failed", { email: formData.email, error: err.message });
      analytics.trackEvent("signin_error", { error: err.message });
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
          borderRadius: 20,
          background: "var(--ns-accent-bg)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 16px",
        }}>
          <span style={{ fontSize: 36 }}>🍎</span>
        </div>
        <h1 style={{ margin: "0 0 4px", fontSize: 28, fontWeight: 800, letterSpacing: -0.5, color: "var(--ns-text-primary)" }}>NutriScan</h1>
        <p style={{ margin: 0, fontSize: 14, color: "var(--ns-text-secondary)" }}>Análise inteligente de alimentos</p>
      </div>

      {generalError && (
        <div className="ns-error-banner animate-scale-in">
          <span>⚠️</span> {generalError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="animate-fade-up stagger-2">
        <div style={{ marginBottom: 16 }}>
          <label className="ns-label-field">Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className={`ns-input ${errors.email ? "ns-input-error" : ""}`}
            placeholder="seu@email.com"
            autoComplete="email"
          />
          {errors.email && <div className="ns-error-text">{errors.email}</div>}
        </div>

        <div style={{ marginBottom: 28 }}>
          <label className="ns-label-field">Senha</label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className={`ns-input ${errors.password ? "ns-input-error" : ""}`}
            placeholder="••••••••"
            autoComplete="current-password"
          />
          {errors.password && <div className="ns-error-text">{errors.password}</div>}
        </div>

        <button type="submit" disabled={loading} className="ns-btn ns-btn-primary">
          {loading ? (
            <>
              <div className="ns-spinner" />
              Entrando...
            </>
          ) : "Entrar"}
        </button>
      </form>

      <div className="animate-fade-up stagger-3" style={{ textAlign: "center", marginTop: 24, fontSize: 14 }}>
        <span style={{ color: "var(--ns-text-secondary)" }}>Não tem conta? </span>
        <Link to="/signup" style={{ color: "var(--ns-accent)", textDecoration: "none", fontWeight: 700 }}>
          Criar conta
        </Link>
      </div>
    </div>
  );
}
