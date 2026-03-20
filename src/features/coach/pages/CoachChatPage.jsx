import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../auth/hooks/useAuth";
import * as db from "../../../lib/db";

export default function CoachChatPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showConversations, setShowConversations] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    loadConversations();
  }, [user?.id]);

  useEffect(() => {
    if (!currentConversation) {
      console.log("[CHAT] currentConversation é null, aguardando...");
      return;
    }
    console.log("[CHAT] Carregando mensagens para:", currentConversation.id);
    loadMessages(currentConversation.id);
  }, [currentConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  async function loadConversations() {
    try {
      const convs = await db.listChatConversations(user.id);
      setConversations(convs || []);

      // Se não tem conversa, tenta criar uma nova
      if (!convs || convs.length === 0) {
        try {
          const newConv = await db.createChatConversation(user.id, "Nova conversa");
          setConversations([newConv]);
          setCurrentConversation(newConv);
        } catch (createErr) {
          console.error("Erro ao criar conversa:", createErr);
          // Cria conversa fake para permitir enviar mensagem
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
      // Fallback: cria conversa temporária
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
    try {
      const msgs = await db.listChatMessages(conversationId);
      setMessages(msgs || []);
    } catch (err) {
      console.error("Erro ao carregar mensagens:", err);
    }
  }

  async function handleSendMessage(e) {
    e.preventDefault();
    if (!inputMessage.trim() || sending || !currentConversation) return;

    const userMessage = inputMessage.trim();
    setInputMessage("");
    setSending(true);

    console.log("[CHAT] Enviando mensagem:", userMessage);
    console.log("[CHAT] Conversation ID:", currentConversation.id);
    console.log("[CHAT] User ID:", user.id);

    // Adiciona mensagem do usuário otimisticamente
    const optimisticMsg = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: userMessage,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimisticMsg]);

    try {
      // Chama API do chat
      console.log("[CHAT] Fazendo POST para /api/chat...");
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: currentConversation.id,
          message: userMessage,
          userId: user.id,
        }),
      });

      console.log("[CHAT] Response status:", response.status);

      if (!response.ok) {
        const errText = await response.text();
        console.error("[CHAT] Erro na resposta:", errText);
        throw new Error(`Erro ${response.status}: ${errText}`);
      }

      const data = await response.json();
      console.log("[CHAT] Dados recebidos:", data);

      // Adiciona resposta da IA
      const aiMsg = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: data.reply,
        created_at: new Date().toISOString(),
        model: data.model,
      };
      setMessages(prev => [...prev, aiMsg]);

      // Atualiza lista de conversas
      await loadConversations();
    } catch (err) {
      console.error("[CHAT] ERRO COMPLETO:", err);
      console.error("[CHAT] Stack:", err.stack);
      // Remove mensagem otimista em caso de erro
      setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
      alert(`Erro: ${err.message}`);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  async function handleNewConversation() {
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
    if (!confirm("Deletar esta conversa?")) return;
    try {
      await db.deleteChatConversation(convId);
      const filtered = conversations.filter(c => c.id !== convId);
      setConversations(filtered);
      if (currentConversation?.id === convId) {
        setCurrentConversation(filtered[0] || null);
      }
    } catch (err) {
      console.error("Erro ao deletar conversa:", err);
    }
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  if (loading) {
    return (
      <div className="ns-page flex-center" style={{ minHeight: "60vh" }}>
        <div className="ns-spinner ns-spinner-lg" />
      </div>
    );
  }

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      height: "100dvh", background: "var(--ns-bg-primary)",
      maxWidth: 480, margin: "0 auto",
    }}>
      {/* Header */}
      <div style={{
        padding: "16px 20px", borderBottom: "1px solid var(--ns-border)",
        background: "var(--ns-bg-card)", display: "flex",
        justifyContent: "space-between", alignItems: "center",
      }}>
        <button
          onClick={() => setShowConversations(!showConversations)}
          style={{
            background: "none", border: "none", padding: 8,
            fontSize: 20, cursor: "pointer",
          }}
        >
          ☰
        </button>
        <div style={{ textAlign: "center", flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>🧠 NutriCoach</h1>
          <p style={{ margin: 0, fontSize: 11, color: "var(--ns-text-muted)" }}>
            Seu nutricionista IA
          </p>
        </div>
        <button
          onClick={handleNewConversation}
          style={{
            background: "none", border: "none", padding: 8,
            fontSize: 20, cursor: "pointer",
          }}
        >
          ✏️
        </button>
      </div>

      {/* Conversations sidebar (overlay) */}
      {showConversations && (
        <div
          onClick={() => setShowConversations(false)}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
            zIndex: 100, display: "flex",
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: "80%", maxWidth: 320, background: "var(--ns-bg-card)",
              height: "100%", overflowY: "auto", padding: 20,
            }}
          >
            <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700 }}>Conversas</h3>
            {conversations.map(conv => (
              <div
                key={conv.id}
                onClick={() => {
                  setCurrentConversation(conv);
                  setShowConversations(false);
                }}
                style={{
                  padding: 12, marginBottom: 8, borderRadius: 12,
                  background: conv.id === currentConversation?.id ? "var(--ns-accent-bg)" : "var(--ns-bg-elevated)",
                  cursor: "pointer", display: "flex", justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 14, fontWeight: 600,
                    color: conv.id === currentConversation?.id ? "var(--ns-accent)" : "var(--ns-text-primary)",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {conv.title || "Sem título"}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--ns-text-muted)", marginTop: 2 }}>
                    {conv.message_count || 0} mensagens
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteConversation(conv.id);
                  }}
                  style={{
                    background: "none", border: "none", fontSize: 16,
                    color: "var(--ns-text-muted)", cursor: "pointer", padding: 4,
                  }}
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Messages area */}
      <div style={{
        flex: 1, overflowY: "auto", padding: "20px 16px",
        display: "flex", flexDirection: "column", gap: 16,
      }}>
        {messages.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 20px" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🧠</div>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 8px" }}>
              Oi! Sou o NutriCoach
            </h2>
            <p style={{ fontSize: 14, color: "var(--ns-text-muted)", margin: 0 }}>
              Tire suas duvidas sobre nutricao, alimentacao e seus objetivos!
            </p>
            <div style={{
              marginTop: 24, display: "flex", flexDirection: "column", gap: 8,
            }}>
              {[
                "O que devo comer hoje?",
                "Como melhorar minha dieta?",
                "Quais alimentos evitar?",
              ].map(q => (
                <button
                  key={q}
                  onClick={() => setInputMessage(q)}
                  className="ns-btn ns-btn-secondary"
                  style={{ fontSize: 13, padding: "10px 16px" }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div
            key={msg.id || idx}
            style={{
              display: "flex",
              justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
              animation: "fadeIn 0.3s ease",
            }}
          >
            <div style={{
              maxWidth: "75%",
              padding: "12px 16px",
              borderRadius: 16,
              background: msg.role === "user" ? "var(--ns-accent)" : "var(--ns-bg-card)",
              color: msg.role === "user" ? "#fff" : "var(--ns-text-primary)",
              fontSize: 14, lineHeight: 1.5,
              boxShadow: "var(--ns-shadow-sm)",
            }}>
              {msg.content}
            </div>
          </div>
        ))}

        {sending && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div style={{
              padding: "12px 16px", borderRadius: 16,
              background: "var(--ns-bg-card)",
              boxShadow: "var(--ns-shadow-sm)",
            }}>
              <div style={{ display: "flex", gap: 6 }}>
                <span className="ns-typing-dot" style={{ animationDelay: "0s" }}>●</span>
                <span className="ns-typing-dot" style={{ animationDelay: "0.2s" }}>●</span>
                <span className="ns-typing-dot" style={{ animationDelay: "0.4s" }}>●</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <form
        onSubmit={handleSendMessage}
        style={{
          padding: "12px 16px", borderTop: "1px solid var(--ns-border)",
          background: "var(--ns-bg-card)", display: "flex", gap: 10,
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={inputMessage}
          onChange={e => setInputMessage(e.target.value)}
          placeholder="Digite sua pergunta..."
          className="ns-input"
          style={{
            flex: 1, borderRadius: 20, padding: "10px 16px",
            fontSize: 14,
          }}
          disabled={sending}
        />
        <button
          type="submit"
          className="ns-btn ns-btn-primary"
          style={{
            borderRadius: 20, padding: "10px 20px",
            fontSize: 20, lineHeight: 1,
          }}
          disabled={!inputMessage.trim() || sending}
        >
          ↑
        </button>
      </form>
    </div>
  );
}
