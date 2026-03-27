import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import PraxiAvatar from '../../../components/praxi/PraxiAvatar';
import { getNudge, dismissNudge } from '../../../lib/coach/proactive-nudges';
import {
  getDailyGoals,
  getHydrationToday,
  listScanHistory,
} from '../../../lib/db';

// PraxiAvatar aceita os estados: happy, thinking, celebrating, cooking, sleeping, waving, worried, proud.
// Usa "thinking" para o nudge: sugere que o Praxi está avaliando a situação do usuário.

export default function ProactiveNudgeBanner({ streakDays = 0 }) {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [nudge, setNudge]     = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;

    async function fetchNudge() {
      try {
        const hour = new Date().getHours();
        const name = profile?.full_name?.split(' ')[0] ?? 'você';

        const [goals, hydration, scans] = await Promise.all([
          getDailyGoals(user.id).catch(() => null),
          getHydrationToday(user.id).catch(() => null),
          listScanHistory(user.id, 50).catch(() => []),
        ]);

        // Filtrar refeições do dia atual usando formato YYYY-MM-DD (fr-CA)
        // para evitar problemas de fuso horário com toISOString()
        const todayStr = new Date().toLocaleDateString('fr-CA');
        const todayScans = (scans || []).filter(s => {
          if (!s.scanned_at) return false;
          return new Date(s.scanned_at).toLocaleDateString('fr-CA') === todayStr;
        });

        const caloriesConsumed = todayScans.reduce((acc, s) => acc + (s.calories || 0), 0);
        const proteinConsumed  = todayScans.reduce((acc, s) => acc + (s.protein  || 0), 0);

        // Última refeição registrada ontem — usada pelo nudge de re-add (tipo 5)
        const yesterdayStr = new Date(Date.now() - 86400000).toLocaleDateString('fr-CA');
        const yesterdayScans = (scans || []).filter(s => {
          if (!s.scanned_at) return false;
          return new Date(s.scanned_at).toLocaleDateString('fr-CA') === yesterdayStr;
        });
        const lastMealName = yesterdayScans.length > 0 ? yesterdayScans[0].food_name : undefined;

        // hydration_logs armazena número de copos (glasses); cada copo = 250 ml
        const hydrationConsumed = (hydration?.glasses ?? 0) * 250;

        const result = await getNudge({
          name,
          hour,
          caloriesGoal:      goals?.calories ?? 2000,
          caloriesConsumed,
          proteinGoal:       goals?.protein  ?? 150,
          proteinConsumed,
          hydrationGoal:     goals?.water    ?? 2000,
          hydrationConsumed,
          streakDays,
          todayMealsCount:   todayScans.length,
          lastMealName,
        });

        if (!cancelled && result) {
          setNudge(result);
          // Pequeno delay para garantir que o DOM já montou antes de animar
          setTimeout(() => setVisible(true), 50);
        }
      } catch (err) {
        // Se qualquer etapa falhar, o banner simplesmente não aparece.
        // Não deve impactar o restante do dashboard.
        console.warn('[ProactiveNudgeBanner] Erro ao buscar nudge:', err);
      }
    }

    fetchNudge();
    return () => { cancelled = true; };
  }, [user?.id]);

  function handleDismiss() {
    dismissNudge();
    setVisible(false);
    // Aguardar a transição de saída antes de desmontar o elemento
    setTimeout(() => setNudge(null), 300);
  }

  function handleAction() {
    if (nudge?.type === 'streak' || nudge?.type === 'readd') {
      navigate('/scan');
    } else if (nudge?.type === 'hydration') {
      // Scroll para o topo onde ficam os controles de hidratação do dashboard
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    // Para tipos calorie e protein não há ação direta — apenas dismiss
    handleDismiss();
  }

  if (!nudge) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        background: '#F0FDF4',
        border: '0.5px solid rgba(45,143,94,0.20)',
        borderRadius: 14,
        padding: '12px 14px',
        marginBottom: 12,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(-8px)',
        // A transição é desativada via media query no CSS global quando o usuário
        // prefere movimento reduzido (prefers-reduced-motion: reduce)
        transition: 'opacity 0.3s ease, transform 0.3s ease',
      }}
    >
      {/* Avatar miniatura do Praxi — estado "thinking" indica avaliação proativa */}
      <div style={{ flexShrink: 0, marginTop: 2 }}>
        <PraxiAvatar state="thinking" size="sm" />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          margin: 0,
          fontSize: 13,
          color: 'var(--ns-text-primary)',
          lineHeight: 1.45,
          fontWeight: 500,
        }}>
          {nudge.message}
        </p>

        {nudge.actionLabel && (
          <button
            onClick={handleAction}
            style={{
              marginTop: 8,
              background: 'var(--ns-accent)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '5px 12px',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {nudge.actionLabel}
          </button>
        )}
      </div>

      <button
        onClick={handleDismiss}
        aria-label="Dispensar"
        style={{
          flexShrink: 0,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 4,
          color: 'var(--ns-text-muted)',
          fontSize: 16,
          lineHeight: 1,
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        &times;
      </button>
    </div>
  );
}
