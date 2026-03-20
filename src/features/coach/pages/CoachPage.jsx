import { useState, useEffect, useRef, useCallback } from 'react';
import { StatusBar } from '../../../app/AppShell';
import { useAuth } from '../../auth/hooks/useAuth';
import { getSupabaseClient } from '../../../lib/supabase';

// ── Suggestion chips ────────────────────────────────────────
const SUGGESTIONS = [
  { icon: '📊', text: 'Como estou hoje?',  q: 'Como está meu progresso hoje? Estou dentro das minhas metas?' },
  { icon: '💪', text: 'Pré-treino',        q: 'O que devo comer antes do treino para ter mais energia e performance?' },
  { icon: '🍽️', text: 'O que comer?',     q: 'Considerando minhas metas, o que você sugere para a próxima refeição?' },
  { icon: '💡', text: 'Dica rápida',       q: 'Me dê uma dica prática e rápida de nutrição para hoje' },
  { icon: '⚖️', text: 'Evolução de peso', q: 'Como está minha evolução de peso? Estou no caminho certo?' },
];

const STAGES = {
  thinking:   'Pensando...',
  analyzing:  'Analisando seus dados...',
  generating: 'Gerando resposta...',
};

function buildSystemPrompt(profile, goals) {
  let prompt = `Você é NutriCoach, um assistente de nutrição inteligente e amigável.

FORMATO:
- Curto e direto (máximo 4 parágrafos)
- Use emojis relevantes (🍎🥗💪📊)
- Tom motivador e positivo
- Dê dicas práticas e acionáveis

IDIOMA: Português (pt-BR)`;

  if (profile) {
    prompt += `\n\n📋 PERFIL:`;
    if (profile.full_name) prompt += `\nNome: ${profile.full_name}`;
    if (profile.weight && profile.height) {
      const bmi = (profile.weight / Math.pow(profile.height / 100, 2)).toFixed(1);
      prompt += `\nPeso: ${profile.weight}kg | Altura: ${profile.height}cm | IMC: ${bmi}`;
    }
    if (profile.goal) {
      const goalMap = { cutting: 'Perder gordura 🔥', bulking: 'Ganhar massa 💪', maintain: 'Manutenção ⚖️' };
      prompt += `\nObjetivo: ${goalMap[profile.goal] || profile.goal}`;
    }
  }

  if (goals) {
    prompt += `\n\n🎯 METAS DIÁRIAS: ${goals.calories} kcal | ${goals.protein}g prot | ${goals.carbs}g carbs | ${goals.fat}g gord`;
  }

  return prompt;
}

// ── Typing indicator ────────────────────────────────────────
function TypingBubble({ stage }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 10 }}>
      <div style={{
        width: 30, height: 30, borderRadius: '50%',
        background: 'var(--ns-bg-1)', border: '0.5px solid var(--ns-sep)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 14, flexShrink: 0,
      }}>🥗</div>
      <div style={{
        background: 'var(--ns-bg-1)', border: '0.5px solid var(--ns-sep)',
        borderRadius: '18px 18px 18px 4px',
        padding: '12px 15px',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{ display: 'flex', gap: 5 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: 6, height: 6, borderRadius: '50%',
              background: 'var(--ns-t-4)',
              animation: `ns-pulse 1.2s ease ${i * 0.22}s infinite`,
            }} />
          ))}
        </div>
        <span style={{ fontSize: 11, color: 'var(--ns-t-5)', letterSpacing: '-0.01em' }}>
          {STAGES[stage] || STAGES.thinking}
        </span>
      </div>
    </div>
  );
}

