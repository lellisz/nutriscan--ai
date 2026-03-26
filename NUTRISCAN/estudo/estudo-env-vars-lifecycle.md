---
tags: [estudo, backend, nodejs, praxis-nutri]
data: 2026-03-22
sessao: [[2026-03-22-coach-ia-evolution]]
---

# Ciclo de Vida de Variaveis de Ambiente em Node.js

## Como funciona
Variaveis de ambiente (.env) sao carregadas UMA VEZ quando o processo Node.js inicia. Depois disso, ficam em memoria (`process.env`). Alterar o arquivo .env NAO atualiza o processo em execucao.

## O fluxo

```
1. Voce edita .env         → Arquivo no disco muda
2. Processo Node.js roda   → Carrega .env na inicializacao
3. process.env.GROQ_API_KEY → Valor em memoria (snapshot do .env)
4. Voce edita .env de novo → Arquivo muda, mas process.env NAO
5. Precisa reiniciar Node  → Ai sim carrega o novo .env
```

## O bug que aprendemos
No Praxis Nutri, o usuario rotacionou as chaves de API no .env, mas o dev-server antigo continuava rodando com as chaves velhas em memoria. O novo processo nao conseguia subir porque a porta 3002 estava ocupada pelo antigo.

```
Terminal: "Porta 3002 ja em uso -- OK!"  ← Enganoso!
Realidade: Servidor antigo com chaves velhas ainda ativo
```

## Solucao
1. Matar o processo antigo: `taskkill //PID 24268 //F`
2. Iniciar novo: `node api/dev-server.js`

## Como encontrar o processo
```bash
# Achar quem esta usando a porta
netstat -ano | grep :3002

# Identificar o processo
wmic process where ProcessId=24268 get Name,CommandLine

# Matar
taskkill //PID 24268 //F
```

## Dica para o futuro
Em desenvolvimento, use ferramentas que recarregam automaticamente:
- `nodemon` — reinicia o processo quando arquivos mudam
- `dotenv` com watch mode — recarrega .env sem reiniciar
- Vite (frontend) ja faz isso via HMR (Hot Module Replacement)

## Links
- [[bug-dev-server-porta-ocupada]]
