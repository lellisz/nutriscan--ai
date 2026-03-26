---
tags: [sessao, nutriscan, praxis-nutri, rebrand]
data: 2026-03-21
---

## Feito hoje (rebrand Praxis Nutri)

### Brainstorm de identidade
- Nome escolhido: **Praxis Nutri** (raiz grega "pratica/acao" + nutricao)
- Paleta: verde petroleo (#1B3A2D) + verde folha (#2D8F5E) + off-white quente (#F4F5F0)
- Tom: nutricionista profissional, direto, cientifico
- Publico: estudantes a atletas, emocao de "confianca e controle"

### Agentes lancados (3 paralelos)
Os 3 agentes bateram rate limit durante execucao, mas conseguiram trabalhar em:
- 53 arquivos modificados
- Build passa limpo
- Status parcial — precisa verificar o que cada um completou vs o que ficou pendente

### O que CERTAMENTE foi feito (das sessoes anteriores)
- index.css com tokens Apple iOS (precisa ser atualizado para Praxis Nutri)
- Emojis removidos de todas as pages
- Acessibilidade melhorada (aria-labels, htmlFor, role=dialog)
- Tokens CSS corrigidos (prefixo ns-)
- HistoryPage conectada ao banco
- ScanPage com SVGs
- Coach com SVGs
- Migration Coach executada no Supabase
- api/scan.js e api/chat.js com bugs corrigidos

### O que ficou PENDENTE (agentes cortados pelo rate limit)
- Paleta Praxis Nutri (verde petroleo) no index.css — pode nao ter sido aplicada
- Dashboard com dados reais — pode nao ter sido conectado
- Profile com menu funcional — pode nao ter sido implementado
- Rebrand dos prompts de IA para "Coach Praxis"
- Streak funcional no Dashboard
- Debug final

## Prompt de continuidade
```
Continuando Praxis Nutri de 2026-03-21.
Rebrand em andamento. Build passa. 53 arquivos modificados.
VERIFICAR: paleta verde petroleo no CSS, Dashboard/Profile com dados reais,
prompts de IA rebranded, features ocas funcionando.
Rodar agente de debug apos verificacao.
```

## Links
- [[Coach Nutri]]
- [[decisao-rebrand-praxis-nutri]]
