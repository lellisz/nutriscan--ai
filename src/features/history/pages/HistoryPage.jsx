import { useState, useEffect, useCallback } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { StatusBar } from '../../../app/AppShell';
import { useAuth } from '../../auth/hooks/useAuth';
import * as db from '../../../lib/db';
import PraxiAvatar from '../../../components/praxi/PraxiAvatar';

const FILTERS = [
  { id: 'Todos',  label: 'Todos' },
  { id: 'Hoje',   label: 'Hoje'  },
  { id: 'Semana', label: '7 dias' },
  { id: 'Mês',    label: '30 dias' },
];

// Ícone de refeição baseado no horário ou meal_type
function MealIcon({ scannedAt, mealType }) {
  const hour = new Date(scannedAt).getHours();
  const type = mealType || (
    hour >= 5  && hour < 10   ? 'breakfast' :
    hour >= 10 && hour < 14.5 ? 'lunch' :
    hour >= 14.5 && hour < 17.5 ? 'snack' :
    hour >= 17.5 && hour < 22 ? 'dinner' : 'other'
  );

  if (type === 'breakfast') return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="4" stroke="var(--ns-orange)" strokeWidth="1.7" />
      <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.22 4.22l1.42 1.42M14.36 14.36l1.42 1.42M4.22 15.78l1.42-1.42M14.36 5.64l1.42-1.42"
        stroke="var(--ns-orange)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
  if (type === 'lunch') return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="11" r="6" stroke="var(--ns-accent)" strokeWidth="1.7" />
      <path d="M7 11h6M10 8v6" stroke="var(--ns-accent)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
  if (type === 'snack') return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M10 3C7 3 4 5.5 4 9c0 4 2 7 6 8 4-1 6-4 6-8 0-3.5-3-6-6-6z"
        stroke="var(--ns-accent)" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M10 3c0 0 1 2 1 4" stroke="var(--ns-accent)" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
  if (type === 'dinner') return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M15 4a6 6 0 01-6 10.5A6 6 0 1115 4z" stroke="var(--ns-text-secondary)" strokeWidth="1.7" />
      <path d="M13 3c1.5.5 2.5 1.5 3 3" stroke="var(--ns-text-secondary)" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
  // other / default
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="7" stroke="var(--ns-text-disabled)" strokeWidth="1.7" />
      <path d="M7 10h6M10 7v6" stroke="var(--ns-text-disabled)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function HistItem({ item, onDelete }) {
  const [confirming, setConfirming] = useState(false);

  const macroTotal = (item.protein || 0) + (item.carbs || 0) + (item.fat || 0) || 1;

  const scannedAt = new Date(item.scanned_at);
  const timeStr = scannedAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  function handleDelete() {
    if (!confirming) { setConfirming(true); return; }
    onDelete(item.id);
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '14px 16px',
      WebkitTapHighlightColor: 'transparent',
    }}>
      {/* Thumb — ícone baseado no horário */}
      <div style={{
        width: 46, height: 46,
        background: 'var(--ns-bg-elevated)',
        border: '0.5px solid var(--ns-border)',
        borderRadius: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <MealIcon scannedAt={item.scanned_at} mealType={item.meal_type} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 15, fontWeight: 600, color: 'var(--ns-text-primary)',
          letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: 3,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {item.food_name || 'Alimento'}
        </div>
        <div style={{ fontSize: 12, color: 'var(--ns-text-muted)', marginBottom: 6 }}>
          {timeStr}
          {item.category ? ` · ${item.category}` : ''}
          {item.status === 'verified' && (
            <span style={{ color: 'var(--ns-accent)', marginLeft: 4, fontWeight: 600 }}>· Verificado</span>
          )}
        </div>
        {/* Barras de macro — cores distintas por nutriente */}
        <div style={{ display: 'flex', gap: 2, height: 7, borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ width: `${((item.protein || 0) / macroTotal) * 100}%`, background: 'var(--ns-macro-protein)', borderRadius: 4 }} />
          <div style={{ width: `${((item.carbs || 0) / macroTotal) * 100}%`, background: 'var(--ns-macro-carbs)', borderRadius: 4 }} />
          <div style={{ width: `${((item.fat || 0) / macroTotal) * 100}%`, background: 'var(--ns-macro-fat)', borderRadius: 4 }} />
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <span className="mono-num" style={{ fontSize: 10, color: 'var(--ns-text-muted)', fontWeight: 500 }}>P {item.protein || 0}g</span>
          <span className="mono-num" style={{ fontSize: 10, color: 'var(--ns-text-muted)', fontWeight: 500 }}>C {item.carbs || 0}g</span>
          <span className="mono-num" style={{ fontSize: 10, color: 'var(--ns-text-muted)', fontWeight: 500 }}>G {item.fat || 0}g</span>
        </div>
      </div>

      {/* Calorias */}
      <div style={{ flexShrink: 0, textAlign: 'right' }}>
        <div className="mono-num" style={{
          fontSize: 15, fontWeight: 700, color: 'var(--ns-text-primary)',
          letterSpacing: '-0.02em', lineHeight: 1,
        }}>
          {item.calories || 0}
        </div>
        <div style={{ fontSize: 10, color: 'var(--ns-text-muted)', marginTop: 2 }}>kcal</div>

        {/* Botão de remover */}
        <button
          onClick={handleDelete}
          onBlur={() => setConfirming(false)}
          style={{
            marginTop: 6, background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 10, fontWeight: 600, padding: '2px 0',
            color: confirming ? 'var(--ns-danger)' : 'var(--ns-text-disabled)',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          {confirming ? 'Confirmar' : 'Remover'}
        </button>
      </div>
    </div>
  );
}

export default function HistoryPage() {
  const { user } = useAuth();
  const shouldReduce = useReducedMotion();
  const [filter, setFilter] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadScans = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await db.listScanHistory(user.id, 100);
      setScans(data || []);
    } catch (err) {
      console.error('Erro ao carregar histórico:', err);
      setError('Erro ao carregar histórico. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { loadScans(); }, [loadScans]);

  async function handleDelete(scanId) {
    try {
      await db.deleteScanHistory(scanId);
      setScans(prev => prev.filter(s => s.id !== scanId));
    } catch (err) {
      console.error('Erro ao remover scan:', err);
      setError('Erro ao remover registro. Tente novamente.');
    }
  }

  // Filtros por data
  const today = new Date().toLocaleDateString('pt-BR');
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const monthAgo = new Date();
  monthAgo.setMonth(monthAgo.getMonth() - 1);

  const filtered = scans.filter(s => {
    const d = new Date(s.scanned_at);
    const matchesDate =
      filter === 'Hoje'   ? d.toLocaleDateString('pt-BR') === today :
      filter === 'Semana' ? d >= weekAgo :
      filter === 'Mês'    ? d >= monthAgo :
      true;
    const matchesSearch = searchQuery.trim() === '' ||
      (s.food_name || '').toLowerCase().includes(searchQuery.toLowerCase().trim());
    return matchesDate && matchesSearch;
  });

  // Agrupamento por data
  const groups = filtered.reduce((acc, scan) => {
    const d = new Date(scan.scanned_at);
    const dateStr = d.toLocaleDateString('pt-BR');
    const todayStr = new Date().toLocaleDateString('pt-BR');
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = yesterdayDate.toLocaleDateString('pt-BR');

    let label;
    if (dateStr === todayStr) label = 'Hoje';
    else if (dateStr === yesterdayStr) label = 'Ontem';
    else label = d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

    if (!acc[label]) acc[label] = [];
    acc[label].push(scan);
    return acc;
  }, {});

  const todayScans = scans.filter(s => new Date(s.scanned_at).toLocaleDateString('pt-BR') === today);
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayScans = scans.filter(s =>
    new Date(s.scanned_at).toLocaleDateString('pt-BR') === yesterdayDate.toLocaleDateString('pt-BR')
  );
  const todayKcal     = todayScans.reduce((s, m) => s + (m.calories || 0), 0);
  const yesterdayKcal = yesterdayScans.reduce((s, m) => s + (m.calories || 0), 0);

  // Counts por filtro (sem filtro de busca, apenas por data)
  const filterCounts = {
    Todos:  scans.length,
    Hoje:   scans.filter(s => new Date(s.scanned_at).toLocaleDateString('pt-BR') === today).length,
    Semana: scans.filter(s => new Date(s.scanned_at) >= weekAgo).length,
    Mês:    scans.filter(s => new Date(s.scanned_at) >= monthAgo).length,
  };

  const pageHeader = (totalRecords) => (
    <header style={{ padding: '20px 20px 16px', background: 'var(--ns-bg-primary)' }} className="animate-fade-up">
      <h1 style={{
        fontSize: 28, fontWeight: 700,
        color: 'var(--ns-text-primary)',
        letterSpacing: '-0.03em',
        margin: 0, lineHeight: 1.1,
      }}>
        Histórico
      </h1>
      <p style={{
        fontSize: 14, color: 'var(--ns-text-muted)',
        margin: '6px 0 0', lineHeight: 1.4,
      }}>
        {totalRecords === 0
          ? 'Nenhum registro ainda'
          : `${totalRecords} ${totalRecords === 1 ? 'registro' : 'registros'} no total`}
      </p>
    </header>
  );

  if (loading) {
    return (
      <div style={{ background: 'var(--ns-bg-primary)', minHeight: '100dvh', paddingBottom: 100 }}>
        <StatusBar />
        {pageHeader(0)}
        <div style={{ padding: '8px 20px' }}>
          {[90, 75, 85, 70].map((w, i) => (
            <div key={i} style={{
              height: 72, borderRadius: 14, marginBottom: 10,
              background: 'linear-gradient(90deg, var(--ns-bg-elevated) 25%, var(--ns-bg-hover) 50%, var(--ns-bg-elevated) 75%)',
              backgroundSize: '200% 100%',
              animation: 'ns-shimmer 1.5s infinite',
            }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--ns-bg-primary)', minHeight: '100dvh', paddingBottom: 100 }}>
      <StatusBar />

      {pageHeader(scans.length)}

      <div style={{ padding: '0 20px 12px' }}>

        {/* Erro */}
        {error && (
          <div style={{
            background: 'var(--ns-danger-bg)', border: '0.5px solid rgba(196,57,28,0.2)',
            borderRadius: 12, padding: '10px 14px', marginBottom: 14,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ fontSize: 13, color: 'var(--ns-danger)' }}>{error}</span>
            <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', fontSize: 16, color: 'var(--ns-danger)', cursor: 'pointer', padding: 4 }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M1 1l10 10M11 1L1 11" stroke="var(--ns-danger)" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        )}

        {/* Barra de busca */}
        <div className="animate-fade-up stagger-1" style={{
          position: 'relative', marginBottom: 14,
        }}>
          <div style={{
            position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
            pointerEvents: 'none', display: 'flex', alignItems: 'center',
          }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="6.5" cy="6.5" r="5" stroke="var(--ns-text-muted)" strokeWidth="1.4" />
              <path d="M10.5 10.5L14 14" stroke="var(--ns-text-muted)" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </div>
          <input
            type="search"
            placeholder="Buscar alimento..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              height: 44,
              paddingLeft: 40,
              paddingRight: 16,
              background: 'var(--ns-bg-card)',
              border: '0.5px solid var(--ns-border)',
              borderRadius: 12,
              fontSize: 16,
              color: 'var(--ns-text-primary)',
              outline: 'none',
              WebkitAppearance: 'none',
              boxSizing: 'border-box',
              fontFamily: 'inherit',
            }}
          />
        </div>

        {/* Stats row */}
        <div className="animate-fade-up stagger-2" style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          {[
            { v: todayKcal.toLocaleString('pt-BR'),       l: 'kcal hoje'  },
            { v: yesterdayKcal.toLocaleString('pt-BR'),   l: 'kcal ontem' },
            { v: scans.length,                            l: 'registros'  },
          ].map(({ v, l }) => (
            <div key={l} style={{
              flex: 1, padding: '12px',
              background: 'var(--ns-bg-card)',
              border: '0.5px solid var(--ns-border)',
              borderRadius: 14,
              boxShadow: 'var(--ns-shadow-sm)',
            }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--ns-text-primary)', letterSpacing: '-0.03em', lineHeight: 1 }}>
                {v}
              </div>
              <div style={{ fontSize: 10, color: 'var(--ns-text-muted)', marginTop: 4 }}>{l}</div>
            </div>
          ))}
        </div>

        {/* Pill filters com contagem */}
        <div className="animate-fade-up stagger-3" style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2, scrollbarWidth: 'none' }}>
          {FILTERS.map(({ id, label }) => {
            const active = filter === id;
            const count = filterCounts[id] ?? 0;
            return (
              <button
                key={id}
                onClick={() => setFilter(id)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '7px 14px',
                  borderRadius: 100,
                  fontSize: 13, fontWeight: 600, letterSpacing: '-0.01em',
                  cursor: 'pointer',
                  transition: 'all 0.18s cubic-bezier(0.4,0,0.2,1)',
                  WebkitTapHighlightColor: 'transparent',
                  border: active ? 'none' : '0.5px solid var(--ns-border)',
                  background: active ? 'var(--ns-accent)' : 'var(--ns-bg-card)',
                  color: active ? '#FFFFFF' : 'var(--ns-text-muted)',
                  flexShrink: 0,
                  boxShadow: active ? '0 2px 8px rgba(45,143,94,0.25)' : 'none',
                }}
              >
                {label}
                {count > 0 && (
                  <span style={{
                    fontSize: 10, fontWeight: 700,
                    background: active ? 'rgba(255,255,255,0.25)' : 'var(--ns-bg-elevated)',
                    color: active ? '#FFF' : 'var(--ns-text-muted)',
                    borderRadius: 100,
                    padding: '1px 6px',
                    lineHeight: 1.5,
                  }}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Estado vazio */}
      {filtered.length === 0 && (
        <div className="ns-empty" style={{ marginTop: 40 }}>
          <div style={{ marginBottom: 8 }}>
            <PraxiAvatar state="waving" size="lg" />
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ns-text-primary)', marginBottom: 4 }}>
            {filter === 'Todos' ? 'Nenhum registro ainda' : `Nenhum registro (${filter.toLowerCase()})`}
          </div>
          <p className="ns-empty-sub">
            Escaneie refeições para registrar sua alimentação.
          </p>
        </div>
      )}

      {/* Grupos por data */}
      {Object.entries(groups).map(([label, items]) => {
        const groupKcal = items.reduce((s, m) => s + (m.calories || 0), 0);
        return (
          <div key={label}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '14px 20px 8px',
            }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ns-text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                {label}
              </span>
              <span style={{ fontSize: 13, color: 'var(--ns-text-secondary)', fontWeight: 600, letterSpacing: '-0.01em' }}>
                {groupKcal.toLocaleString('pt-BR')} kcal
              </span>
            </div>
            <motion.div
              variants={shouldReduce ? {} : {
                hidden: { opacity: 0 },
                visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
              }}
              initial={shouldReduce ? false : 'hidden'}
              animate={shouldReduce ? false : 'visible'}
              style={{
                background: 'var(--ns-bg-card)', borderRadius: 16, overflow: 'hidden',
                border: '0.5px solid var(--ns-border)', margin: '0 16px',
                boxShadow: 'var(--ns-shadow-sm)',
              }}
            >
              {items.map((item, i) => (
                <motion.div
                  key={item.id}
                  variants={shouldReduce ? {} : {
                    hidden: { opacity: 0, y: 12 },
                    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
                  }}
                  style={{ borderTop: i > 0 ? '0.5px solid var(--ns-sep)' : 'none' }}
                >
                  <HistItem item={item} onDelete={handleDelete} />
                </motion.div>
              ))}
            </motion.div>
          </div>
        );
      })}

      <div style={{ height: 24 }} />
    </div>
  );
}
