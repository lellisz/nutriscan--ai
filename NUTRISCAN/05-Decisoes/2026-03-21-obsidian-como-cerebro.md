# Decisao: Obsidian como segundo cerebro do projeto

## Contexto
Claude Code nao tem memoria entre sessoes. Cada conversa comeca do zero.
Precisamos de um sistema de documentacao que:
- Persista conhecimento entre sessoes
- Documente bugs resolvidos para referencia futura
- Mantenha roadmap e planejamento atualizados
- Seja agnostico de ferramenta (funciona com qualquer IA)

## Opcoes consideradas

### Opcao A: Apenas CLAUDE.md + memoria interna do Claude
- Pros: Simples, sem overhead
- Contras: Memoria interna limitada, CLAUDE.md fica poluido se colocar tudo

### Opcao B: Obsidian Vault dentro do projeto
- Pros: Links bidirecionais, busca poderosa, templates, visual graph, plugins, markdown puro
- Contras: Mais arquivos no repo (pode adicionar ao .gitignore)

### Opcao C: Notion/Linear externo
- Pros: Colaboracao, cloud
- Contras: Preso a plataforma, IA nao acessa diretamente

## Decisao final
**Opcao B** - Obsidian vault em `NUTRISCAN/` na raiz do projeto.
- CLAUDE.md continua como fonte de verdade para a IA
- Obsidian e o cerebro expandido para o humano + referencia para a IA
- Templates padronizam como documentar sessoes, bugs e decisoes

## Consequencias
- Novo folder `NUTRISCAN/` no projeto
- Workflow: ao final de cada sessao, documentar no Obsidian
- Bugs resolvidos viram notas pesquisaveis
- Roadmap vive no Obsidian (espelho do status real)

---

*Decidido em: 2026-03-21*

#decisao #workflow #obsidian
