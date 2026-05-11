# voice-transcribe

Recebe áudio em base64, transcreve via Groq Whisper (`whisper-large-v3-turbo`) e extrai
ingredientes/macros estruturados via Groq llama-3.3-70b.

## Rota

`POST /functions/v1/voice-transcribe`

## Auth

Header `Authorization: Bearer <user_jwt>` obrigatório (JWT do Supabase Auth).

## Request

```json
{
  "audioBase64": "<base64 string, sem prefix data:>",
  "mimeType": "audio/m4a"
}
```

Mime types suportados: `audio/m4a`, `audio/mp3`, `audio/mpeg`, `audio/wav`, `audio/webm`,
`audio/ogg`, `audio/flac`, `audio/mp4`. Tamanho máximo: 25 MB.

## Response 200

```json
{
  "transcript": "comi 100g de arroz e um filé de frango grelhado",
  "parsed": {
    "items": [
      {
        "name": "arroz branco cozido",
        "quantity": 100,
        "unit": "g",
        "estimated_kcal": 130,
        "estimated_protein": 2.7,
        "estimated_carbs": 28,
        "estimated_fat": 0.3
      },
      {
        "name": "peito de frango grelhado",
        "quantity": 120,
        "unit": "g",
        "estimated_kcal": 198,
        "estimated_protein": 37.2,
        "estimated_carbs": 0,
        "estimated_fat": 4.3
      }
    ],
    "confidence": 0.85
  }
}
```

## Errors

| Status | Causa |
|--------|-------|
| 400 | body inválido / base64 inválido |
| 401 | JWT ausente ou inválido |
| 405 | método ≠ POST |
| 413 | áudio > 25 MB |
| 500 | erro interno |
| 502 | falha no Groq Whisper |

## curl

```bash
curl -X POST "$SUPABASE_URL/functions/v1/voice-transcribe" \
  -H "Authorization: Bearer $USER_JWT" \
  -H "Content-Type: application/json" \
  -d "{\"audioBase64\":\"$(base64 -w0 sample.m4a)\",\"mimeType\":\"audio/m4a\"}"
```

## Deploy

```bash
supabase functions deploy voice-transcribe
```

## Env vars

- `GROQ_API_KEY` (obrigatório)
- `SUPABASE_URL` (auto-injetado)
- `SUPABASE_SERVICE_ROLE_KEY` (auto-injetado)
