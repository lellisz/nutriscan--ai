import React from "react";
import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

/* ═══════════════════════════════════════════
DESIGN TOKENS  (Apple-inspired light theme)
═══════════════════════════════════════════ */
const T = {
  bg:       "#F2F2F7",
  surface:  "#FFFFFF",
  surface2: "#F7F7FA",
  border:   "#E5E5EA",
  text:     "#1C1C1E",
  text2:    "#636366",
  text3:    "#AEAEB2",
  green:    "#34C759",
  blue:     "#007AFF",
  orange:   "#FF9500",
  red:      "#FF3B30",
  teal:     "#32ADE6",
  purple:   "#AF52DE",
  indigo:   "#5856D6",
  shadow:   "0 2px 24px rgba(0,0,0,0.07)",
  shadowMd: "0 4px 40px rgba(0,0,0,0.10)",
  r:        "18px",
  rSm:      "12px",
};

/* ═══════════════════════════════════════════
STORAGE
═══════════════════════════════════════════ */
const save = async (k, v) => { try { await window.storage.set(k, JSON.stringify(v)); } catch {} };
const load = async (k, d) => { try { const r = await window.storage.get(k); return r ? JSON.parse(r.value) : d; } catch { return d; } };

/* ═══════════════════════════════════════════
HELPERS
═══════════════════════════════════════════ */
const TODAY      = new Date().toLocaleDateString("pt-BR");
const DOW        = new Date().getDay();
const WDAYS      = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
const MONTHS     = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
const MEALS      = ["Café da manhã","Almoço","Jantar","Lanche"];
const MEAL_ICONS = ["☀️","🌿","🌙","🍎"];
const ACTIVITIES = [
  { label:"Sedentário", sub:"Sem exercícios", val:1.2 },
  { label:"Levemente ativo", sub:"1-3× por semana", val:1.375 },
  { label:"Moderado", sub:"3-5× por semana", val:1.55 },
  { label:"Muito ativo", sub:"6-7× por semana", val:1.725 },
  { label:"Atleta", sub:"Treinos intensos diários", val:1.9 },
];
const GOALS_OPT = [
  { id:"cutting", label:"Perder gordura", icon:"✂️", desc:"Déficit calórico controlado" },
  { id:"maintain", label:"Manutenção", icon:"⚖️", desc:"Manter o peso atual" },
  { id:"bulking", label:"Ganhar massa", icon:"💪", desc:"Superávit calórico limpo" },
];

function calcGoals(p) {
  const bmr = p.gender === "M"
    ? 88.362 + 13.397*p.weight + 4.799*p.height - 5.677*p.age
    : 447.593 + 9.247*p.weight + 3.098*p.height - 4.330*p.age;
  const tdee = Math.round(bmr * p.activity);
  const mult  = p.goal==="cutting" ? 0.80 : p.goal==="bulking" ? 1.10 : 1.00;
  const cal   = Math.round(tdee * mult);
  return {
    calories: cal,
    protein:  Math.round(p.weight * (p.goal==="cutting" ? 2.4 : 2.0)),
    carbs:    Math.round((cal * 0.38) / 4),
    fat:      Math.round((cal * 0.27) / 9),
    fiber:    28,
    water:    Math.round(p.weight * 35),
    tdee,
  };
}

function greet() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

/* ═══════════════════════════════════════════
AI SYSTEM PROMPT
═══════════════════════════════════════════ */
const AI_SYSTEM = `Você é um nutricionista e analisa alimentos por imagem com extrema precisão. Retorne APENAS JSON válido – zero texto, zero markdown: { "food_name": "Nome do alimento em português", "emoji": "emoji temático", "category": "proteína"|"carboidrato"|"gordura"|"fruta"|"vegetal"|"bebida"|"misto", "portion": "Porção estimada ex: 1 prato médio ~350g", "calories": número, "protein": número, "carbs": número, "fat": número, "fiber": número, "sugar": número, "sodium": número, "glycemic_index": "baixo"|"médio"|"alto", "satiety_score": 1-10, "cutting_score": 1-10, "confidence": "alta"|"média"|"baixa", "benefits": ["max 2 benefícios curtos"], "watch_out": "aviso curto ou null", "ai_tip": "dica prática de 1 frase para quem quer emagrecer" }`;

