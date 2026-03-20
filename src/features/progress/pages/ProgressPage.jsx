import { StatusBar } from '../../../app/AppShell';

const WEEK = [1650, 1840, 980, 2100, 1720, 1980, 535];
const DAYS  = ['Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom', 'Seg'];

function KpiCard({ label, value, trend, color, miniData }) {
  const max = Math.max(...miniData, 1);
  return (
    <div className="ns-kpi ns-shimmer">
      <div className="ns-kpi-label">{label}</div>
      <div className="ns-kpi-value">{value}</div>
      <div className="ns-badge" style={{ marginTop: 6 }}>
        <span className="ns-badge-text">{trend}</span>
      </div>
      <div className="ns-kpi-mini-bars">
        {miniData.map((v, i) => (
          <div key={i} style={{
            flex: 1, borderRadius: '2px 2px 0 0',
            background: i === miniData.length - 1 ? color : '#2c2c2e',
            height: Math.max(3, (v / max) * 18),
          }} />
        ))}
      </div>
    </div>
  );
}

function BarChart({ data, days, goal }) {
  const max = Math.max(...data, goal);
  return (
    <div>
      <div style={{ height: 0.5, background: '#2c2c2e', position: 'relative', marginBottom: 10 }}>
        <div style={{ position: 'absolute', right: 0, top: -9, fontSize: 8, color: '#48484a', fontWeight: 600 }}>
          meta {goal.toLocaleString('pt-BR')}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 72, marginBottom: 6 }}>
        {data.map((v, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
            <div style={{
              width: '100%', borderRadius: '5px 5px 0 0',
              height: `${(v / max) * 100}%`,
              background: i === data.length - 1 ? '#ebebf0' : '#2c2c2e',
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '30%', background: 'rgba(255,255,255,.05)' }} />
            </div>
            <div style={{ fontSize: 9, color: i === data.length - 1 ? '#aeaeb2' : '#48484a', marginTop: 5, fontWeight: 500 }}>
              {days[i]}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MacroRow({ color, label, value, unit, pct }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
      <div style={{ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0 }} />
      <div style={{ fontSize: 12, color: '#8e8e93', width: 68, flexShrink: 0, letterSpacing: '-0.01em' }}>{label}</div>
      <div className="ns-bar-track" style={{ flex: 1 }}>
        <div className="ns-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#ebebf0', width: 34, textAlign: 'right', letterSpacing: '-0.02em' }}>{value}{unit}</div>
      <div style={{ fontSize: 10, color: '#48484a', width: 26, textAlign: 'right' }}>{pct}%</div>
    </div>
  );
}

const NUTRIENTS = [
  { key: 'Sódio',      value: '1.840mg', meta: 'meta <2300' },
  { key: 'Fibras',     value: '24g',     meta: 'meta 30g'   },
  { key: 'Açúcares',   value: '38g',     meta: 'meta <50g'  },
  { key: 'Colesterol', value: '180mg',   meta: 'meta <300'  },
  { key: 'Ferro',      value: '12mg',    meta: 'meta 18mg'  },
];

export default function ProgressPage() {
  const avg = Math.round(WEEK.reduce((a, b) => a + b, 0) / WEEK.length);

  return (
    <div className="ns-page">
      <StatusBar />

      <div className="ns-page-header" style={{ paddingBottom: 12 }}>
        <div className="ns-eyebrow">Análise</div>
        <div className="ns-page-title">Progresso</div>
      </div>

      {/* KPI grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7, padding: '0 18px 10px' }}>
        <KpiCard label="Registros"   value="12"     trend="↑ +3"         color="#ebebf0" miniData={[4,7,5,9,6,8,3]}  />
        <KpiCard label="Perdido"     value="1.2kg"  trend="↓ no ritmo"   color="#aeaeb2" miniData={[1,2,2,3,2,4,3]}  />
        <KpiCard label="Déficit"     value="430"    trend="kcal abaixo"  color="#8e8e93" miniData={[8,6,9,5,7,4,6]}  />
        <KpiCard label="Hidratação"  value="1.8L"   trend="69% meta"     color="#636366" miniData={[5,7,4,8,6,9,5]}  />
      </div>

      {/* Bar chart */}
      <div className="ns-card-sm ns-shimmer" style={{ padding: '14px 16px', margin: '0 18px 9px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', letterSpacing: '-0.02em' }}>Calorias · 7 dias</div>
          <div style={{ fontSize: 12, color: '#48484a', letterSpacing: '-0.01em' }}>
            Média <span style={{ color: '#aeaeb2', fontWeight: 600 }}>{avg.toLocaleString('pt-BR')}</span>
          </div>
        </div>
        <BarChart data={WEEK} days={DAYS} goal={2732} />
      </div>

      {/* Macro distribution */}
      <div className="ns-card-sm ns-shimmer" style={{ padding: '14px 16px', margin: '0 18px 9px' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', letterSpacing: '-0.02em', marginBottom: 14 }}>
          Distribuição · macros
        </div>
        <MacroRow color="#ebebf0" label="Proteína"    value={142} unit="g" pct={32} />
        <MacroRow color="#aeaeb2" label="Carboidrato" value={218} unit="g" pct={48} />
        <MacroRow color="#636366" label="Gordura"     value={62}  unit="g" pct={20} style={{ marginBottom: 0 }} />
      </div>

      {/* Nutrient table */}
      <div className="ns-card-sm ns-shimmer" style={{ padding: '14px 16px', margin: '0 18px 4px' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', letterSpacing: '-0.02em', marginBottom: 12 }}>
          Nutrientes · média 7 dias
        </div>
        {NUTRIENTS.map((n, i) => (
          <div key={n.key} className="ns-nutrient-row" style={i === NUTRIENTS.length - 1 ? { borderBottom: 'none' } : {}}>
            <span className="ns-nutrient-key">{n.key}</span>
            <span className="ns-nutrient-meta">{n.meta}</span>
            <span className="ns-nutrient-value">{n.value}</span>
          </div>
        ))}
      </div>

      <div style={{ height: 4 }} />
    </div>
  );
}