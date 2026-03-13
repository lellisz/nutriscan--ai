import { useState, useRef, useCallback, useEffect, useMemo } from “react”;
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from “recharts”;

/* ─────────────────────────────────────────────
DESIGN TOKENS  (Apple-inspired light theme)
───────────────────────────────────────────── */
const T = {
bg:       “#F2F2F7”,
surface:  “#FFFFFF”,
surface2: “#F7F7FA”,
border:   “#E5E5EA”,
text:     “#1C1C1E”,
text2:    “#636366”,
text3:    “#AEAEB2”,
green:    “#34C759”,
blue:     “#007AFF”,
orange:   “#FF9500”,
red:      “#FF3B30”,
teal:     “#32ADE6”,
purple:   “#AF52DE”,
indigo:   “#5856D6”,
shadow:   “0 2px 24px rgba(0,0,0,0.07)”,
shadowMd: “0 4px 40px rgba(0,0,0,0.10)”,
r:        “18px”,
rSm:      “12px”,
};

/* ─────────────────────────────────────────────
STORAGE
───────────────────────────────────────────── */
const save = async (k, v) => { try { await window.storage.set(k, JSON.stringify(v)); } catch {} };
const load = async (k, d) => { try { const r = await window.storage.get(k); return r ? JSON.parse(r.value) : d; } catch { return d; } };

/* ─────────────────────────────────────────────
HELPERS
───────────────────────────────────────────── */
const TODAY      = new Date().toLocaleDateString(“pt-BR”);
const DOW        = new Date().getDay();
const WDAYS      = [“Dom”,“Seg”,“Ter”,“Qua”,“Qui”,“Sex”,“Sáb”];
const MONTHS     = [“Jan”,“Fev”,“Mar”,“Abr”,“Mai”,“Jun”,“Jul”,“Ago”,“Set”,“Out”,“Nov”,“Dez”];
const MEALS      = [“Café da manhã”,“Almoço”,“Jantar”,“Lanche”];
const MEAL_ICONS = [“☀️”,“🌿”,“🌙”,“🍎”];
const ACTIVITIES = [
{ label:“Sedentário”, sub:“Sem exercícios”, val:1.2 },
{ label:“Levemente ativo”, sub:“1–3× por semana”, val:1.375 },
{ label:“Moderado”, sub:“3–5× por semana”, val:1.55 },
{ label:“Muito ativo”, sub:“6–7× por semana”, val:1.725 },
{ label:“Atleta”, sub:“Treinos intensos diários”, val:1.9 },
];
const GOALS_OPT = [
{ id:“cutting”, label:“Perder gordura”, icon:“🔥”, desc:“Déficit calórico controlado” },
{ id:“maintain”, label:“Manutenção”, icon:“⚖️”, desc:“Manter o peso atual” },
{ id:“bulking”, label:“Ganhar massa”, icon:“💪”, desc:“Superávit calórico limpo” },
];

function calcGoals(p) {
const bmr = p.gender === “M”
? 88.362 + 13.397*p.weight + 4.799*p.height - 5.677*p.age
: 447.593 + 9.247*p.weight + 3.098*p.height - 4.330*p.age;
const tdee = Math.round(bmr * p.activity);
const mult  = p.goal===“cutting” ? 0.80 : p.goal===“bulking” ? 1.10 : 1.00;
const cal   = Math.round(tdee * mult);
return {
calories: cal,
protein:  Math.round(p.weight * (p.goal===“cutting” ? 2.4 : 2.0)),
carbs:    Math.round((cal * 0.38) / 4),
fat:      Math.round((cal * 0.27) / 9),
fiber:    28,
water:    Math.round(p.weight * 35),
tdee,
};
}

function greet() {
const h = new Date().getHours();
if (h < 12) return “Bom dia”;
if (h < 18) return “Boa tarde”;
return “Boa noite”;
}

/* ─────────────────────────────────────────────
AI SYSTEM PROMPT
───────────────────────────────────────────── */
const AI_SYSTEM = Você é um nutricionista e analisa alimentos por imagem com extrema precisão. Retorne APENAS JSON válido — zero texto, zero markdown: { "food_name": "Nome do alimento em português", "emoji": "emoji temático", "category": "proteína"|"carboidrato"|"gordura"|"fruta"|"vegetal"|"bebida"|"misto", "portion": "Porção estimada ex: 1 prato médio ~350g", "calories": número, "protein": número, "carbs": número, "fat": número, "fiber": número, "sugar": número, "sodium": número, "glycemic_index": "baixo"|"médio"|"alto", "satiety_score": 1-10, "cutting_score": 1-10, "confidence": "alta"|"média"|"baixa", "benefits": ["max 2 benefícios curtos"], "watch_out": "aviso curto ou null", "ai_tip": "dica prática de 1 frase para quem quer emagrecer" };

/* ─────────────────────────────────────────────
PRIMITIVE COMPONENTS
───────────────────────────────────────────── */
const css = @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&display=swap'); *{box-sizing:border-box;-webkit-tap-highlight-color:transparent;} body{margin:0;background:${T.bg};} input,select,textarea{font-family:inherit;outline:none;} button{cursor:pointer;font-family:inherit;border:none;} ::-webkit-scrollbar{width:0;height:0;} @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}} @keyframes fadeIn{from{opacity:0}to{opacity:1}} @keyframes scaleIn{from{opacity:0;transform:scale(.94)}to{opacity:1;transform:scale(1)}} @keyframes spin{to{transform:rotate(360deg)}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:.45}} @keyframes slideRight{from{transform:translateX(-100%)}to{transform:translateX(0)}} @keyframes pop{0%{transform:scale(1)}50%{transform:scale(1.18)}100%{transform:scale(1)}} .fu{animation:fadeUp .38s cubic-bezier(.4,0,.2,1) both} .fi{animation:fadeIn .3s ease both} .si{animation:scaleIn .32s cubic-bezier(.4,0,.2,1) both} .btn-press{transition:transform .12s,box-shadow .12s,opacity .12s;} .btn-press:active{transform:scale(.96);opacity:.85;} .tab-icon{transition:transform .2s;} .tab-icon:active{transform:scale(.88);};

function Spinner({ size=24, color=T.blue }) {
return <div style={{ width:size, height:size, border:2.5px solid ${color}30, borderTop:2.5px solid ${color}, borderRadius:“50%”, animation:“spin .75s linear infinite” }} />;
}

function Card({ children, style={}, onClick, className=”” }) {
return (
<div onClick={onClick} className={className} style={{ background:T.surface, borderRadius:T.r, boxShadow:T.shadow, overflow:“hidden”, …style }}>
{children}
</div>
);
}

function SectionLabel({ children }) {
return <div style={{ fontSize:13, fontWeight:700, color:T.text3, letterSpacing:.8, textTransform:“uppercase”, margin:“20px 0 8px”, paddingLeft:4 }}>{children}</div>;
}

function Tag({ children, color=T.blue }) {
return <span style={{ display:“inline-block”, fontSize:11, fontWeight:700, color, background:color+“18”, padding:“3px 9px”, borderRadius:99, letterSpacing:.2 }}>{children}</span>;
}

