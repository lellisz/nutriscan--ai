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

function HistItem({ item, isLast }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '14px 16px',
      borderTop: 'none',
      WebkitTapHighlightColor: 'transparent',
      cursor: 'pointer',
    }}>
      {/* Thumb */}
      <div style={{
        width: 44, height: 44,
        background: '#F5F5F5',
        borderRadius: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 22, flexShrink: 0,
      }}>
        {item.emoji}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 15, fontWeight: 600, color: '#000',
          letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: 3,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {item.name}
        </div>
        <div style={{ fontSize: 12, color: '#B0B0B0', marginBottom: 6 }}>
          {item.time} · {item.category}
        </div>
        {/* Barras de macro — pretas */}
        <div style={{ display: 'flex', gap: 1.5, height: 3, borderRadius: 2, overflow: 'hidden' }}>
          {(() => {
            const total = item.macros.p + item.macros.c + item.macros.g || 1;
            return (
              <>
                <div style={{ width: `${(item.macros.p / total) * 100}%`, background: '#000', borderRadius: 2 }} />
                <div style={{ width: `${(item.macros.c / total) * 100}%`, background: '#6B6B6B', borderRadius: 2 }} />
                <div style={{ width: `${(item.macros.g / total) * 100}%`, background: '#B0B0B0', borderRadius: 2 }} />
              </>
            );
          })()}
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <span style={{ fontSize: 10, color: '#6B6B6B', fontWeight: 600 }}>P {item.macros.p}g</span>
          <span style={{ fontSize: 10, color: '#6B6B6B', fontWeight: 600 }}>C {item.macros.c}g</span>
          <span style={{ fontSize: 10, color: '#6B6B6B', fontWeight: 600 }}>G {item.macros.g}g</span>
        </div>
      </div>

      {/* Calorias — PRETAS */}
      <div style={{ flexShrink: 0, textAlign: 'right' }}>
        <div style={{
          fontSize: 15, fontWeight: 700, color: '#000',
          letterSpacing: '-0.02em', lineHeight: 1,
        }}>
          {item.calories}
        </div>
        <div style={{ fontSize: 10, color: '#B0B0B0', marginTop: 2 }}>kcal</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 3, justifyContent: 'flex-end', marginTop: 5 }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#16A34A' }} />
          <span style={{ fontSize: 10, color: '#B0B0B0' }}>{item.confidence}%</span>
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
    <div style={{ background: '#FFFFFF', minHeight: '100dvh', paddingBottom: 100 }}>
      <StatusBar />

      <div style={{ padding: '0 20px 10px' }}>
        <div style={{ fontSize: 13, color: '#B0B0B0', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2, paddingTop: 4 }}>
          Registro
        </div>
        <div style={{
          fontSize: 36, fontWeight: 800, color: '#000',
          letterSpacing: '-0.05em', lineHeight: 1.02, marginBottom: 18,
        }}>
          Histórico
        </div>

        {/* Stats row — valores em PRETO */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {[
            { v: todayKcal,                              l: 'kcal hoje'  },
            { v: yesterdayKcal.toLocaleString('pt-BR'),  l: 'kcal ontem' },
            { v: totalMeals,                             l: 'refeições'  },
          ].map(({ v, l }) => (
            <div
              key={l}
              style={{
                flex: 1, padding: '12px 12px',
                background: '#F5F5F5',
                borderRadius: 14,
              }}
            >
              <div style={{
                fontSize: 20, fontWeight: 800, color: '#000',
                letterSpacing: '-0.04em', lineHeight: 1,
              }}>
                {v}
              </div>
              <div style={{ fontSize: 10, color: '#B0B0B0', marginTop: 4 }}>{l}</div>
            </div>
          ))}
        </div>

        {/* Segmented control — light */}
        <div style={{
          display: 'flex', gap: 0,
          background: '#F5F5F5', borderRadius: 12, padding: 3,
        }}>
          {FILTERS.map(f => (
            <div
              key={f}
              onClick={() => setFilter(f)}
              style={{
                flex: 1, textAlign: 'center',
                padding: '7px 0', borderRadius: 10,
                fontSize: 13, fontWeight: 600, letterSpacing: '-0.02em',
                cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
                WebkitTapHighlightColor: 'transparent',
                background: filter === f ? '#FFFFFF' : 'transparent',
                color: filter === f ? '#000' : '#B0B0B0',
                boxShadow: filter === f ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              {f}
            </div>
          ))}
        </div>
      </div>

      {/* Hoje */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '14px 20px 8px',
      }}>
        <span style={{
          fontSize: 13, fontWeight: 600, color: '#B0B0B0',
          letterSpacing: '0.04em', textTransform: 'uppercase',
        }}>
          Hoje
        </span>
        <span style={{ fontSize: 13, color: '#000', fontWeight: 700, letterSpacing: '-0.02em' }}>
          {todayKcal} kcal
        </span>
      </div>
      <div style={{
        background: '#FFFFFF',
        borderRadius: 16,
        overflow: 'hidden',
        border: '0.5px solid rgba(0,0,0,0.08)',
        margin: '0 16px',
      }}>
        {today.map((m, i) => (
          <div key={m.id} style={{ borderTop: i > 0 ? '0.5px solid rgba(0,0,0,0.05)' : 'none' }}>
            <HistItem item={m} isLast={i === today.length - 1} />
          </div>
        ))}
      </div>

      {/* Ontem */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '18px 20px 8px',
      }}>
        <span style={{
          fontSize: 13, fontWeight: 600, color: '#B0B0B0',
          letterSpacing: '0.04em', textTransform: 'uppercase',
        }}>
          Ontem
        </span>
        <span style={{ fontSize: 13, color: '#000', fontWeight: 700, letterSpacing: '-0.02em' }}>
          {yesterdayKcal} kcal
        </span>
      </div>
      <div style={{
        background: '#FFFFFF',
        borderRadius: 16,
        overflow: 'hidden',
        border: '0.5px solid rgba(0,0,0,0.08)',
        margin: '0 16px',
      }}>
        {yesterday.map((m, i) => (
          <div key={m.id} style={{ borderTop: i > 0 ? '0.5px solid rgba(0,0,0,0.05)' : 'none' }}>
            <HistItem item={m} isLast={i === yesterday.length - 1} />
          </div>
        ))}
      </div>

      <div style={{ height: 24 }} />
    </div>
  );
}
