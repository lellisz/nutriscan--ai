---
tags: [sessao, nutriscan, praxis-nutri]
data: 2026-03-22
---

## Evolucao do Coach IA + Rotacao de chaves + Frontend UX

### Diagnostico e Planejamento
- Revisao completa do estado do projeto (skill /progress)
- Identificacao de chaves expostas no git history: GROQ_API_KEY, GEMINI_API_KEY, SUPABASE_SERVICE_ROLE_KEY
- InsightsPage ja estava conectada a dados reais (checklist desatualizado corrigido)
- Identificacao de que o dev-server antigo mantinha chaves velhas em memoria

### Backend / IA (api/chat.js)
- Adicionado Gemini como 3o provider na cascata: Groq -> Anthropic -> Gemini -> Ollama
- Funcao `callGemini()` criada — usa `generativelanguage.googleapis.com/v1beta`, system_instruction separada, formato contents com role model/user
- Fix do retry em 401/403: `callAnthropicWithRetry` agora nao retenta em erros de autenticacao (antes fazia 3 requests inuteis)
- Log melhorado quando todos os providers falham por auth — mensagem explicita no console indicando quais chaves verificar
- Modelo Gemini configuravel via env var `GEMINI_MODEL` (padrao: gemini-2.5-flash-lite)

### Frontend / UX (CoachChatPage.jsx)
- Auto-scroll inteligente: `scrollContainerRef` + `isNearBottomRef` detecta se usuario esta perto do fim (threshold 80px). So faz scroll automatico se usuario esta no fundo; se scrollou para cima para ler historico, nao interrompe
- Textarea expansivel: substituiu `<input type="text">` por `<textarea>` com auto-expand ate 120px, Enter envia, Shift+Enter quebra linha
- Font-size 16px no input (evita zoom automatico no iOS)
- Timeout de 30 segundos via AbortController — corta requests que demoram demais
- Mensagens de erro amigaveis por tipo: AbortError -> "coach demorou", TypeError -> "sem conexao", 429 -> "muitas mensagens"
- Sugestoes iniciais atualizadas: "O que devo comer antes do treino?", "Analise meu dia de hoje", "Como melhorar minha ingestao de proteina?"
- Reset da altura do textarea ao enviar mensagem

### Seguranca
- Chaves GROQ, GEMINI e ANTHROPIC rotacionadas pelo usuario nos dashboards dos providers
- Chaves antigas no git history identificadas e documentadas como comprometidas
- Supabase service_role_key exposta identificada (rotacao pendente)
- Anthropic com saldo zerado (nao e problema de chave, e de credito)

### Infraestrutura
- Dev-server antigo (PID 24268) estava segurando porta 3002 com chaves velhas em memoria
- Processo matado e servidor reiniciado com codigo e chaves atualizadas
- Diagnostico via `netstat -ano` + `wmic process` para identificar processo zumbi

## Bugs corrigidos
- Dev-server zumbi na porta 3002 — processo antigo nao encerrado impedia novo servidor de subir com chaves atualizadas ([[bug-dev-server-porta-ocupada]])
- Retry desnecessario em 401 — Anthropic fazia 3 requests mesmo com chave invalida ([[bug-retry-desnecessario-401]])
- Chat sem fallback Gemini — scan.js tinha 4 providers, chat.js so tinha 3 ([[bug-chat-sem-gemini-fallback]])

## Decisoes tomadas
- Gemini adicionado ao chat com mesma arquitetura do scan.js ([[decisao-gemini-chat-fallback]])
- Textarea em vez de input no chat — melhor UX para mensagens longas
- AbortController com 30s timeout — protege contra requests pendurados

## Estado do projeto apos esta sessao
- Coach IA funcionando com Groq (primario) + Gemini (fallback)
- Anthropic disponivel como fallback se usuario adicionar creditos
- Frontend do chat com UX melhorada (scroll, textarea, erros amigaveis)
- InsightsPage confirmada como funcional (checklist atualizado)
- Chaves Groq e Gemini rotacionadas e funcionando
- Supabase service_role_key ainda precisa ser rotacionada

## Prompt de continuidade
```
Continuando Praxis Nutri de 2026-03-22.
Coach IA funcionando (Groq + Gemini). Frontend do chat melhorado (auto-scroll, textarea, timeout, erros amigaveis).
Pendente: rotacionar Supabase service_role_key, integrar pagamento, CI/CD, ciclos semanais.
```

## Links
- [[Coach Nutri]]
- [[decisao-gemini-chat-fallback]]
- [[bug-dev-server-porta-ocupada]]
- [[bug-retry-desnecessario-401]]
- [[bug-chat-sem-gemini-fallback]]
