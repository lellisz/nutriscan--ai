import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { StatusBar } from '../../../app/AppShell';
import { useAuth } from '../../auth/hooks/useAuth';
import {
  listScanHistory,
  getDailyGoals,
  getHydrationToday,
  saveHydration,
} from '../../../lib/db';

// ── Helpers ────────────────────────────────────────────────

function calcBMI(weight, height) {
  if (!weight || !height) return null;
  const h = height / 100;
  return (weight / (h * h)).toFixed(1);
}

function bmiLabel(bmi) {
  if (!bmi) return null;
  const v = parseFloat(bmi);
  if (v < 18.5) return 'Abaixo do peso';
  if (v < 25)   return 'Peso normal';
  if (v < 30)   return 'Sobrepeso';
  return 'Obesidade';
}

function calcStreak(scans) {
  if (!scans || scans.length === 0) return 0;
  const days = new Set(scans.map(s => s.scanned_at?.split('T')[0]).filter(Boolean));
  const today = new Date();
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().split('T')[0];
    if (days.has(key)) streak++;
    else if (i > 0) break;
  }
  return streak;
}

// ── SVG Icons ──────────────────────────────────────────────

const IconPerson = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="var(--ns-text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="10" cy="6.5" r="3" />
    <path d="M3.5 17.5c0-3.3 2.9-6 6.5-6s6.5 2.7 6.5 6" />
  </svg>
);

const IconTarget = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="var(--ns-text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="10" cy="10" r="8" />
    <circle cx="10" cy="10" r="4.5" />
    <circle cx="10" cy="10" r="1.5" />
  </svg>
);

const IconInfo = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="var(--ns-text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="10" cy="10" r="8" />
    <path d="M10 9v5" />
    <circle cx="10" cy="6.5" r="0.5" fill="var(--ns-text-muted)" />
  </svg>
);

const IconLogout = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="var(--ns-danger)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 3h4v14h-4" />
    <path d="M8 13l4-3-4-3" />
    <path d="M3 10h9" />
  </svg>
);

const IconCake = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ns-text-tertiary)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-8a2 2 0 00-2-2H6a2 2 0 00-2 2v8" />
    <path d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2 1 2 1" />
    <path d="M2 21h20M7 8v2M12 8v2M17 8v2M7 4l1 4M12 4v4M17 4l-1 4" />
  </svg>
);

const IconRuler = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ns-text-tertiary)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.3 15.3a1 1 0 010 1.4l-2.6 2.6a1 1 0 01-1.4 0L2.7 4.7a1 1 0 010-1.4l2.6-2.6a1 1 0 011.4 0z" />
    <path d="M14 7l-3 3M10 11l-2 2M6 15l-2 2M18 3l-3 3" />
  </svg>
);

const IconScale = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ns-text-tertiary)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2" />
    <path d="M8 21h8M12 17v4M7 9l3 3 4-5" />
  </svg>
);

const IconChart = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ns-text-tertiary)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </svg>
);

const IconDrop = () => (
  <svg width="14" height="16" viewBox="0 0 10 13" fill="none">
    <path d="M5 1C5 1 1 6 1 9a4 4 0 008 0c0-3-4-8-4-8z"
      fill="rgba(37,99,235,0.12)"
      stroke="var(--ns-blue)" strokeWidth="1.4" />
  </svg>
);