// ── Message bubble ──────────────────────────────────────────
function Bubble({ role, content, time }) {
  const isUser = role === 'user';
  const isError = !isUser && content.startsWith('Não consegui');

  return (
    <div style={{
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      alignItems: 'flex-end',
      gap: 8,
      marginBottom: 10,
      animation: 'ns-fade-up 0.2s ease',
    }}>
      {!isUser && (
        <div style={{
          width: 30, height: 30, borderRadius: '50%',
          background: 'var(--ns-bg-1)', border: '0.5px solid var(--ns-sep)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, flexShrink: 0,
        }}>🥗</div>
      )}

      <div style={{ maxWidth: '76%' }}>
        <div style={{
          background: isUser ? 'var(--ns-t-1)' : isError ? '#180808' : 'var(--ns-bg-1)',
          color: isUser ? '#000' : isError ? '#ff6b6b' : 'var(--ns-t-1)',
          borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
          padding: '11px 15px',
          fontSize: 14,
          lineHeight: 1.55,
          letterSpacing: '-0.01em',
          border: isUser ? 'none' : `0.5px solid ${isError ? '#3a1010' : 'var(--ns-sep)'}`,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}>
          {content}
        </div>

        <div style={{
          fontSize: 10, color: 'var(--ns-t-6)', marginTop: 3,
          textAlign: isUser ? 'right' : 'left',
        }}>
          {time}
        </div>
      </div>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────
export default function CoachPage() {
  const { user } = useAuth();
  const [messages, setMessages]         = useState([]);
  const [input, setInput]               = useState('');
  const [loading, setLoading]           = useState(false);
  const [loadingStage, setLoadingStage] = useState('thinking');
  const [systemPrompt, setSystemPrompt] = useState(
    'Você é NutriCoach, assistente de nutrição. Responda em português (pt-BR).'
  );

  const loadingRef  = useRef(false);
  const historyRef  = useRef([]);
  const bottomRef   = useRef(null);
  const inputRef    = useRef(null);

  const now = () =>
    new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      try {
        const client = getSupabaseClient();
        const [{ data: profile }, { data: goals }] = await Promise.all([
          client.from('profiles').select('*').eq('user_id', user.id).maybeSingle(),
          client.from('daily_goals').select('*').eq('user_id', user.id).maybeSingle(),
        ]);
        setSystemPrompt(buildSystemPrompt(profile, goals));
      } catch (e) {
        console.warn('[Coach] Could not load profile:', e.message);
      }
    })();
  }, [user?.id]);

  const sendMessage = useCallback(async (text) => {
    const trimmed = text?.trim();
    if (!trimmed || loadingRef.current) return;

    loadingRef.current = true;
    setInput('');
    setLoading(true);
    setLoadingStage('thinking');

    const userMsg = { id: `u-${Date.now()}`, role: 'user', content: trimmed, time: now() };
    setMessages(prev => [...prev, userMsg]);

    const newHistory = [...historyRef.current, { role: 'user', content: trimmed }];
    historyRef.current = newHistory;

    const t1 = setTimeout(() => setLoadingStage('analyzing'), 700);
    const t2 = setTimeout(() => setLoadingStage('generating'), 2100);

    try {
      const client = getSupabaseClient();
      const { data, error: fnError } = await client.functions.invoke('coach', {
        body: {
          messages: newHistory.slice(-10),
          system: systemPrompt,
          max_tokens: 800,
        },
      });

      if (fnError) throw new Error(fnError.message);

      const reply = data?.content?.[0]?.text;
      if (!reply) {
        throw new Error(
          data?.error ||
          'Resposta vazia. Verifique se a edge function "coach" está deployada no Supabase com a ANTHROPIC_API_KEY configurada nos secrets.'
        );
      }

      historyRef.current = [...newHistory, { role: 'assistant', content: reply }];

      setMessages(prev => [...prev, {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: reply,
        time: now(),
      }]);

    } catch (err) {
      historyRef.current = historyRef.current.slice(0, -1);
      setMessages(prev => [...prev, {
        id: `e-${Date.now()}`,
        role: 'assistant',
        content: `Não consegui processar sua mensagem.\n\n${err.message}`,
        time: now(),
      }]);
    }

    clearTimeout(t1);
    clearTimeout(t2);
    loadingRef.current = false;
    setLoading(false);
    setLoadingStage('thinking');
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [systemPrompt]);

  const clearChat = () => {
    historyRef.current = [];
    setMessages([]);
  };

  const isEmpty = messages.length === 0;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: 'calc(100vh - 84px)',
      background: 'var(--ns-bg)',
    }}>
      <StatusBar />

      {/* ── Header ── */}
      <div style={{
        padding: '10px var(--ns-page-px) 12px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '0.5px solid var(--ns-sep-subtle)', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 42, height: 42, borderRadius: '50%',
            background: 'var(--ns-bg-1)', border: '0.5px solid var(--ns-sep)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, position: 'relative',
          }}>
            🥗
            <div style={{
              position: 'absolute', bottom: 1, right: 1,
              width: 10, height: 10, borderRadius: '50%',
              background: loading ? '#ff9500' : '#32d74b',
              border: '2px solid var(--ns-bg)',
              transition: 'background .4s',
            }} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--ns-t-5)', letterSpacing: '-0.01em', marginBottom: 1 }}>
              Assistente IA
            </div>
            <div style={{ fontSize: 19, fontWeight: 700, color: 'var(--ns-t-primary)', letterSpacing: '-0.04em', lineHeight: 1.1 }}>
              Coach Nutri
            </div>
          </div>
        </div>

        {messages.length > 0 && (
          <button
            onClick={clearChat}
            style={{
              background: 'transparent', border: '0.5px solid var(--ns-sep)',
              borderRadius: 10, padding: '6px 14px',
              fontSize: 12, color: 'var(--ns-t-5)', cursor: 'pointer',
              fontFamily: 'inherit', letterSpacing: '-0.01em',
            }}
          >
            Limpar
          </button>
        )}
      </div>

      {/* ── Messages ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px var(--ns-page-px) 6px', scrollbarWidth: 'none' }}>

        {isEmpty && (
          <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            minHeight: '28vh', textAlign: 'center', padding: '24px 0 12px',
          }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'var(--ns-bg-1)', border: '0.5px solid var(--ns-sep)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 34, marginBottom: 14,
            }}>🥗</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--ns-t-primary)', letterSpacing: '-0.04em', marginBottom: 6 }}>
              Coach Nutri
            </div>
            <div style={{ fontSize: 14, color: 'var(--ns-t-4)', lineHeight: 1.5, maxWidth: 260 }}>
              Seu assistente de nutrição personalizado. Pergunte sobre dieta, metas e progresso.
            </div>
          </div>
        )}

        {messages.map(msg => <Bubble key={msg.id} {...msg} />)}
        {loading && <TypingBubble stage={loadingStage} />}

        <div ref={bottomRef} />
      </div>

      {/* ── Suggestion chips ── */}
      {isEmpty && !loading && (
        <div style={{ overflowX: 'auto', scrollbarWidth: 'none', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: 8, padding: '0 var(--ns-page-px) 12px' }}>
            {SUGGESTIONS.map(s => (
              <button
                key={s.q}
                onClick={() => sendMessage(s.q)}
                style={{
                  background: 'var(--ns-bg-1)', border: '0.5px solid var(--ns-sep)',
                  borderRadius: 20, padding: '8px 14px',
                  fontSize: 13, color: 'var(--ns-t-2)', whiteSpace: 'nowrap',
                  cursor: 'pointer', fontFamily: 'inherit',
                  letterSpacing: '-0.01em',
                  display: 'flex', alignItems: 'center', gap: 5,
                }}
              >
                <span>{s.icon}</span>{s.text}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Input ── */}
      <div style={{
        padding: '10px var(--ns-page-px) 16px',
        borderTop: '0.5px solid var(--ns-sep-subtle)',
        flexShrink: 0, background: 'var(--ns-bg)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'flex-end', gap: 10,
          background: 'var(--ns-bg-1)', borderRadius: 22,
          padding: '10px 10px 10px 16px',
          border: '0.5px solid var(--ns-sep)',
        }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage(input);
              }
            }}
            onInput={e => {
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
            }}
            placeholder="Pergunte ao Coach Nutri..."
            disabled={loading}
            rows={1}
            style={{
              flex: 1, background: 'transparent', border: 'none',
              outline: 'none', resize: 'none', overflow: 'hidden',
              fontSize: 15, color: 'var(--ns-t-primary)', fontFamily: 'inherit',
              letterSpacing: '-0.01em', lineHeight: 1.5,
              maxHeight: 100, caretColor: 'var(--ns-t-2)',
            }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            style={{
              width: 36, height: 36, borderRadius: '50%',
              background: input.trim() && !loading ? 'var(--ns-t-1)' : 'var(--ns-bg-2)',
              border: 'none',
              cursor: input.trim() && !loading ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, transition: 'background .15s',
            }}
          >
            {loading ? (
              <div style={{
                width: 14, height: 14,
                border: '2px solid var(--ns-bg-3)', borderTopColor: 'var(--ns-t-3)',
                borderRadius: '50%', animation: 'ns-rotate 0.7s linear infinite',
              }} />
            ) : (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 7h10M7 2l5 5-5 5"
                  stroke={input.trim() ? '#000' : 'var(--ns-t-5)'}
                  strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
        </div>
        <div style={{ fontSize: 10, color: 'var(--ns-sep)', textAlign: 'center', marginTop: 8, letterSpacing: '-0.01em' }}>
          Coach Nutri · Powered by Groq
        </div>
      </div>
    </div>
  );
}
