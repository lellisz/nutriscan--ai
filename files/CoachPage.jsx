import { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import { StatusBar } from '../../app/AppShell';
import { useAuth } from '../auth/hooks/useAuth';

// ── System prompt ──────────────────────────────────────────
const buildSystemPrompt = (profile) => `
Você é o Coach Nutri, assistente de nutrição inteligente do NutriScan.
Seu tom é profissional, direto e encorajador — como um nutricionista pessoal.

Perfil do usuário:
- Nome: ${profile?.name ?? 'Felipe'}
- Objetivo: ${profile?.goal ?? 'manutenção'}
- Meta calórica: ${profile?.daily_goals?.calories ?? 2732} kcal/dia
- Meta proteína: ${profile?.daily_goals?.protein ?? 150}g/dia
- Meta carboidrato: ${profile?.daily_goals?.carbs ?? 260}g/dia
- Meta gordura: ${profile?.daily_goals?.fat ?? 82}g/dia
- Peso: ${profile?.weight ?? 75}kg | Altura: ${profile?.height ?? 175}cm

Diretrizes:
- Responda sempre em português do Brasil
- Seja conciso: máximo 3 parágrafos por resposta
- Use dados do perfil para personalizar conselhos
- Para perguntas fora de nutrição/saúde, redirecione gentilmente
- Nunca invente dados clínicos ou substitua consulta médica
- Quando relevante, mencione macros, calorias e horários
`.trim();

// ── Suggested prompts ──────────────────────────────────────
const SUGGESTIONS = [
  'Como estou hoje?',
  'O que comer no pré-treino?',
  'Ideias de jantar proteico',
  'Estou abaixo da meta de água',
  'Me motiva a continuar',
];

// ── Typing indicator ───────────────────────────────────────
function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center', padding: '2px 0' }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: 6, height: 6, borderRadius: '50%',
          background: '#48484a',
          animation: `ns-typing-dot 1.2s ease-in-out ${i * 0.2}s infinite`,
        }} />
      ))}
    </div>
  );
}

// ── Message bubble ─────────────────────────────────────────
function Bubble({ msg }) {
  const isUser = msg.role === 'user';
  const isError = msg.error;

  return (
    <div style={{
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      marginBottom: 8,
      animation: 'ns-fade-up 0.2s ease',
    }}>
      {!isUser && (
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: '#1c1c1e', border: '.5px solid #2c2c2e',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, flexShrink: 0, marginRight: 8, marginTop: 2,
        }}>
          🥗
        </div>
      )}
      <div style={{ maxWidth: '75%' }}>
        <div style={{
          background: isUser ? '#ebebf0' : isError ? '#1a0a0a' : '#1c1c1e',
          color: isUser ? '#000' : isError ? '#636366' : '#ebebf0',
          borderRadius: isUser
            ? '18px 18px 4px 18px'
            : '18px 18px 18px 4px',
          padding: '11px 14px',
          fontSize: 14,
          lineHeight: 1.55,
          letterSpacing: '-0.01em',
          border: isError ? '.5px solid #2c1010' : 'none',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {!isUser && !isError && (
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0,
              height: '40%',
              background: 'linear-gradient(180deg,rgba(255,255,255,.03),transparent)',
              pointerEvents: 'none',
            }} />
          )}
          {msg.typing ? <TypingDots /> : msg.content}
        </div>
        <div style={{
          fontSize: 10, color: '#3a3a3c', marginTop: 3,
          textAlign: isUser ? 'right' : 'left',
          letterSpacing: '-0.01em', paddingLeft: isUser ? 0 : 2,
        }}>
          {msg.time}
        </div>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────
