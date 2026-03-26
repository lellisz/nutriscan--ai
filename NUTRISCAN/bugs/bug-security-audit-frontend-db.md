---
tags: [bug, nutriscan, seguranca]
data: 2026-03-22
status: resolvido
---

## Erro
Auditoria de seguranca revelou 4 vulnerabilidades:
1. API client (client.js) nao enviava Authorization header com JWT nas requests
2. CoachChatPage usava fetch raw sem Authorization header
3. Tabela rate_limit_hits sem RLS habilitado
4. Sem security headers (CSP, X-Frame-Options, etc) no Netlify/Vercel

## Causa
1. client.js foi implementado sem integracao com o auth do Supabase
2. CoachChatPage usava fetch direto ao inves do apiClient
3. rate_limit_hits foi criada depois das policies iniciais e esqueceram RLS
4. Headers de seguranca nunca foram configurados

## Solucao
1. Adicionado `_getAccessToken()` no APIClient que busca token da sessao Supabase e injeta como `Authorization: Bearer` em todas as requests
2. Adicionado getSession + Authorization header no fetch do CoachChatPage
3. Adicionado `enable row level security` + policies SELECT/INSERT na tabela rate_limit_hits
4. Adicionado security headers no netlify.toml (CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy) e vercel.json

## Pontos positivos encontrados
- api/scan.js ja tinha validateAuth com JWT
- api/chat.js ja tinha validateAuth + comparacao userId body vs token
- Nenhum uso de dangerouslySetInnerHTML em todo o projeto
- Todas as tabelas principais ja tinham RLS com auth.uid() = user_id
- chat_conversations e chat_messages ja tinham RLS completo
- Supabase client usa persistSession + autoRefreshToken
- CORS configurado com ALLOWED_ORIGIN obrigatorio (sem fallback para "*")

## Referencias
- [[Coach Nutri]]
