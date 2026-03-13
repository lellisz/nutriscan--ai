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

function App() {
  return (
    <div style={{ padding: 16, maxWidth: 600, margin: "0 auto" }}>
      <style>{css}</style>
      <h1>Nutriscan</h1>
      <p>Placeholder for main app content</p>
    </div>
  );
}

export default App;

