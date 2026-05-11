
## [T004] modo Planning
**Adicionado:** 17:00:26

implementa CoachScreen em app/(tabs)/coach.tsx: header 'Coach Praxi' sansLight 18px ivory #EBE4D2, FlatList de mensagens (bolha usuario: bg purple #7F77DD, bolha coach: bg surface #100F15), TextInput bottom para digitar, botao Send chama Edge Function /coach com Bearer token do Supabase session. Loading indicator durante chamada. TypeScript strict.

**Critério:** tsc --noEmit sem erros, mensagens aparecem, Edge Function conectada

---