function Avatar({ name, size=46 }) {
const initials = name?.split(” “).map(w=>w[0]).join(””).slice(0,2).toUpperCase() || “U”;
return (
<div style={{ width:size, height:size, borderRadius:“50%”, background:linear-gradient(135deg,${T.blue},${T.teal}), display:“flex”, alignItems:“center”, justifyContent:“center”, flexShrink:0 }}>
<span style={{ fontSize:size*.38, fontWeight:800, color:”#fff” }}>{initials}</span>
</div>
);
}

function RingChart({ value, max, size=110, strokeW=10, color=T.blue, label, sub }) {
const r    = (size - strokeW) / 2;
const circ = 2 * Math.PI * r;
const fill = circ * Math.min(value / (max||1), 1);
const over = value > max;
const col  = over ? T.red : color;
return (
<div style={{ position:“relative”, width:size, height:size, flexShrink:0 }}>
<svg width={size} height={size} style={{ transform:“rotate(-90deg)” }}>
<circle cx={size/2} cy={size/2} r={r} fill=“none” stroke={col+“18”} strokeWidth={strokeW} />
<circle cx={size/2} cy={size/2} r={r} fill=“none” stroke={col} strokeWidth={strokeW}
strokeDasharray={${fill} ${circ}} strokeLinecap=“round”
style={{ transition:“stroke-dasharray .8s cubic-bezier(.4,0,.2,1)” }} />
</svg>
<div style={{ position:“absolute”, inset:0, display:“flex”, flexDirection:“column”, alignItems:“center”, justifyContent:“center”, textAlign:“center” }}>
<div style={{ fontSize:size*.18, fontWeight:800, color:col, lineHeight:1 }}>{Math.round(value)}</div>
<div style={{ fontSize:size*.1, color:T.text3, marginTop:2 }}>{label}</div>
{sub && <div style={{ fontSize:size*.085, color:T.text3 }}>{sub}</div>}
</div>
</div>
);
}

function MacroBar({ label, value, max, color, unit=“g” }) {
const pct = Math.min(value/(max||1)*100, 100);
const over = value > max;
return (
<div style={{ marginBottom:11 }}>
<div style={{ display:“flex”, justifyContent:“space-between”, fontSize:13, marginBottom:5 }}>
<span style={{ color:T.text2, fontWeight:500 }}>{label}</span>
<span style={{ fontWeight:700, color: over ? T.red : T.text }}>
{Math.round(value)}{unit} <span style={{ color:T.text3, fontWeight:400 }}>/ {max}{unit}</span>
</span>
</div>
<div style={{ height:6, background:T.bg, borderRadius:99, overflow:“hidden” }}>
<div style={{ height:“100%”, width:${pct}%, background: over ? T.red : color, borderRadius:99, transition:“width .7s cubic-bezier(.4,0,.2,1)” }} />
</div>
</div>
);
}

function StatBox({ icon, label, value, color=T.text, sub }) {
return (
<div style={{ flex:1, background:T.surface2, borderRadius:T.rSm, padding:“13px 10px”, textAlign:“center” }}>
<div style={{ fontSize:20, marginBottom:4 }}>{icon}</div>
<div style={{ fontSize:16, fontWeight:800, color }}>{value}</div>
<div style={{ fontSize:11, color:T.text3, marginTop:2, fontWeight:500 }}>{label}</div>
{sub && <div style={{ fontSize:10, color:T.text3, marginTop:1 }}>{sub}</div>}
</div>
);
}

function ScoreBadge({ score, label }) {
const color = score >= 7 ? T.green : score >= 4 ? T.orange : T.red;
return (
<div style={{ flex:1, background:color+“12”, borderRadius:T.rSm, padding:“12px 8px”, textAlign:“center” }}>
<div style={{ fontSize:22, fontWeight:900, color }}>{score}<span style={{ fontSize:12, color:T.text3 }}>/10</span></div>
<div style={{ fontSize:11, color:T.text2, marginTop:3, fontWeight:600 }}>{label}</div>
</div>
);
}

/* ─────────────────────────────────────────────
ONBOARDING
───────────────────────────────────────────── */
function Onboarding({ onDone }) {
const [step, setStep] = useState(0);
const [form, setForm] = useState({ name:””, weight:””, height:””, age:””, gender:“M”, activity:1.55, goal:“cutting” });
const set = (k,v) => setForm(p=>({…p,[k]:v}));

const steps = [
{
icon:“🥗”,
title:“Bem-vindo ao NutriScan”,
sub:“O assistente inteligente para o seu objetivo de saúde.”,
content: (
<div>
<p style={{ color:T.text2, fontSize:15, lineHeight:1.7, textAlign:“center”, margin:“0 0 28px” }}>
Escaneie alimentos com a câmera, acompanhe macronutrientes e alcance seus objetivos com orientação de IA.
</p>
<div style={{ display:“grid”, gridTemplateColumns:“1fr 1fr”, gap:10 }}>
{[[“📸”,“Escanear”,“por foto”],[“📊”,“Macros”,“em tempo real”],[“⚖️”,“Peso”,“e progresso”],[“🎯”,“Metas”,“personalizadas”]].map(([i,t,s])=>(
<div key={t} style={{ background:T.bg, borderRadius:T.rSm, padding:“14px 12px”, textAlign:“center” }}>
<div style={{ fontSize:24, marginBottom:6 }}>{i}</div>
<div style={{ fontSize:13, fontWeight:700, color:T.text }}>{t}</div>
<div style={{ fontSize:11, color:T.text3 }}>{s}</div>
</div>
))}
</div>
</div>
)
},
{
icon:“👤”, title:“Como podemos te chamar?”, sub:“Personalizaremos sua experiência.”,
content: (
<div>
<input placeholder=“Seu nome” value={form.name} onChange={e=>set(“name”,e.target.value)}
style={{ width:“100%”, fontSize:22, fontWeight:700, textAlign:“center”, border:“none”, borderBottom:2px solid ${form.name?T.blue:T.border}, padding:“12px 0”, background:“transparent”, color:T.text, outline:“none”, transition:“border-color .2s” }} />
<div style={{ display:“flex”, gap:12, marginTop:28 }}>
{[“M”,“F”].map(g=>(
<button key={g} className=“btn-press” onClick={()=>set(“gender”,g)} style={{
flex:1, padding:“14px”, borderRadius:T.rSm, border:2px solid ${form.gender===g?T.blue:T.border},
background: form.gender===g ? T.blue+“12” : T.surface2, color: form.gender===g ? T.blue : T.text2, fontWeight:700, fontSize:14, transition:“all .2s”
}}>{g===“M”?“👨 Masculino”:“👩 Feminino”}</button>
))}
</div>
</div>
)
},
{
icon:“📏”, title:“Suas medidas”, sub:“Para calcular suas metas com precisão.”,
content: (
<div style={{ display:“flex”, flexDirection:“column”, gap:16 }}>
{[{k:“weight”,l:“Peso (kg)”,ph:“Ex: 78”,u:“kg”},{k:“height”,l:“Altura (cm)”,ph:“Ex: 175”,u:“cm”},{k:“age”,l:“Idade”,ph:“Ex: 27”,u:“anos”}].map(({k,l,ph,u})=>(
<div key={k}>
<div style={{ fontSize:13, color:T.text3, fontWeight:600, marginBottom:6 }}>{l}</div>
<div style={{ display:“flex”, alignItems:“center”, gap:10, background:T.bg, borderRadius:T.rSm, padding:“0 16px” }}>
<input type=“number” placeholder={ph} value={form[k]} onChange={e=>set(k,e.target.value)}
style={{ flex:1, fontSize:18, fontWeight:700, padding:“14px 0”, border:“none”, background:“transparent”, color:T.text }} />
<span style={{ color:T.text3, fontWeight:600, fontSize:14 }}>{u}</span>
</div>
</div>
))}
</div>
)
},
{
icon:“🏃”, title:“Nível de atividade”, sub:“Com qual frequência você se exercita?”,
content: (
<div style={{ display:“flex”, flexDirection:“column”, gap:10 }}>
{ACTIVITIES.map(a=>(
<button key={a.val} className=“btn-press” onClick={()=>set(“activity”,a.val)} style={{
display:“flex”, alignItems:“center”, gap:14, padding:“14px 16px”, borderRadius:T.rSm,
border:2px solid ${form.activity===a.val?T.blue:T.border},
background: form.activity===a.val ? T.blue+“10” : T.surface2,
textAlign:“left”, transition:“all .2s”
}}>
<div style={{ width:10, height:10, borderRadius:“50%”, background: form.activity===a.val?T.blue:T.border, flexShrink:0, transition:“background .2s” }} />
<div>
<div style={{ fontSize:14, fontWeight:700, color: form.activity===a.val?T.blue:T.text }}>{a.label}</div>
<div style={{ fontSize:12, color:T.text3, marginTop:2 }}>{a.sub}</div>
</div>
</button>
))}
</div>
)
},
{
icon:“🎯”, title:“Qual é seu objetivo?”, sub:“Calcularemos suas metas automaticamente.”,
content: (
<div style={{ display:“flex”, flexDirection:“column”, gap:12 }}>
{GOALS_OPT.map(g=>(
<button key={g.id} className=“btn-press” onClick={()=>set(“goal”,g.id)} style={{
display:“flex”, alignItems:“center”, gap:16, padding:“18px 16px”, borderRadius:T.rSm,
border:2px solid ${form.goal===g.id?T.blue:T.border},
background: form.goal===g.id ? T.blue+“10” : T.surface2, textAlign:“left”, transition:“all .2s”
}}>
<span style={{ fontSize:28 }}>{g.icon}</span>
<div>
<div style={{ fontSize:15, fontWeight:700, color: form.goal===g.id?T.blue:T.text }}>{g.label}</div>
<div style={{ fontSize:12, color:T.text3, marginTop:2 }}>{g.desc}</div>
</div>
{form.goal===g.id && <div style={{ marginLeft:“auto”, fontSize:18, color:T.blue }}>✓</div>}
</button>
))}
</div>
)
}
];

const cur = steps[step];
const canNext = step===0 || (step===1&&form.name) || (step===2&&form.weight&&form.height&&form.age) || step>=3;

const finish = () => {
const p = { …form, weight:+form.weight, height:+form.height, age:+form.age };
onDone(p);
};

return (
<div style={{ minHeight:“100vh”, background:T.bg, display:“flex”, flexDirection:“column”, maxWidth:430, margin:“0 auto”, padding:“0 20px” }}>
<style>{css}</style>
{/* Progress bar */}
<div style={{ height:3, background:T.border, borderRadius:99, margin:“52px 0 0” }}>
<div style={{ height:“100%”, width:${((step+1)/steps.length)*100}%, background:T.blue, borderRadius:99, transition:“width .4s ease” }} />
</div>
<div style={{ fontSize:12, color:T.text3, marginTop:8, fontWeight:500 }}>{step+1} de {steps.length}</div>


  <div key={step} className="fu" style={{ flex:1, paddingTop:32 }}>
    <div style={{ fontSize:44, marginBottom:12, textAlign:"center" }}>{cur.icon}</div>
    <h1 style={{ fontSize:24, fontWeight:900, color:T.text, margin:"0 0 6px", textAlign:"center", lineHeight:1.2 }}>{cur.title}</h1>
    <p style={{ fontSize:14, color:T.text2, margin:"0 0 28px", textAlign:"center" }}>{cur.sub}</p>
    {cur.content}
  </div>

  <div style={{ paddingBottom:40, display:"flex", gap:12 }}>
    {step>0 && (
      <button className="btn-press" onClick={()=>setStep(s=>s-1)} style={{ padding:"16px 22px", borderRadius:T.rSm, background:T.surface, border:`1.5px solid ${T.border}`, color:T.text2, fontWeight:700, fontSize:15 }}>←</button>
    )}
    <button className="btn-press" onClick={()=>step<steps.length-1?setStep(s=>s+1):finish()} disabled={!canNext} style={{
      flex:1, padding:"16px", borderRadius:T.rSm, background: canNext?T.blue:"#C7C7CC", color:"#fff", fontWeight:800, fontSize:16,
      boxShadow: canNext?`0 4px 20px ${T.blue}44`:"none", transition:"all .2s"
    }}>
      {step<steps.length-1?"Continuar":"Começar agora 🚀"}
    </button>
  </div>
</div>


);
}

/* ─────────────────────────────────────────────
MAIN APP
───────────────────────────────────────────── */
export default function App() {
const [profile, setProfile]   = useState(null);
const [goals, setGoals]       = useState(null);
const [foods, setFoods]       = useState([]);
const [weekCals, setWeekCals] = useState(Array(7).fill(0).map((_,i)=>({day:WDAYS[i],cal:0,pro:0})));
const [weightLog, setWeightLog] = useState([]);
const [water, setWater]       = useState(0);
const [streak, setStreak]     = useState(0);
const [tab, setTab]           = useState(“home”);
const [loaded, setLoaded]     = useState(false);
const [pendingFile, setPendingFile] = useState(null);
const fileRef                 = useRef();

useEffect(()=>{
(async()=>{
const p  = await load(“profile_v2”, null);
const f  = await load(“foods_”+TODAY, []);
const wk = await load(“weekCals”, Array(7).fill(0).map((*,i)=>({day:WDAYS[i],cal:0,pro:0})));
const wl = await load(“weightLog_v2”, []);
const wa = await load(“water*”+TODAY, 0);
const st = await load(“streak_v2”, 0);
if (p) { setProfile(p); setGoals(calcGoals(p)); }
setFoods(f); setWeekCals(wk); setWeightLog(wl); setWater(wa); setStreak(st);
setLoaded(true);
})();
},[]);

useEffect(()=>{ if(loaded&&profile){ save(“foods_”+TODAY,foods); syncWeek(foods); } },[foods]);
useEffect(()=>{ if(loaded) save(“water_”+TODAY,water); },[water]);
useEffect(()=>{ if(loaded&&profile){ save(“profile_v2”,profile); setGoals(calcGoals(profile)); } },[profile]);
useEffect(()=>{ if(loaded) save(“weightLog_v2”,weightLog); },[weightLog]);
useEffect(()=>{ if(loaded) save(“weekCals”,weekCals); },[weekCals]);
useEffect(()=>{ if(loaded) save(“streak_v2”,streak); },[streak]);

const syncWeek = (fs) => {
const cal = fs.reduce((a,f)=>a+f.calories,0);
const pro = fs.reduce((a,f)=>a+f.protein,0);
setWeekCals(prev=>prev.map((d,i)=>i===DOW?{…d,cal,pro}:d));
};

const totals = useMemo(()=>foods.reduce((a,f)=>({
calories:a.calories+f.calories, protein:a.protein+f.protein,
carbs:a.carbs+f.carbs, fat:a.fat+f.fat, fiber:a.fiber+(f.fiber||0)
}),{calories:0,protein:0,carbs:0,fat:0,fiber:0}),[foods]);

const handleOnboard = (p) => {
setProfile(p); setGoals(calcGoals(p));
save(“profile_v2”,p); setLoaded(true);
};

const addFood = (item, preview) => {
const entry = { …item, id:Date.now(), meal:item._meal||“Lanche”, mealIdx:item._mealIdx||3,
time:new Date().toLocaleTimeString(“pt-BR”,{hour:“2-digit”,minute:“2-digit”}), image:preview||null };
setFoods(prev=>[entry,…prev]);
setStreak(s=>s+1);
};
const deleteFood = (id) => setFoods(prev=>prev.filter(f=>f.id!==id));

if (!loaded) return (
<div style={{ minHeight:“100vh”, background:T.bg, display:“flex”, alignItems:“center”, justifyContent:“center”, flexDirection:“column”, gap:14 }}>
<style>{css}</style>
<Spinner size={36} />
<div style={{ fontSize:14, color:T.text3, fontWeight:600, letterSpacing:.5 }}>Carregando</div>
</div>
);

if (!profile) return <Onboarding onDone={handleOnboard} />;

const tabs = [
{id:“home”,  icon:“house.fill”,  label:“Início”},
{id:“scan”,  icon:“camera.fill”, label:“Scan”},
{id:“diary”, icon:“list.bullet”, label:“Diário”},
{id:“progress”,icon:“chart.bar.fill”,label:“Progresso”},
{id:“profile”,icon:“person.fill”,label:“Perfil”},
];

const NAV_ICONS = { “home”:“🏠”,“scan”:“📸”,“diary”:“📋”,“progress”:“📊”,“profile”:“👤” };

return (
<div style={{ maxWidth:430, margin:“0 auto”, minHeight:“100vh”, background:T.bg, fontFamily:”‘Nunito’,sans-serif”, position:“relative” }}>
<style>{css}</style>


  <div style={{ paddingBottom:88 }}>
    {tab==="home"     && <HomeTab     profile={profile} goals={goals} totals={totals} foods={foods} water={water} setWater={setWater} weekCals={weekCals} streak={streak} setTab={setTab} fileRef={fileRef} />}
    {tab==="scan"     && <ScanTab     goals={goals} addFood={addFood} fileRef={fileRef} pendingFile={pendingFile} clearPendingFile={()=>setPendingFile(null)} />}
    {tab==="diary"    && <DiaryTab    foods={foods} totals={totals} goals={goals} deleteFood={deleteFood} />}
    {tab==="progress" && <ProgressTab totals={totals} goals={goals} weekCals={weekCals} weightLog={weightLog} setWeightLog={setWeightLog} streak={streak} profile={profile} />}
    {tab==="profile"  && <ProfileTab  profile={profile} setProfile={setProfile} goals={goals} foods={foods} />}
  </div>

  {/* Bottom Nav */}
  <nav style={{ position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:430,
    background:"rgba(255,255,255,0.92)", backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)",
    borderTop:`1px solid ${T.border}`, zIndex:999 }}>
    <div style={{ display:"flex", justifyContent:"space-around", padding:"8px 0 18px" }}>
      {tabs.map(t=>{
        const active = tab===t.id;
        return (
          <button key={t.id} className="tab-icon" onClick={()=>setTab(t.id)} style={{
            display:"flex", flexDirection:"column", alignItems:"center", gap:3,
            padding:"6px 14px", borderRadius:14, background:"none",
            transition:"background .15s"
          }}>
            <span style={{ fontSize:22, filter: active?"none":"grayscale(1) opacity(.45)", transition:"filter .2s" }}>{NAV_ICONS[t.id]}</span>
            <span style={{ fontSize:10, fontWeight:active?800:600, color:active?T.blue:T.text3, transition:"color .2s" }}>{t.label}</span>
            {active && <div style={{ width:4,height:4,borderRadius:"50%",background:T.blue,marginTop:-2 }} />}
          </button>
        );
      })}
    </div>
  </nav>

  <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display:"none" }}
    onChange={e=>{ if(e.target.files[0]) { setPendingFile(e.target.files[0]); setTab("scan"); e.target.value=""; } }} />
</div>


);
}

