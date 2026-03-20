import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/hooks/useAuth";
import { ProfileSchema } from "../../../lib/validation/schemas";
import * as db from "../../../lib/db";
import { analytics } from "../../../lib/analytics";
import { logger } from "../../../lib/logger";

const ACTIVITIES = [
  { label: "Sedentário", sub: "Sem exercícios", val: "1.2", icon: "🛋️" },
  { label: "Levemente ativo", sub: "1-3× por semana", val: "1.375", icon: "🚶" },
  { label: "Moderado", sub: "3-5× por semana", val: "1.55", icon: "🏃" },
  { label: "Muito ativo", sub: "6-7× por semana", val: "1.725", icon: "💪" },
  { label: "Atleta", sub: "Treinos intensos", val: "1.9", icon: "🏋️" },
];

const GOALS = [
  { id: "cutting", label: "Perder gordura", icon: "✂️", desc: "Déficit calórico", color: "var(--red)" },
  { id: "maintain", label: "Manutenção", icon: "⚖️", desc: "Manter peso", color: "var(--ns-accent)" },
  { id: "bulking", label: "Ganhar massa", icon: "💪", desc: "Superávit calórico", color: "var(--green)" },
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
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

  const totalSteps = 3;

  async function handleSubmit() {
    setErrors({});
    setGeneralError("");
    setLoading(true);

    try {
      ProfileSchema.parse(formData);

      await db.saveProfile(user.id, formData);

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
      logger.info("Onboarding completed", { userId: user.id, goal: formData.goal, calories: goals.calories });
      navigate("/dashboard");
    } catch (err) {
      const issues = err.issues || err.errors;
      if (issues) {
        const fieldErrors = {};
        issues.forEach((e) => { fieldErrors[e.path[0]] = e.message; });
        setErrors(fieldErrors);
        setStep(0);
      } else if (err.message?.includes("does not exist") || err.message?.includes("schema cache")) {
        setGeneralError("Erro de configuração do banco de dados. Entre em contato com o suporte.");
        logger.error("Database schema error", { error: err.message });
      } else {
        setGeneralError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }

  function nextStep() {
    if (step < totalSteps - 1) setStep(step + 1);
    else handleSubmit();
  }

  function prevStep() {
    if (step > 0) setStep(step - 1);
  }

  return (
    <div style={{
      padding: 20, maxWidth: 500, margin: "0 auto",
      minHeight: "100dvh",
      display: "flex", flexDirection: "column",
    }}>
      {/* Progress Bar */}
      <div className="animate-fade-up" style={{ marginBottom: 32, paddingTop: 12 }}>
        <div style={{ display: "flex", gap: 6 }}>
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} style={{
              flex: 1, height: 4, borderRadius: 2,
              background: i <= step ? "var(--ns-accent)" : "var(--ns-border)",
              transition: "background 0.3s ease",
            }} />
          ))}
        </div>
        <div style={{ fontSize: 12, color: "var(--ns-text-muted)", marginTop: 8, textAlign: "center" }}>
          Passo {step + 1} de {totalSteps}
        </div>
      </div>

      {generalError && (
        <div className="ns-error-banner animate-scale-in">
          <span>⚠️</span> {generalError}
        </div>
      )}

      <div style={{ flex: 1 }}>
        {/* Step 0: Personal Info */}
        {step === 0 && (
          <div className="animate-fade-up">
            <div style={{ textAlign: "center", marginBottom: 32 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>👋</div>
              <h1 style={{ margin: "0 0 6px", fontSize: 26, fontWeight: 800, letterSpacing: -0.5 }}>Vamos começar!</h1>
              <p style={{ margin: 0, fontSize: 14, color: "var(--ns-text-secondary)" }}>Suas informações básicas</p>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label className="ns-label">Nome Completo</label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className={`ns-input ${errors.full_name ? "ns-input-error" : ""}`}
                placeholder="Como podemos te chamar?"
              />
              {errors.full_name && <div className="ns-error-text">{errors.full_name}</div>}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div>
                <label className="ns-label">Idade</label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || 0 })}
                  className={`ns-input ${errors.age ? "ns-input-error" : ""}`}
                />
                {errors.age && <div className="ns-error-text">{errors.age}</div>}
              </div>
              <div>
                <label className="ns-label">Gênero</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="ns-input"
                >
                  <option value="M">Masculino</option>
                  <option value="F">Feminino</option>
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label className="ns-label">Peso (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) || 0 })}
                  className={`ns-input ${errors.weight ? "ns-input-error" : ""}`}
                />
                {errors.weight && <div className="ns-error-text">{errors.weight}</div>}
              </div>
              <div>
                <label className="ns-label">Altura (cm)</label>
                <input
                  type="number"
                  value={formData.height}
                  onChange={(e) => setFormData({ ...formData, height: parseFloat(e.target.value) || 0 })}
                  className={`ns-input ${errors.height ? "ns-input-error" : ""}`}
                />
                {errors.height && <div className="ns-error-text">{errors.height}</div>}
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Activity Level */}
        {step === 1 && (
          <div className="animate-fade-up">
            <div style={{ textAlign: "center", marginBottom: 32 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🏃</div>
              <h1 style={{ margin: "0 0 6px", fontSize: 26, fontWeight: 800, letterSpacing: -0.5 }}>Nível de atividade</h1>
              <p style={{ margin: 0, fontSize: 14, color: "var(--ns-text-secondary)" }}>Com que frequência você se exercita?</p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {ACTIVITIES.map((act) => (
                <button
                  key={act.val}
                  onClick={() => setFormData({ ...formData, activity_level: act.val })}
                  className={`ns-select-card${formData.activity_level === act.val ? " ns-select-card--active" : ""}`}
                  style={{ display: "flex", alignItems: "center", gap: 14, textAlign: "left" }}
                >
                  <span style={{ fontSize: 28 }}>{act.icon}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{act.label}</div>
                    <div style={{ fontSize: 13, color: "var(--ns-text-secondary)" }}>{act.sub}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Goal */}
        {step === 2 && (
          <div className="animate-fade-up">
            <div style={{ textAlign: "center", marginBottom: 32 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🎯</div>
              <h1 style={{ margin: "0 0 6px", fontSize: 26, fontWeight: 800, letterSpacing: -0.5 }}>Qual seu objetivo?</h1>
              <p style={{ margin: 0, fontSize: 14, color: "var(--ns-text-secondary)" }}>Vamos personalizar suas metas</p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {GOALS.map((goal) => (
                <button
                  key={goal.id}
                  onClick={() => setFormData({ ...formData, goal: goal.id })}
                  className={`ns-select-card${formData.goal === goal.id ? " ns-select-card--active" : ""}`}
                  style={{ display: "flex", alignItems: "center", gap: 16, textAlign: "left", padding: 18 }}
                >
                  <div style={{
                    width: 52, height: 52, borderRadius: 16,
                    background: formData.goal === goal.id ? "var(--ns-accent-bg)" : "var(--ns-bg-card)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 26, flexShrink: 0,
                    transition: "background 0.2s ease",
                  }}>
                    {goal.icon}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>{goal.label}</div>
                    <div style={{ fontSize: 13, color: "var(--ns-text-secondary)", marginTop: 2 }}>{goal.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div style={{ display: "flex", gap: 12, marginTop: 32, paddingBottom: 20 }}>
        {step > 0 && (
          <button onClick={prevStep} className="ns-btn ns-btn-secondary" style={{ flex: 1 }}>
            ← Voltar
          </button>
        )}
        <button
          onClick={nextStep}
          disabled={loading}
          className="ns-btn ns-btn-primary"
          style={{ flex: step > 0 ? 2 : 1 }}
        >
          {loading ? (
            <>
              <div className="ns-spinner ns-spinner-sm" style={{ borderColor: "rgba(255,255,255,0.3)", borderTopColor: "white" }} />
              Salvando...
            </>
          ) : step < totalSteps - 1 ? "Próximo →" : "Começar 🚀"}
        </button>
      </div>
    </div>
  );
}