export default function CoachPage() {
  const { profile } = useAuth();
  const [messages, setMessages] = useState([
    {
      id: 0,
      role: 'assistant',
      content: `Olá, ${profile?.name?.split(' ')[0] ?? 'Felipe'}! 👋\n\nSou seu Coach Nutri. Posso te ajudar com dicas nutricionais, análise das suas refeições e estratégias para atingir suas metas. Como posso te ajudar hoje?`,
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    }
  ]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [showSuggest, setShowSuggest] = useState(true);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);
  const historyRef = useRef([]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const now = () =>
    new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const sendMessage = useCallback(async (text) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setInput('');
    setShowSuggest(false);

    const userMsg = {
      id: Date.now(),
      role: 'user',
      content: trimmed,
      time: now(),
    };

    const typingMsg = {
      id: Date.now() + 1,
      role: 'assistant',
      typing: true,
      time: now(),
    };

    setMessages(prev => [...prev, userMsg, typingMsg]);

    // Build history for API
    const history = [
      ...historyRef.current,
      { role: 'user', content: trimmed },
    ];
    historyRef.current = history;

    try {
      // Chama via Supabase Edge Function — sem CORS
      const { data, error: fnError } = await supabase.functions.invoke('coach', {
        body: {
          messages: history,
          system: buildSystemPrompt(profile),
          max_tokens: 1000,
        },
      });

      if (fnError) throw new Error(fnError.message);

      const reply = data?.content?.[0]?.text;
      if (!reply) throw new Error('Resposta vazia da IA');

      historyRef.current = [
        ...history,
        { role: 'assistant', content: reply },
      ];

      setMessages(prev => [
        ...prev.filter(m => !m.typing),
        {
          id: Date.now() + 2,
          role: 'assistant',
          content: reply,
          time: now(),
        },
      ]);
    } catch (err) {
      console.error('Coach API error:', err);
      setMessages(prev => [
        ...prev.filter(m => !m.typing),
        {
          id: Date.now() + 2,
          role: 'assistant',
          content: 'Desculpe, ocorreu um erro de conexão. Verifique sua internet e tente novamente.',
          time: now(),
          error: true,
        },
      ]);
      // Remove last user msg from history on error so user can retry
      historyRef.current = historyRef.current.slice(0, -1);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }, [loading, profile]);

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const clearChat = () => {
    historyRef.current = [];
    setShowSuggest(true);
    setMessages([{
      id: Date.now(),
      role: 'assistant',
      content: `Conversa reiniciada. Como posso te ajudar, ${profile?.name?.split(' ')[0] ?? 'Felipe'}?`,
      time: now(),
    }]);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#000' }}>
      <StatusBar />

      {/* Header */}
      <div style={{
        padding: '10px 18px 12px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '.5px solid #1c1c1e',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            background: '#1c1c1e', border: '.5px solid #2c2c2e',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, position: 'relative',
          }}>
            🥗
            <div style={{
              position: 'absolute', bottom: 0, right: 0,
              width: 10, height: 10, borderRadius: '50%',
              background: '#8e8e93', border: '1.5px solid #000',
              animation: 'ns-pulse 2s ease infinite',
            }} />
          </div>
          <div>
            <div style={{ fontSize: 10, color: '#48484a', letterSpacing: '-0.01em', marginBottom: 1 }}>
              Assistente IA
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1 }}>
              Coach Nutri
            </div>
          </div>
        </div>
        <button
          onClick={clearChat}
          style={{
            background: '#1c1c1e', border: '.5px solid #2c2c2e',
            borderRadius: 10, padding: '6px 12px',
            fontSize: 12, color: '#48484a', cursor: 'pointer',
            fontFamily: 'inherit', letterSpacing: '-0.01em',
            transition: 'all .15s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#8e8e93'}
          onMouseLeave={e => e.currentTarget.style.color = '#48484a'}
        >
          Limpar
        </button>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '14px 18px',
        scrollbarWidth: 'none',
      }}>
        {messages.map(msg => <Bubble key={msg.id} msg={msg} />)}

        {/* Suggestions */}
        {showSuggest && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 10, color: '#3a3a3c', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8, fontWeight: 600 }}>
              Sugestões
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  style={{
                    background: '#1c1c1e', border: '.5px solid #2c2c2e',
                    borderRadius: 20, padding: '7px 13px',
                    fontSize: 12, color: '#aeaeb2', cursor: 'pointer',
                    fontFamily: 'inherit', letterSpacing: '-0.01em',
                    transition: 'all .15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#2c2c2e'; e.currentTarget.style.color = '#ebebf0'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#1c1c1e'; e.currentTarget.style.color = '#aeaeb2'; }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '10px 18px 28px',
        borderTop: '.5px solid #1c1c1e',
        flexShrink: 0, background: '#000',
      }}>
        <div style={{
          display: 'flex', alignItems: 'flex-end', gap: 10,
          background: '#1c1c1e', borderRadius: 18,
          padding: '10px 10px 10px 16px',
          border: '.5px solid #2c2c2e',
        }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Pergunte ao seu coach..."
            rows={1}
            style={{
              flex: 1, background: 'transparent', border: 'none',
              outline: 'none', resize: 'none', overflow: 'hidden',
              fontSize: 15, color: '#fff', fontFamily: 'inherit',
              letterSpacing: '-0.01em', lineHeight: 1.5,
              maxHeight: 100,
              caretColor: '#aeaeb2',
            }}
            onInput={e => {
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
            }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            style={{
              width: 34, height: 34, borderRadius: '50%',
              background: input.trim() && !loading ? '#ebebf0' : '#2c2c2e',
              border: 'none', cursor: input.trim() && !loading ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, transition: 'all .15s',
            }}
          >
            {loading ? (
              <div style={{
                width: 14, height: 14, border: '2px solid #3a3a3c',
                borderTopColor: '#8e8e93', borderRadius: '50%',
                animation: 'ns-rotate 0.7s linear infinite',
              }} />
            ) : (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 7h10M7 2l5 5-5 5"
                  stroke={input.trim() ? '#000' : '#48484a'}
                  strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
        </div>
        <div style={{ fontSize: 10, color: '#2c2c2e', textAlign: 'center', marginTop: 8, letterSpacing: '-0.01em' }}>
          Coach Nutri · Powered by Anthropic
        </div>
      </div>
    </div>
  );
}
