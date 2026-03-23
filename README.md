# Praxis Nutri

> Assistente de nutrição com IA — scan de alimentos, análise nutricional instantânea e acompanhamento diário.

![Status](https://img.shields.io/badge/status-em%20desenvolvimento-yellow)
![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?logo=supabase&logoColor=white)
![Groq](https://img.shields.io/badge/Groq-F55036?logo=groq&logoColor=white)
![Gemini](https://img.shields.io/badge/Gemini-4285F4?logo=google&logoColor=white)
![Netlify](https://img.shields.io/badge/Netlify-00C7B7?logo=netlify&logoColor=white)

---

## Sobre o Projeto

O **Praxis Nutri** é uma aplicação móvel-first de nutrição alimentada por IA. O usuário fotografa sua refeição, a aplicação identifica os alimentos e calcula os macronutrientes automaticamente. Um coach de IA personalizado oferece orientações, sugestões de refeições e acompanha o progresso diário — com autenticação segura e dados persistidos por usuário via Supabase.

### Idioma

A aplicação é completamente em **português brasileiro (pt-BR)**.

---

## Funcionalidades

| Funcionalidade | Status |
|---|---|
| Autenticação (cadastro e login) | ✅ Concluído |
| Scan de alimentos por foto (IA) | ✅ Concluído |
| Chat com Coach Praxis (IA) | ✅ Concluído |
| Histórico de refeições com macros | ✅ Concluído |
| Dashboard com progresso diário | ✅ Concluído |
| Gráficos de evolução semanal | ✅ Concluído |
| Registro de metas nutricionais | ✅ Concluído |
| Perfil de usuário e preferências | ✅ Concluído |
| Sistema de subscrição premium | 🔄 Em desenvolvimento |

---

## Stack Tecnológico

### Frontend
- **React** — UI interativa
- **Vite** — build tool rápido
- **React Router** — roteamento SPA
- **Recharts** — gráficos de evolução
- **Zod** — validação de dados

### Estilização
- **CSS Personalizado** — sistema de design com variáveis
- Classe padrão: `ns-` prefix (`ns-card`, `ns-btn`, `ns-input`, etc.)
- Design mobile-first (max-width: 480px)

### Backend e Dados
- **Supabase** — PostgreSQL gerenciado com autenticação integrada
- **Row Level Security (RLS)** — isolamento de dados por usuário garantido no BD

### IA e Análise

A arquitetura de IA usa **modelos diferentes por tipo de tarefa**, balanceando qualidade e custo:

| Tarefa | Modelo | Provedor |
|---|---|---|
| Análise de imagem de alimentos | Gemini 2.5 Flash | Google |
| Detecção de intenção do usuário | Llama 3.1 8B | Groq |
| Resposta do Coach Praxis | Llama 3.3 70B | Groq |
| Insights nutricionais | Gemini Flash-Lite | Google |

**Motivação:** usar um modelo maior para todas as tarefas aumentaria o custo em ~4x sem ganho proporcional de qualidade. Detecção de intenção simples não exige 70B parâmetros.

### Monitoramento
- **Sentry** — rastreamento de erros em produção

### DevOps
- **GitHub Actions** — CI/CD automatizado
- **Netlify** — host e deployments

---

## Estrutura do Projeto

```
praxis-nutri/
├── src/
│   ├── components/           # Componentes React reutilizáveis
│   ├── pages/                # Telas: Home, Chat, Scan, Histórico, Perfil
│   ├── services/             # Integrações com Groq, Gemini e Supabase
│   ├── hooks/                # Lógica de estado e autenticação
│   └── styles/               # Design system e CSS global
├── api/                      # Endpoints (Vercel/Netlify)
│   ├── scan.js              # Análise de imagens
│   └── chat.js              # Chat com coach
├── supabase/
│   ├── schema.sql           # Schema com RLS policies
│   └── migrations/          # Scripts de migração
├── screenshots/             # Imagens do app
├── .github/
│   └── workflows/           # Pipelines CI/CD
├── docs/                    # Documentação
└── CLAUDE.md               # Guia do projeto
```

---

## Como Rodar Localmente

### Pré-requisitos
- **Node.js** 18+
- Conta no [Supabase](https://supabase.com) (gratuita)
- Chave de API do [Groq](https://console.groq.com) (gratuita)
- Chave de API do [Google Gemini](https://aistudio.google.com) (gratuita)

### Instalação

```bash
# Clone o repositório
git clone https://github.com/lellisz/praxis-nutri.git
cd praxis-nutri

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env
# Preencha com suas credenciais (veja .env.example)

# Inicie o servidor de desenvolvimento
npm run dev
```

### Variáveis de Ambiente

```env
# Supabase
VITE_SUPABASE_URL=sua_url_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_supabase_anonima

# Groq
VITE_GROQ_API_KEY=sua_chave_groq

# Google Gemini
VITE_GEMINI_API_KEY=sua_chave_gemini

# Sentry (produção)
VITE_SENTRY_DSN=seu_sentry_dsn
```

---

## Segurança

### Row Level Security (RLS)

O isolamento de dados entre usuários é garantido pelo **Row Level Security** do PostgreSQL — não apenas na camada de aplicação. Mesmo com falhas no frontend, o banco recusa qualquer acesso a dados de outro usuário.

Exemplo de política RLS:
```sql
CREATE POLICY "users_own_data" ON refeicoes
  FOR ALL USING (auth.uid() = user_id);
```

### Boas Práticas
- Nunca commitar `.env` ou `.env.claude`
- Validação com Zod em todas entradas de usuário
- Erro handling e rastreamento com Sentry

---

## Comandos

```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview local do build
npm run preview

# Lint e formatação
npm run lint
```

---

## Banco de Dados

**Tabelas principais:**
- `profiles` — dados do usuário
- `daily_goals` — metas nutricionais diárias
- `scan_history` — histórico de alimentos escaneados
- `weight_logs` — registro de peso
- `workout_logs` — registro de atividades
- `hydration_logs` — registro de hidratação
- `coach_messages` — histórico de conversas com Coach Praxis

---

## Fluxo de IA

```
Usuário
   |
   |-- Mensagem de chat
   |       |-- Detecção de intenção    →  Llama 3.1 8B   (Groq)    # Rápido e barato
   |               |-- Resposta do coach →  Llama 3.3 70B (Groq)    # Contexto rico
   |
   |-- Foto de refeição
           |-- Análise da imagem       →  Gemini 2.5 Flash         # Visão multimodal
           |-- Geração de insights     →  Gemini Flash-Lite        # Resumos simples
```

---

## Autor

**Felipe Lelis Z. Rabello Queiroz**
CEO & Desenvolvedor — Praxis Nutri

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?logo=linkedin&logoColor=white)](https://linkedin.com/in/felipe-lelis-752790375)
[![GitHub](https://img.shields.io/badge/GitHub-181717?logo=github&logoColor=white)](https://github.com/lellisz)

---

## Licença

Propriedade intelectual — Felipe Lelis Z. Rabello Queiroz

---

*Projeto em desenvolvimento ativo. Contribuições e feedback são bem-vindos.*
