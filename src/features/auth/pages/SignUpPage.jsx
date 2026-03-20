import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { SignUpSchema } from "../../../lib/validation/schemas";
import { analytics } from "../../../lib/analytics";
import { logger } from "../../../lib/logger";

const SUPABASE_ERROR_MAP = {
  "email rate limit exceeded": "Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.",
  "user already registered": "Este email já está cadastrado. Tente fazer login.",
  "signup is disabled": "Cadastro temporariamente desativado. Tente mais tarde.",
  "password should be at least 6 characters": "A senha precisa ter no mínimo 6 caracteres.",
};

function translateAuthError(message) {
  const key = Object.keys(SUPABASE_ERROR_MAP).find((k) =>
    message.toLowerCase().includes(k)
  );
  return key ? SUPABASE_ERROR_MAP[key] : message;
}

export default function SignUpPage() {
  const navigate = useNavigate();
  const { signUp, loading } = useAuth();
  const [formData, setFormData] = useState({ email: "", password: "", confirmPassword: "" });
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState("");

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
          <span style={{ fontSize: 36 }}>🥗</span>
        </div>
        <h1 style={{ margin: "0 0 4px", fontSize: 28, fontWeight: 800, letterSpacing: -0.5, color: "var(--ns-text-primary)" }}>Criar Conta</h1>
        <p style={{ margin: 0, fontSize: 14, color: "var(--ns-text-secondary)" }}>Comece sua jornada nutricional</p>
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

        <div style={{ marginBottom: 16 }}>
          <label className="ns-label-field">Senha</label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className={`ns-input ${errors.password ? "ns-input-error" : ""}`}
            placeholder="Mínimo 6 caracteres"
            autoComplete="new-password"
          />
          {errors.password && <div className="ns-error-text">{errors.password}</div>}
        </div>

        <div style={{ marginBottom: 28 }}>
          <label className="ns-label-field">Confirmar Senha</label>
          <input
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

      <div className="animate-fade-up stagger-3" style={{ textAlign: "center", marginTop: 24, fontSize: 14 }}>
        <span style={{ color: "var(--ns-text-secondary)" }}>Já tem conta? </span>
        <Link to="/signin" style={{ color: "var(--ns-accent)", textDecoration: "none", fontWeight: 700 }}>
          Entrar
        </Link>
      </div>
    </div>
  );
}
