import React, { useState } from "react";

export default function CoachChatPageSimple() {
  const [messages, setMessages] = useState([
    { id: "1", role: "assistant", content: "Olá! Sou o NutriCoach. Como posso ajudar você hoje?" }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSendMessage(e) {
    e.preventDefault();
    if (!inputMessage.trim() || sending) return;

    const userMessage = inputMessage.trim();
    setInputMessage("");
    setSending(true);

    // Adiciona mensagem do usuário
    const userMsg = {
      id: `user-${Date.now()}`,
      role: "user",
      content: userMessage,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);

    // Simular resposta da IA (sem API)
    setTimeout(() => {
      const aiMsg = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: "Essa é uma resposta simulada! Para ativar a IA real, precisamos resolver a configuração do servidor. Sua pergunta foi: '" + userMessage + "'",
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, aiMsg]);
      setSending(false);
    }, 1000);
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
        background: "var(--ns-bg-card)", textAlign: "center",
      }}>
        <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>🧠 NutriCoach (Modo Debug)</h1>
        <p style={{ margin: 0, fontSize: 11, color: "var(--ns-text-muted)" }}>
          Teste de interface sem API
        </p>
      </div>

      {/* Messages area */}
      <div style={{
        flex: 1, overflowY: "auto", padding: "20px 16px",
        display: "flex", flexDirection: "column", gap: 16,
      }}>
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