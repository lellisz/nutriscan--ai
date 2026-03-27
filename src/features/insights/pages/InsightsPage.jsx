import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../auth/hooks/useAuth";
import * as db from "../../../lib/db";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

function StatCard({ value, label }) {
  return (
    <div className="ns-card" style={{ padding: 16, textAlign: "center" }}>
      <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.5, color: "var(--ns-text-primary)" }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: "var(--ns-text-muted)", fontWeight: 500, marginTop: 2 }}>
        {label}
      </div>
    </div>
  );
}

const WORKOUT_TYPES = [
  { value: "musculacao", label: "Musculação", abbr: "MUS" },
  { value: "cardio",     label: "Cardio",     abbr: "CAR" },
  { value: "hiit",       label: "HIIT",       abbr: "HIT" },
  { value: "funcional",  label: "Funcional",  abbr: "FUN" },
  { value: "esporte",    label: "Esporte",    abbr: "ESP" },
  { value: "outro",      label: "Outro",      abbr: "OUT" },
];

const INTENSITY_OPTIONS = [
  { value: "leve", label: "Leve" },
  { value: "moderado", label: "Moderado" },
  { value: "intenso", label: "Intenso" },
];

export default function InsightsPage() {
  const { user } = useAuth();
  const [goals, setGoals] = useState(null);
  const [profile, setProfile] = useState(null);
  const [scans, setScans] = useState([]);
  const [weightLogs, setWeightLogs] = useState([]);
  const [workoutLogs, setWorkoutLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("visao");

  // Weight form
  const [weightInput, setWeightInput] = useState("");
  const [weightNote, setWeightNote] = useState("");
  const [savingWeight, setSavingWeight] = useState(false);

  // Workout form
  const [showWorkoutForm, setShowWorkoutForm] = useState(false);
  const [workoutType, setWorkoutType] = useState("musculacao");
  const [workoutDuration, setWorkoutDuration] = useState("");
  const [workoutCalories, setWorkoutCalories] = useState("");
  const [workoutIntensity, setWorkoutIntensity] = useState("moderado");
  const [workoutNote, setWorkoutNote] = useState("");
  const [savingWorkout, setSavingWorkout] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [confirmDeleteWorkoutId, setConfirmDeleteWorkoutId] = useState(null);
  const [period, setPeriod] = useState("hoje");

  useEffect(() => {
    if (user?.id) loadProgressData();
  }, [user?.id]);

  async function loadProgressData() {
    if (!user?.id) return;
    try {
      const [goalsData, profileData, scansData, weightData, workoutData] = await Promise.all([
        db.getDailyGoals(user.id),
        db.getProfile(user.id),
        db.listScanHistory(user.id, 100),
        db.listWeightLogs(user.id, 90),
        db.listWorkoutLogs(user.id, 50),
      ]);
      setGoals(goalsData);
      setProfile(profileData);
      setScans(scansData || []);
      setWeightLogs(weightData || []);
      setWorkoutLogs(workoutData || []);
    } catch (err) {
      console.error("Erro ao carregar progresso:", err);
      setErrorMsg("Erro ao carregar dados. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  // ========== Visao geral data ==========
  const today = new Date().toLocaleDateString("pt-BR");
  const todayScans = scans.filter(s => new Date(s.scanned_at).toLocaleDateString("pt-BR") === today);
  const totalCalToday = todayScans.reduce((sum, s) => sum + (s.calories || 0), 0);
  const deficit = Math.max((goals?.calories || 0) - totalCalToday, 0);

  const todayWorkouts = workoutLogs.filter(w => w.logged_at === new Date().toISOString().split("T")[0]);
  const totalBurned = todayWorkouts.reduce((sum, w) => sum + (w.calories_burned || 0), 0);

  const weightChange = useMemo(() => {
    if (weightLogs.length < 2) return null;
    const sorted = [...weightLogs].sort((a, b) => a.logged_at.localeCompare(b.logged_at));
    const first = sorted[0].weight;
    const last = sorted[sorted.length - 1].weight;
    return (last - first).toFixed(1);
  }, [weightLogs]);

  const chartData = useMemo(() => {
    const dayLabels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString("pt-BR");
      const dayScans = scans.filter(s => new Date(s.scanned_at).toLocaleDateString("pt-BR") === dateStr);
      const dayCal = dayScans.reduce((sum, s) => sum + (s.calories || 0), 0);
      result.push({ name: dayLabels[d.getDay()], calorias: dayCal });
    }
    return result;
  }, [scans]);

  // ========== Weight chart data ==========
  const weightChartData = useMemo(() => {
    if (!weightLogs.length) return [];
    const sorted = [...weightLogs]
      .sort((a, b) => a.logged_at.localeCompare(b.logged_at))
      .slice(-30);
    return sorted.map(w => ({
      name: new Date(w.logged_at + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      peso: Number(w.weight),
    }));
  }, [weightLogs]);

  // ========== Workout weekly data ==========
  const workoutWeekData = useMemo(() => {
    const dayLabels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const dayWorkouts = workoutLogs.filter(w => w.logged_at === dateStr);
      const dayMin = dayWorkouts.reduce((sum, w) => sum + (w.duration_min || 0), 0);
      result.push({ name: dayLabels[d.getDay()], minutos: dayMin });
    }
    return result;
  }, [workoutLogs]);

  const weekTotalMin = workoutWeekData.reduce((sum, d) => sum + d.minutos, 0);
  const weekTotalWorkouts = useMemo(() => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekStr = weekAgo.toISOString().split("T")[0];
    return workoutLogs.filter(w => w.logged_at >= weekStr).length;
  }, [workoutLogs]);

  // ========== Handlers ==========

  async function handleSaveWeight(e) {
    e.preventDefault();
    const w = parseFloat(weightInput);
    if (!w || w < 20 || w > 400) return;
    setSavingWeight(true);
    setErrorMsg(null);
    try {
      const saved = await db.saveWeightLog(user.id, { weight: w, note: weightNote || null });
      setWeightLogs(prev => {
        const filtered = prev.filter(l => l.logged_at !== saved.logged_at);
        return [saved, ...filtered];
      });
      setWeightInput("");
      setWeightNote("");
    } catch (err) {
      console.error("Erro ao salvar peso:", err);
      setErrorMsg("Erro ao salvar peso. Tente novamente.");
    } finally {
      setSavingWeight(false);
    }
  }

  async function handleSaveWorkout(e) {
    e.preventDefault();
    const dur = parseInt(workoutDuration);
    if (!dur || dur < 1) return;
    setSavingWorkout(true);
    setErrorMsg(null);
    try {
      const saved = await db.saveWorkoutLog(user.id, {
        workoutType,
        durationMin: dur,
        caloriesBurned: workoutCalories ? parseInt(workoutCalories) : null,
        intensity: workoutIntensity,
        note: workoutNote || null,
      });
      setWorkoutLogs(prev => [saved, ...prev]);
      setShowWorkoutForm(false);
      setWorkoutDuration("");
      setWorkoutCalories("");
      setWorkoutNote("");
    } catch (err) {
      console.error("Erro ao salvar treino:", err);
      setErrorMsg("Erro ao salvar treino. Tente novamente.");
    } finally {
      setSavingWorkout(false);
    }
  }

  async function handleDeleteWorkout(id) {
    if (confirmDeleteWorkoutId !== id) {
      setConfirmDeleteWorkoutId(id);
      return;
    }
    setConfirmDeleteWorkoutId(null);
    setErrorMsg(null);
    try {
      await db.deleteWorkoutLog(id);
      setWorkoutLogs(prev => prev.filter(w => w.id !== id));
    } catch (err) {
      console.error("Erro ao deletar treino:", err);
      setErrorMsg("Erro ao remover treino. Tente novamente.");
    }
  }

  const tabs = [
    { id: "visao", label: "Visão geral" },
    { id: "peso", label: "Peso" },
    { id: "treino", label: "Treino" },
  ];

  const PERIOD_OPTIONS = [
    { id: "hoje",   label: "Hoje"   },
    { id: "7dias",  label: "7 dias" },
    { id: "30dias", label: "30 dias" },
  ];

  // Resumo rápido de acordo com o período selecionado
  const periodSummary = (() => {
    if (period === "hoje") {
      return totalCalToday > 0
        ? `${totalCalToday.toLocaleString("pt-BR")} kcal consumidas hoje`
        : "Nenhum registro hoje";
    }
    if (period === "7dias") {
      const weekScans = scans.filter(s => {
        const d = new Date(s.scanned_at);
        const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 7);
        return d >= cutoff;
      });
      const total = weekScans.reduce((sum, s) => sum + (s.calories || 0), 0);
      return `${total.toLocaleString("pt-BR")} kcal nos ultimos 7 dias`;
    }
    const monthScans = scans.filter(s => {
      const d = new Date(s.scanned_at);
      const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 30);
      return d >= cutoff;
    });
    const total = monthScans.reduce((sum, s) => sum + (s.calories || 0), 0);
    return `${total.toLocaleString("pt-BR")} kcal nos ultimos 30 dias`;
  })();

  const insightsHeader = (isLoading) => (
    <header style={{ padding: '20px 20px 16px', background: 'var(--ns-bg-primary)' }} className="animate-fade-up">
      <h1 style={{
        fontSize: 28, fontWeight: 700,
        color: 'var(--ns-text-primary)',
        letterSpacing: '-0.03em',
        margin: 0, lineHeight: 1.1,
      }}>
        Progresso
      </h1>
      <p style={{
        fontSize: 14, color: 'var(--ns-text-muted)',
        margin: '6px 0 12px', lineHeight: 1.4,
      }}>
        {isLoading ? 'Carregando dados...' : periodSummary}
      </p>

      {/* Seletor de periodo */}
      <div style={{ display: 'flex', gap: 6 }}>
        {PERIOD_OPTIONS.map(({ id, label }) => {
          const active = period === id;
          return (
            <button
              key={id}
              onClick={() => setPeriod(id)}
              style={{
                padding: '6px 14px',
                borderRadius: 100,
                fontSize: 13, fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.18s cubic-bezier(0.4,0,0.2,1)',
                WebkitTapHighlightColor: 'transparent',
                border: active ? 'none' : '0.5px solid var(--ns-border)',
                background: active ? 'var(--ns-accent)' : 'var(--ns-bg-card)',
                color: active ? '#FFFFFF' : 'var(--ns-text-muted)',
                boxShadow: active ? '0 2px 8px rgba(45,143,94,0.25)' : 'none',
              }}
            >
              {label}
            </button>
          );
        })}
      </div>
    </header>
  );

  if (loading) {
    return (
      <div className="ns-aurora-bg" style={{ background: 'transparent', minHeight: '100dvh', paddingBottom: 100 }}>
        {insightsHeader(true)}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '40vh' }}>
          <div className="ns-spinner ns-spinner-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="ns-aurora-bg" style={{ background: 'transparent', minHeight: '100dvh', paddingBottom: 100 }}>

      {insightsHeader(false)}

      <div style={{ padding: '0 20px' }}>

      {/* Error banner */}
      {errorMsg && (
        <div style={{
          background: "var(--ns-danger-bg)", border: "0.5px solid rgba(196,57,28,0.2)",
          borderRadius: 12, padding: "10px 14px", marginBottom: 12,
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <span style={{ fontSize: 13, color: "var(--ns-danger)" }}>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} style={{ background: "none", border: "none", fontSize: 16, color: "var(--ns-danger)", cursor: "pointer", padding: 4 }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M1 1l10 10M11 1L1 11" stroke="var(--ns-danger)" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      )}

      {/* Tab bar */}
      <div className="animate-fade-up stagger-1" style={{
        display: "flex", gap: 0, marginBottom: 24,
        background: "var(--ns-bg-elevated)", borderRadius: 100,
        padding: 4,
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1, padding: "10px 0",
              borderRadius: 100,
              fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer",
              background: activeTab === tab.id ? "var(--ns-bg-card)" : "transparent",
              color: activeTab === tab.id ? "var(--ns-text-primary)" : "var(--ns-text-muted)",
              boxShadow: activeTab === tab.id ? "var(--ns-shadow-sm)" : "none",
              transition: "all 0.2s ease",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ========== Visao geral tab ========== */}
      {activeTab === "visao" && (
        <>
          <div className="animate-fade-up stagger-2" style={{
            display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20,
          }}>
            <StatCard value={todayScans.length} label="Registros hoje" />
            <StatCard
              value={weightChange !== null ? `${weightChange > 0 ? "+" : ""}${weightChange} kg` : "--"}
              label="Variação de peso"
            />
            <StatCard value={`${deficit} kcal`} label="Deficit hoje" />
            <StatCard value={`${totalBurned} kcal`} label="Queimado hoje" />
          </div>

          <div className="ns-card animate-fade-up stagger-3" style={{ padding: 20 }}>
            <p className="ns-label">CALORIAS — 7 DIAS</p>
            <div style={{ width: "100%", height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--ns-text-muted)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--ns-text-muted)" }} axisLine={false} tickLine={false} width={40} />
                  <Tooltip
                    contentStyle={{ background: "var(--ns-bg-card)", border: "0.5px solid var(--ns-border)", borderRadius: 8, fontSize: 12 }}
                    formatter={(value) => [`${value} kcal`, "Calorias"]}
                  />
                  <Line type="monotone" dataKey="calorias" stroke="var(--ns-accent)" strokeWidth={2} dot={{ r: 4, fill: "var(--ns-accent)" }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {/* ========== Peso tab ========== */}
      {activeTab === "peso" && (
        <>
          {/* Weight input form */}
          <form onSubmit={handleSaveWeight} className="ns-card animate-fade-up stagger-2" style={{ padding: 20, marginBottom: 16 }}>
            <p className="ns-label" style={{ marginBottom: 12 }}>REGISTRAR PESO</p>
            <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
              <div style={{ flex: 1 }}>
                <input
                  type="number"
                  step="0.1"
                  min="20"
                  max="400"
                  placeholder="Ex: 75.5"
                  value={weightInput}
                  onChange={e => setWeightInput(e.target.value)}
                  className="ns-input"
                  style={{ width: "100%", fontSize: 18, fontWeight: 700, textAlign: "center" }}
                />
                <div style={{ fontSize: 11, color: "var(--ns-text-muted)", textAlign: "center", marginTop: 4 }}>kg</div>
              </div>
              <div style={{ flex: 1 }}>
                <input
                  type="text"
                  placeholder="Nota (opcional)"
                  value={weightNote}
                  onChange={e => setWeightNote(e.target.value)}
                  className="ns-input"
                  style={{ width: "100%" }}
                  maxLength={100}
                />
              </div>
            </div>
            <button
              type="submit"
              className="ns-btn ns-btn-primary"
              style={{ width: "100%" }}
              disabled={savingWeight || !weightInput}
            >
              {savingWeight ? "Salvando..." : "Registrar peso"}
            </button>
          </form>

          {/* Weight stats */}
          {weightLogs.length > 0 && (
            <div className="animate-fade-up stagger-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
              <div className="ns-card" style={{ padding: 12, textAlign: "center" }}>
                <div style={{ fontSize: 11, color: "var(--ns-text-muted)", fontWeight: 600, marginBottom: 4 }}>ATUAL</div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{Number(weightLogs[0]?.weight).toFixed(1)}</div>
                <div style={{ fontSize: 11, color: "var(--ns-text-muted)" }}>kg</div>
              </div>
              <div className="ns-card" style={{ padding: 12, textAlign: "center" }}>
                <div style={{ fontSize: 11, color: "var(--ns-text-muted)", fontWeight: 600, marginBottom: 4 }}>INICIAL</div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>
                  {Number([...weightLogs].sort((a, b) => a.logged_at.localeCompare(b.logged_at))[0]?.weight).toFixed(1)}
                </div>
                <div style={{ fontSize: 11, color: "var(--ns-text-muted)" }}>kg</div>
              </div>
              <div className="ns-card" style={{ padding: 12, textAlign: "center" }}>
                <div style={{ fontSize: 11, color: "var(--ns-text-muted)", fontWeight: 600, marginBottom: 4 }}>VARIAÇÃO</div>
                <div style={{
                  fontSize: 18, fontWeight: 700,
                  color: weightChange && parseFloat(weightChange) < 0 ? "var(--ns-success)" : weightChange && parseFloat(weightChange) > 0 ? "var(--ns-warning)" : "var(--ns-text-primary)",
                }}>
                  {weightChange !== null ? `${weightChange > 0 ? "+" : ""}${weightChange}` : "--"}
                </div>
                <div style={{ fontSize: 11, color: "var(--ns-text-muted)" }}>kg</div>
              </div>
            </div>
          )}

          {/* Weight chart */}
          {weightChartData.length >= 2 ? (
            <div className="ns-card animate-fade-up stagger-3" style={{ padding: 20, marginBottom: 16 }}>
              <p className="ns-label">EVOLUÇÃO DE PESO</p>
              <div style={{ width: "100%", height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weightChartData}>
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--ns-text-muted)" }} axisLine={false} tickLine={false} />
                    <YAxis
                      tick={{ fontSize: 11, fill: "var(--ns-text-muted)" }}
                      axisLine={false} tickLine={false} width={40}
                      domain={["dataMin - 1", "dataMax + 1"]}
                    />
                    <Tooltip
                      contentStyle={{ background: "var(--ns-bg-card)", border: "0.5px solid var(--ns-border)", borderRadius: 8, fontSize: 12 }}
                      formatter={(value) => [`${value} kg`, "Peso"]}
                    />
                    <Line type="monotone" dataKey="peso" stroke="var(--ns-accent)" strokeWidth={2} dot={{ r: 4, fill: "var(--ns-accent)" }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : weightLogs.length > 0 ? (
            <div className="ns-card animate-fade-up stagger-3" style={{ padding: 20, textAlign: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 14, color: "var(--ns-text-muted)" }}>
                Registre mais um peso para ver o gráfico de evolução.
              </div>
            </div>
          ) : null}

          {/* Recent weight entries */}
          {weightLogs.length > 0 && (
            <div className="ns-card animate-fade-up stagger-4" style={{ padding: 20 }}>
              <p className="ns-label">HISTÓRICO RECENTE</p>
              {weightLogs.slice(0, 10).map(w => (
                <div key={w.id} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "10px 0", borderBottom: "0.5px solid var(--ns-border)",
                }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>
                      {new Date(w.logged_at + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                    </div>
                    {w.note && <div style={{ fontSize: 12, color: "var(--ns-text-muted)" }}>{w.note}</div>}
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{Number(w.weight).toFixed(1)} kg</div>
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {weightLogs.length === 0 && (
            <div className="ns-card animate-fade-up stagger-3 ns-empty">
              <div style={{
                width: 48, height: 48, borderRadius: 14, background: 'var(--ns-bg-elevated)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8,
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M12 3a9 9 0 100 18A9 9 0 0012 3z" stroke="var(--ns-text-muted)" strokeWidth="1.6" />
                  <path d="M8 12h4l2 2" stroke="var(--ns-text-muted)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Nenhum registro de peso</div>
              <p className="ns-empty-sub">Registre seu peso acima para acompanhar sua evolução.</p>
            </div>
          )}
        </>
      )}

      {/* ========== Treino tab ========== */}
      {activeTab === "treino" && (
        <>
          {/* Week summary */}
          <div className="animate-fade-up stagger-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            <StatCard value={weekTotalWorkouts} label="Treinos (7 dias)" />
            <StatCard value={`${weekTotalMin} min`} label="Tempo total" />
          </div>

          {/* Week chart */}
          <div className="ns-card animate-fade-up stagger-2" style={{ padding: 20, marginBottom: 16 }}>
            <p className="ns-label">MINUTOS — 7 DIAS</p>
            <div style={{ width: "100%", height: 160 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={workoutWeekData}>
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--ns-text-muted)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--ns-text-muted)" }} axisLine={false} tickLine={false} width={32} />
                  <Tooltip
                    contentStyle={{ background: "var(--ns-bg-card)", border: "0.5px solid var(--ns-border)", borderRadius: 8, fontSize: 12 }}
                    formatter={(value) => [`${value} min`, "Treino"]}
                  />
                  <Line type="monotone" dataKey="minutos" stroke="var(--ns-accent)" strokeWidth={2} dot={{ r: 4, fill: "var(--ns-accent)" }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Add workout button / form */}
          {!showWorkoutForm ? (
            <button
              onClick={() => setShowWorkoutForm(true)}
              className="ns-btn ns-btn-primary animate-fade-up stagger-3"
              style={{ width: "100%", marginBottom: 16 }}
            >
              + Registrar treino
            </button>
          ) : (
            <form onSubmit={handleSaveWorkout} className="ns-card animate-scale-in" style={{ padding: 20, marginBottom: 16 }}>
              <p className="ns-label" style={{ marginBottom: 12 }}>NOVO TREINO</p>

              {/* Workout type selector */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 14 }}>
                {WORKOUT_TYPES.map(wt => (
                  <button
                    key={wt.value}
                    type="button"
                    onClick={() => setWorkoutType(wt.value)}
                    className="ns-card-sm"
                    style={{
                      padding: "10px 6px", textAlign: "center", border: "none", cursor: "pointer",
                      background: workoutType === wt.value ? "var(--ns-accent-bg)" : "var(--ns-bg-elevated)",
                      outline: workoutType === wt.value ? "2px solid var(--ns-accent)" : "none",
                      borderRadius: "var(--ns-radius-sm)",
                    }}
                  >
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.03em', color: workoutType === wt.value ? "var(--ns-accent)" : "var(--ns-text-muted)" }}>
                      {wt.abbr}
                    </div>
                    <div style={{ fontSize: 10, fontWeight: 600, marginTop: 4, color: workoutType === wt.value ? "var(--ns-accent)" : "var(--ns-text-muted)" }}>
                      {wt.label}
                    </div>
                  </button>
                ))}
              </div>

              {/* Duration + Calories */}
              <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, color: "var(--ns-text-muted)", fontWeight: 600, marginBottom: 4, display: "block" }}>DURAÇÃO (min) *</label>
                  <input
                    type="number" min="1" max="600"
                    placeholder="Ex: 45"
                    value={workoutDuration}
                    onChange={e => setWorkoutDuration(e.target.value)}
                    className="ns-input"
                    style={{ width: "100%" }}
                    required
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, color: "var(--ns-text-muted)", fontWeight: 600, marginBottom: 4, display: "block" }}>CALORIAS</label>
                  <input
                    type="number" min="0" max="5000"
                    placeholder="Ex: 300"
                    value={workoutCalories}
                    onChange={e => setWorkoutCalories(e.target.value)}
                    className="ns-input"
                    style={{ width: "100%" }}
                  />
                </div>
              </div>

              {/* Intensity */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 11, color: "var(--ns-text-muted)", fontWeight: 600, marginBottom: 6, display: "block" }}>INTENSIDADE</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {INTENSITY_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setWorkoutIntensity(opt.value)}
                      style={{
                        flex: 1, padding: "8px 0", borderRadius: 100, fontSize: 12, fontWeight: 600,
                        border: "none", cursor: "pointer",
                        background: workoutIntensity === opt.value ? "var(--ns-accent-bg)" : "var(--ns-bg-elevated)",
                        color: workoutIntensity === opt.value ? "var(--ns-accent)" : "var(--ns-text-muted)",
                        outline: workoutIntensity === opt.value ? "2px solid var(--ns-accent)" : "none",
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Note */}
              <input
                type="text"
                placeholder="Nota (opcional)"
                value={workoutNote}
                onChange={e => setWorkoutNote(e.target.value)}
                className="ns-input"
                style={{ width: "100%", marginBottom: 14 }}
                maxLength={200}
              />

              {/* Actions */}
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowWorkoutForm(false)}
                  className="ns-btn ns-btn-secondary"
                  style={{ flex: 1 }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="ns-btn ns-btn-primary"
                  style={{ flex: 1 }}
                  disabled={savingWorkout || !workoutDuration}
                >
                  {savingWorkout ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          )}

          {/* Recent workouts */}
          {workoutLogs.length > 0 ? (
            <div className="ns-card animate-fade-up stagger-4" style={{ padding: 20 }}>
              <p className="ns-label">HISTÓRICO DE TREINOS</p>
              {workoutLogs.slice(0, 15).map(w => {
                const typeInfo = WORKOUT_TYPES.find(t => t.value === w.workout_type) || WORKOUT_TYPES[5];
                return (
                  <div key={w.id} style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "12px 0", borderBottom: "0.5px solid var(--ns-border)",
                  }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 12,
                      background: "var(--ns-bg-elevated)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0,
                    }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ns-text-muted)', letterSpacing: '0.02em' }}>
                        {typeInfo.abbr}
                      </span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{typeInfo.label}</div>
                      <div style={{ fontSize: 12, color: "var(--ns-text-muted)" }}>
                        {new Date(w.logged_at + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                        {w.intensity && ` · ${w.intensity}`}
                        {w.note && ` · ${w.note}`}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 700 }}>{w.duration_min} min</div>
                      {w.calories_burned && (
                        <div style={{ fontSize: 12, color: "var(--ns-text-muted)" }}>{w.calories_burned} kcal</div>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteWorkout(w.id)}
                      onBlur={() => setConfirmDeleteWorkoutId(null)}
                      aria-label={confirmDeleteWorkoutId === w.id ? "Confirmar remoção" : "Remover treino"}
                      style={{
                        background: confirmDeleteWorkoutId === w.id ? "var(--ns-danger-bg)" : "none",
                        border: "none", cursor: "pointer",
                        padding: "4px 8px",
                        borderRadius: 6,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: confirmDeleteWorkoutId === w.id ? 10 : 18,
                        fontWeight: 600,
                        color: confirmDeleteWorkoutId === w.id ? "var(--ns-danger)" : "var(--ns-text-muted)",
                        fontFamily: "inherit",
                        flexShrink: 0,
                      }}
                    >
                      {confirmDeleteWorkoutId === w.id ? "Confirmar" : "×"}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : !showWorkoutForm && (
            <div className="ns-card animate-fade-up stagger-4 ns-empty">
              <div style={{
                width: 48, height: 48, borderRadius: 14, background: 'var(--ns-bg-elevated)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8,
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" stroke="var(--ns-text-muted)" strokeWidth="2" strokeLinecap="round" />
                  <circle cx="3" cy="9" r="2" stroke="var(--ns-text-muted)" strokeWidth="1.6" />
                  <circle cx="21" cy="9" r="2" stroke="var(--ns-text-muted)" strokeWidth="1.6" />
                  <circle cx="3" cy="15" r="2" stroke="var(--ns-text-muted)" strokeWidth="1.6" />
                  <circle cx="21" cy="15" r="2" stroke="var(--ns-text-muted)" strokeWidth="1.6" />
                  <path d="M5 9h14M5 15h14" stroke="var(--ns-text-muted)" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Nenhum treino registrado</div>
              <p className="ns-empty-sub">Registre seus treinos para acompanhar sua evolução.</p>
            </div>
          )}
        </>
      )}

      </div>
    </div>
  );
}
