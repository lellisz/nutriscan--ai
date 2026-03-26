import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/hooks/useAuth";
import { ProfileSchema } from "../../../lib/validation/schemas";
import * as db from "../../../lib/db";
import { analytics } from "../../../lib/analytics";
import { logger } from "../../../lib/logger";
import PraxiAvatar from "../../../components/praxi/PraxiAvatar";

// ── SVG Icons ──────────────────────────────────────────────
const IconWave = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
    <circle cx="24" cy="24" r="22" fill="var(--ns-bg-elevated)" />
    <path d="M14 26c2-4 4-6 6-4s3 5 6 4 4-4 6-2" stroke="var(--ns-accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <path d="M12 20c1.5-2 3-2.5 4.5-1s2 3.5 3.5 3.5 2.5-2 4-2.5" stroke="var(--ns-text-muted)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.5" />
  </svg>
);

const IconActivity = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
    <circle cx="24" cy="24" r="22" fill="var(--ns-bg-elevated)" />
    <path d="M16 30l5-10 4 7 3-5 4 8" stroke="var(--ns-accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

const IconTarget = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
    <circle cx="24" cy="24" r="22" fill="var(--ns-bg-elevated)" />
    <circle cx="24" cy="24" r="10" stroke="var(--ns-accent)" strokeWidth="2" fill="none" />
    <circle cx="24" cy="24" r="5"  stroke="var(--ns-accent)" strokeWidth="2" fill="none" />
    <circle cx="24" cy="24" r="2"  fill="var(--ns-accent)" />
  </svg>
);

// Activity icons
const IconSofa = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M3 13V9a2 2 0 012-2h14a2 2 0 012 2v4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    <rect x="1" y="13" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.7" />
    <rect x="18" y="13" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.7" />
    <path d="M6 18h12" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);

const IconWalk = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="4" r="2" stroke="currentColor" strokeWidth="1.7" />
    <path d="M9 9l-2 5M15 9l2 5M9 14l1 6M15 14l-1 6M9 9h6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconRun = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <circle cx="13" cy="4" r="2" stroke="currentColor" strokeWidth="1.7" />
    <path d="M7 20l3-5 2 2 3-4 3 1M10 10l3-3 2 2-1 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconFlex = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="4" r="2" stroke="currentColor" strokeWidth="1.7" />
    <path d="M8 10c2-1.5 6-1.5 8 0M10 10l-2 10M14 10l2 10M9 15h6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);

const IconBarbell = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M6 12h12M3 9v6M21 9v6M5 10v4M19 10v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

// Goal icons
const IconScissors = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <circle cx="6"  cy="7"  r="3" stroke="currentColor" strokeWidth="1.7" />
    <circle cx="6"  cy="17" r="3" stroke="currentColor" strokeWidth="1.7" />
    <path d="M8.5 8.5L20 4M8.5 15.5L20 20" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);

const IconScale = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="15" width="18" height="5" rx="2" stroke="currentColor" strokeWidth="1.7" />
    <path d="M12 15V8M8 11l4-7 4 7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconMuscle = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M6 15c0-3 2-6 6-6s6 3 6 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    <path d="M9 9V6a3 3 0 016 0v3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    <path d="M8 15c0 2.5 1.5 4 4 4s4-1.5 4-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);

const IconWarning = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
    <path d="M8 2L14.5 13H1.5L8 2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    <path d="M8 6v3.5M8 11.5v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

const ACTIVITIES = [
  { label: "Sedentário",      sub: "Sem exercícios",     val: "1.2",   Icon: IconSofa    },
  { label: "Levemente ativo", sub: "1-3x por semana",    val: "1.375", Icon: IconWalk    },
  { label: "Moderado",        sub: "3-5x por semana",    val: "1.55",  Icon: IconRun     },
  { label: "Muito ativo",     sub: "6-7x por semana",    val: "1.725", Icon: IconFlex    },
  { label: "Atleta",          sub: "Treinos intensos",   val: "1.9",   Icon: IconBarbell },
];

const GOALS = [
  { id: "cutting",  label: "Perder gordura", Icon: IconScissors, desc: "Deficit calorico",   color: "var(--ns-danger)"  },
  { id: "maintain", label: "Manutencao",     Icon: IconScale,    desc: "Manter peso",        color: "var(--ns-accent)"  },
  { id: "bulking",  label: "Ganhar massa",   Icon: IconMuscle,   desc: "Superavit calorico", color: "var(--ns-success)" },
];