/* ─────────────────────────────────────────────
HOME TAB
───────────────────────────────────────────── */
function HomeTab({ profile, goals, totals, foods, water, setWater, weekCals, streak, setTab, fileRef }) {
const calLeft  = (goals?.calories||0) - totals.calories;
const over     = totals.calories > (goals?.calories||0);
const waterGoal = Math.ceil((goals?.water||2000)/250);

const today = new Date();
const dateStr = today.toLocaleDateString(“pt-BR”,{weekday:“long”,day:“numeric”,month:“long”});

return (
<div>
{/* Hero header */}
<div style={{ background:linear-gradient(160deg,${T.blue} 0%,#34AADC 100%), padding:“52px 20px 28px”, position:“relative”, overflow:“hidden” }}>
<div style={{ position:“absolute”, top:-40, right:-40, width:180, height:180, borderRadius:“50%”, background:“rgba(255,255,255,.08)” }} />
<div style={{ position:“absolute”, bottom:-60, left:-30, width:140, height:140, borderRadius:“50%”, background:“rgba(255,255,255,.06)” }} />
<div style={{ display:“flex”, justifyContent:“space-between”, alignItems:“flex-start”, position:“relative” }}>
<div>
<div style={{ fontSize:13, color:“rgba(255,255,255,.75)”, fontWeight:600, marginBottom:2 }}>{greet()},</div>
<div style={{ fontSize:26, fontWeight:900, color:”#fff”, lineHeight:1.1 }}>{profile?.name?.split(” “)[0]} 👋</div>
<div style={{ fontSize:12, color:“rgba(255,255,255,.65)”, marginTop:4, textTransform:“capitalize” }}>{dateStr}</div>
</div>
<div style={{ textAlign:“right” }}>
<div style={{ fontSize:12, color:“rgba(255,255,255,.7)”, marginBottom:2 }}>{over?“Acima do limite”:“Restam”}</div>
<div style={{ fontSize:28, fontWeight:900, color: over?”#FFD60A”:”#fff” }}>{Math.abs(Math.round(calLeft))}</div>
<div style={{ fontSize:11, color:“rgba(255,255,255,.7)” }}>kcal</div>
</div>
</div>
</div>


  <div style={{ padding:"0 16px" }}>
    {/* Calorie card */}
    <Card style={{ marginTop:-20, padding:20, position:"relative", zIndex:2 }} className="fu">
      <div style={{ display:"flex", alignItems:"center", gap:18 }}>
        <RingChart value={totals.calories} max={goals?.calories||2000} size={108} strokeW={10} color={T.blue} label="kcal" sub={`/ ${goals?.calories}`} />
        <div style={{ flex:1 }}>
          <MacroBar label="Proteína 💪" value={totals.protein} max={goals?.protein||130} color={T.green} />
          <MacroBar label="Carboidratos 🌾" value={totals.carbs} max={goals?.carbs||160} color={T.orange} />
          <MacroBar label="Gorduras 🥑" value={totals.fat} max={goals?.fat||50} color={T.purple} />
        </div>
      </div>

      <div style={{ display:"flex", gap:10, marginTop:16 }}>
        <StatBox icon="🔥" label="Ingerido" value={`${Math.round(totals.calories)} kcal`} color={T.red} />
        <StatBox icon="📉" label="TDEE" value={`${goals?.tdee||0} kcal`} color={T.blue} />
        <StatBox icon="🏆" label="Registros" value={streak} color={T.orange} />
      </div>
    </Card>

    {/* Quick scan CTA */}
    <button className="btn-press fu" onClick={()=>{ fileRef.current?.click(); }} style={{
      width:"100%", marginTop:14, padding:"18px 22px", borderRadius:T.r,
      background:`linear-gradient(135deg,${T.blue},#34AADC)`,
      boxShadow:`0 6px 28px ${T.blue}44`, border:"none",
      display:"flex", alignItems:"center", justifyContent:"center", gap:12, animationDelay:".05s"
    }}>
      <span style={{ fontSize:24 }}>📸</span>
      <div style={{ textAlign:"left" }}>
        <div style={{ fontSize:16, fontWeight:800, color:"#fff" }}>Escanear alimento</div>
        <div style={{ fontSize:12, color:"rgba(255,255,255,.75)" }}>A IA identifica calorias em segundos</div>
      </div>
      <div style={{ marginLeft:"auto", fontSize:20, color:"rgba(255,255,255,.7)" }}>→</div>
    </button>

    {/* Water tracker */}
    <SectionLabel>Hidratação 💧</SectionLabel>
    <Card style={{ padding:"16px 18px" }} className="fu" style={{ animationDelay:".1s", background:T.surface, borderRadius:T.r, boxShadow:T.shadow, overflow:"hidden", padding:"16px 18px", marginBottom:0 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
        <div style={{ fontSize:14, fontWeight:700, color:T.text }}>Meta diária de água</div>
        <Tag color={T.teal}>{water*250}ml / {goals?.water||2000}ml</Tag>
      </div>
      <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:10 }}>
        {Array(waterGoal).fill(0).map((_,i)=>(
          <button key={i} className="btn-press" onClick={()=>setWater(i<water?i:i+1)} style={{
            fontSize:22, background:"none", padding:2,
            filter: i<water?"none":"grayscale(1) opacity(.22)", transition:"filter .15s, transform .12s"
          }}>💧</button>
        ))}
      </div>
      <div style={{ height:4, background:T.bg, borderRadius:99, overflow:"hidden" }}>
        <div style={{ height:"100%", width:`${Math.min(water/waterGoal*100,100)}%`, background:T.teal, borderRadius:99, transition:"width .6s ease" }} />
      </div>
      <div style={{ fontSize:11, color:T.text3, marginTop:6 }}>Toque para registrar um copo (250ml)</div>
    </Card>

    {/* Week chart */}
    <SectionLabel>Esta semana</SectionLabel>
    <Card style={{ padding:"16px 18px" }}>
      <div style={{ fontSize:14, fontWeight:700, marginBottom:14, color:T.text }}>Calorias diárias</div>
      <ResponsiveContainer width="100%" height={110}>
        <BarChart data={weekCals} barSize={22} barCategoryGap="30%">
          <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
          <XAxis dataKey="day" tick={{ fontSize:11, fill:T.text3, fontFamily:"Nunito" }} axisLine={false} tickLine={false} />
          <YAxis hide />
          <Tooltip contentStyle={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, fontSize:12, fontFamily:"Nunito" }} cursor={{ fill:T.blue+"10", radius:8 }} />
          <Bar dataKey="cal" name="kcal" fill={T.blue} radius={[7,7,0,0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>

    {/* Recent meals */}
    {foods.length>0 && <>
      <SectionLabel>Refeições de hoje</SectionLabel>
      <Card style={{ overflow:"hidden" }}>
        {foods.slice(0,4).map((f,i)=>(
          <div key={f.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"13px 16px", borderBottom:i<Math.min(foods.length,4)-1?`1px solid ${T.border}`:"none" }}>
            <div style={{ width:42,height:42,borderRadius:10,background:T.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0 }}>
              {f.emoji||"🍽️"}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:14,fontWeight:700,color:T.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{f.food_name}</div>
              <div style={{ fontSize:11,color:T.text3,marginTop:1 }}>{f.meal} · {f.time}</div>
            </div>
            <div style={{ textAlign:"right",flexShrink:0 }}>
              <div style={{ fontSize:14,fontWeight:800,color:T.blue }}>{f.calories}</div>
              <div style={{ fontSize:10,color:T.text3 }}>kcal</div>
            </div>
          </div>
        ))}
        {foods.length>4 && (
          <button className="btn-press" onClick={()=>setTab("diary")} style={{ width:"100%",padding:"13px",background:T.bg,border:"none",color:T.blue,fontWeight:700,fontSize:13 }}>
            Ver mais {foods.length-4} item(s) →
          </button>
        )}
      </Card>
    </>}

    {/* Tips */}
    <SectionLabel>Dicas para você</SectionLabel>
    <div style={{ display:"flex", flexDirection:"column", gap:10, paddingBottom:10 }}>
      {[
        {icon:"🥩",color:T.green,title:"Proteína protege músculo",body:"Manter alta ingestão proteica durante déficit preserva sua massa magra."},
        {icon:"🥗",color:T.orange,title:"Alimentos de volume",body:"Vegetais e proteínas magras enchem o prato sem estourar as calorias."},
        {icon:"💤",color:T.purple,title:"Sono e cortisol",body:"Dormir mal eleva cortisol, dificultando a queima de gordura."},
      ].map(({icon,color,title,body})=>(
        <Card key={title} style={{ padding:"14px 16px" }}>
          <div style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
            <div style={{ width:38,height:38,borderRadius:10,background:color+"18",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0 }}>{icon}</div>
            <div>
              <div style={{ fontSize:13,fontWeight:700,color:T.text,marginBottom:3 }}>{title}</div>
              <div style={{ fontSize:12,color:T.text2,lineHeight:1.55 }}>{body}</div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  </div>
</div>


);
}

/* ─────────────────────────────────────────────
SCAN TAB
───────────────────────────────────────────── */
function ScanTab({ goals, addFood, fileRef, pendingFile, clearPendingFile }) {
const [preview,    setPreview]    = useState(null);
const [analyzing,  setAnalyzing]  = useState(false);
const [result,     setResult]     = useState(null);
const [error,      setError]      = useState(null);
const [mealIdx,    setMealIdx]    = useState(0);
const [manual,     setManual]     = useState(false);
const [mf, setMf] = useState({food_name:””,calories:””,protein:””,carbs:””,fat:””,fiber:””});
const localRef = useRef();

// Pick up file passed from the nav bar camera button
useEffect(()=>{
if (pendingFile) {
handleFile(pendingFile);
clearPendingFile();
}
},[pendingFile]);

const handleFile = useCallback(async(file)=>{
if(!file) return;
setError(null); setResult(null); setManual(false);
const reader = new FileReader();
reader.onload = async(e)=>{
const b64 = e.target.result.split(”,”)[1];
setPreview(e.target.result); setAnalyzing(true);
try {
const res = await fetch(“https://api.anthropic.com/v1/messages”,{
method:“POST”, headers:{“Content-Type”:“application/json”},
body:JSON.stringify({ model:“claude-sonnet-4-20250514”, max_tokens:1000, system:AI_SYSTEM,
messages:[{role:“user”,content:[
{type:“image”,source:{type:“base64”,media_type:file.type||“image/jpeg”,data:b64}},
{type:“text”,text:“Analise o alimento.”}
]}]
})
});
const data = await res.json();
const txt  = data.content?.find(b=>b.type===“text”)?.text||””;
const parsed = JSON.parse(txt.replace(/json|/g,””).trim());
setResult(parsed);
} catch { setError(“Não foi possível identificar o alimento. Tente uma foto mais nítida e bem iluminada.”); }
finally { setAnalyzing(false); }
};
reader.readAsDataURL(file);
},[]);

const confirmAdd = ()=>{
if(!result) return;
addFood({…result, _meal:MEALS[mealIdx], _mealIdx:mealIdx}, preview);
setResult(null); setPreview(null);
};

const confirmManual = ()=>{
if(!mf.food_name||!mf.calories) return;
addFood({food_name:mf.food_name,emoji:“🍽️”,category:“misto”,portion:“1 porção”,calories:+mf.calories,protein:+mf.protein||0,carbs:+mf.carbs||0,fat:+mf.fat||0,fiber:+mf.fiber||0,cutting_score:5,satiety_score:5,confidence:“manual”,ai_tip:“Alimento inserido manualmente.”, _meal:MEALS[mealIdx],_mealIdx:mealIdx}, null);
setMf({food_name:””,calories:””,protein:””,carbs:””,fat:””,fiber:””});
setManual(false);
};

const reset = ()=>{ setPreview(null); setResult(null); setError(null); setAnalyzing(false); };

const catColor = { proteína:T.green, carboidrato:T.orange, gordura:T.purple, fruta:T.red, vegetal:T.teal, bebida:T.blue, misto:T.indigo };

return (
<div style={{ padding:“0 16px” }}>
<div style={{ paddingTop:52,paddingBottom:16 }}>
<div style={{ fontSize:28,fontWeight:900,color:T.text }}>Escanear</div>
<div style={{ fontSize:14,color:T.text2,marginTop:4 }}>Fotografe qualquer alimento para análise</div>
</div>


  {/* Meal selector */}
  <div style={{ display:"flex",gap:8,marginBottom:16,overflowX:"auto",paddingBottom:2 }}>
    {MEALS.map((m,i)=>(
      <button key={i} className="btn-press" onClick={()=>setMealIdx(i)} style={{
        display:"flex",alignItems:"center",gap:6,padding:"9px 16px",borderRadius:99,whiteSpace:"nowrap",fontWeight:700,fontSize:13,
        background:mealIdx===i?T.blue:T.surface, color:mealIdx===i?"#fff":T.text2,
        border:`1.5px solid ${mealIdx===i?T.blue:T.border}`, boxShadow:mealIdx===i?`0 4px 16px ${T.blue}33`:"none",
        transition:"all .2s"
      }}>
        <span>{MEAL_ICONS[i]}</span>{m}
      </button>
    ))}
  </div>

  {/* Upload area */}
  {!preview && !manual && (
    <div className="fu">
      <div onClick={()=>localRef.current.click()} style={{
        border:`2px dashed ${T.border}`, borderRadius:T.r, padding:"48px 24px", textAlign:"center",
        background:T.surface, cursor:"pointer", marginBottom:12, transition:"all .2s"
      }}
        onMouseEnter={e=>{e.currentTarget.style.borderColor=T.blue;e.currentTarget.style.background=T.blue+"08";}}
        onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.background=T.surface;}}>
        <div style={{ fontSize:56,marginBottom:14 }}>📷</div>
        <div style={{ fontSize:17,fontWeight:800,color:T.text,marginBottom:6 }}>Fotografar alimento</div>
        <div style={{ fontSize:13,color:T.text2,marginBottom:22,lineHeight:1.5 }}>A IA identifica o alimento,<br/>calorias e todos os macros</div>
        <span style={{ background:T.blue,color:"#fff",padding:"13px 32px",borderRadius:99,fontSize:14,fontWeight:800,display:"inline-block", boxShadow:`0 4px 20px ${T.blue}44` }}>Selecionar imagem</span>
      </div>
      <input ref={localRef} type="file" accept="image/*" capture="environment" style={{ display:"none" }} onChange={e=>handleFile(e.target.files[0])} />

      <button className="btn-press" onClick={()=>setManual(true)} style={{ width:"100%",padding:16,borderRadius:T.rSm,background:T.surface,border:`1.5px solid ${T.border}`,color:T.text2,fontWeight:700,fontSize:14 }}>
        ✏️  Inserir manualmente
      </button>

      {/* Tips */}
      <SectionLabel>Dicas para melhores resultados</SectionLabel>
      <Card style={{ padding:"14px 16px" }}>
        {[["💡","Boa iluminação traz resultados mais precisos"],["📐","Enquadre bem o prato ou embalagem"],["🎯","Quanto mais nítida a foto, melhor a análise"]].map(([i,t])=>(
          <div key={t} style={{ display:"flex",gap:10,padding:"7px 0",borderBottom:t!=="Quanto mais nítida a foto, melhor a análise"?`1px solid ${T.border}`:"none" }}>
            <span style={{ fontSize:16 }}>{i}</span>
            <span style={{ fontSize:13,color:T.text2 }}>{t}</span>
          </div>
        ))}
      </Card>
    </div>
  )}

  {/* Manual form */}
  {manual && (
    <Card style={{ padding:20 }} className="si">
      <div style={{ fontSize:17,fontWeight:800,color:T.text,marginBottom:18 }}>✏️ Inserir manualmente</div>
      {[{k:"food_name",l:"Nome do alimento",t:"text",ph:"Ex: Frango grelhado"},{k:"calories",l:"Calorias (kcal)",t:"number",ph:"Ex: 230"},{k:"protein",l:"Proteína (g)",t:"number",ph:"Ex: 32"},{k:"carbs",l:"Carboidratos (g)",t:"number",ph:"Ex: 0"},{k:"fat",l:"Gorduras (g)",t:"number",ph:"Ex: 6"},{k:"fiber",l:"Fibras (g)",t:"number",ph:"Ex: 0"}].map(({k,l,t,ph})=>(
        <div key={k} style={{ marginBottom:13 }}>
          <div style={{ fontSize:12,color:T.text3,fontWeight:700,marginBottom:5 }}>{l}</div>
          <input type={t} placeholder={ph} value={mf[k]} onChange={e=>setMf(p=>({...p,[k]:e.target.value}))}
            style={{ width:"100%",background:T.bg,border:`1.5px solid ${T.border}`,borderRadius:T.rSm,padding:"12px 14px",color:T.text,fontSize:15,fontWeight:600,boxSizing:"border-box" }} />
        </div>
      ))}
      <div style={{ display:"flex",gap:10,marginTop:4 }}>
        <button className="btn-press" onClick={()=>setManual(false)} style={{ flex:1,padding:14,borderRadius:T.rSm,background:T.bg,border:`1.5px solid ${T.border}`,color:T.text2,fontWeight:700,fontSize:14 }}>Cancelar</button>
        <button className="btn-press" onClick={confirmManual} style={{ flex:2,padding:14,borderRadius:T.rSm,background:T.blue,color:"#fff",fontWeight:800,fontSize:14,boxShadow:`0 4px 16px ${T.blue}44` }}>Adicionar</button>
      </div>
    </Card>
  )}

  {/* Preview + loader */}
  {preview && (
    <div className="fu">
      <div style={{ position:"relative",borderRadius:T.r,overflow:"hidden",marginBottom:14,boxShadow:T.shadowMd }}>
        <img src={preview} alt="food" style={{ width:"100%",height:230,objectFit:"cover",display:"block" }} />
        {analyzing && (
          <div style={{ position:"absolute",inset:0,background:"rgba(255,255,255,.85)",backdropFilter:"blur(8px)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:14 }}>
            <Spinner size={38} />
            <div style={{ fontSize:15,fontWeight:700,color:T.text,animation:"pulse 1.5s ease infinite" }}>Analisando com IA…</div>
            <div style={{ fontSize:12,color:T.text2 }}>Identificando nutrientes</div>
          </div>
        )}
      </div>
      {error && (
        <Card style={{ padding:16,border:`1.5px solid ${T.red}33`,marginBottom:14 }}>
          <div style={{ fontSize:14,color:T.red,fontWeight:600 }}>⚠️ {error}</div>
          <button className="btn-press" onClick={reset} style={{ marginTop:10,fontSize:13,color:T.blue,background:"none",fontWeight:700 }}>Tentar novamente</button>
        </Card>
      )}
    </div>
  )}

  {/* Result card */}
  {result && !analyzing && (
    <div className="si">
      {/* Food header */}
      <Card style={{ padding:20,marginBottom:12 }}>
        <div style={{ display:"flex",gap:14,alignItems:"flex-start",marginBottom:16 }}>
          <div style={{ width:60,height:60,borderRadius:14,background:T.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:34,flexShrink:0 }}>{result.emoji||"🍽️"}</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:19,fontWeight:900,color:T.text,lineHeight:1.2 }}>{result.food_name}</div>
            <div style={{ fontSize:13,color:T.text2,marginTop:3 }}>{result.portion}</div>
            <div style={{ display:"flex",gap:6,marginTop:8,flexWrap:"wrap" }}>
              {result.category && <Tag color={catColor[result.category]||T.blue}>{result.category}</Tag>}
              <Tag color={result.confidence==="alta"?T.green:result.confidence==="média"?T.orange:T.red}>
                {result.confidence==="alta"?"✓ Alta precisão":result.confidence==="média"?"⚡ Média precisão":"? Baixa precisão"}
              </Tag>
            </div>
          </div>
        </div>

        {/* Score row */}
        <div style={{ display:"flex",gap:10,marginBottom:18 }}>
          <ScoreBadge score={result.cutting_score} label="Cutting" />
          <ScoreBadge score={result.satiety_score} label="Saciedade" />
          <div style={{ flex:1,background:T.bg,borderRadius:T.rSm,padding:"12px 8px",textAlign:"center" }}>
            <div style={{ fontSize:14,fontWeight:800,color:result.glycemic_index==="baixo"?T.green:result.glycemic_index==="médio"?T.orange:T.red }}>
              {result.glycemic_index?.charAt(0).toUpperCase()+result.glycemic_index?.slice(1)}
            </div>
            <div style={{ fontSize:11,color:T.text2,marginTop:3,fontWeight:600 }}>Índice glicêmico</div>
          </div>
        </div>

        {/* Main macros */}
        <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:16 }}>
          {[{l:"Calorias",v:result.calories,u:"kcal",c:T.red},{l:"Proteína",v:result.protein+"g",c:T.green},{l:"Carbs",v:result.carbs+"g",c:T.orange},{l:"Gordura",v:result.fat+"g",c:T.purple},{l:"Fibras",v:(result.fiber||0)+"g",c:T.teal},{l:"Sódio",v:(result.sodium||0)+"mg",c:T.indigo}].map(({l,v,c})=>(
            <div key={l} style={{ background:T.bg,borderRadius:T.rSm,padding:"11px 8px",textAlign:"center" }}>
              <div style={{ fontSize:15,fontWeight:800,color:c }}>{v}</div>
              <div style={{ fontSize:10,color:T.text3,marginTop:3,fontWeight:600 }}>{l}</div>
            </div>
          ))}
        </div>

        {/* Benefits & warning */}
        {result.benefits?.length>0 && (
          <div style={{ marginBottom:12 }}>
            {result.benefits.map((b,i)=>(
              <div key={i} style={{ display:"flex",gap:8,fontSize:13,color:T.text2,padding:"5px 0",borderBottom:i<result.benefits.length-1?`1px solid ${T.border}`:"none" }}>
                <span style={{ color:T.green,flexShrink:0 }}>✓</span>{b}
              </div>
            ))}
          </div>
        )}
        {result.watch_out && (
          <div style={{ background:T.orange+"12",border:`1px solid ${T.orange}33`,borderRadius:T.rSm,padding:"10px 14px",fontSize:13,color:T.orange,fontWeight:600,marginBottom:12 }}>
            ⚠️ {result.watch_out}
          </div>
        )}
        {result.ai_tip && (
          <div style={{ background:T.blue+"0E",border:`1px solid ${T.blue}22`,borderRadius:T.rSm,padding:"12px 14px",fontSize:13,color:T.blue,lineHeight:1.55,marginBottom:16 }}>
            💡 {result.ai_tip}
          </div>
        )}

        <div style={{ display:"flex",gap:10 }}>
          <button className="btn-press" onClick={reset} style={{ flex:1,padding:15,borderRadius:T.rSm,background:T.bg,border:`1.5px solid ${T.border}`,color:T.text2,fontWeight:700,fontSize:14 }}>Cancelar</button>
          <button className="btn-press" onClick={confirmAdd} style={{ flex:2,padding:15,borderRadius:T.rSm,background:T.blue,color:"#fff",fontWeight:800,fontSize:14,boxShadow:`0 4px 20px ${T.blue}44` }}>
            ＋ Adicionar ao diário
          </button>
        </div>
      </Card>
    </div>
  )}
</div>


);
}

/* ─────────────────────────────────────────────
DIARY TAB
───────────────────────────────────────────── */
function DiaryTab({ foods, totals, goals, deleteFood }) {
const grouped = useMemo(()=>{
const g = {};
MEALS.forEach(m=>{ g[m] = foods.filter(f=>f.meal===m); });
return g;
},[foods]);

const calPct = Math.min(totals.calories/(goals?.calories||1)*100,100);
const over   = totals.calories>(goals?.calories||0);

return (
<div style={{ padding:“0 16px” }}>
<div style={{ paddingTop:52,paddingBottom:16 }}>
<div style={{ fontSize:28,fontWeight:900,color:T.text }}>Diário</div>
<div style={{ fontSize:14,color:T.text2,marginTop:4 }}>
{new Date().toLocaleDateString(“pt-BR”,{weekday:“long”,day:“numeric”,month:“long”})}
</div>
</div>


  {/* Summary rings */}
  <Card style={{ padding:20,marginBottom:4 }}>
    <div style={{ display:"flex",justifyContent:"space-around",alignItems:"center" }}>
      <RingChart value={totals.calories} max={goals?.calories||2000} size={84} strokeW={8} color={T.blue} label="kcal" />
      <RingChart value={totals.protein} max={goals?.protein||130} size={72} strokeW={7} color={T.green} label="prot." />
      <RingChart value={totals.carbs} max={goals?.carbs||160} size={72} strokeW={7} color={T.orange} label="carbs" />
      <RingChart value={totals.fat} max={goals?.fat||50} size={72} strokeW={7} color={T.purple} label="gord." />
    </div>
    <div style={{ marginTop:16 }}>
      <div style={{ display:"flex",justifyContent:"space-between",fontSize:12,color:T.text3,marginBottom:6 }}>
        <span style={{ fontWeight:700 }}>Calorias</span>
        <span style={{ color:over?T.red:T.text,fontWeight:700 }}>{Math.round(totals.calories)} / {goals?.calories} kcal</span>
      </div>
      <div style={{ height:7,background:T.bg,borderRadius:99,overflow:"hidden" }}>
        <div style={{ height:"100%",width:`${calPct}%`,background:over?T.red:`linear-gradient(90deg,${T.blue},${T.teal})`,borderRadius:99,transition:"width .7s ease" }} />
      </div>
    </div>
    {over && <div style={{ marginTop:10,background:T.red+"10",borderRadius:T.rSm,padding:"8px 12px",fontSize:12,color:T.red,fontWeight:600 }}>⚠️ Você ultrapassou a meta de calorias em {Math.round(totals.calories-goals.calories)} kcal</div>}
  </Card>

  {/* Extra stats row */}
  <div style={{ display:"flex",gap:10,margin:"14px 0" }}>
    <StatBox icon="🧬" label="Fibras" value={`${Math.round(totals.fiber||0)}g`} color={T.teal} sub={`meta: ${goals?.fiber||28}g`} />
    <StatBox icon="🍽️" label="Refeições" value={foods.length} color={T.blue} />
    <StatBox icon="⚡" label="Restam" value={`${Math.max(0,Math.round((goals?.calories||0)-totals.calories))} kcal`} color={over?T.red:T.green} />
  </div>

  {foods.length===0 ? (
    <div style={{ textAlign:"center",padding:"70px 20px",color:T.text3 }}>
      <div style={{ fontSize:56,marginBottom:12 }}>🍽️</div>
      <div style={{ fontSize:18,fontWeight:800,color:T.text2 }}>Nenhuma refeição registrada</div>
      <div style={{ fontSize:14,marginTop:6 }}>Escaneie um alimento para começar</div>
    </div>
  ) : (
    MEALS.map((meal,mi)=>{
      const mf = grouped[meal];
      if(!mf.length) return null;
      const mCal = mf.reduce((a,f)=>a+f.calories,0);
      const mPro = mf.reduce((a,f)=>a+f.protein,0);
      return (
        <div key={meal} style={{ marginBottom:16 }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8 }}>
            <div style={{ display:"flex",alignItems:"center",gap:8 }}>
              <span style={{ fontSize:18 }}>{MEAL_ICONS[mi]}</span>
              <span style={{ fontSize:15,fontWeight:800,color:T.text }}>{meal}</span>
            </div>
            <div style={{ display:"flex",gap:6 }}>
              <Tag color={T.blue}>{mCal} kcal</Tag>
              <Tag color={T.green}>{Math.round(mPro)}g prot.</Tag>
            </div>
          </div>
          <Card style={{ overflow:"hidden" }}>
            {mf.map((f,i)=>(
              <div key={f.id} style={{ display:"flex",alignItems:"center",gap:12,padding:"13px 16px",borderBottom:i<mf.length-1?`1px solid ${T.border}`:"none" }}>
                {f.image
                  ? <img src={f.image} alt="" style={{ width:48,height:48,borderRadius:10,objectFit:"cover",flexShrink:0 }} />
                  : <div style={{ width:48,height:48,borderRadius:10,background:T.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,flexShrink:0 }}>{f.emoji||"🍽️"}</div>
                }
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ fontSize:14,fontWeight:700,color:T.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{f.food_name}</div>
                  <div style={{ fontSize:11,color:T.text3,marginTop:2,marginBottom:5 }}>{f.portion} · {f.time}</div>
                  <div style={{ display:"flex",gap:5,flexWrap:"wrap" }}>
                    <Tag color={T.red}>{f.calories} kcal</Tag>
                    <Tag color={T.green}>P {f.protein}g</Tag>
                    <Tag color={T.orange}>C {f.carbs}g</Tag>
                    <Tag color={T.purple}>G {f.fat}g</Tag>
                  </div>
                </div>
                <button className="btn-press" onClick={()=>deleteFood(f.id)} style={{ background:T.bg,border:"none",width:32,height:32,borderRadius:8,fontSize:14,color:T.text3,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center" }}>✕</button>
              </div>
            ))}
          </Card>
        </div>
      );
    })
  )}
</div>


);
}

/* ─────────────────────────────────────────────
PROGRESS TAB
───────────────────────────────────────────── */
function ProgressTab({ totals, goals, weekCals, weightLog, setWeightLog, streak, profile }) {
const [newW, setNewW] = useState(””);
const [weightPeriod, setWeightPeriod] = useState(10);

const startW = weightLog[weightLog.length-1]?.weight;
const currW  = weightLog[0]?.weight;
const lost   = startW && currW ? (startW-currW).toFixed(1) : null;

const addWeight = ()=>{
if(!newW) return;
setWeightLog(prev=>[{date:TODAY,weight:+newW,id:Date.now()},…prev].slice(0,60));
setNewW(””);
};

const wData  = […weightLog].reverse().slice(-weightPeriod);
const avgCal = weekCals.reduce((a,d)=>a+d.cal,0)/7;

const achievements = [
{ icon:“🏅”, title:“Primeiro scan”, desc:“Analisou o primeiro alimento”, done:streak>=1 },
{ icon:“🔥”, title:“Em chamas”, desc:“10 alimentos registrados”, done:streak>=10 },
{ icon:“💪”, title:“Proteína em dia”, desc:“Meta proteica atingida”, done:totals.protein>=(goals?.protein||130) },
{ icon:“💧”, title:“Hidratado”, desc:“Meta de água atingida hoje”, done:false },
{ icon:“⚖️”, title:“Consistente”, desc:“5 registros de peso”, done:weightLog.length>=5 },
{ icon:“🎯”, title:“Déficit controlado”, desc:“Abaixo da meta calórica”, done:totals.calories<(goals?.calories||2000)&&totals.calories>0 },
];

return (
<div style={{ padding:“0 16px” }}>
<div style={{ paddingTop:52,paddingBottom:16 }}>
<div style={{ fontSize:28,fontWeight:900,color:T.text }}>Progresso</div>
<div style={{ fontSize:14,color:T.text2,marginTop:4 }}>Acompanhe sua evolução</div>
</div>


  {/* Key metrics */}
  <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14 }}>
    {[
      {icon:"⚖️",label:"Peso atual",value:currW?currW+"kg":"—",color:T.blue,sub:profile?.weight?"Inicial: "+profile.weight+"kg":""},
      {icon:"📉",label:"Total perdido",value:lost?lost+"kg":"—",color:lost&&+lost>0?T.green:T.red,sub:lost&&+lost>0?"Ótimo progresso!":""},
      {icon:"🔥",label:"Déficit hoje",value:Math.max(0,Math.round((goals?.calories||0)-totals.calories))+" kcal",color:T.orange,sub:"meta: -"+(goals?.tdee-(goals?.calories||0))+" kcal/dia"},
      {icon:"📝",label:"Registros",value:streak,color:T.purple,sub:"alimentos escaneados"},
    ].map(({icon,label,value,color,sub})=>(
      <Card key={label} style={{ padding:"16px 14px" }}>
        <div style={{ fontSize:24,marginBottom:8 }}>{icon}</div>
        <div style={{ fontSize:18,fontWeight:900,color }}>{value}</div>
        <div style={{ fontSize:12,color:T.text2,marginTop:2,fontWeight:600 }}>{label}</div>
        {sub&&<div style={{ fontSize:11,color:T.text3,marginTop:2 }}>{sub}</div>}
      </Card>
    ))}
  </div>

  {/* Weekly calories chart */}
  <SectionLabel>Calorias — últimos 7 dias</SectionLabel>
  <Card style={{ padding:"16px 18px",marginBottom:14 }}>
    <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14 }}>
      <div style={{ fontSize:14,fontWeight:700,color:T.text }}>Média: {Math.round(avgCal)} kcal/dia</div>
      <Tag color={avgCal<(goals?.calories||2000)?T.green:T.red}>{avgCal<(goals?.calories||2000)?"Em déficit":"Acima"}</Tag>
    </div>
    <ResponsiveContainer width="100%" height={120}>
      <AreaChart data={weekCals}>
        <defs>
          <linearGradient id="cGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={T.blue} stopOpacity={0.2} />
            <stop offset="95%" stopColor={T.blue} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
        <XAxis dataKey="day" tick={{ fontSize:11,fill:T.text3,fontFamily:"Nunito" }} axisLine={false} tickLine={false} />
        <YAxis hide />
        <Tooltip contentStyle={{ background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,fontSize:12,fontFamily:"Nunito" }} cursor={{ stroke:T.blue+"22",strokeWidth:2 }} />
        <Area type="monotone" dataKey="cal" name="kcal" stroke={T.blue} strokeWidth={2.5} fill="url(#cGrad)" dot={{ fill:T.blue,r:3,strokeWidth:0 }} activeDot={{ r:5 }} />
      </AreaChart>
    </ResponsiveContainer>
  </Card>

  {/* Protein chart */}
  <Card style={{ padding:"16px 18px",marginBottom:14 }}>
    <div style={{ fontSize:14,fontWeight:700,marginBottom:14,color:T.text }}>Proteína — meta: {goals?.protein}g/dia</div>
    <ResponsiveContainer width="100%" height={100}>
      <BarChart data={weekCals} barSize={20}>
        <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
        <XAxis dataKey="day" tick={{ fontSize:11,fill:T.text3,fontFamily:"Nunito" }} axisLine={false} tickLine={false} />
        <YAxis hide />
        <Tooltip contentStyle={{ background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,fontSize:12,fontFamily:"Nunito" }} cursor={{ fill:T.green+"10" }} />
        <Bar dataKey="pro" name="g proteína" fill={T.green} radius={[6,6,0,0]} />
      </BarChart>
    </ResponsiveContainer>
  </Card>

  {/* Weight log */}
  <SectionLabel>Registro de peso</SectionLabel>
  <Card style={{ padding:20,marginBottom:14 }}>
    <div style={{ display:"flex",gap:10,marginBottom:16 }}>
      <input type="number" step="0.1" placeholder="Peso atual (kg)" value={newW} onChange={e=>setNewW(e.target.value)}
        style={{ flex:1,background:T.bg,border:`1.5px solid ${T.border}`,borderRadius:T.rSm,padding:"12px 14px",color:T.text,fontSize:15,fontWeight:600 }} />
      <button className="btn-press" onClick={addWeight} style={{ padding:"12px 18px",borderRadius:T.rSm,background:T.blue,color:"#fff",fontWeight:800,fontSize:14,boxShadow:`0 4px 16px ${T.blue}33` }}>Salvar</button>
    </div>

    {wData.length>1 ? (
      <>
        <div style={{ display:"flex",gap:8,marginBottom:12 }}>
          {[7,14,30].map(p=>(
            <button key={p} className="btn-press" onClick={()=>setWeightPeriod(p)} style={{ flex:1,padding:"7px",borderRadius:8,border:`1.5px solid ${weightPeriod===p?T.blue:T.border}`,background:weightPeriod===p?T.blue+"12":T.bg,color:weightPeriod===p?T.blue:T.text3,fontWeight:700,fontSize:12 }}>
              {p} dias
            </button>
          ))}
        </div>
        <ResponsiveContainer width="100%" height={110}>
          <AreaChart data={wData}>
            <defs>
              <linearGradient id="wGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={T.purple} stopOpacity={0.2} />
                <stop offset="95%" stopColor={T.purple} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tick={{ fontSize:9,fill:T.text3 }} axisLine={false} tickLine={false} />
            <YAxis hide domain={["dataMin - 0.5","dataMax + 0.5"]} />
            <Tooltip contentStyle={{ background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,fontSize:12 }} cursor={{ stroke:T.purple+"30",strokeWidth:2 }} />
            <Area type="monotone" dataKey="weight" name="kg" stroke={T.purple} strokeWidth={2.5} fill="url(#wGrad)" dot={{ fill:T.purple,r:3,strokeWidth:0 }} activeDot={{ r:5 }} />
          </AreaChart>
        </ResponsiveContainer>
      </>
    ) : (
      <div style={{ textAlign:"center",padding:"24px",color:T.text3,fontSize:13 }}>Adicione ao menos 2 registros para ver o gráfico</div>
    )}

    {weightLog.slice(0,5).map((w,i)=>(
      <div key={w.id} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:i<Math.min(weightLog.length,5)-1?`1px solid ${T.border}`:"none" }}>
        <span style={{ fontSize:13,color:T.text2 }}>{w.date}</span>
        <div style={{ display:"flex",alignItems:"center",gap:8 }}>
          {i>0 && weightLog[i-1] && (
            <span style={{ fontSize:11,color:w.weight<weightLog[i-1].weight?T.green:T.red,fontWeight:700 }}>
              {w.weight<weightLog[i-1].weight?"↓":"↑"}{Math.abs(w.weight-weightLog[i-1].weight).toFixed(1)}kg
            </span>
          )}
          <span style={{ fontSize:14,fontWeight:800,color:T.text }}>{w.weight} kg</span>
        </div>
      </div>
    ))}
  </Card>

  {/* Achievements */}
  <SectionLabel>Conquistas</SectionLabel>
  <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,paddingBottom:12 }}>
    {achievements.map(a=>(
      <Card key={a.title} style={{ padding:"14px 14px",opacity:a.done?1:.45 }}>
        <div style={{ fontSize:28,marginBottom:6 }}>{a.icon}</div>
        <div style={{ fontSize:13,fontWeight:800,color:T.text }}>{a.title}</div>
        <div style={{ fontSize:11,color:T.text3,marginTop:3,lineHeight:1.4 }}>{a.desc}</div>
        {a.done && <div style={{ marginTop:6 }}><Tag color={T.green}>Conquistado ✓</Tag></div>}
      </Card>
    ))}
  </div>