/* ═══════════════════════════════════════════
PRIMITIVE COMPONENTS
═══════════════════════════════════════════ */
const css = `
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&display=swap');
* { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
body { margin: 0; background: ${T.bg}; }
input, select, textarea { font-family: inherit; outline: none; }
button { cursor: pointer; font-family: inherit; border: none; }
::-webkit-scrollbar { width: 0; height: 0; }
@keyframes fadeUp { from { opacity: 0; transform: translateY(14px) } to { opacity: 1; transform: none } }
@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
@keyframes scaleIn { from { opacity: 0; transform: scale(.94) } to { opacity: 1; transform: scale(1) } }
@keyframes spin { to { transform: rotate(360deg) } }
@keyframes pulse { 0%, 100% { opacity: 1 } 50% { opacity: .45 } }
@keyframes slideRight { from { transform: translateX(-100%) } to { transform: translateX(0) } }
@keyframes pop { 0% { transform: scale(1) } 50% { transform: scale(1.18) } 100% { transform: scale(1) } }
.fu { animation: fadeUp .38s cubic-bezier(.4,0,.2,1) both; }
.fi { animation: fadeIn .3s ease both; }
.si { animation: scaleIn .32s cubic-bezier(.4,0,.2,1) both; }
.btn-press { transition: transform .12s, box-shadow .12s, opacity .12s; }
.btn-press:active { transform: scale(.96); opacity: .85; }
.tab-icon { transition: transform .2s; }
.tab-icon:active { transform: scale(.88); }
`;

function Spinner({ size = 24, color = T.blue }) {
  return <div style={{ width: size, height: size, border: `2.5px solid ${color}30`, borderTop: `2.5px solid ${color}`, borderRadius: "50%", animation: "spin .75s linear infinite" }} />;
}

function Card({ children, style = {}, onClick, className = "" }) {
  return (
    <div onClick={onClick} className={className} style={{ background: T.surface, borderRadius: T.r, boxShadow: T.shadow, overflow: "hidden", ...style }}>
      {children}
    </div>
  );
}

function SectionLabel({ children }) {
  return <div style={{ fontSize: 13, fontWeight: 700, color: T.text3, letterSpacing: .8, textTransform: "uppercase", margin: "20px 0 8px", paddingLeft: 4 }}>{children}</div>;
}

function Tag({ children, color = T.blue }) {
  return <span style={{ display: "inline-block", fontSize: 11, fontWeight: 700, color, background: color + "18", padding: "3px 9px", borderRadius: 99, letterSpacing: .2 }}>{children}</span>;
}