const Chevron = ({ open = false }) => (
  <svg
    width="7" height="12" viewBox="0 0 7 12" fill="none"
    style={{ flexShrink: 0, transition: 'transform 0.2s ease', transform: open ? 'rotate(90deg)' : 'none' }}
  >
    <path d="M1 1l5 5-5 5" stroke="var(--ns-text-disabled)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ── Skeleton block ─────────────────────────────────────────

function SkeletonBlock({ width = '100%', height = 16, radius = 6, style = {} }) {
  return (
    <div style={{
      width, height, borderRadius: radius,
      background: 'var(--ns-ring-track)',
      animation: 'ns-pulse 1.4s ease infinite',
      ...style,
    }} />
  );
}

// ── Confirm Sign Out Modal ─────────────────────────────────

function SignOutModal({ onConfirm, onCancel, loading }) {
  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--ns-bg-card)',
          borderRadius: 'var(--ns-radius-lg)',
          padding: '28px 24px 24px',
          width: '100%',
          maxWidth: 340,
          boxShadow: 'var(--ns-shadow-lg)',
        }}
      >
        <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--ns-text-primary)', letterSpacing: '-0.02em', marginBottom: 8 }}>
          Sair da conta
        </div>
        <div style={{ fontSize: 14, color: 'var(--ns-text-muted)', lineHeight: 1.55, marginBottom: 24 }}>
          Tem certeza que deseja sair? Você precisará entrar novamente para acessar o Praxis Nutri.
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onCancel}
            disabled={loading}
            style={{
              flex: 1, height: 44, borderRadius: 12,
              background: 'var(--ns-bg-elevated)',
              border: '0.5px solid var(--ns-border)',
              color: 'var(--ns-text-primary)',
              fontSize: 15, fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
              letterSpacing: '-0.01em',
            }}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{
              flex: 1, height: 44, borderRadius: 12,
              background: 'var(--ns-danger)',
              border: 'none',
              color: '#FFFFFF',
              fontSize: 15, fontWeight: 600,
              cursor: loading ? 'default' : 'pointer',
              fontFamily: 'inherit',
              letterSpacing: '-0.01em',
              opacity: loading ? 0.7 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            {loading ? (
              <div style={{
                width: 16, height: 16,
                border: '2px solid rgba(255,255,255,0.4)',
                borderTopColor: '#FFF',
                borderRadius: '50%',
                animation: 'ns-spin 0.7s linear infinite',
              }} />
            ) : 'Sair'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────

export default function ProfilePage() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const name    = profile?.full_name ?? user?.email?.split('@')[0] ?? 'Usuário';
  const email   = user?.email ?? '';
  const initial = name.charAt(0).toUpperCase();

  // ── Data state ──
  const [loading, setLoading]         = useState(true);
  const [scansCount, setScansCount]   = useState(0);
  const [streakCount, setStreakCount] = useState(0);
  const [daysCount, setDaysCount]     = useState(0);
  const [goals, setGoals]             = useState(null);
  const [waterMl, setWaterMl]         = useState(0);
  const [savingWater, setSavingWater] = useState(false);

  // ── Panel state ──
  const [openPanel, setOpenPanel] = useState(null); // 'about'

  // ── Sign out modal ──
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [signingOut, setSigningOut]             = useState(false);

  // ── Biometrics ──
  const age    = profile?.age    ?? null;
  const height = profile?.height ?? null;
  const weight = profile?.weight ?? null;
  const bmi    = calcBMI(weight, height);

  const waterGoal = goals?.water ?? 2500;
  const waterPct  = Math.min(Math.round((waterMl / waterGoal) * 100), 100);

  // ── Load data ──
  const loadData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [scans, goalsData, hydration] = await Promise.all([
        listScanHistory(user.id, 500),
        getDailyGoals(user.id),
        getHydrationToday(user.id),
      ]);

      setScansCount(scans?.length ?? 0);
      setStreakCount(calcStreak(scans));

      const createdAt = user?.created_at || profile?.created_at;
      if (createdAt) {
        const diff = Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24));
        setDaysCount(diff + 1);
      }

      if (goalsData) {
        setGoals(goalsData);
      }

      if (hydration) {
        setWaterMl((hydration.glasses ?? 0) * 250);
      }
    } catch (err) {
      console.error('[Profile] Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.created_at, profile?.created_at]);

  useEffect(() => {
    loadData();
  }, [loadData]);


  // ── Handlers ──

  const togglePanel = (panel) => {
    setOpenPanel(prev => prev === panel ? null : panel);
  };

  const handleAddWater = async () => {
    if (savingWater || !user?.id) return;
    const currentGlasses = Math.round(waterMl / 250);
    const maxGlasses = Math.round(waterGoal / 250);
    if (currentGlasses >= maxGlasses) return;
    const newGlasses = currentGlasses + 1;
    setWaterMl(newGlasses * 250);
    setSavingWater(true);
    try {
      await saveHydration(user.id, newGlasses);
    } catch (err) {
      setWaterMl(currentGlasses * 250);
      console.error('[Profile] Erro ao salvar hidratação:', err);
    } finally {
      setSavingWater(false);
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
    } catch (err) {
      console.error('[Profile] Erro ao sair:', err);
      setSigningOut(false);
      setShowSignOutModal(false);
    }
  };

  // ── Style helpers ──

  const cardStyle = {
    background: 'var(--ns-bg-card)',
    border: '0.5px solid var(--ns-border)',
    borderRadius: 16,
    overflow: 'hidden',
    boxShadow: 'var(--ns-shadow-sm)',
  };

  const sectionTitle = {
    fontSize: 13, fontWeight: 600, color: 'var(--ns-text-muted)',
    letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 8,
  };

  const iconWrapStyle = {
    width: 36, height: 36, borderRadius: 10,
    background: 'var(--ns-bg-elevated)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  };

  // ── Expanded panel: Sobre o Praxis Nutri ──

  function AboutPanel() {
    const rows = [
      { l: 'Versão do app',    v: '1.0.0'           },
      { l: 'Tecnologia de IA', v: 'Anthropic Claude' },
      { l: 'Base nutricional', v: 'TACO + USDA'      },
      { l: 'Rótulo nutricional', v: 'Padrão ANVISA'  },
    ];
    return (
      <div style={{ padding: '0 16px 16px', borderTop: '0.5px solid var(--ns-sep)' }}>
        <div style={{ paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 0 }}>
          {rows.map((r, i) => (
            <div key={r.l}>
              {i > 0 && <div style={{ height: '0.5px', background: 'var(--ns-sep)' }} />}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0' }}>
                <span style={{ fontSize: 14, color: 'var(--ns-text-muted)', fontWeight: 500 }}>{r.l}</span>
                <span style={{ fontSize: 14, color: 'var(--ns-text-primary)', fontWeight: 600 }}>{r.v}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Goal label ──
  const goalLabel = profile?.goal === 'cutting'
    ? 'Perda de gordura'
    : profile?.goal === 'bulking'
    ? 'Ganho de massa'
    : profile?.goal === 'maintain'
    ? 'Manutenção do peso'
    : profile?.goal ?? 'Sem objetivo definido';

  // ── Render ─────────────────────────────────────────────────

  return (
    <div className="ns-aurora-bg" style={{ background: 'transparent', minHeight: '100dvh', paddingBottom: 100 }}>
      <StatusBar />

      {/* ── Topo: avatar + nome + stats ── */}
      <div style={{
        background: 'var(--ns-bg-card)',
        padding: '24px 20px 20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        borderBottom: '0.5px solid var(--ns-border)',
      }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'var(--ns-accent-bg)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 30, fontWeight: 700, color: 'var(--ns-accent)',
          border: '0.5px solid rgba(45,143,94,0.2)',
          boxShadow: 'var(--ns-shadow-md)',
        }}>
          {initial}
        </div>

        <div style={{
          fontSize: 20, fontWeight: 700, color: 'var(--ns-text-primary)',
          letterSpacing: '-0.02em', lineHeight: 1.2,
          marginTop: 12, textAlign: 'center',
        }}>
          {name}
        </div>
        <div style={{ fontSize: 13, color: 'var(--ns-text-muted)', marginTop: 4, textAlign: 'center' }}>
          {goalLabel}
        </div>
        <div style={{ fontSize: 12, color: 'var(--ns-text-disabled)', marginTop: 2, textAlign: 'center' }}>
          {email}
        </div>

        {/* Stats row */}
        <div style={{
          display: 'flex',
          background: 'var(--ns-bg-elevated)',
          borderRadius: 16,
          padding: '16px 0',
          marginTop: 20,
          width: '100%',
        }}>
          {loading ? (
            <div style={{ flex: 1, display: 'flex', gap: 10, padding: '0 16px' }}>
              <SkeletonBlock height={36} style={{ flex: 1, borderRadius: 8 }} />
              <SkeletonBlock height={36} style={{ flex: 1, borderRadius: 8 }} />
              <SkeletonBlock height={36} style={{ flex: 1, borderRadius: 8 }} />
            </div>
          ) : (
            [
              { v: scansCount,  l: 'Scans'  },
              { v: streakCount, l: 'Streak' },
              { v: daysCount,   l: 'Dias'   },
            ].map(({ v, l }, i) => (
              <div key={l} style={{
                flex: 1, textAlign: 'center',
                borderRight: i < 2 ? '0.5px solid var(--ns-sep)' : 'none',
              }}>
                <div style={{
                  fontSize: 20, fontWeight: 700, color: 'var(--ns-text-primary)',
                  letterSpacing: '-0.03em', lineHeight: 1,
                }}>
                  {v}
                </div>
                <div style={{
                  fontSize: 10, color: 'var(--ns-text-muted)', marginTop: 3,
                  fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em',
                }}>
                  {l}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Biometrics ── */}
      <div style={{ margin: '16px 20px 0' }}>
        <div className="ns-card-interactive" style={{ ...cardStyle, padding: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 0 }}>
            {[
              { l: 'Idade',  v: age    ?? '—', u: age    ? 'anos'        : 'anos', Icon: IconCake  },
              { l: 'Altura', v: height ?? '—', u: height ? 'cm'          : 'cm',   Icon: IconRuler },
              { l: 'Peso',   v: weight ?? '—', u: weight ? 'kg'          : 'kg',   Icon: IconScale },
              { l: 'IMC',    v: bmi    ?? '—', u: bmi    ? bmiLabel(bmi) : 'IMC',  Icon: IconChart },
            ].map(({ l, v, u, Icon }, i) => (
              <div key={l} style={{
                textAlign: 'center',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                borderRight: i < 3 ? '0.5px solid var(--ns-sep)' : 'none',
                padding: '4px 0',
              }}>
                <Icon />
                <div style={{
                  fontSize: 17, fontWeight: 700, color: 'var(--ns-text-primary)',
                  letterSpacing: '-0.03em', lineHeight: 1,
                }}>
                  {v}
                </div>
                <div style={{
                  fontSize: 10, color: 'var(--ns-text-muted)',
                  fontWeight: 500, lineHeight: 1.2, textAlign: 'center',
                }}>
                  {u}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Hidratação ── */}
      <div style={{ margin: '16px 20px 0' }}>
        <div className="ns-card-interactive" style={{ ...cardStyle, padding: 16 }}>
          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', marginBottom: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <IconDrop />
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ns-text-primary)', letterSpacing: '-0.01em' }}>
                Hidratação
              </span>
            </div>
            <span style={{ fontSize: 13, color: 'var(--ns-text-muted)', fontWeight: 500 }}>
              meta {waterGoal.toLocaleString('pt-BR')}ml
            </span>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <SkeletonBlock height={6} />
              <SkeletonBlock height={16} width="40%" />
            </div>
          ) : (
            <>
              <div style={{ height: 22, background: 'var(--ns-ring-track)', borderRadius: 20, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.05)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)' }}>
                <div className="ns-water-bar" style={{
                  height: '100%', width: `${waterPct}%`,
                  transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
                }} />
              </div>
              <div style={{
                display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', marginTop: 10,
              }}>
                <span style={{ fontSize: 13, color: 'var(--ns-text-muted)', fontWeight: 500 }}>
                  {waterMl.toLocaleString('pt-BR')}ml de {waterGoal.toLocaleString('pt-BR')}ml
                </span>
                <button
                  onClick={handleAddWater}
                  disabled={savingWater || waterMl >= waterGoal}
                  style={{
                    background: 'var(--ns-blue-bg)',
                    color: 'var(--ns-blue)',
                    borderRadius: 20,
                    padding: '6px 14px',
                    fontSize: 13,
                    fontWeight: 600,
                    border: 'none',
                    cursor: savingWater || waterMl >= waterGoal ? 'default' : 'pointer',
                    WebkitTapHighlightColor: 'transparent',
                    letterSpacing: '-0.01em',
                    opacity: savingWater ? 0.6 : 1,
                  }}
                >
                  + 250ml
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Metas diarias (resumo) ── */}
      {!loading && goals && (
        <div style={{ margin: '16px 20px 0' }}>
          <div style={sectionTitle}>Minhas metas</div>
          <div style={cardStyle}>
            {[
              { key: 'Calorias',    v: goals.calories != null ? `${goals.calories} kcal` : '—' },
              { key: 'Proteína',    v: goals.protein  != null ? `${goals.protein}g/dia`  : '—' },
              { key: 'Carboidrato', v: goals.carbs    != null ? `${goals.carbs}g/dia`    : '—' },
              { key: 'Gordura',     v: goals.fat      != null ? `${goals.fat}g/dia`      : '—' },
            ].map((g, i) => (
              <div key={g.key} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 16px',
                borderTop: i > 0 ? '0.5px solid var(--ns-sep)' : 'none',
              }}>
                <span style={{ fontSize: 14, color: 'var(--ns-text-primary)', flex: 1, fontWeight: 500 }}>{g.key}</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--ns-text-muted)', letterSpacing: '-0.01em' }}>
                  {g.v}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Conta ── */}
      <div style={{ margin: '16px 20px 0' }}>
        <div style={sectionTitle}>Conta</div>
        <div className="ns-card-interactive" style={cardStyle}>

          {/* Dados pessoais */}
          <div>
            <div
              onClick={() => navigate('/profile/edit')}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '13px 16px',
                cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <div style={iconWrapStyle}><IconPerson /></div>
              <span style={{ flex: 1, fontSize: 15, color: 'var(--ns-text-primary)', fontWeight: 500 }}>
                Dados pessoais
              </span>
              <Chevron open={false} />
            </div>
          </div>

          {/* Metas nutricionais */}
          <div style={{ borderTop: '0.5px solid var(--ns-sep)' }}>
            <div
              onClick={() => navigate('/profile/goals')}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '13px 16px',
                cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <div style={iconWrapStyle}><IconTarget /></div>
              <span style={{ flex: 1, fontSize: 15, color: 'var(--ns-text-primary)', fontWeight: 500 }}>
                Metas nutricionais
              </span>
              <Chevron open={false} />
            </div>
          </div>

          {/* Sobre o Praxis Nutri */}
          <div style={{ borderTop: '0.5px solid var(--ns-sep)' }}>
            <div
              onClick={() => togglePanel('about')}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '13px 16px',
                cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <div style={iconWrapStyle}><IconInfo /></div>
              <span style={{ flex: 1, fontSize: 15, color: 'var(--ns-text-primary)', fontWeight: 500 }}>
                Sobre o Praxis Nutri
              </span>
              <Chevron open={openPanel === 'about'} />
            </div>
            {openPanel === 'about' && <AboutPanel />}
          </div>

        </div>
      </div>

      {/* ── Botao Sair ── */}
      <div style={{ margin: '20px 0 24px' }}>
        <button
          onClick={() => setShowSignOutModal(true)}
          style={{
            width: 'calc(100% - 40px)',
            margin: '0 20px',
            height: 48,
            borderRadius: 14,
            border: '0.5px solid rgba(196,57,28,0.2)',
            background: 'transparent',
            color: 'var(--ns-danger)',
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            letterSpacing: '-0.01em',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <IconLogout />
          Sair da conta
        </button>
      </div>

      {/* ── Modal de confirmação ── */}
      {showSignOutModal && (
        <SignOutModal
          onConfirm={handleSignOut}
          onCancel={() => setShowSignOutModal(false)}
          loading={signingOut}
        />
      )}
    </div>
  );
}
