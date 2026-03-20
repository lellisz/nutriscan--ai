# 🚀 NutriScan - Guia de Desenvolvimento

## Como Rodar o Projeto

### Servidor Completo (Frontend + Backend)
```bash
npm run dev
```
Isso irá iniciar automaticamente:
- **API Server** (porta 3002) - Backend serverless functions
- **Vite Dev Server** (porta 5173) - Frontend React

### Servidores Individuais (se necessário)
```bash
# Apenas API
npm run dev:api

# Apenas Vite
npm run dev:vite
```

## Variáveis de Ambiente Necessárias

Certifique-se de ter um arquivo `.env.claude` ou `.env.local` com:

```env
# Supabase
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
SUPABASE_ANON_KEY=sua-anon-key

# Anthropic (para Coach IA)
ANTHROPIC_API_KEY=sk-ant-...

# Ollama (opcional - fallback local)
OLLAMA_URL=http://localhost:11434
```

## Funcionalidades Principais

### 📸 Scan de Alimentos
- Endpoint: `/api/scan`
- Analisa fotos de comida com IA
- Retorna informações nutricionais detalhadas

### 🤖 Coach IA Conversacional
- Endpoint: `/api/chat`
- Coach nutricional inteligente com contexto do usuário
- Features avançadas:
  - ⚡ Cache de respostas (5 min TTL)
  - 🔄 Retry automático com exponential backoff
  - 🦙 Fallback para Ollama se Anthropic falhar
  - 📊 Análise nutricional em tempo real
  - 🎯 Insights automáticos baseados em metas

## Troubleshooting

### Erro: "Failed to execute 'json' on 'Response'"
**Causa**: Servidor de API não está rodando
**Solução**: Use `npm run dev` (não apenas `npm run dev:vite`)

### Cache não está funcionando
**Solução**: Cache é em memória e reseta a cada restart do servidor

### IA não responde
**Solução**: Verifique se `ANTHROPIC_API_KEY` está configurada em `.env.claude`