</div>


);
}

/* ─────────────────────────────────────────────
PROFILE TAB
───────────────────────────────────────────── */
function ProfileTab({ profile, setProfile, goals, foods }) {
const [editing, setEditing]   = useState(false);
const [draft, setDraft]       = useState(profile);
const set = (k,v)=>setDraft(p=>({…p,[k]:v}));

const goalObj = GOALS_OPT.find(g=>g.id===profile.goal)||GOALS_OPT[0];
const actObj  = ACTIVITIES.find(a=>a.val===profile.activity)||ACTIVITIES[2];

return (
<div style={{ padding:“0 16px” }}>
{/* Header */}
<div style={{ paddingTop:52,paddingBottom:24,display:“flex”,gap:14,alignItems:“center” }}>
<Avatar name={profile.name} size={56} />
<div>
<div style={{ fontSize:22,fontWeight:900,color:T.text }}>{profile.name}</div>
<div style={{ fontSize:13,color:T.text2,marginTop:2 }}>{goalObj.icon} {goalObj.label} · {profile.gender===“M”?“Masculino”:“Feminino”}</div>
</div>
<button className=“btn-press” onClick={()=>{ setDraft(profile); setEditing(true); }} style={{ marginLeft:“auto”,padding:“8px 16px”,borderRadius:T.rSm,background:T.blue+“12”,color:T.blue,fontWeight:700,fontSize:13,border:“none” }}>Editar</button>
</div>

```
  {/* Calculated goals */}
  <SectionLabel>Suas metas calculadas</SectionLabel>
  <Card style={{ padding:0,overflow:"hidden",marginBottom:14 }}>
    {[
      {label:"TDEE (manutenção)",value:${goals?.tdee} kcal/dia,icon:"⚡",color:T.blue},
      {label:Meta (${profile.goal==="cutting"?"déficit -20%":profile.goal==="bulking"?"superávit +10%":"manutenção"}),value:${goals?.calories} kcal/dia,icon:"🎯",color:T.green},
      {label:"Proteína",value:${goals?.protein}g/dia,icon:"💪",color:T.green},
      {label:"Carboidratos",value:${goals?.carbs}g/dia,icon:"🌾",color:T.orange},
      {label:"Gorduras",value:${goals?.fat}g/dia,icon:"🥑",color:T.purple},
      {label:"Água",value:${goals?.water}ml/dia,icon:"💧",color:T.teal},
    ].map(({label,value,icon,color},i,arr)=>(
      <div key={label} style={{ display:"flex",alignItems:"center",gap:12,padding:"14px 16px",borderBottom:i<arr.length-1?1px solid ${T.border}:"none" }}>
        <div style={{ width:36,height:36,borderRadius:10,background:color+"14",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0 }}>{icon}</div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:13,color:T.text2 }}>{label}</div>
        </div>
        <div style={{ fontSize:14,fontWeight:800,color }}>{value}</div>
      </div>
    ))}
  </Card>

  {/* Personal stats */}
  <SectionLabel>Dados pessoais</SectionLabel>
  <Card style={{ padding:0,overflow:"hidden",marginBottom:14 }}>
    {[
      {label:"Peso",value:profile.weight+"kg"},
      {label:"Altura",value:profile.height+"cm"},
      {label:"Idade",value:profile.age+" anos"},
      {label:"Nível de atividade",value:actObj.label},
      {label:"Objetivo",value:goalObj.label},
    ].map(({label,value},i,arr)=>(
      <div key={label} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 16px",borderBottom:i<arr.length-1?1px solid ${T.border}:"none" }}>
        <span style={{ fontSize:14,color:T.text2 }}>{label}</span>
        <span style={{ fontSize:14,fontWeight:700,color:T.text }}>{value}</span>
      </div>
    ))}
  </Card>

  {/* How it works */}
  <SectionLabel>Como funciona o cutting</SectionLabel>
  <Card style={{ padding:16,marginBottom:14 }}>
    {[
      ["📉","Déficit de 20% abaixo do TDEE para perda de gordura segura"],
      ["🥩","Alta proteína (2,4g/kg) para preservar 100% da massa magra"],
      ["💪","Treino de força sinaliza ao corpo para manter músculo"],
      ["📆","Déficit de ~3.500kcal/semana = ~500g de gordura perdida"],
    ].map(([icon,text],i)=>(
      <div key={i} style={{ display:"flex",gap:12,padding:"9px 0",borderBottom:i<3?1px solid ${T.border}:"none",alignItems:"flex-start" }}>
        <span style={{ fontSize:18,flexShrink:0 }}>{icon}</span>
        <span style={{ fontSize:13,color:T.text2,lineHeight:1.55 }}>{text}</span>
      </div>
    ))}
  </Card>

  <div style={{ paddingBottom:12,fontSize:12,color:T.text3,textAlign:"center",lineHeight:1.6 }}>
    NutriScan AI · Powered by Claude AI<br/>Sempre consulte um profissional de saúde
  </div>

  {/* Edit modal */}
  {editing && (
    <div className="fi" style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.4)",zIndex:9999,display:"flex",alignItems:"flex-end",justifyContent:"center" }} onClick={()=>setEditing(false)}>
      <div className="si" onClick={e=>e.stopPropagation()} style={{ background:T.surface,borderRadius:"24px 24px 0 0",padding:"24px 20px 36px",width:"100%",maxWidth:430,maxHeight:"85vh",overflowY:"auto" }}>
        <div style={{ width:36,height:4,borderRadius:99,background:T.border,margin:"0 auto 20px" }} />
        <div style={{ fontSize:18,fontWeight:900,color:T.text,marginBottom:20 }}>Editar perfil</div>

        {[{k:"name",l:"Nome",t:"text"},{k:"weight",l:"Peso (kg)",t:"number"},{k:"height",l:"Altura (cm)",t:"number"},{k:"age",l:"Idade",t:"number"}].map(({k,l,t})=>(
          <div key={k} style={{ marginBottom:14 }}>
            <div style={{ fontSize:12,color:T.text3,fontWeight:700,marginBottom:6 }}>{l}</div>
            <input type={t} value={draft[k]} onChange={e=>set(k,t==="number"?+e.target.value:e.target.value)}
              style={{ width:"100%",background:T.bg,border:1.5px solid ${T.border},borderRadius:T.rSm,padding:"12px 14px",color:T.text,fontSize:15,fontWeight:600,boxSizing:"border-box" }} />
          </div>
        ))}

        <div style={{ marginBottom:14 }}>
          <div style={{ fontSize:12,color:T.text3,fontWeight:700,marginBottom:8 }}>Gênero</div>
          <div style={{ display:"flex",gap:10 }}>
            {["M","F"].map(g=>(
              <button key={g} className="btn-press" onClick={()=>set("gender",g)} style={{ flex:1,padding:12,borderRadius:T.rSm,border:2px solid ${draft.gender===g?T.blue:T.border},background:draft.gender===g?T.blue+"10":T.bg,color:draft.gender===g?T.blue:T.text2,fontWeight:700,fontSize:14,transition:"all .2s" }}>
                {g==="M"?"👨 Masc.":"👩 Fem."}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom:14 }}>
          <div style={{ fontSize:12,color:T.text3,fontWeight:700,marginBottom:8 }}>Objetivo</div>
          {GOALS_OPT.map(g=>(
            <button key={g.id} className="btn-press" onClick={()=>set("goal",g.id)} style={{ width:"100%",display:"flex",alignItems:"center",gap:12,padding:"12px 14px",borderRadius:T.rSm,border:2px solid ${draft.goal===g.id?T.blue:T.border},background:draft.goal===g.id?T.blue+"10":T.bg,marginBottom:8,textAlign:"left",transition:"all .2s" }}>
              <span style={{ fontSize:20 }}>{g.icon}</span>
              <div>
                <div style={{ fontSize:13,fontWeight:700,color:draft.goal===g.id?T.blue:T.text }}>{g.label}</div>
                <div style={{ fontSize:11,color:T.text3 }}>{g.desc}</div>
              </div>
              {draft.goal===g.id&&<span style={{ marginLeft:"auto",color:T.blue,fontSize:16 }}>✓</span>}
            </button>
          ))}
        </div>

        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:12,color:T.text3,fontWeight:700,marginBottom:8 }}>Nível de atividade</div>
          {ACTIVITIES.map(a=>(
            <button key={a.val} className="btn-press" onClick={()=>set("activity",a.val)} style={{ width:"100%",display:"flex",alignItems:"center",gap:12,padding:"11px 14px",borderRadius:T.rSm,border:2px solid ${draft.activity===a.val?T.blue:T.border},background:draft.activity===a.val?T.blue+"10":T.bg,marginBottom:8,textAlign:"left",transition:"all .2s" }}>
              <div style={{ width:8,height:8,borderRadius:"50%",background:draft.activity===a.val?T.blue:T.border,flexShrink:0 }} />
              <div>
                <div style={{ fontSize:13,fontWeight:700,color:draft.activity===a.val?T.blue:T.text }}>{a.label}</div>
                <div style={{ fontSize:11,color:T.text3 }

