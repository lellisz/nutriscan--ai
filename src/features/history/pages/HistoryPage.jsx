import { useState } from 'react';
import { StatusBar } from '../../../app/AppShell';

const FILTERS = ['Todos', 'Hoje', 'Semana', 'Mês'];

const MEALS = [
  {
    id: 1, emoji: '🍗', name: 'Frango grelhado',
    time: '19:32', category: 'Jantar', calories: 320,
    macros: { p: 38, c: 0, g: 8 }, confidence: 94, date: 'hoje',
  },
  {
    id: 2, emoji: '🍚', name: 'Arroz integral',
    time: '13:10', category: 'Almoço', calories: 215,
    macros: { p: 4, c: 45, g: 2 }, confidence: 88, date: 'hoje',
  },
  {
    id: 3, emoji: '🥩', name: 'Bife de alcatra',
    time: '20:15', category: 'Jantar', calories: 410,
    macros: { p: 48, c: 0, g: 22 }, confidence: 89, date: 'ontem',
  },
  {
    id: 4, emoji: '🥗', name: 'Salada caesar',
    time: '12:20', category: 'Almoço', calories: 190,
    macros: { p: 12, c: 8, g: 14 }, confidence: 91, date: 'ontem',
  },
  {
    id: 5, emoji: '🍌', name: 'Vitamina de banana',
    time: '08:45', category: 'Café', calories: 280,
    macros: { p: 8, c: 52, g: 5 }, confidence: 96, date: 'ontem',
  },
];

function HistItem({ item }) {
  const total = item.macros.p + item.macros.c + item.macros.g || 1;

  return (
    <div
      className="ns-hist-item ns-shimmer"
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '14px 20px',
        background: '#1c1c1e',
        WebkitTapHighlightColor: 'transparent',
        cursor: 'pointer',
        transition: 'opacity 0.15s cubic-bezier(0.4,0,0.2,1)',
      }}
    >
      {/* Thumb */}
      <div
        className="ns-hist-thumb"
        style={{
          width: 48, height: 48, borderRadius: 10,
          background: 'rgba(255,255,255,0.07)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 24, flexShrink: 0,
        }}
      >
        {item.emoji}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          className="ns-hist-name"
          style={{
            fontSize: 15, fontWeight: 600, color: '#ffffff',
            letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: 3,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}
        >
          {item.name}
        </div>
        <div className="ns-hist-meta" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <span className="ns-hist-time" style={{ fontSize: 12, color: '#8e8e93', letterSpacing: '-0.01em' }}>{item.time}</span>
          <div style={{ width: 2, height: 2, borderRadius: '50%', background: '#48484a' }} />
          <span className="ns-hist-cat" style={{ fontSize: 12, color: '#636366', letterSpacing: '-0.01em' }}>{item.category}</span>
        </div>
        {/* Barras de macro proporcionais */}
        <div style={{ display: 'flex', gap: 1.5, height: 3, borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ width: `${(item.macros.p / total) * 100}%`, background: '#FF6B35', borderRadius: 2 }} />
          <div style={{ width: `${(item.macros.c / total) * 100}%`, background: '#FFD60A', borderRadius: 2 }} />
          <div style={{ width: `${(item.macros.g / total) * 100}%`, background: '#BF5AF2', borderRadius: 2 }} />
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 5 }}>
          <span style={{ fontSize: 10, color: '#FF6B35', letterSpacing: '-0.01em', fontWeight: 500 }}>P {item.macros.p}g</span>
          <span style={{ fontSize: 10, color: '#FFD60A', letterSpacing: '-0.01em', fontWeight: 500 }}>C {item.macros.c}g</span>
          <span style={{ fontSize: 10, color: '#BF5AF2', letterSpacing: '-0.01em', fontWeight: 500 }}>G {item.macros.g}g</span>
        </div>
      </div>

      <div style={{ flexShrink: 0, textAlign: 'right' }}>
        <div
          className="ns-hist-kcal"
          style={{
            fontSize: 18, fontWeight: 700, color: '#30D158',
            letterSpacing: '-0.04em', lineHeight: 1,
          }}
        >
          {item.calories}
        </div>
        <div style={{ fontSize: 10, color: '#636366', marginTop: 2, letterSpacing: '-0.01em' }}>kcal</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 3, justifyContent: 'flex-end', marginTop: 5 }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#30D158', boxShadow: '0 0 4px rgba(48,209,88,0.5)' }} />
          <span style={{ fontSize: 10, color: '#48484a', letterSpacing: '-0.01em' }}>{item.confidence}%</span>
        </div>
      </div>
    </div>
  );
}

