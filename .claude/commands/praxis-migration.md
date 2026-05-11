---
description: Workflow completo de migration Supabase — verifica schema atual, gera SQL correto, detecta impacto em tipos TypeScript e checa necessidade de RLS
allowed-tools: Read, Bash, Glob, Grep, Write
---

# PRAXIS Migration

## Mudança de schema desejada
$ARGUMENTS

## Passo 1 — Listar Migrations Existentes

```bash
ls -la C:/projetos/praxis/supabase/migrations/ | sort
```

Identificar:
- Próximo número sequencial disponível
- Tabelas já criadas (grep nas migrations existentes)

## Passo 2 — Analisar Schema Atual

Ler as migrations existentes para a tabela afetada:
```bash
grep -l "[nome_tabela]" C:/projetos/praxis/supabase/migrations/*.sql
```

Extrair colunas atuais, constraints, indexes e policies RLS existentes.

## Passo 3 — Classificar a Mudança

| Tipo | Exemplos | Risco |
|------|----------|-------|
| Additive | ADD COLUMN, CREATE TABLE, CREATE INDEX | Baixo |
| Modificadora | ALTER COLUMN TYPE, ADD CONSTRAINT | Médio |
| Destrutiva | DROP COLUMN, DROP TABLE, RENAME | **ALTO — alertar usuário** |

Se destrutiva → alertar: "Esta migration é destrutiva. Dados existentes podem ser perdidos. Confirmar antes de continuar."

## Passo 4 — Verificar Consistência

Antes de gerar o SQL:
- A tabela alvo existe em alguma migration anterior?
- A coluna já existe? (duplo ADD causa erro)
- Há foreign keys para tabelas que existem?
- O tipo de dado é compatível com o uso no app (verificar services/)?

## Passo 5 — Gerar SQL da Migration

Nome do arquivo: `NNN_descricao_curta.sql`

Padrões obrigatórios:
```sql
-- Sempre usar IF NOT EXISTS / IF EXISTS para idempotência
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS nome_coluna tipo DEFAULT valor;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tabela_coluna ON tabela(coluna);

-- Comentário de contexto no topo
-- Migration NNN: [descrição do que faz e por quê]
```

## Passo 6 — Checklist RLS

Para cada tabela nova ou coluna com dados de usuário:
- Há policy `SELECT` filtrando por `user_id = auth.uid()`?
- Há policy `INSERT` garantindo que user só insere seus dados?
- Há policy `UPDATE`/`DELETE` para seu próprio user_id?

Se tabela nova sem políticas → gerar políticas RLS junto na migration.

## Passo 7 — Comandos de Aplicação

```bash
# Aplicar ao banco (rodar no terminal)
supabase db push

# OU via Supabase CLI local
supabase migration up

# Após aplicar — regenerar tipos TypeScript
supabase gen types typescript --local > C:/projetos/praxis/types/supabase.ts
```

## Passo 8 — Impacto nos Tipos

Após gerar tipos, verificar quais arquivos precisam ser atualizados:
```bash
# Encontrar usos da tabela modificada
grep -rn "[nome_tabela]" C:/projetos/praxis/services/ C:/projetos/praxis/stores/ C:/projetos/praxis/hooks/
```

Listar: "Atualizar esses arquivos para usar os novos tipos: [lista]"

## Output Final

```
## Migration [NNN] — [nome_tabela]

Tipo: [Additive/Modificadora/Destrutiva]
Arquivo: supabase/migrations/[NNN_descricao].sql

[conteúdo SQL completo]

Aplicar com:
  supabase db push

Após aplicar:
  supabase gen types typescript --local > types/supabase.ts

Arquivos impactados:
  - [arquivo]: [o que muda]

RLS: [OK existente / Novas policies incluídas na migration]
```
