import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { StatusBar } from '../../../app/AppShell-new';
import { useAuth } from '../../auth/hooks/useAuth';
import * as db from '../../../lib/db';

// ── Utility Functions ─────────────────────────────────────
function getInitials(name) {
  if (!name) return 'U';
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function calculateBMI(weight, height) {
  if (!weight || !height) return null;
  const heightM = height / 100;
  return (weight / (heightM * heightM)).toFixed(1);
}

function getBMICategory(bmi) {
  if (bmi < 18.5) return { label: 'Abaixo', color: '#ff9500' };
  if (bmi < 25) return { label: 'Normal', color: '#34c759' };
  if (bmi < 30) return { label: 'Sobrepeso', color: '#ff9500' };
  return { label: 'Obesidade', color: '#ff453a' };
}

function goalLabel(goal) {
  const map = { cutting: 'Perder gordura', maintain: 'Manutenção', bulking: 'Ganhar massa' };
  return map[goal] || 'Sem meta definida';
}

function goalIcon(goal) {
  const map = { cutting: '🔥', maintain: '⚖️', bulking: '💪' };
  return map[goal] || '🎯';
}

function calculateTDEE(profile) {
  if (!profile?.weight || !profile?.height || !profile?.age || !profile?.gender || !profile?.activity_level) return null;
  const bmr = profile.gender === 'M'
    ? 88.362 + 13.397 * profile.weight + 4.799 * profile.height - 5.677 * profile.age
    : 447.593 + 9.247 * profile.weight + 3.098 * profile.height - 4.33 * profile.age;
  return Math.round(bmr * parseFloat(profile.activity_level));
}

function goalAdjustmentLabel(goal) {
  const map = { cutting: '-20%', maintain: 'manutenção', bulking: '+10%' };
  return map[goal] || 'manutenção';
}

// ── Stat Card ─────────────────────────────────────────────
function StatCard({ label, value, unit, color = '#ebebf0', isHighlight = false }) {
  return (
    <div className="ns-stat-card">
      <div className="ns-stat-label">{label}</div>
      <div className="ns-stat-value" style={{ color: isHighlight ? color : '#ebebf0' }}>
        {value}
      </div>
      <div
        className="ns-stat-unit"
        style={{ color: isHighlight ? color : '#48484a' }}
      >
        {unit}
      </div>
    </div>
  );
}

// ── Avatar Component ──────────────────────────────────────
function Avatar({ name, size = 64 }) {
  return (
    <div className="ns-avatar" style={{ width: size, height: size }}>
      <span style={{ fontSize: size * 0.4 }}>
        {getInitials(name)}
      </span>
    </div>
  );
}

// ── Goal Card ─────────────────────────────────────────────
function GoalCard({ label, value, color = '#ebebf0' }) {
  return (
    <div className="ns-goal-card">
      <div className="ns-goal-value" style={{ color }}>{value}</div>
      <div className="ns-goal-label">{label}</div>
    </div>
  );
}

// ── Menu Item ─────────────────────────────────────────────
function MenuItem({ icon, label, action, isExpanded, hasPanel = false }) {
  return (
    <div className="ns-menu-item" onClick={action}>
      <div className="ns-menu-icon">{icon}</div>
      <div className="ns-menu-label">{label}</div>
      <div className="ns-menu-arrow" style={{
        transform: hasPanel && isExpanded ? 'rotate(90deg)' : 'none'
      }}>
        <svg width="7" height="12" viewBox="0 0 7 12" fill="none">
          <path d="M1 1l5 5-5 5" stroke="#8e8e93" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </div>
  );
}

// ── Weight Mini Chart ─────────────────────────────────────
function WeightMiniChart({ logs = [] }) {
  if (logs.length === 0) return null;

  const weights = logs.map(l => l.weight);
  const max = Math.max(...weights);
  const min = Math.min(...weights);
  const range = max - min || 1;

  return (
    <div className="ns-weight-chart">
      <svg width="60" height="20" viewBox="0 0 60 20">
        <polyline
          points={logs.map((log, i) =>
            `${i * (60 / Math.max(1, logs.length - 1))},${20 - ((log.weight - min) / range) * 16}`
          ).join(' ')}
          fill="none"
          stroke="#ebebf0"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.8"
        />
        {logs.map((log, i) => (
          <circle
            key={i}
            cx={i * (60 / Math.max(1, logs.length - 1))}
            cy={20 - ((log.weight - min) / range) * 16}
            r="1.5"
            fill="#ebebf0"
            opacity="0.6"
          />
        ))}
      </svg>
    </div>
  );
}

// ── Profile Page ──────────────────────────────────────────
export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState(null);
  const [goals, setGoals] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPrefs, setShowPrefs] = useState(false);
  const [showDiet, setShowDiet] = useState(false);
  const [scansCount, setScansCount] = useState(0);
  const [weightLogs, setWeightLogs] = useState([]);

  useEffect(() => { loadProfile(); }, []);

  async function loadProfile() {
    try {
      const [profileData, goalsData, scansData, weightData] = await Promise.all([
        db.getProfile(user.id),
        db.getDailyGoals(user.id),
        db.listScanHistory(user.id, 999),
        db.listWeightLogs(user.id, 5),
      ]);
      setProfile(profileData);
      setGoals(goalsData);
      setScansCount(scansData?.length || 0);
      setWeightLogs(weightData || []);
    } catch (err) {
      console.error('Erro ao carregar perfil:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOut() {
    await signOut();
    navigate('/signin');
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', background: '#000'
      }}>
        <div style={{
          width: 32, height: 32, border: '2px solid #2c2c2e',
          borderTop: '2px solid #ebebf0', borderRadius: '50%',
          animation: 'ns-rotate 1s linear infinite'
        }} />
      </div>
    );
  }

  const bmi = calculateBMI(profile?.weight, profile?.height);
  const bmiCat = bmi ? getBMICategory(parseFloat(bmi)) : null;
  const tdee = calculateTDEE(profile);

  const menuItems = [
    { icon: '👤', label: 'Dados Pessoais', action: () => navigate('/onboarding'), hasPanel: false },
    {
      icon: '⚙️',
      label: 'Preferências',
      action: () => setShowPrefs(p => !p),
      hasPanel: true,
      isExpanded: showPrefs
    },
    {
      icon: '🥗',
      label: 'Minha dieta',
      action: () => setShowDiet(p => !p),
      hasPanel: true,
      isExpanded: showDiet
    },
    { icon: '⭐', label: 'Assinatura', action: () => navigate('/subscription'), hasPanel: false },
  ];

  return (
    <div className="ns-page">
      <StatusBar />

      <div className="ns-px" style={{ paddingTop: 14 }}>
        {/* ── Header ── */}
        <div style={{ marginBottom: 20 }}>
          <div style={{
            fontSize: 34, fontWeight: 700, color: '#fff',
            letterSpacing: '-0.05em', lineHeight: 1, marginBottom: 2
          }}>
            Perfil
          </div>
          <div style={{
            fontSize: 15, color: '#8e8e93', letterSpacing: '-0.02em'
          }}>
            Suas informações e preferências
          </div>
        </div>

        {/* ── User Card ── */}
        <div className="ns-card ns-shimmer" style={{ padding: 20, marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Avatar name={profile?.full_name} size={64} />
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: 20, fontWeight: 700, color: '#fff',
                letterSpacing: '-0.03em', marginBottom: 4
              }}>
                {profile?.full_name || 'Usuário'}
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                fontSize: 13, color: '#ebebf0', fontWeight: 600,
                marginBottom: 4
              }}>
                <span>{goalIcon(profile?.goal)}</span>
                <span>{goalLabel(profile?.goal)}</span>
              </div>
              <div style={{
                fontSize: 12, color: '#8e8e93', letterSpacing: '-0.01em'
              }}>
                {scansCount} análises realizadas
              </div>
            </div>
          </div>
        </div>

        {/* ── Stats Grid ── */}
        <div className="ns-stats-grid" style={{ marginBottom: 10 }}>
          <StatCard
            label="IDADE"
            value={profile?.age || '--'}
            unit="anos"
          />
          <StatCard
            label="ALTURA"
            value={profile?.height || '--'}
            unit="cm"
          />
          <StatCard
            label="PESO"
            value={profile?.weight || '--'}
            unit="kg"
          />
          <StatCard
            label="IMC"
            value={bmi || '--'}
            unit={bmiCat?.label || ''}
            color={bmiCat?.color}
            isHighlight={true}
          />
        </div>

        {/* ── Metas Calculadas ── */}
        {goals && profile && (
          <div className="ns-card-sm ns-shimmer" style={{ padding: 16, marginBottom: 10 }}>
            <div style={{
              fontSize: 12, fontWeight: 600, color: '#8e8e93',
              textTransform: 'uppercase', letterSpacing: '.05em',
              marginBottom: 12
            }}>
              Metas Calculadas
            </div>
            <div className="ns-goals-list">
              {[
                { label: 'TDEE (manutenção)', value: `${tdee || '--'} kcal/dia` },
                { label: `Meta (${goalAdjustmentLabel(profile.goal)})`, value: `${goals.calories} kcal/dia` },
                { label: 'Proteína', value: `${goals.protein}g/dia` },
                { label: 'Carboidratos', value: `${goals.carbs}g/dia` },
                { label: 'Gorduras', value: `${goals.fat}g/dia` },
              ].map((item, i, arr) => (
                <div key={item.label} className="ns-goal-row">
                  <span className="ns-goal-row-label">{item.label}</span>
                  <span className="ns-goal-row-value">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Menu Section ── */}
        <div style={{
          fontSize: 12, fontWeight: 600, color: '#8e8e93',
          textTransform: 'uppercase', letterSpacing: '.05em',
          marginBottom: 6, marginLeft: 4
        }}>
          Conta
        </div>

        <div className="ns-card-sm ns-shimmer" style={{ marginBottom: 16 }}>
          {menuItems.map((item, i, arr) => (
            <div key={item.label}>
              <MenuItem
                icon={item.icon}
                label={item.label}
                action={item.action}
                isExpanded={item.isExpanded}
                hasPanel={item.hasPanel}
              />

              {/* Preferências Panel */}
              {item.label === 'Preferências' && showPrefs && (
                <div className="ns-expandable-panel">
                  <div className="ns-panel-section">
                    <div className="ns-panel-label">TEMA</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {['Escuro', 'Claro'].map(theme => (
                        <div
                          key={theme}
                          className={`ns-toggle-option ${theme === 'Escuro' ? 'ns-toggle-option--active' : 'ns-toggle-option--disabled'}`}
                        >
                          <span>{theme === 'Escuro' ? '🌙' : '☀️'} {theme}</span>
                          {theme === 'Claro' && (
                            <div style={{ fontSize: 9, marginTop: 2, color: '#636366' }}>em breve</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="ns-panel-section">
                    <div className="ns-panel-label">UNIDADES</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {[
                        { label: 'Métrico (kg/cm)', active: true },
                        { label: 'Imperial (lb/ft)', active: false }
                      ].map(unit => (
                        <div
                          key={unit.label}
                          className={`ns-toggle-option ${unit.active ? 'ns-toggle-option--active' : 'ns-toggle-option--disabled'}`}
                        >
                          {unit.label}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="ns-panel-section" style={{ marginBottom: 0 }}>
                    <div className="ns-panel-label">APP</div>
                    <div className="ns-info-list">
                      {[
                        { label: 'Versão', value: '1.0.0' },
                        { label: 'Provider IA', value: 'Anthropic + Ollama' },
                        { label: 'Plano', value: profile?.is_premium ? 'Premium' : 'Gratuito' },
                      ].map((info, idx, arr) => (
                        <div key={info.label} className="ns-info-row">
                          <span className="ns-info-label">{info.label}</span>
                          <span className="ns-info-value">{info.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Minha Dieta Panel */}
              {item.label === 'Minha dieta' && showDiet && (
                <div className="ns-expandable-panel">
                  {goals ? (
                    <>
                      <div className="ns-panel-section">
                        <div className="ns-panel-label">METAS DIÁRIAS</div>
                        <div className="ns-goals-grid">
                          {[
                            { label: 'Calorias', value: `${goals.calories} kcal`, color: '#ebebf0' },
                            { label: 'Proteína', value: `${goals.protein}g`, color: '#ebebf0' },
                            { label: 'Carboidratos', value: `${goals.carbs}g`, color: '#aeaeb2' },
                            { label: 'Gorduras', value: `${goals.fat}g`, color: '#8e8e93' },
                            { label: 'Fibra', value: `${goals.fiber || 25}g`, color: '#636366' },
                            { label: 'Água', value: `${goals.water || 2500}ml`, color: '#636366' },
                          ].map(macro => (
                            <GoalCard
                              key={macro.label}
                              label={macro.label}
                              value={macro.value}
                              color={macro.color}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Weight History */}
                      {weightLogs.length > 0 && (
                        <div className="ns-panel-section">
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 8
                          }}>
                            <div className="ns-panel-label">PESO RECENTE</div>
                            <WeightMiniChart logs={weightLogs} />
                          </div>
                          <div className="ns-weight-list">
                            {weightLogs.slice(0, 3).map(log => (
                              <div key={log.id} className="ns-weight-row">
                                <span className="ns-weight-date">
                                  {new Date(log.logged_at + 'T12:00:00').toLocaleDateString('pt-BR', {
                                    day: '2-digit',
                                    month: 'short'
                                  })}
                                </span>
                                <span className="ns-weight-value">
                                  {Number(log.weight).toFixed(1)} kg
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div style={{ paddingTop: 12 }}>
                        <div
                          className="ns-scan-cta ns-shimmer"
                          onClick={() => navigate('/insights')}
                          style={{ padding: '12px 16px' }}
                        >
                          <div className="ns-scan-icon" style={{ width: 32, height: 32 }}>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                              <path d="M2 12l3-7 4 4 5-6" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              <circle cx="14" cy="4" r="1" fill="#fff"/>
                            </svg>
                          </div>
                          <div style={{ flex: 1 }}>
                            <div className="ns-scan-title" style={{ fontSize: 13 }}>Ver progresso completo</div>
                          </div>
                          <div className="ns-scan-arrow">
                            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                              <path d="M3.5 2l4 3.5-4 3.5" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div style={{ textAlign: 'center', padding: 20 }}>
                      <div style={{
                        fontSize: 13, color: '#8e8e93',
                        marginBottom: 16, lineHeight: 1.4
                      }}>
                        Complete o onboarding para<br />definir suas metas nutricionais.
                      </div>
                      <div
                        className="ns-scan-cta ns-shimmer"
                        onClick={() => navigate('/onboarding')}
                        style={{ margin: '0 auto', padding: '10px 16px' }}
                      >
                        <div className="ns-scan-icon" style={{ width: 28, height: 28, fontSize: 16 }}>
                          🎯
                        </div>
                        <div style={{ flex: 1 }}>
                          <div className="ns-scan-title" style={{ fontSize: 13 }}>Definir metas</div>
                        </div>
                        <div className="ns-scan-arrow">
                          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                            <path d="M3.5 2l4 3.5-4 3.5" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {i < arr.length - 1 && !((item.label === 'Preferências' && showPrefs) || (item.label === 'Minha dieta' && showDiet)) && (
                <div className="ns-divider" />
              )}
            </div>
          ))}
        </div>

        {/* ── Sign Out ── */}
        <div
          className="ns-danger-btn"
          onClick={handleSignOut}
        >
          <div style={{ fontSize: 18, marginRight: 8 }}>👋</div>
          <span>Sair da conta</span>
        </div>
      </div>
    </div>
  );
}