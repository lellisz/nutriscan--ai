import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import { getProfile, saveProfile } from '../../../lib/db';

// ── SVG Icons ──────────────────────────────────────────────

const IconBack = () => (
  <svg width="10" height="17" viewBox="0 0 10 17" fill="none">
    <path d="M8.5 1.5L1.5 8.5L8.5 15.5"
      stroke="var(--ns-text-primary)" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ── Field ──────────────────────────────────────────────────

function Field({ label, value, onChange, type = 'text', options = null, unit = '' }) {
  const inputStyle = {
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
    appearance: 'none',
    WebkitAppearance: 'none',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{
        fontSize: 13, fontWeight: 600,
        color: 'var(--ns-text-muted)',
        letterSpacing: '-0.01em',
      }}>
        {label}{unit ? ` (${unit})` : ''}
      </label>
      {options ? (
        <select
          value={value ?? ''}
          onChange={e => onChange(e.target.value)}
          style={inputStyle}
        >
          <option value="">Selecionar...</option>
          {options.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          value={value ?? ''}
          onChange={e => onChange(e.target.value)}
          style={inputStyle}
        />
      )}
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

export default function EditProfilePage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving]           = useState(false);
  const [success, setSuccess]         = useState('');
  const [error, setError]             = useState('');

  const [form, setForm] = useState({
    full_name:      '',
    age:            '',
    gender:         '',
    weight:         '',
    height:         '',
    activity_level: '',
    goal:           '',
  });

  // ── Load profile ──
  useEffect(() => {
    if (!user?.id) return;
    setLoadingData(true);
    getProfile(user.id)
      .then(data => {
        if (data) {
          setForm({
            full_name:      data.full_name      ?? '',
            age:            data.age            ?? '',
            gender:         data.gender         ?? '',
            weight:         data.weight         ?? '',
            height:         data.height         ?? '',
            activity_level: data.activity_level ?? '',
            goal:           data.goal           ?? '',
          });
        }
      })
      .catch(err => console.error('[EditProfile] Erro ao carregar perfil:', err))
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
      await saveProfile(user.id, {
        full_name:      form.full_name      || null,
        age:            form.age            ? Number(form.age)     : null,
        gender:         form.gender         || null,
        weight:         form.weight         ? Number(form.weight)  : null,
        height:         form.height         ? Number(form.height)  : null,
        activity_level: form.activity_level || null,
        goal:           form.goal           || null,
      });
      setSuccess('Dados salvos com sucesso.');
      setTimeout(() => navigate('/profile'), 1000);
    } catch (err) {
      console.error('[EditProfile] Erro ao salvar:', err);
      setError('Não foi possível salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  // ── Styles ──
  const cardStyle = {
    background: 'var(--ns-bg-card)',
    border: '0.5px solid var(--ns-border)',
    borderRadius: 'var(--ns-radius-lg)',
    padding: '16px 16px',
    boxShadow: 'var(--ns-shadow-sm)',
  };

  // ── Loading ──
  if (loadingData) {
    return (
      <div style={{ background: 'var(--ns-bg-primary)', minHeight: '100dvh' }}>
        {/* Header */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 100,
          background: 'var(--ns-bg-card)',
          borderBottom: '0.5px solid var(--ns-border)',
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '14px 20px',
        }}>
          <button
            onClick={() => navigate('/profile')}
            style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'var(--ns-bg-elevated)',
              border: '0.5px solid var(--ns-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', flexShrink: 0,
            }}
          >
            <IconBack />
          </button>
          <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--ns-text-primary)', letterSpacing: '-0.02em' }}>
            Dados pessoais
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
      <div style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'var(--ns-bg-card)',
        borderBottom: '0.5px solid var(--ns-border)',
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '14px 20px',
      }}>
        <button
          onClick={() => navigate('/profile')}
          style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'var(--ns-bg-elevated)',
            border: '0.5px solid var(--ns-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', flexShrink: 0,
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <IconBack />
        </button>
        <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--ns-text-primary)', letterSpacing: '-0.02em' }}>
          Dados pessoais
        </span>
      </div>

      {/* Formulario */}
      <div style={{ padding: '20px 20px 0' }}>

        {/* Identificação */}
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ns-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
          Identificação
        </div>
        <div style={{ ...cardStyle, marginBottom: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field
              label="Nome completo"
              value={form.full_name}
              onChange={set('full_name')}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field
                label="Idade"
                value={form.age}
                onChange={set('age')}
                type="number"
                unit="anos"
              />
              <Field
                label="Gênero"
                value={form.gender}
                onChange={set('gender')}
                options={[
                  { value: 'male',   label: 'Masculino' },
                  { value: 'female', label: 'Feminino'  },
                  { value: 'other',  label: 'Outro'     },
                ]}
              />
            </div>
          </div>
        </div>

        {/* Biometria */}
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ns-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
          Biometria
        </div>
        <div style={{ ...cardStyle, marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field
              label="Peso"
              value={form.weight}
              onChange={set('weight')}
              type="number"
              unit="kg"
            />
            <Field
              label="Altura"
              value={form.height}
              onChange={set('height')}
              type="number"
              unit="cm"
            />
          </div>
        </div>

        {/* Estilo de vida */}
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ns-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
          Estilo de vida
        </div>
        <div style={{ ...cardStyle, marginBottom: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field
              label="Nível de atividade"
              value={form.activity_level}
              onChange={set('activity_level')}
              options={[
                { value: 'sedentary',   label: 'Sedentário'          },
                { value: 'light',       label: 'Levemente ativo'     },
                { value: 'moderate',    label: 'Moderadamente ativo' },
                { value: 'active',      label: 'Muito ativo'         },
                { value: 'very_active', label: 'Extremamente ativo'  },
              ]}
            />
            <Field
              label="Objetivo"
              value={form.goal}
              onChange={set('goal')}
              options={[
                { value: 'cutting',  label: 'Perda de gordura'   },
                { value: 'bulking',  label: 'Ganho de massa'     },
                { value: 'maintain', label: 'Manutenção do peso' },
              ]}
            />
          </div>
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