export default function HistoryPage() {
  const [filter, setFilter] = useState('Todos');

  const today     = MEALS.filter(m => m.date === 'hoje');
  const yesterday = MEALS.filter(m => m.date === 'ontem');

  const todayKcal     = today.reduce((s, m) => s + m.calories, 0);
  const yesterdayKcal = yesterday.reduce((s, m) => s + m.calories, 0);
  const totalMeals    = MEALS.length;

  return (
    <div className="ns-page" style={{ background: '#000000' }}>
      <StatusBar />

      <div className="ns-page-header" style={{ paddingBottom: 10, padding: '0 20px 10px' }}>
        <div style={{ fontSize: 13, color: '#636366', letterSpacing: '-0.01em', marginBottom: 2, fontWeight: 500 }}>Registro</div>
        <div style={{
          fontSize: 36, fontWeight: 800, color: '#ffffff',
          letterSpacing: '-0.05em', lineHeight: 1.02, marginBottom: 18,
        }}>
          Histórico
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {[
            { v: todayKcal, l: 'kcal hoje', color: '#30D158' },
            { v: yesterdayKcal.toLocaleString('pt-BR'), l: 'kcal ontem', color: '#FF9F0A' },
            { v: totalMeals, l: 'refeições', color: '#0A84FF' },
          ].map(({ v, l, color }) => (
            <div
              key={l}
              className="ns-card-sm ns-shimmer"
              style={{
                flex: 1, padding: '12px 12px',
                background: '#111111',
                border: '0.5px solid rgba(255,255,255,0.07)', borderRadius: 14,
              }}
            >
              <div style={{
                fontSize: 20, fontWeight: 800, color,
                letterSpacing: '-0.04em', lineHeight: 1,
              }}>
                {v}
              </div>
              <div style={{ fontSize: 10, color: '#636366', marginTop: 4, letterSpacing: '-0.01em' }}>{l}</div>
            </div>
          ))}
        </div>

        {/* Segmented control */}
        <div
          className="ns-segment"
          style={{
            display: 'flex', gap: 0,
            background: '#1c1c1e', borderRadius: 12, padding: 3,
          }}
        >
          {FILTERS.map(f => (
            <div
              key={f}
              className={`ns-segment-item${filter === f ? ' ns-segment-item--active' : ''}`}
              onClick={() => setFilter(f)}
              style={{
                flex: 1, textAlign: 'center',
                padding: '7px 0', borderRadius: 10,
                fontSize: 13, fontWeight: 600, letterSpacing: '-0.02em',
                cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
                WebkitTapHighlightColor: 'transparent',
                background: filter === f ? '#2c2c2e' : 'transparent',
                color: filter === f ? '#ffffff' : '#636366',
              }}
            >
              {f}
            </div>
          ))}
        </div>
      </div>

      {/* Today */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '14px 20px 8px',
      }}>
        <span style={{
          fontSize: 13, fontWeight: 600, color: '#8e8e93',
          letterSpacing: '0.02em', textTransform: 'uppercase',
        }}>
          Hoje
        </span>
        <span style={{ fontSize: 13, color: '#30D158', fontWeight: 600, letterSpacing: '-0.02em' }}>
          {todayKcal} kcal
        </span>
      </div>
      {/* Lista hoje com separadores */}
      <div style={{ background: '#1c1c1e', borderRadius: 16, overflow: 'hidden', margin: '0 16px' }}>
        {today.map((m, i) => (
          <div key={m.id}>
            <HistItem item={m} />
            {i < today.length - 1 && (
              <div style={{ height: '0.5px', background: 'rgba(255,255,255,0.05)', margin: '0 20px' }} />
            )}
          </div>
        ))}
      </div>

      {/* Yesterday */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '18px 20px 8px',
      }}>
        <span style={{
          fontSize: 13, fontWeight: 600, color: '#8e8e93',
          letterSpacing: '0.02em', textTransform: 'uppercase',
        }}>
          Ontem
        </span>
        <span style={{ fontSize: 13, color: '#FF9F0A', fontWeight: 600, letterSpacing: '-0.02em' }}>
          {yesterdayKcal} kcal
        </span>
      </div>
      <div style={{ background: '#1c1c1e', borderRadius: 16, overflow: 'hidden', margin: '0 16px' }}>
        {yesterday.map((m, i) => (
          <div key={m.id}>
            <HistItem item={m} />
            {i < yesterday.length - 1 && (
              <div style={{ height: '0.5px', background: 'rgba(255,255,255,0.05)', margin: '0 20px' }} />
            )}
          </div>
        ))}
      </div>

      <div style={{ height: 24 }} />
    </div>
  );
}
