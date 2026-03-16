import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/hooks/useAuth";
import { ProfileSchema } from "../../../lib/validation/schemas";
import * as db from "../../../lib/db";
import { analytics } from "../../../lib/analytics";
import { logger } from "../../../lib/logger";

const T = {
  bg: "#F2F2F7",
  surface: "#FFFFFF",
  surface2: "#F7F7FA",
  border: "#E5E5EA",
  text: "#1C1C1E",
  text2: "#636366",
  text3: "#AEAEB2",
  blue: "#007AFF",
  green: "#34C759",
  red: "#FF3B30",
  r: "18px",
  shadow: "0 2px 24px rgba(0,0,0,0.07)",
};

const ACTIVITIES = [
  { label: "Sedentário", sub: "Sem exercícios", val: "1.2" },
  { label: "Levemente ativo", sub: "1-3× por semana", val: "1.375" },
  { label: "Moderado", sub: "3-5× por semana", val: "1.55" },
  { label: "Muito ativo", sub: "6-7× por semana", val: "1.725" },
  { label: "Atleta", sub: "Treinos intensos diários", val: "1.9" },
];

const GOALS = [
  { id: "cutting", label: "Perder gordura", icon: "✂️", desc: "Déficit calórico" },
  { id: "maintain", label: "Manutenção", icon: "⚖️", desc: "Manter peso" },
  { id: "bulking", label: "Ganhar massa", icon: "💪", desc: "Superávit calórico" },
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    full_name: "",
    age: 30,
    gender: "M",
    weight: 75,
    height: 175,
    activity_level: "1.55",
    goal: "maintain",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors({});
    setGeneralError("");
    setLoading(true);

    try {
      ProfileSchema.parse(formData);

      // Salvar perfil no banco
      await db.saveProfile(user.id, formData);

      // Calcular e salvar metas
      const bmr =
        formData.gender === "M"
          ? 88.362 + 13.397 * formData.weight + 4.799 * formData.height - 5.677 * formData.age
          : 447.593 + 9.247 * formData.weight + 3.098 * formData.height - 4.33 * formData.age;

      const tdee = Math.round(bmr * parseFloat(formData.activity_level));
      const mult = formData.goal === "cutting" ? 0.8 : formData.goal === "bulking" ? 1.1 : 1.0;
      const calories = Math.round(tdee * mult);

      const goals = {
        calories,
        protein: Math.round(formData.weight * (formData.goal === "cutting" ? 2.4 : 2.0)),
        carbs: Math.round((calories * 0.38) / 4),
        fat: Math.round((calories * 0.27) / 9),
        fiber: 28,
        water: Math.round(formData.weight * 35),
      };

      await db.saveDailyGoals(user.id, goals);
      analytics.trackOnboarding({
        age: formData.age,
        gender: formData.gender,
        goal: formData.goal,
        bmi: (formData.weight / ((formData.height / 100) ** 2)).toFixed(1),
      });
      logger.info("Onboarding completed", {
        userId: user.id,
        goal: formData.goal,
        calories: goals.calories,
      });
      navigate("/scan");
    } catch (err) {
      if (err.errors) {
        const fieldErrors = {};
        err.errors.forEach((e) => {
          fieldErrors[e.path[0]] = e.message;
        });
        setErrors(fieldErrors);
      } else {
        setGeneralError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto", minHeight: "100vh" }}>
      <h1 style={{ marginBottom: "30px" }}>Seu Perfil Nutricional</h1>

      {generalError && (
        <div style={{ background: T.red + "18", color: T.red, padding: "12px", borderRadius: T.r, marginBottom: "20px", fontSize: "14px" }}>
          {generalError}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", fontSize: "14px", fontWeight: 500, marginBottom: "6px" }}>Nome Completo</label>
          <input
            type="text"
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            style={{
              width: "100%",
              padding: "12px",
              border: `1px solid ${errors.full_name ? T.red : T.border}`,
              borderRadius: "12px",
              fontSize: "14px",
            }}
          />
          {errors.full_name && <div style={{ color: T.red, fontSize: "12px", marginTop: "4px" }}>{errors.full_name}</div>}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
          <div>
            <label style={{ display: "block", fontSize: "14px", fontWeight: 500, marginBottom: "6px" }}>Idade</label>
            <input
              type="number"
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) })}
              style={{
                width: "100%",
                padding: "12px",
                border: `1px solid ${errors.age ? T.red : T.border}`,
                borderRadius: "12px",
                fontSize: "14px",
              }}
            />
            {errors.age && <div style={{ color: T.red, fontSize: "12px", marginTop: "4px" }}>{errors.age}</div>}
          </div>

          <div>
            <label style={{ display: "block", fontSize: "14px", fontWeight: 500, marginBottom: "6px" }}>Gênero</label>
            <select
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              style={{
                width: "100%",
                padding: "12px",
                border: `1px solid ${T.border}`,
                borderRadius: "12px",
                fontSize: "14px",
              }}
            >
              <option value="M">Masculino</option>
              <option value="F">Feminino</option>
            </select>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
          <div>
            <label style={{ display: "block", fontSize: "14px", fontWeight: 500, marginBottom: "6px" }}>Peso (kg)</label>
            <input
              type="number"
              step="0.1"
              value={formData.weight}
              onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) })}
              style={{
                width: "100%",
                padding: "12px",
                border: `1px solid ${errors.weight ? T.red : T.border}`,
                borderRadius: "12px",
                fontSize: "14px",
              }}
            />
            {errors.weight && <div style={{ color: T.red, fontSize: "12px", marginTop: "4px" }}>{errors.weight}</div>}
          </div>

          <div>
            <label style={{ display: "block", fontSize: "14px", fontWeight: 500, marginBottom: "6px" }}>Altura (cm)</label>
            <input
              type="number"
              step="0.1"
              value={formData.height}
              onChange={(e) => setFormData({ ...formData, height: parseFloat(e.target.value) })}
              style={{
                width: "100%",
                padding: "12px",
                border: `1px solid ${errors.height ? T.red : T.border}`,
                borderRadius: "12px",
                fontSize: "14px",
              }}
            />
            {errors.height && <div style={{ color: T.red, fontSize: "12px", marginTop: "4px" }}>{errors.height}</div>}
          </div>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", fontSize: "14px", fontWeight: 500, marginBottom: "12px" }}>Nível de Atividade</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            {ACTIVITIES.map((act) => (
              <div
                key={act.val}
                onClick={() => setFormData({ ...formData, activity_level: act.val })}
                style={{
                  padding: "12px",
                  border: `2px solid ${formData.activity_level === act.val ? T.blue : T.border}`,
                  borderRadius: T.r,
                  cursor: "pointer",
                  background: formData.activity_level === act.val ? T.blue + "08" : T.surface,
                }}
              >
                <div style={{ fontWeight: 600, fontSize: "14px" }}>{act.label}</div>
                <div style={{ fontSize: "12px", color: T.text2 }}>{act.sub}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: "24px" }}>
          <label style={{ display: "block", fontSize: "14px", fontWeight: 500, marginBottom: "12px" }}>Objetivo</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
            {GOALS.map((goal) => (
              <div
                key={goal.id}
                onClick={() => setFormData({ ...formData, goal: goal.id })}
                style={{
                  padding: "12px",
                  border: `2px solid ${formData.goal === goal.id ? T.blue : T.border}`,
                  borderRadius: T.r,
                  cursor: "pointer",
                  background: formData.goal === goal.id ? T.blue + "08" : T.surface,
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "24px", marginBottom: "4px" }}>{goal.icon}</div>
                <div style={{ fontWeight: 600, fontSize: "14px" }}>{goal.label}</div>
                <div style={{ fontSize: "12px", color: T.text2 }}>{goal.desc}</div>
              </div>
            ))}
          </div>
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
          {loading ? "Salvando..." : "Continuar para Scans"}
        </button>
      </form>
    </div>
  );
}
