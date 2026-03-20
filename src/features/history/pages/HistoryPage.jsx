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
    <div className="ns-hist-item ns-shimmer">
      <div className="ns-hist-thumb">{item.emoji}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="ns-hist-name">{item.name}</div>
        <div className="ns-hist-meta">
          <span className="ns-hist-time">{item.time}</span>
          <span className="ns-hist-sep" />
          <span className="ns-hist-cat">{item.category}</span>
        </div>
        {/* Proportional macro bars */}
        <div style={{ display: 'flex', gap: 2, height: 3, marginTop: 6, borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ width: `${(item.macros.p / total) * 100}%`, background: 'var(--ns-macro-prot)', borderRadius: 2 }} />
          <div style={{ width: `${(item.macros.c / total) * 100}%`, background: 'var(--ns-macro-carb)', borderRadius: 2 }} />
          <div style={{ width: `${(item.macros.g / total) * 100}%`, background: 'var(--ns-macro-fat)', borderRadius: 2 }} />
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <span style={{ fontSize: 10, color: 'var(--ns-t-5)', letterSpacing: '-0.01em' }}>P {item.macros.p}g</span>
          <span style={{ fontSize: 10, color: 'var(--ns-t-5)', letterSpacing: '-0.01em' }}>C {item.macros.c}g</span>
          <span style={{ fontSize: 10, color: 'var(--ns-t-5)', letterSpacing: '-0.01em' }}>G {item.macros.g}g</span>
        </div>
      </div>
      <div style={{ flexShrink: 0, textAlign: 'right' }}>
        <div className="ns-hist-kcal">{item.calories}</div>
        <div style={{ fontSize: 9, color: 'var(--ns-t-5)', marginTop: 1 }}>kcal</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 3, justifyContent: 'flex-end', marginTop: 4 }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#32d74b' }} />
          <span style={{ fontSize: 9, color: 'var(--ns-t-4)', letterSpacing: '-0.01em' }}>{item.confidence}%</span>
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
    <div className="ns-page">
      <StatusBar />

      <div className="ns-page-header" style={{ paddingBottom: 10 }}>
        <div className="ns-eyebrow">Registro</div>
        <div className="ns-page-title" style={{ marginBottom: 14 }}>Histórico</div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
          {[
            [todayKcal, 'kcal hoje'],
            [yesterdayKcal.toLocaleString('pt-BR'), 'kcal ontem'],
            [totalMeals, 'refeições'],
          ].map(([v, l]) => (
            <div key={l} className="ns-card-sm ns-shimmer" style={{ flex: 1, padding: '10px 12px' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--ns-t-primary)', letterSpacing: '-0.04em', lineHeight: 1 }}>{v}</div>
              <div style={{ fontSize: 9, color: 'var(--ns-t-5)', marginTop: 3, letterSpacing: '-0.01em' }}>{l}</div>
            </div>
          ))}
        </div>

        {/* Segmented control */}
        <div className="ns-segment">
          {FILTERS.map(f => (
            <div
              key={f}
              className={`ns-segment-item${filter === f ? ' ns-segment-item--active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f}
            </div>
          ))}
        </div>
      </div>

      {/* Today */}
      <div className="ns-section-header" style={{ marginTop: 6 }}>
        <span className="ns-section-title">Hoje</span>
        <span className="ns-section-meta">{todayKcal} kcal</span>
      </div>
      {today.map(m => <HistItem key={m.id} item={m} />)}

      {/* Yesterday */}
      <div className="ns-section-header" style={{ marginTop: 10 }}>
        <span className="ns-section-title">Ontem</span>
        <span className="ns-section-meta">{yesterdayKcal} kcal</span>
      </div>
      {yesterday.map(m => <HistItem key={m.id} item={m} />)}

      <div style={{ height: 8 }} />
    </div>
  );
}
