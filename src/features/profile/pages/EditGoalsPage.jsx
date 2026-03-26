import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import { getDailyGoals, saveDailyGoals } from '../../../lib/db';

// ── SVG Icons ──────────────────────────────────────────────

const IconBack = () => (
  <svg width="10" height="17" viewBox="0 0 10 17" fill="none">
    <path d="M8.5 1.5L1.5 8.5L8.5 15.5"
      stroke="var(--ns-text-primary)" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ── Field ──────────────────────────────────────────────────

function Field({ label, value, onChange, unit = '' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{
        fontSize: 13, fontWeight: 600,
        color: 'var(--ns-text-muted)',
        letterSpacing: '-0.01em',
      }}>
        {label}{unit ? ` (${unit})` : ''}
      </label>
      <input
        type="number"
        value={value ?? ''}
        onChange={e => onChange(e.target.value)}
        style={{
          background: 'var(--ns-bg-input)',
          border: '0.5px solid var(--ns-border)',
          borderRadius: 10,
          padding: '11px 12px',
          fontSize: 15,
          color: 'var(--ns-text-primary)',
          fontFamily: 'inherit',
          outline: 'none',
          width: '100%',
          boxSizing: 'border-box',
        }}
      />
    </div>
  );
}

// ── Inline messages ────────────────────────────────────────

function SuccessMsg({ msg }) {
  if (!msg) return null;
  return (
    <div style={{
      background: 'var(--ns-success-bg)',
      border: '0.5px solid rgba(45,143,94,0.25)',
      borderRadius: 10,
      padding: '10px 14px',
      fontSize: 13,
      fontWeight: 500,
      color: 'var(--ns-success)',
    }}>
      {msg}
    </div>
  );
}

