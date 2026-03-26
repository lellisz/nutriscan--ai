# Motor de IA — Praxis Nutri

## Providers
- **Groq**: LLaMA 3.3 70B Versatile + LLaMA 3.1 8B Instant
- **Gemini**: Flash 2.0 + Flash Lite
- **NÃO USAR**: Claude/Anthropic API

## Endpoints ativos
| Rota | Função | Modelo |
|------|--------|--------|
| POST /api/scan | Análise de imagem | Groq Vision / Gemini |
| POST /api/chat | Chat do coach | Groq 70B / Gemini Flash |
| POST /api/voice | Parse voz→alimento | Groq 70B |

## Edge Function (pendente deploy)
- supabase/functions/chat/index.ts
- Intent detection: LLaMA 8B (~10ms)
- Roteamento: small_talk→8B, question→70B, emotional→Gemini
- Fallback cruzado automático

## System prompt Praxi (anti-culpa)
- NUNCA: "excedeu", "falhou", "a mais"
- SEMPRE: "dia generoso", "amanhã equilibra"
- Tom: amigo nutricionista brasileiro
- Conhece: PF, coxinha, açaí, tapioca, pão de queijo, marmitex
