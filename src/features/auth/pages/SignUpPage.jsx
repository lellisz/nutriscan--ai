import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { SignUpSchema } from "../../../lib/validation/schemas";
import { analytics } from "../../../lib/analytics";
import { logger } from "../../../lib/logger";

const T = {
  bg: "#F2F2F7",
  surface: "#FFFFFF",
  border: "#E5E5EA",
  text: "#1C1C1E",
  text2: "#636366",
  blue: "#007AFF",
  red: "#FF3B30",
  r: "18px",
};

export default function SignUpPage() {
  const navigate = useNavigate();
  const { signUp, loading } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });
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
      navigate("/onboarding");
    } catch (err) {
      logger.error("Signup failed", { email: formData.email, error: err.message });
      analytics.trackEvent("signup_error", { error: err.message });
      if (err.errors) {
        const fieldErrors = {};
        err.errors.forEach((e) => {
          fieldErrors[e.path[0]] = e.message;
        });
        setErrors(fieldErrors);
      } else {
        setGeneralError(err.message);
      }
    }
  }

  return (
    <div style={{ padding: "20px", maxWidth: "400px", margin: "0 auto", minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <h1 style={{ textAlign: "center", marginBottom: "30px" }}>NutriScan</h1>

      {generalError && (
        <div style={{ background: T.red + "18", color: T.red, padding: "12px", borderRadius: T.r, marginBottom: "20px", fontSize: "14px" }}>
          {generalError}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", fontSize: "14px", fontWeight: 500, marginBottom: "6px" }}>Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            style={{
              width: "100%",
              padding: "12px",
              border: `1px solid ${errors.email ? T.red : T.border}`,
              borderRadius: "12px",
              fontSize: "14px",
            }}
          />
          {errors.email && <div style={{ color: T.red, fontSize: "12px", marginTop: "4px" }}>{errors.email}</div>}
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", fontSize: "14px", fontWeight: 500, marginBottom: "6px" }}>Senha</label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            style={{
              width: "100%",
              padding: "12px",
              border: `1px solid ${errors.password ? T.red : T.border}`,
              borderRadius: "12px",
              fontSize: "14px",
            }}
          />
          {errors.password && <div style={{ color: T.red, fontSize: "12px", marginTop: "4px" }}>{errors.password}</div>}
        </div>

        <div style={{ marginBottom: "24px" }}>
          <label style={{ display: "block", fontSize: "14px", fontWeight: 500, marginBottom: "6px" }}>Confirmar Senha</label>
          <input
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            style={{
              width: "100%",
              padding: "12px",
              border: `1px solid ${errors.confirmPassword ? T.red : T.border}`,
              borderRadius: "12px",
              fontSize: "14px",
            }}
          />
          {errors.confirmPassword && <div style={{ color: T.red, fontSize: "12px", marginTop: "4px" }}>{errors.confirmPassword}</div>}
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "14px",
            background: T.blue,
            color: "white",
            border: "none",
            borderRadius: T.r,
            fontSize: "16px",
            fontWeight: 600,
            cursor: loading ? "wait" : "pointer",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "Criando..." : "Criar Conta"}
        </button>
      </form>

      <div style={{ textAlign: "center", marginTop: "20px", fontSize: "14px" }}>
        Já tem conta? <Link to="/signin" style={{ color: T.blue, textDecoration: "none", fontWeight: 600 }}>Entrar</Link>
      </div>
    </div>
  );
}