// Maps which fields belong to each step, for smart error redirect
const STEP_FIELDS = [
  ["full_name", "age", "gender", "weight", "height"], // step 0
  ["activity_level"],                                  // step 1
  ["goal"],                                            // step 2
];

// 5.3 — Welcome onboarding screens
const WELCOME_GOALS = [
  { id: "cutting",  label: "Perder gordura", emoji: "🔥", desc: "Definir o corpo e secar" },
  { id: "maintain", label: "Manter peso",    emoji: "⚖️", desc: "Equilíbrio e bem-estar" },
  { id: "bulking",  label: "Ganhar massa",   emoji: "💪", desc: "Crescer forte e saudável" },
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [phase, setPhase]         = useState('welcome'); // 'welcome' | 'form'
  const [welcomeStep, setWelcomeStep] = useState(0);     // 0, 1, 2
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

  // ── Welcome screens (5.3) ─────────────────────────────────────────────────

  if (phase === 'welcome') {
    if (welcomeStep === 0) {
      return (
        <div style={{
          minHeight: "100dvh", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          padding: "40px 28px", background: "var(--ns-bg-primary)",
          textAlign: "center", gap: 0,
          animation: "ns-fade-up 0.35s ease",
        }}>
          <div style={{ marginBottom: 28 }}>
            <PraxiAvatar state="waving" size="lg" />
          </div>
          <h1 style={{
            fontSize: 30, fontWeight: 800, color: "var(--ns-text-primary)",
            letterSpacing: "-0.04em", margin: "0 0 12px", lineHeight: 1.1,
          }}>
            Olá! Sou o Praxi
          </h1>
          <p style={{
            fontSize: 16, color: "var(--ns-text-muted)", lineHeight: 1.6,
            margin: "0 0 48px", maxWidth: 280,
          }}>
            Seu coach nutricional com IA. Vou te ajudar a comer melhor — sem culpa, sem sofrimento.
          </p>
          <button
            onClick={() => setWelcomeStep(1)}
            style={{
              width: "100%", maxWidth: 320, height: 54, borderRadius: 16,
              background: "var(--ns-accent)", border: "none",
              fontSize: 17, fontWeight: 700, color: "#FFF",
              letterSpacing: "-0.02em", cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Começar
          </button>
          <div style={{ display: "flex", gap: 6, marginTop: 24 }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: i === 0 ? 20 : 6, height: 6, borderRadius: 3,
                background: i === 0 ? "var(--ns-accent)" : "var(--ns-border)",
                transition: "width 0.3s ease",
              }} />
            ))}
          </div>
        </div>
      );
    }

    if (welcomeStep === 1) {
      return (
        <div style={{
          minHeight: "100dvh", display: "flex", flexDirection: "column",
          padding: "48px 24px 40px", background: "var(--ns-bg-primary)",
          animation: "ns-fade-up 0.35s ease",
        }}>
          <h2 style={{
            fontSize: 26, fontWeight: 800, color: "var(--ns-text-primary)",
            letterSpacing: "-0.04em", margin: "0 0 8px",
          }}>
            Qual é o seu objetivo?
          </h2>
          <p style={{ fontSize: 14, color: "var(--ns-text-muted)", margin: "0 0 32px" }}>
            Vou personalizar tudo para você
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
            {WELCOME_GOALS.map(({ id, label, emoji, desc }) => {
              const selected = formData.goal === id;
              return (
                <button
                  key={id}
                  onClick={() => {
                    setFormData(prev => ({ ...prev, goal: id }));
                    setWelcomeStep(2);
                  }}
                  style={{
                    display: "flex", alignItems: "center", gap: 16,
                    padding: "18px 20px", borderRadius: 18,
                    background: selected ? "var(--ns-accent-bg)" : "var(--ns-bg-card)",
                    border: selected ? "1.5px solid var(--ns-accent)" : "1px solid var(--ns-border)",
                    cursor: "pointer", textAlign: "left", fontFamily: "inherit",
                    transition: "all 0.15s ease",
                  }}
                >
                  <span style={{ fontSize: 32 }}>{emoji}</span>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "var(--ns-text-primary)" }}>{label}</div>
                    <div style={{ fontSize: 13, color: "var(--ns-text-muted)", marginTop: 2 }}>{desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 24 }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: i === 1 ? 20 : 6, height: 6, borderRadius: 3,
                background: i === 1 ? "var(--ns-accent)" : "var(--ns-border)",
                transition: "width 0.3s ease",
              }} />
            ))}
          </div>
        </div>
      );
    }

    // welcomeStep === 2: CTA scan
    const selectedGoal = WELCOME_GOALS.find(g => g.id === formData.goal);
    return (
      <div style={{
        minHeight: "100dvh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "40px 28px", background: "var(--ns-bg-primary)",
        textAlign: "center", animation: "ns-fade-up 0.35s ease",
      }}>
        <div style={{ marginBottom: 24 }}>
          <PraxiAvatar state="celebrating" size="lg" />
        </div>
        <h2 style={{
          fontSize: 26, fontWeight: 800, color: "var(--ns-text-primary)",
          letterSpacing: "-0.04em", margin: "0 0 8px",
        }}>
          Incrível!
        </h2>
        <p style={{
          fontSize: 15, color: "var(--ns-text-muted)", lineHeight: 1.6,
          margin: "0 0 36px", maxWidth: 280,
        }}>
          Objetivo: <strong style={{ color: "var(--ns-accent)" }}>{selectedGoal?.label}</strong>.<br />
          Agora escaneia seu primeiro alimento para começarmos!
        </p>
        <button
          onClick={() => navigate("/scan")}
          style={{
            width: "100%", maxWidth: 320, height: 54, borderRadius: 16,
            background: "var(--ns-accent)", border: "none",
            fontSize: 17, fontWeight: 700, color: "#FFF",
            letterSpacing: "-0.02em", cursor: "pointer",
            fontFamily: "inherit", marginBottom: 12,
          }}
        >
          Escanear primeiro alimento
        </button>
        <button
          onClick={() => setPhase('form')}
          style={{
            width: "100%", maxWidth: 320, height: 44,
            background: "none", border: "none",
            fontSize: 14, color: "var(--ns-text-muted)",
            cursor: "pointer", fontFamily: "inherit",
          }}
        >
          Completar perfil detalhado
        </button>
        <div style={{ display: "flex", gap: 6, marginTop: 16 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: i === 2 ? 20 : 6, height: 6, borderRadius: 3,
              background: i === 2 ? "var(--ns-accent)" : "var(--ns-border)",
              transition: "width 0.3s ease",
            }} />
          ))}
        </div>
      </div>
    );
  }

  // ── Form phase (original onboarding) ─────────────────────────────────────

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
        // Redirect to the first step that contains the first failing field
        const firstErrorField = issues[0]?.path[0];
        const targetStep = STEP_FIELDS.findIndex((fields) =>
          fields.includes(firstErrorField)
        );
        setStep(targetStep >= 0 ? targetStep : 0);
      } else if (err.message?.includes("does not exist") || err.message?.includes("schema cache")) {
        setGeneralError("Erro de configuracao do banco de dados. Entre em contato com o suporte.");
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
      padding: 20,
      maxWidth: 500,
      margin: "0 auto",
      minHeight: "100dvh",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Progress Bar */}
      <div className="animate-fade-up" style={{ marginBottom: 32, paddingTop: 12 }}>
        <div style={{ display: "flex", gap: 6 }}>
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} style={{
              flex: 1,
              height: 4,
              borderRadius: 2,
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
        <div className="ns-error-banner animate-scale-in" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <IconWarning />
          <span>{generalError}</span>
        </div>
      )}

      <div style={{ flex: 1 }}>
        {/* Step 0: Personal Info */}
        {step === 0 && (
          <div className="animate-fade-up">
            <div style={{ textAlign: "center", marginBottom: 32 }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
                <IconWave />
              </div>
              <h1 style={{ margin: "0 0 6px", fontSize: 26, fontWeight: 700, letterSpacing: -0.5, color: "var(--ns-text-primary)" }}>
                Vamos comecar!
              </h1>
              <p style={{ margin: 0, fontSize: 14, color: "var(--ns-text-muted)" }}>
                Suas informacoes basicas
              </p>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label htmlFor="ob-name" className="ns-label">Nome Completo</label>
              <input
                id="ob-name"
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className={`ns-input ${errors.full_name ? "ns-input-error" : ""}`}
                placeholder="Como podemos te chamar?"
                autoComplete="name"
              />
              {errors.full_name && <div className="ns-error-text">{errors.full_name}</div>}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div>
                <label htmlFor="ob-age" className="ns-label">Idade</label>
                <input
                  id="ob-age"
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || 0 })}
                  className={`ns-input ${errors.age ? "ns-input-error" : ""}`}
                />
                {errors.age && <div className="ns-error-text">{errors.age}</div>}
              </div>
              <div>
                <label htmlFor="ob-gender" className="ns-label">Genero</label>
                <select
                  id="ob-gender"
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
                <label htmlFor="ob-weight" className="ns-label">Peso (kg)</label>
                <input
                  id="ob-weight"
                  type="number"
                  step="0.1"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) || 0 })}
                  className={`ns-input ${errors.weight ? "ns-input-error" : ""}`}
                />
                {errors.weight && <div className="ns-error-text">{errors.weight}</div>}
              </div>
              <div>
                <label htmlFor="ob-height" className="ns-label">Altura (cm)</label>
                <input
                  id="ob-height"
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
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
                <IconActivity />
              </div>
              <h1 style={{ margin: "0 0 6px", fontSize: 26, fontWeight: 700, letterSpacing: -0.5, color: "var(--ns-text-primary)" }}>
                Nivel de atividade
              </h1>
              <p style={{ margin: 0, fontSize: 14, color: "var(--ns-text-muted)" }}>
                Com que frequencia voce se exercita?
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {ACTIVITIES.map((act) => {
                const isActive = formData.activity_level === act.val;
                return (
                  <button
                    key={act.val}
                    onClick={() => setFormData({ ...formData, activity_level: act.val })}
                    aria-pressed={isActive}
                    className={`ns-select-card${isActive ? " ns-select-card--active" : ""}`}
                    style={{ display: "flex", alignItems: "center", gap: 14, textAlign: "left" }}
                  >
                    <div style={{
                      color: isActive ? "var(--ns-accent)" : "var(--ns-text-muted)",
                      flexShrink: 0,
                      transition: "color 0.2s ease",
                    }}>
                      <act.Icon />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 15, color: "var(--ns-text-primary)" }}>{act.label}</div>
                      <div style={{ fontSize: 13, color: "var(--ns-text-muted)" }}>{act.sub}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 2: Goal */}
        {step === 2 && (
          <div className="animate-fade-up">
            <div style={{ textAlign: "center", marginBottom: 32 }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
                <IconTarget />
              </div>
              <h1 style={{ margin: "0 0 6px", fontSize: 26, fontWeight: 700, letterSpacing: -0.5, color: "var(--ns-text-primary)" }}>
                Qual seu objetivo?
              </h1>
              <p style={{ margin: 0, fontSize: 14, color: "var(--ns-text-muted)" }}>
                Vamos personalizar suas metas
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {GOALS.map((goal) => {
                const isActive = formData.goal === goal.id;
                return (
                  <button
                    key={goal.id}
                    onClick={() => setFormData({ ...formData, goal: goal.id })}
                    aria-pressed={isActive}
                    className={`ns-select-card${isActive ? " ns-select-card--active" : ""}`}
                    style={{ display: "flex", alignItems: "center", gap: 16, textAlign: "left", padding: 18 }}
                  >
                    <div style={{
                      width: 48,
                      height: 48,
                      borderRadius: "var(--ns-radius-md)",
                      background: isActive ? "var(--ns-accent-bg)" : "var(--ns-bg-elevated)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      color: isActive ? goal.color : "var(--ns-text-muted)",
                      transition: "background 0.2s ease, color 0.2s ease",
                    }}>
                      <goal.Icon />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 16, color: "var(--ns-text-primary)" }}>{goal.label}</div>
                      <div style={{ fontSize: 13, color: "var(--ns-text-muted)", marginTop: 2 }}>{goal.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      {/* paddingBottom = nav height (72px) + folga, para não ficar atrás da bottom nav bar */}
      <div style={{ display: "flex", gap: 12, marginTop: 32, paddingBottom: "calc(var(--ns-nav-height) + 20px)" }}>
        {step > 0 && (
          <button onClick={prevStep} className="ns-btn ns-btn-secondary" style={{ flex: 1 }}>
            Voltar
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
          ) : step < totalSteps - 1 ? "Proximo" : "Comecar"}
        </button>
      </div>
    </div>
  );
}
