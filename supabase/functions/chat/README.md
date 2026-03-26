# Edge Function: chat

Coach IA conversacional do Praxis Nutri (Praxi).
Substitui progressivamente `api/chat.js` (Vercel) com roteamento inteligente por intent.

## Providers utilizados

| Intent            | Provider preferencial | Fallback            |
|-------------------|-----------------------|---------------------|
| small_talk        | Groq LLaMA 8B         | Gemini Flash Lite   |
| question          | Groq LLaMA 70B        | Gemini Flash Lite   |
| recipe_request    | Groq LLaMA 70B        | Gemini Flash Lite   |
| emotional         | Gemini Flash 2.0      | Groq LLaMA 8B       |
| food_log          | Gemini Flash 2.0      | Groq LLaMA 8B       |
| progress_report   | Gemini Flash 2.0      | Groq LLaMA 8B       |
| goal_update       | Gemini Flash 2.0      | Groq LLaMA 8B       |

## Como fazer deploy

```bash
# Instalar Supabase CLI se ainda nao tiver
npm install -g supabase

# Login (primeira vez)
supabase login

# Deploy da funcao
supabase functions deploy chat --project-ref SEU_PROJECT_REF
```

## Secrets necessarios

Configurar antes do deploy (ou via Supabase Dashboard > Edge Functions > Secrets):

```bash
supabase secrets set \
  GROQ_API_KEY=gsk_... \
  GEMINI_API_KEY=AIza... \
  SUPABASE_URL=https://SEU_PROJECT.supabase.co \
  SUPABASE_SERVICE_ROLE_KEY=eyJ... \
  SUPABASE_ANON_KEY=eyJ... \
  ALLOWED_ORIGIN=https://seudominio.com \
  --project-ref SEU_PROJECT_REF
```

> ALLOWED_ORIGIN em desenvolvimento pode ser omitido (fallback para `*`).
> Em producao, sempre defina com o dominio exato do frontend.

## Variaveis de ambiente

| Variavel                  | Obrigatoria | Descricao                                      |
|---------------------------|-------------|------------------------------------------------|
| GROQ_API_KEY              | Sim         | Chave da API Groq (console.groq.com)           |
| GEMINI_API_KEY            | Sim         | Chave da API Google Gemini (ai.google.dev)     |
| SUPABASE_URL              | Sim         | URL do projeto Supabase                        |
| SUPABASE_SERVICE_ROLE_KEY | Sim         | Service role key (acesso admin ao banco)       |
| SUPABASE_ANON_KEY         | Sim         | Anon key (para validar JWT do usuario)         |
| ALLOWED_ORIGIN            | Producao    | Dominio permitido no CORS                      |

## Migration necessaria

Antes de usar a funcao, aplicar a migration:

```bash
# Via CLI (projeto linkado)
supabase db push

# Ou manualmente no SQL Editor do Supabase Dashboard
# Arquivo: supabase/migrations/20260326_conversation_insights.sql
```

## Endpoint

```
POST https://SEU_PROJECT.supabase.co/functions/v1/chat
```

### Request

```json
{
  "message": "O que devo comer antes do treino?",
  "conversationId": "uuid-opcional",
  "useCache": true
}
```

Headers:
```
Authorization: Bearer <supabase_access_token>
Content-Type: application/json
```

### Response (200)

```json
{
  "reply": "Para treino de forca...",
  "conversationId": "uuid",
  "intent": "question",
  "provider": "groq",
  "model": "llama-3.3-70b-versatile",
  "cached": false,
  "duration_ms": 843
}
```

### Erros comuns

| Status | Significado                                      |
|--------|--------------------------------------------------|
| 400    | Body invalido ou mensagem ausente/muito longa    |
| 401    | Token JWT ausente ou invalido                    |
| 405    | Metodo diferente de POST                         |
| 429    | Rate limit atingido (20 msg/min por usuario)     |
| 500    | Erro interno (todos os providers falharam)       |

## Teste local

```bash
supabase start
supabase functions serve chat

curl -X POST http://localhost:54321/functions/v1/chat \
  -H "Authorization: Bearer SEU_JWT" \
  -H "Content-Type: application/json" \
  -d '{"message": "Oi Praxi, qual minha meta de proteina?"}'
```
