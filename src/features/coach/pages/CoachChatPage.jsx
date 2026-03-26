import React, { useState, useEffect, useRef } from "react";
import { motion, useReducedMotion } from "motion/react";
import ReactMarkdown from "react-markdown";
import { useAuth } from "../../auth/hooks/useAuth";
import { getSupabaseClient } from "../../../lib/supabase";
import * as db from "../../../lib/db";
import PraxiAvatar from "../../../components/praxi/PraxiAvatar";

// ── SVG Icons ────────────────────────────────────────────────────────────────

function IconMenu() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="3" y1="5.5" x2="17" y2="5.5" stroke="var(--ns-text-primary)" strokeWidth="1.7" strokeLinecap="round" />
      <line x1="3" y1="10" x2="17" y2="10" stroke="var(--ns-text-primary)" strokeWidth="1.7" strokeLinecap="round" />
      <line x1="3" y1="14.5" x2="17" y2="14.5" stroke="var(--ns-text-primary)" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function IconPlus() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="10" y1="3" x2="10" y2="17" stroke="var(--ns-text-primary)" strokeWidth="1.7" strokeLinecap="round" />
      <line x1="3" y1="10" x2="17" y2="10" stroke="var(--ns-text-primary)" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function IconChat() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M8 10C8 8.34 9.34 7 11 7H37C38.66 7 40 8.34 40 10V30C40 31.66 38.66 33 37 33H26L18 41V33H11C9.34 33 8 31.66 8 30V10Z"
        stroke="var(--ns-text-disabled)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconArrowUp({ color = "#fff" }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="9" y1="14" x2="9" y2="4" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <polyline points="4,8 9,3 14,8" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="2" y1="4" x2="14" y2="4" stroke="var(--ns-text-disabled)" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M5 4V3C5 2.45 5.45 2 6 2H10C10.55 2 11 2.45 11 3V4" stroke="var(--ns-text-disabled)" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M3 4L4 13C4 13.55 4.45 14 5 14H11C11.55 14 12 13.55 12 13L13 4" stroke="var(--ns-text-disabled)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Typing Indicator ──────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div style={{ display: "flex", justifyContent: "flex-start", alignItems: "flex-end", gap: 8 }}>
      <div style={{ flexShrink: 0, marginBottom: 2 }}>
        <PraxiAvatar state="thinking" size="sm" />
      </div>
      <div style={{
        padding: "14px 18px",
        borderRadius: "18px 18px 18px 4px",
        background: "var(--ns-bg-elevated)",
        display: "flex",
        gap: 5,
        alignItems: "center",
      }}>
        <style>{`
          @keyframes ns-dot-bounce {
            0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
            30% { transform: translateY(-4px); opacity: 1; }
          }
        `}</style>
        {[0, 1, 2].map(i => (
          <span
            key={i}
            style={{
              display: "inline-block",
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "var(--ns-text-disabled)",
              animation: `ns-dot-bounce 1.2s ease-in-out infinite`,
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ── Quick Actions chips ───────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  "Analisar meu dia",
  "O que comer agora?",
  "Receita proteica fácil",
  "Pré-treino ideal",
  "Como emagrecer sem culpa",
  "Mais fibras na dieta",
  "Substituto saudável",
  "Estou ansioso com comida",
];

// ── Modo Respira (8.1) ────────────────────────────────────────────────────────

const ANXIETY_KEYWORDS = [
  'culpado', 'culpada', 'estraguei', 'não devia', 'me odeio', 'horrível',
  'fracassei', 'falhei', 'me sinto mal',
  // keywords extras mantidas
  'ansioso', 'ansiosa', 'culpa', 'errei',
  'comi demais', 'exagerei', 'vergonha', 'frustrado',
  'frustrada', 'decepcionado', 'descontrolei',
];

function hasAnxietyKeywords(text) {
  const lower = text.toLowerCase();
  return ANXIETY_KEYWORDS.some(k => lower.includes(k));
}

const BREATHE_MARKER = '__BREATHE__';

function BreatheCard({ onDismiss }) {
  return (
    <div style={{
      margin: '0',
      background: '#E8F5EC',
      borderRadius: 16,
      padding: '16px',
      border: '1px solid rgba(26,127,86,0.2)',
      maxWidth: "85%",
    }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: '#1A7F56', marginBottom: 4 }}>
        Ei, tá tudo bem
      </div>
      <p style={{ margin: "0 0 10px", fontSize: 14, color: '#2D5F3F', lineHeight: 1.5 }}>
        Comer é necessário e não é o inimigo. Todos temos dias diferentes.
      </p>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
        {["Inspira 4s", "Segura 4s", "Expira 6s"].map((step, i) => (
          <span key={step} style={{
            padding: "4px 10px",
            borderRadius: 20,
            background: "rgba(26,127,86,0.12)",
            fontSize: 12,
            color: '#1A7F56',
            fontWeight: 500,
          }}>
            {i + 1}. {step}
          </span>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={onDismiss}
          style={{
            flex: 1, padding: '8px 12px', borderRadius: 10,
            background: '#1A7F56', border: 'none',
            color: '#FFF', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Quero conversar
        </button>
        <a
          href="tel:188"
          style={{
            flex: 1, padding: '8px 12px', borderRadius: 10,
            background: 'rgba(26,127,86,0.1)', border: '1px solid rgba(26,127,86,0.3)',
            color: '#1A7F56', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            textDecoration: 'none', display: 'flex', alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          CVV 188
        </a>
        <button
          onClick={onDismiss}
          aria-label="Fechar"
          style={{
            padding: '8px 12px', borderRadius: 10,
            background: 'transparent', border: 'none',
            color: 'var(--ns-text-muted)', fontSize: 13, cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function CoachChatPage() {
  const { user, loading: authLoading } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showConversations, setShowConversations] = useState(false);
  const [sendError, setSendError] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const inputRef = useRef(null);
  const isNearBottomRef = useRef(true);
  const shouldReduce = useReducedMotion();

  // Aguarda auth resolver antes de carregar conversas
  useEffect(() => {
    if (authLoading) return;
    if (!user?.id) {
      setLoading(false);
      return;
    }
    loadConversations();
  }, [user?.id, authLoading]);

  useEffect(() => {
    if (!currentConversation) return;
    loadMessages(currentConversation.id);
  }, [currentConversation?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  async function loadConversations() {
    if (!user?.id) return;
    setLoading(true);
    try {
      const convs = await db.listChatConversations(user.id);
      setConversations(convs || []);

      if (!convs || convs.length === 0) {
        try {
          const newConv = await db.createChatConversation(user.id, "Nova conversa");
          setConversations([newConv]);
          setCurrentConversation(newConv);
        } catch (createErr) {
          console.error("Erro ao criar conversa:", createErr);
          // Fallback: conversa temporária local para não bloquear o usuário
          const fakeConv = {
            id: `temp-${user.id}`,
            user_id: user.id,
            title: "Nova conversa",
            message_count: 0,
            created_at: new Date().toISOString(),
          };
          setConversations([fakeConv]);
          setCurrentConversation(fakeConv);
        }
      } else {
        setCurrentConversation(convs[0]);
      }
    } catch (err) {
      console.error("Erro ao carregar conversas:", err);
      // Fallback: conversa temporária para não bloquear o usuário
      const fakeConv = {
        id: `temp-${user.id}`,
        user_id: user.id,
        title: "Nova conversa",
        message_count: 0,
        created_at: new Date().toISOString(),
      };
      setConversations([fakeConv]);
      setCurrentConversation(fakeConv);
    } finally {
      setLoading(false);
    }
  }

  async function loadMessages(conversationId) {
    // IDs temporários não existem no banco — não tentar carregar
    const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!isValidUUID.test(conversationId)) {
      setMessages([]);
      return;
    }
    try {
      const msgs = await db.listChatMessages(conversationId);
      setMessages(msgs || []);
    } catch (err) {
      console.error("Erro ao carregar mensagens:", err);
      setMessages([]);
    }
  }

  async function sendMessage(userMessage) {
    if (!userMessage.trim() || sending || !currentConversation || !user?.id) return;

    setInputMessage("");
    setSending(true);
    setSendError(null);
    // Reset textarea height
    if (inputRef.current) inputRef.current.style.height = "auto";

    const optimisticMsg = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: userMessage,
      created_at: new Date().toISOString(),
    };

    // 5.4 — Modo Respira: detecta ansiedade/culpa alimentar
    const anxious = hasAnxietyKeywords(userMessage);
    const breatheMsg = anxious ? {
      id: `breathe-${Date.now()}`,
      role: "assistant",
      content: BREATHE_MARKER,
      created_at: new Date().toISOString(),
    } : null;

    setMessages(prev => anxious
      ? [...prev, optimisticMsg, breatheMsg]
      : [...prev, optimisticMsg]
    );
    // Força scroll ao enviar mensagem própria
    setTimeout(() => scrollToBottom(true), 50);

    try {
      const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const convId = isValidUUID.test(currentConversation.id)
        ? currentConversation.id
        : undefined;

      // Obtem JWT para autenticar a requisicao no backend
      let accessToken = null;
      try {
        const supabase = getSupabaseClient();
        const { data: { session } } = await supabase.auth.getSession();
        accessToken = session?.access_token || null;
      } catch {
        // Continua sem token — o backend retornara 401
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          conversationId: convId,
          message: userMessage,
          userId: user.id,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || errData.error || `Erro ${response.status}`);
      }

      const data = await response.json();

      const aiMsg = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: data.reply,
        created_at: new Date().toISOString(),
        model: data.model,
      };
      setMessages(prev => [...prev, aiMsg]);

      // Recarrega conversas para atualizar contadores (ignora erro silenciosamente)
      loadConversations().catch(() => {});
    } catch (err) {
      console.error("Erro ao enviar mensagem:", err);
      setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
      // Mensagens de erro amigáveis por tipo
      let friendlyError = "Algo deu errado. Tente novamente.";
      if (err.name === "AbortError") {
        friendlyError = "O coach demorou para responder. Tente novamente.";
      } else if (err instanceof TypeError || err.message?.includes("fetch")) {
        friendlyError = "Sem conexao com a internet. Verifique sua rede.";
      } else if (err.message?.includes("timeout") || err.message?.includes("abort")) {
        friendlyError = "O coach demorou para responder. Tente novamente.";
      } else if (err.message?.includes("429")) {
        friendlyError = "Muitas mensagens seguidas. Aguarde um momento.";
      }
      setSendError(friendlyError);
      setInputMessage(userMessage);
    } finally {
      setSending(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }

  async function handleSendMessage(e) {
    e.preventDefault();
    await sendMessage(inputMessage.trim());
  }

  async function handleNewConversation() {
    if (!user?.id) return;
    try {
      const newConv = await db.createChatConversation(user.id, "Nova conversa");
      setConversations(prev => [newConv, ...prev]);
      setCurrentConversation(newConv);
      setMessages([]);
      setShowConversations(false);
    } catch (err) {
      console.error("Erro ao criar conversa:", err);
    }
  }

  async function handleDeleteConversation(convId) {
    if (confirmDeleteId !== convId) {
      setConfirmDeleteId(convId);
      return;
    }
    setConfirmDeleteId(null);
    // IDs temporários só existem localmente — remover da lista sem chamar o banco
    const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!isValidUUID.test(convId)) {
      const filtered = conversations.filter(c => c.id !== convId);
      setConversations(filtered);
      if (currentConversation?.id === convId) {
        setCurrentConversation(filtered[0] || null);
        setMessages([]);
      }
      return;
    }
    try {
      await db.deleteChatConversation(convId);
      const filtered = conversations.filter(c => c.id !== convId);
      setConversations(filtered);
      if (currentConversation?.id === convId) {
        setCurrentConversation(filtered[0] || null);
        setMessages([]);
      }
    } catch (err) {
      console.error("Erro ao deletar conversa:", err);
    }
  }

  function scrollToBottom(force = false) {
    if (force || isNearBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }

  function handleScrollContainer() {
    const el = scrollContainerRef.current;
    if (!el) return;
    const { scrollHeight, scrollTop, clientHeight } = el;
    isNearBottomRef.current = scrollHeight - scrollTop - clientHeight < 80;
  }

  // Aguardando auth carregar
  if (authLoading || loading) {
    return (
      <div
        className="flex-center"
        style={{ minHeight: "60vh", background: "var(--ns-bg-primary)" }}
      >
        <div className="ns-spinner ns-spinner-lg" />
      </div>
    );
  }

  // Usuário não autenticado
  if (!user) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
          gap: 12,
          padding: "0 24px",
          textAlign: "center",
          background: "var(--ns-bg-primary)",
        }}
      >
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
          <rect x="8" y="18" width="24" height="16" rx="3" stroke="var(--ns-text-disabled)" strokeWidth="1.8" />
          <path d="M13 18V13C13 9.13 16.13 6 20 6C23.87 6 27 9.13 27 13V18" stroke="var(--ns-text-disabled)" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        <p style={{ color: "var(--ns-text-muted)", fontSize: 14, margin: 0 }}>
          Faça login para acessar o Coach Praxis.
        </p>
      </div>
    );
  }

  const canSend = inputMessage.trim().length > 0 && !sending;

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "calc(100dvh - var(--ns-nav-height, 72px))",
      background: "var(--ns-bg-primary)",
      maxWidth: 480,
      margin: "0 auto",
    }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{
        padding: "14px 16px",
        borderBottom: "1px solid var(--ns-border)",
        background: "rgba(244,245,240,0.94)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexShrink: 0,
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}>
        <button
          onClick={() => setShowConversations(!showConversations)}
          aria-label="Abrir conversas"
          style={{
            background: "none",
            border: "none",
            padding: 8,
            cursor: "pointer",
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <IconMenu />
        </button>

        <div style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
        }}>
          <PraxiAvatar state="happy" size="sm" />
          <div style={{ textAlign: "left" }}>
            <div style={{
              margin: 0,
              fontSize: 17,
              fontWeight: 700,
              color: "var(--ns-text-primary)",
              lineHeight: 1.2,
              letterSpacing: "-0.3px",
            }}>
              Coach Praxi
            </div>
            <div style={{
              margin: 0,
              fontSize: 12,
              color: "var(--ns-text-muted)",
              lineHeight: 1.3,
              marginTop: 1,
            }}>
              Seu nutricionista IA
            </div>
          </div>
        </div>

        <button
          onClick={handleNewConversation}
          aria-label="Nova conversa"
          style={{
            background: "none",
            border: "none",
            padding: 8,
            cursor: "pointer",
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <IconPlus />
        </button>
      </div>

      {/* ── Sidebar overlay ────────────────────────────────────────────────── */}
      {showConversations && (
        <div
          onClick={() => setShowConversations(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            zIndex: 200,
            display: "flex",
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: "85%",
              maxWidth: 320,
              background: "var(--ns-bg-card)",
              height: "100%",
              overflowY: "auto",
              padding: "24px 16px 24px 20px",
              boxShadow: "4px 0 24px rgba(0,0,0,0.08)",
            }}
          >
            <div style={{
              fontSize: 20,
              fontWeight: 700,
              color: "var(--ns-text-primary)",
              margin: "0 0 20px",
              letterSpacing: "-0.4px",
            }}>
              Conversas
            </div>

            {conversations.length === 0 && (
              <p style={{ color: "var(--ns-text-muted)", fontSize: 14, margin: 0 }}>
                Nenhuma conversa ainda.
              </p>
            )}

            {conversations.map(conv => {
              const isActive = conv.id === currentConversation?.id;
              return (
                <div
                  key={conv.id}
                  onClick={() => {
                    setCurrentConversation(conv);
                    setShowConversations(false);
                  }}
                  style={{
                    padding: "12px 14px",
                    marginBottom: 8,
                    borderRadius: 12,
                    background: isActive ? "var(--ns-accent-bg)" : "var(--ns-bg-elevated)",
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderLeft: isActive ? `3px solid var(--ns-accent)` : "3px solid transparent",
                    transition: "background 0.15s ease",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 14,
                      fontWeight: 500,
                      color: "var(--ns-text-primary)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}>
                      {conv.title || "Sem título"}
                    </div>
                    <div style={{
                      fontSize: 12,
                      color: "var(--ns-text-muted)",
                      marginTop: 2,
                    }}>
                      {conv.message_count || 0} mensagens
                    </div>
                  </div>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      handleDeleteConversation(conv.id);
                    }}
                    onBlur={() => setConfirmDeleteId(null)}
                    aria-label={confirmDeleteId === conv.id ? "Confirmar exclusão" : "Deletar conversa"}
                    style={{
                      background: confirmDeleteId === conv.id ? "var(--ns-danger-bg)" : "none",
                      border: "none",
                      cursor: "pointer",
                      padding: "4px 6px",
                      borderRadius: 6,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      marginLeft: 8,
                      fontSize: 10,
                      fontWeight: 600,
                      color: confirmDeleteId === conv.id ? "var(--ns-danger)" : undefined,
                      fontFamily: "inherit",
                    }}
                  >
                    {confirmDeleteId === conv.id ? "Confirmar" : <IconTrash />}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Área de mensagens ───────────────────────────────────────────────── */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScrollContainer}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "20px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
          WebkitOverflowScrolling: "touch",
        }}
      >

        {/* Empty state */}
        {messages.length === 0 && (
          <div style={{
            textAlign: "center",
            padding: "48px 24px 32px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 0,
          }}>
            <div style={{ marginBottom: 20 }}>
              <PraxiAvatar state="waving" size="lg" />
            </div>
            <div style={{
              fontSize: 22,
              fontWeight: 700,
              color: "var(--ns-text-primary)",
              margin: "0 0 8px",
              letterSpacing: "-0.5px",
              lineHeight: 1.2,
            }}>
              Como posso te ajudar?
            </div>
            <p style={{
              fontSize: 14,
              color: "var(--ns-text-muted)",
              margin: "0 0 28px",
              lineHeight: 1.5,
            }}>
              Pergunte sobre nutrição, dieta e saúde
            </p>
            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              width: "100%",
              maxWidth: 320,
            }}>
              {[
                "O que devo comer antes do treino?",
                "Analise meu dia de hoje",
                "Como melhorar minha ingestão de proteína?",
              ].map(q => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  style={{
                    background: "var(--ns-bg-elevated)",
                    border: "0.5px solid var(--ns-border)",
                    borderRadius: 20,
                    padding: "10px 16px",
                    fontSize: 14,
                    color: "var(--ns-text-primary)",
                    cursor: "pointer",
                    textAlign: "center",
                    transition: "background 0.15s ease",
                    fontFamily: "inherit",
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Mensagens */}
        {messages.map((msg, idx) => {
          if (msg.content === BREATHE_MARKER) {
            return (
              <div key={msg.id || idx} style={{ display: "flex", justifyContent: "flex-start" }}>
                <BreatheCard onDismiss={() => setMessages(prev => prev.filter(m => m.id !== msg.id))} />
              </div>
            );
          }
          return (
            <div
              key={msg.id || idx}
              style={{
                display: "flex",
                justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
              }}
            >
              <div style={{
                maxWidth: "78%",
                padding: "11px 15px",
                borderRadius: msg.role === "user"
                  ? "18px 18px 4px 18px"
                  : "18px 18px 18px 4px",
                background: msg.role === "user" ? "var(--ns-accent)" : "var(--ns-bg-elevated)",
                color: msg.role === "user" ? "#FFFFFF" : "var(--ns-text-primary)",
                fontSize: 15,
                lineHeight: 1.55,
                wordBreak: "break-word",
              }}>
                {msg.role === "assistant" ? (
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => <p style={{ margin: '0 0 6px', whiteSpace: 'pre-wrap' }}>{children}</p>,
                      strong: ({ children }) => <strong style={{ fontWeight: 700 }}>{children}</strong>,
                      ul: ({ children }) => <ul style={{ margin: '4px 0', paddingLeft: 18 }}>{children}</ul>,
                      li: ({ children }) => <li style={{ marginBottom: 2 }}>{children}</li>,
                      a: ({ href, children }) => <a href={href} style={{ color: 'var(--ns-accent)', textDecoration: 'underline' }}>{children}</a>,
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                ) : (
                  <span style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</span>
                )}
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {sending && <TypingIndicator />}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Banner de erro ──────────────────────────────────────────────────── */}
      {sendError && (
        <div style={{
          margin: "0 16px 8px",
          padding: "10px 14px",
          borderRadius: 12,
          background: "var(--ns-danger-bg)",
          color: "var(--ns-danger)",
          fontSize: 13,
          textAlign: "center",
          border: "0.5px solid rgba(255,59,48,0.2)",
        }}>
          {sendError}
        </div>
      )}

      {/* ── Quick Actions chips (5.1) ───────────────────────────────────────── */}
      {messages.length > 0 && !sending && inputMessage.length === 0 && (
        <div style={{
          overflowX: "auto",
          padding: "6px 16px 2px",
          display: "flex",
          gap: 8,
          flexShrink: 0,
          scrollbarWidth: "none",
          WebkitOverflowScrolling: "touch",
        }}>
          <style>{`.ns-chips-row::-webkit-scrollbar { display: none; }`}</style>
          {QUICK_ACTIONS.map(action => (
            <button
              key={action}
              onClick={() => sendMessage(action)}
              type="button"
              style={{
                flexShrink: 0,
                whiteSpace: "nowrap",
                padding: "7px 14px",
                borderRadius: 20,
                background: "var(--ns-bg-elevated)",
                border: "0.5px solid var(--ns-border)",
                fontSize: 13,
                color: "var(--ns-text-primary)",
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "background 0.15s ease",
              }}
            >
              {action}
            </button>
          ))}
        </div>
      )}

      {/* ── Input bar ───────────────────────────────────────────────────────── */}
      <form
        onSubmit={handleSendMessage}
        style={{
          padding: "10px 16px 12px",
          borderTop: "1px solid var(--ns-border)",
          background: "rgba(244,245,240,0.94)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          display: "flex",
          gap: 10,
          alignItems: "center",
          flexShrink: 0,
        }}
      >
        <textarea
          ref={inputRef}
          value={inputMessage}
          onChange={e => {
            setInputMessage(e.target.value);
            // Auto-expand
            const el = e.target;
            el.style.height = "auto";
            el.style.height = Math.min(el.scrollHeight, 120) + "px";
          }}
          onKeyDown={e => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (canSend) handleSendMessage(e);
            }
          }}
          placeholder="Digite sua pergunta..."
          rows={1}
          style={{
            flex: 1,
            background: "var(--ns-bg-elevated)",
            border: "0.5px solid var(--ns-border)",
            borderRadius: 22,
            padding: "11px 18px",
            fontSize: 16,
            color: "var(--ns-text-primary)",
            outline: "none",
            fontFamily: "inherit",
            resize: "none",
            lineHeight: 1.4,
            maxHeight: 120,
            overflowY: "auto",
          }}
          disabled={sending}
          autoComplete="off"
        />
        <motion.button
          type="submit"
          disabled={!canSend}
          aria-label="Enviar mensagem"
          whileTap={{ scale: shouldReduce ? 1 : 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: canSend ? "var(--ns-accent)" : "var(--ns-bg-elevated)",
            border: "none",
            cursor: canSend ? "pointer" : "default",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            transition: "background 0.15s ease",
          }}
        >
          <IconArrowUp color={canSend ? "#fff" : "var(--ns-text-disabled)"} />
        </motion.button>
      </form>
    </div>
  );
}