function Avatar({ name, size = 46 }) {
  const initials = name?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "U";
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: `linear-gradient(135deg, ${T.blue}, ${T.teal})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <span style={{ fontSize: size * .38, fontWeight: 800, color: "#fff" }}>{initials}</span>
    </div>
  );
}

function RingChart({ value, max, size = 110, strokeW = 10, color = T.blue, label, sub }) {
  const r = (size - strokeW) / 2;
  const circ = 2 * Math.PI * r;
  const fill = circ * Math.min(value / (max || 1), 1);
  const over = value > max;
  const col = over ? T.red : color;
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={col + "18"} strokeWidth={strokeW} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={col} strokeWidth={strokeW}
          strokeDasharray={`${fill} ${circ}`} strokeLinecap="round"
          style={{ transition: "stroke-dasharray .8s cubic-bezier(.4,0,.2,1)" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
        <div style={{ fontSize: size * .18, fontWeight: 800, color: col, lineHeight: 1 }}>{Math.round(value)}</div>
        <div style={{ fontSize: size * .1, color: T.text3, marginTop: 2 }}>{label}</div>
        {sub && <div style={{ fontSize: size * .085, color: T.text3 }}>{sub}</div>}
      </div>
    </div>
  );
}

function MacroBar({ label, value, max, color, unit = "g" }) {
  const pct = Math.min(value / (max || 1) * 100, 100);
  const over = value > max;
  return (
    <div style={{ marginBottom: 11 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 5 }}>
        <span style={{ color: T.text2, fontWeight: 500 }}>{label}</span>
        <span style={{ fontWeight: 700, color: over ? T.red : T.text }}>{Math.round(value)} {unit}</span>
      </div>
      <div style={{ height: 6, background: T.surface2, borderRadius: 3, overflow: "hidden" }}>
        <div style={{ height: "100%", width: pct + "%", background: color, transition: "width .4s" }} />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
ONBOARDING / SETUP SCREEN
═══════════════════════════════════════════ */
const STEPS = ["Seu nome", "Dados físicos", "Atividade", "Objetivo"];

function SetupScreen({ onDone }) {
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState({
    name: "", gender: "M", age: "", weight: "", height: "",
    activity: 1.55, goal: "maintain",
  });

  const update = (k, v) => setProfile(p => ({ ...p, [k]: v }));

  const canNext = () => {
    if (step === 0) return profile.name.trim().length > 0;
    if (step === 1) return profile.age >= 10 && profile.age <= 100 && profile.weight >= 30 && profile.weight <= 300 && profile.height >= 100 && profile.height <= 250;
    return true;
  };

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <style>{css}</style>
      <div style={{ width: "100%", maxWidth: 440 }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🥗</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: T.text, fontFamily: "Nunito, sans-serif" }}>NutriScan</div>
          <div style={{ fontSize: 14, color: T.text2, marginTop: 4, fontFamily: "Nunito, sans-serif" }}>Configure seu perfil nutricional</div>
        </div>

        {/* Progress */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: T.text3, marginBottom: 6, fontFamily: "Nunito, sans-serif" }}>
            <span>{STEPS[step]}</span>
            <span>Passo {step + 1} de {STEPS.length}</span>
          </div>
          <div style={{ height: 4, background: T.border, borderRadius: 2 }}>
            <div style={{ height: "100%", width: progress + "%", background: T.blue, borderRadius: 2, transition: "width .4s" }} />
          </div>
        </div>

        <Card style={{ padding: 24 }} className="si">
          {step === 0 && (
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: T.text, marginBottom: 4, fontFamily: "Nunito, sans-serif" }}>Qual é o seu nome?</div>
              <div style={{ fontSize: 14, color: T.text2, marginBottom: 20, fontFamily: "Nunito, sans-serif" }}>Vamos personalizar sua experiência.</div>
              <input
                value={profile.name}
                onChange={e => update("name", e.target.value)}
                placeholder="Digite seu nome"
                style={{ width: "100%", padding: "14px 16px", borderRadius: T.rSm, border: `1.5px solid ${T.border}`, fontSize: 16, fontFamily: "Nunito, sans-serif", background: T.surface2, color: T.text }}
              />
              <div style={{ marginTop: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.text2, marginBottom: 10, fontFamily: "Nunito, sans-serif" }}>Sexo biológico</div>
                <div style={{ display: "flex", gap: 12 }}>
                  {[{ v: "M", label: "♂ Masculino" }, { v: "F", label: "♀ Feminino" }].map(g => (
                    <button key={g.v} onClick={() => update("gender", g.v)} className="btn-press"
                      style={{ flex: 1, padding: "12px 0", borderRadius: T.rSm, fontFamily: "Nunito, sans-serif", fontWeight: 700, fontSize: 14, background: profile.gender === g.v ? T.blue : T.surface2, color: profile.gender === g.v ? "#fff" : T.text2, border: `1.5px solid ${profile.gender === g.v ? T.blue : T.border}`, transition: "all .2s" }}>
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: T.text, marginBottom: 4, fontFamily: "Nunito, sans-serif" }}>Dados físicos</div>
              <div style={{ fontSize: 14, color: T.text2, marginBottom: 20, fontFamily: "Nunito, sans-serif" }}>Para calcular suas metas com precisão.</div>
              {[
                { label: "Idade (anos)", key: "age", placeholder: "Ex: 28", min: 10, max: 100 },
                { label: "Peso (kg)", key: "weight", placeholder: "Ex: 75", min: 30, max: 300 },
                { label: "Altura (cm)", key: "height", placeholder: "Ex: 175", min: 100, max: 250 },
              ].map(f => (
                <div key={f.key} style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.text2, marginBottom: 6, fontFamily: "Nunito, sans-serif" }}>{f.label}</div>
                  <input
                    type="number" min={f.min} max={f.max}
                    value={profile[f.key]}
                    onChange={e => update(f.key, Number(e.target.value))}
                    placeholder={f.placeholder}
                    style={{ width: "100%", padding: "12px 16px", borderRadius: T.rSm, border: `1.5px solid ${T.border}`, fontSize: 16, fontFamily: "Nunito, sans-serif", background: T.surface2, color: T.text }}
                  />
                </div>
              ))}
            </div>
          )}

          {step === 2 && (
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: T.text, marginBottom: 4, fontFamily: "Nunito, sans-serif" }}>Nível de atividade</div>
              <div style={{ fontSize: 14, color: T.text2, marginBottom: 20, fontFamily: "Nunito, sans-serif" }}>Seja honesto para melhores resultados.</div>
              {ACTIVITIES.map(a => (
                <button key={a.val} onClick={() => update("activity", a.val)} className="btn-press"
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "14px 16px", borderRadius: T.rSm, border: `1.5px solid ${profile.activity === a.val ? T.blue : T.border}`, marginBottom: 10, background: profile.activity === a.val ? T.blue + "12" : T.surface2, textAlign: "left", transition: "all .2s" }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: profile.activity === a.val ? T.blue : T.text, fontFamily: "Nunito, sans-serif" }}>{a.label}</div>
                    <div style={{ fontSize: 12, color: T.text3, fontFamily: "Nunito, sans-serif" }}>{a.sub}</div>
                  </div>
                  {profile.activity === a.val && <div style={{ fontSize: 18 }}>✓</div>}
                </button>
              ))}
            </div>
          )}

          {step === 3 && (
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: T.text, marginBottom: 4, fontFamily: "Nunito, sans-serif" }}>Qual é o seu objetivo?</div>
              <div style={{ fontSize: 14, color: T.text2, marginBottom: 20, fontFamily: "Nunito, sans-serif" }}>Suas metas serão ajustadas de acordo.</div>
              {GOALS_OPT.map(g => (
                <button key={g.id} onClick={() => update("goal", g.id)} className="btn-press"
                  style={{ display: "flex", alignItems: "center", gap: 14, width: "100%", padding: "16px", borderRadius: T.rSm, border: `1.5px solid ${profile.goal === g.id ? T.blue : T.border}`, marginBottom: 10, background: profile.goal === g.id ? T.blue + "12" : T.surface2, textAlign: "left", transition: "all .2s" }}>
                  <div style={{ fontSize: 28 }}>{g.icon}</div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: profile.goal === g.id ? T.blue : T.text, fontFamily: "Nunito, sans-serif" }}>{g.label}</div>
                    <div style={{ fontSize: 12, color: T.text3, fontFamily: "Nunito, sans-serif" }}>{g.desc}</div>
                  </div>
                  {profile.goal === g.id && <div style={{ marginLeft: "auto", fontSize: 18 }}>✓</div>}
                </button>
              ))}
            </div>
          )}
        </Card>

        {/* Navigation */}
        <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)} className="btn-press"
              style={{ flex: 1, padding: "15px", borderRadius: T.rSm, fontFamily: "Nunito, sans-serif", fontWeight: 700, fontSize: 15, background: T.surface, color: T.text2, border: `1.5px solid ${T.border}` }}>
              Voltar
            </button>
          )}
          <button
            onClick={() => {
              if (step < STEPS.length - 1) { setStep(s => s + 1); }
              else { save("userProfile", profile); onDone(profile); }
            }}
            disabled={!canNext()}
            className="btn-press"
            style={{ flex: 2, padding: "15px", borderRadius: T.rSm, fontFamily: "Nunito, sans-serif", fontWeight: 800, fontSize: 15, background: canNext() ? T.blue : T.border, color: "#fff", opacity: canNext() ? 1 : 0.6 }}>
            {step < STEPS.length - 1 ? "Continuar →" : "Começar 🚀"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
PROFILE / PREFERENCES SCREEN
═══════════════════════════════════════════ */
function ProfileScreen({ profile, onEdit }) {
  const goals = useMemo(() => calcGoals(profile), [profile]);
  const actLabel = ACTIVITIES.find(a => a.val === profile.activity)?.label || "";
  const goalOpt  = GOALS_OPT.find(g => g.id === profile.goal);

  return (
    <div style={{ paddingBottom: 32, fontFamily: "Nunito, sans-serif" }}>
      {/* Header */}
      <Card style={{ padding: "24px 20px", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Avatar name={profile.name} size={60} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: T.text }}>{profile.name}</div>
            <div style={{ fontSize: 13, color: T.text2, marginTop: 2 }}>
              {profile.gender === "M" ? "♂" : "♀"} {profile.age} anos · {profile.weight} kg · {profile.height} cm
            </div>
            <div style={{ marginTop: 6, display: "flex", gap: 6, flexWrap: "wrap" }}>
              <Tag color={T.blue}>{actLabel}</Tag>
              <Tag color={goalOpt?.id === "cutting" ? T.orange : goalOpt?.id === "bulking" ? T.green : T.teal}>
                {goalOpt?.icon} {goalOpt?.label}
              </Tag>
            </div>
          </div>
        </div>
      </Card>

      {/* Metas diárias */}
      <SectionLabel>Metas diárias</SectionLabel>
      <Card style={{ padding: 20, marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-around", marginBottom: 20 }}>
          <RingChart value={goals.calories} max={goals.calories} size={100} strokeW={9} color={T.orange} label="kcal" sub="meta" />
          <RingChart value={goals.water} max={goals.water} size={100} strokeW={9} color={T.teal} label="ml" sub="água" />
          <RingChart value={goals.protein} max={goals.protein} size={100} strokeW={9} color={T.blue} label="g prot." sub="meta" />
        </div>
        <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 16 }}>
          <MacroBar label="Proteína" value={goals.protein} max={goals.protein} color={T.blue} />
          <MacroBar label="Carboidratos" value={goals.carbs} max={goals.carbs} color={T.orange} />
          <MacroBar label="Gordura" value={goals.fat} max={goals.fat} color={T.purple} />
          <MacroBar label="Fibra" value={goals.fiber} max={goals.fiber} color={T.green} />
        </div>
      </Card>

      {/* Stats */}
      <SectionLabel>Metabolismo</SectionLabel>
      <Card style={{ padding: 20, marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-around" }}>
          {[
            { label: "TDEE", value: goals.tdee + " kcal", sub: "Gasto total" },
            { label: "Meta", value: goals.calories + " kcal", sub: "Alvo diário" },
            { label: "Água", value: (goals.water / 1000).toFixed(1) + " L", sub: "Hidratação" },
          ].map(s => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 900, color: T.text }}>{s.value}</div>
              <div style={{ fontSize: 11, color: T.text3, marginTop: 2 }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Edit button */}
      <button onClick={onEdit} className="btn-press"
        style={{ width: "100%", padding: "15px", borderRadius: T.rSm, fontFamily: "Nunito, sans-serif", fontWeight: 800, fontSize: 15, background: T.surface, color: T.blue, border: `1.5px solid ${T.blue}` }}>
        ✏️ Editar preferências
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════
ROOT APP
═══════════════════════════════════════════ */
function App() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    load("userProfile", null).then(p => {
      setProfile(p);
      setLoading(false);
    });
  }, []);

  const handleDone = useCallback((p) => {
    setProfile(p);
    setEditing(false);
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: T.bg }}>
        <style>{css}</style>
        <Spinner size={36} />
      </div>
    );
  }

  if (!profile || editing) {
    return <SetupScreen onDone={handleDone} />;
  }

  return (
    <div style={{ background: T.bg, minHeight: "100vh", fontFamily: "Nunito, sans-serif" }}>
      <style>{css}</style>
      {/* Top bar */}
      <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: "16px 20px", display: "flex", alignItems: "center", gap: 12, position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ fontSize: 24 }}>🥗</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, color: T.text3, fontWeight: 600 }}>{greet()},</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: T.text }}>{profile.name}</div>
        </div>
        <Avatar name={profile.name} size={36} />
      </div>
      {/* Content */}
      <div style={{ padding: "16px 16px 32px", maxWidth: 600, margin: "0 auto" }}>
        <ProfileScreen profile={profile} onEdit={() => setEditing(true)} />
      </div>
    </div>
  );
}

export default App;