function ErrorMsg({ msg }) {
  if (!msg) return null;
  return (
    <div style={{
      background: 'var(--ns-danger-bg)',
      border: '0.5px solid var(--ns-danger)',
      borderRadius: 10,
      padding: '10px 14px',
      fontSize: 13,
      fontWeight: 500,
      color: 'var(--ns-danger)',
    }}>
      {msg}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────

export default function EditGoalsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving]           = useState(false);
  const [success, setSuccess]         = useState('');
  const [error, setError]             = useState('');

  const [form, setForm] = useState({
    calories: '',
    protein:  '',
    carbs:    '',
    fat:      '',
    fiber:    '',
    water:    '',
  });

  // ── Load goals ──
  useEffect(() => {
    if (!user?.id) return;
    setLoadingData(true);
    getDailyGoals(user.id)
      .then(data => {
        if (data) {
          setForm({
            calories: data.calories ?? '',
            protein:  data.protein  ?? '',
            carbs:    data.carbs    ?? '',
            fat:      data.fat      ?? '',
            fiber:    data.fiber    ?? '',
            water:    data.water    ?? '',
          });
        }
      })
      .catch(err => console.error('[EditGoals] Erro ao carregar metas:', err))
      .finally(() => setLoadingData(false));
  }, [user?.id]);

  // ── Set field helper ──
  const set = (key) => (val) => setForm(f => ({ ...f, [key]: val }));

  // ── Save handler ──
  const handleSave = async () => {
    if (saving || !user?.id) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await saveDailyGoals(user.id, {
        calories: form.calories ? Number(form.calories) : null,
        protein:  form.protein  ? Number(form.protein)  : null,
        carbs:    form.carbs    ? Number(form.carbs)    : null,
        fat:      form.fat      ? Number(form.fat)      : null,
        fiber:    form.fiber    ? Number(form.fiber)    : null,
        water:    form.water    ? Number(form.water)    : null,
      });
      setSuccess('Metas salvas com sucesso.');
      setTimeout(() => navigate('/profile'), 1000);
    } catch (err) {
      console.error('[EditGoals] Erro ao salvar:', err);
      setError('Não foi possível salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  // ── Styles ──
  const headerStyle = {
    position: 'sticky', top: 0, zIndex: 100,
    background: 'var(--ns-bg-card)',
    borderBottom: '0.5px solid var(--ns-border)',
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '14px 20px',
  };

  const backBtnStyle = {
    width: 36, height: 36, borderRadius: 10,
    background: 'var(--ns-bg-elevated)',
    border: '0.5px solid var(--ns-border)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', flexShrink: 0,
    WebkitTapHighlightColor: 'transparent',
  };

  const cardStyle = {
    background: 'var(--ns-bg-card)',
    border: '0.5px solid var(--ns-border)',
    borderRadius: 'var(--ns-radius-lg)',
    padding: '16px 16px',
    boxShadow: 'var(--ns-shadow-sm)',
  };

  const sectionLabelStyle = {
    fontSize: 11, fontWeight: 600,
    color: 'var(--ns-text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: 8,
  };

  // ── Loading ──
  if (loadingData) {
    return (
      <div style={{ background: 'var(--ns-bg-primary)', minHeight: '100dvh' }}>
        <div style={headerStyle}>
          <button onClick={() => navigate('/profile')} style={backBtnStyle}>
            <IconBack />
          </button>
          <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--ns-text-primary)', letterSpacing: '-0.02em' }}>
            Metas nutricionais
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
          <div className="ns-spinner ns-spinner-lg" />
        </div>
      </div>
    );
  }

  // ── Render ──
  return (
    <div style={{ background: 'var(--ns-bg-primary)', minHeight: '100dvh', paddingBottom: 100 }}>

      {/* Header fixo */}
      <div style={headerStyle}>
        <button onClick={() => navigate('/profile')} style={backBtnStyle}>
          <IconBack />
        </button>
        <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--ns-text-primary)', letterSpacing: '-0.02em' }}>
          Metas nutricionais
        </span>
      </div>

      {/* Formulario */}
      <div style={{ padding: '20px 20px 0' }}>

        {/* Energia */}
        <div style={sectionLabelStyle}>Energia</div>
        <div style={{ ...cardStyle, marginBottom: 16 }}>
          <Field
            label="Calorias"
            value={form.calories}
            onChange={set('calories')}
            unit="kcal"
          />
        </div>

        {/* Macronutrientes */}
        <div style={sectionLabelStyle}>Macronutrientes</div>
        <div style={{ ...cardStyle, marginBottom: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field
                label="Proteína"
                value={form.protein}
                onChange={set('protein')}
                unit="g"
              />
              <Field
                label="Carboidratos"
                value={form.carbs}
                onChange={set('carbs')}
                unit="g"
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field
                label="Gordura"
                value={form.fat}
                onChange={set('fat')}
                unit="g"
              />
              <Field
                label="Fibra"
                value={form.fiber}
                onChange={set('fiber')}
                unit="g"
              />
            </div>
          </div>
        </div>

        {/* Hidratação */}
        <div style={sectionLabelStyle}>Hidratação</div>
        <div style={{ ...cardStyle, marginBottom: 16 }}>
          <Field
            label="Agua"
            value={form.water}
            onChange={set('water')}
            unit="ml"
          />
        </div>

        {/* Mensagens */}
        {success && <div style={{ marginBottom: 12 }}><SuccessMsg msg={success} /></div>}
        {error   && <div style={{ marginBottom: 12 }}><ErrorMsg msg={error} /></div>}

        {/* Botao salvar */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="ns-btn ns-btn-primary"
          style={{
            width: '100%', height: 50, borderRadius: 14,
            fontSize: 16, fontWeight: 600, letterSpacing: '-0.01em',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            opacity: saving ? 0.7 : 1,
            cursor: saving ? 'default' : 'pointer',
            border: 'none',
          }}
        >
          {saving ? (
            <>
              <div style={{
                width: 16, height: 16,
                border: '2px solid rgba(255,255,255,0.4)',
                borderTopColor: '#FFF',
                borderRadius: '50%',
                animation: 'ns-spin 0.7s linear infinite',
              }} />
              Salvando...
            </>
          ) : 'Salvar'}
        </button>

      </div>
    </div>
  );
}
