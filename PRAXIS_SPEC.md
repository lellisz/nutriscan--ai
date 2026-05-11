# PRAXIS NUTRITION — Design Spec v2.0
> Source of truth para implementação React Native / Expo  
> Baseado no PDF Black Metallic v2.0  
> Usar este arquivo em TODO prompt ao Claude Code

---

## 1. TOKENS OBRIGATÓRIOS

```typescript
// constants/Colors.ts — substituir completamente
export const Colors = {
  // Backgrounds
  BG:  '#07070D',   // fundo principal — NUNCA branco puro
  C1:  '#0D0D17',   // cards primários
  C2:  '#12121F',   // cards secundários
  C3:  '#1A1A2E',   // cards terciários / hover

  // Brancos metálicos (hierarquia)
  WH:  '#EBE4D2',   // títulos principais, logo
  W2:  '#C8BFA8',   // subtítulos
  W3:  '#8A8070',   // labels, textos muted
  W4:  '#4A4860',   // textos muito suaves (MÍNIMO — não usar mais escuro)

  // Accent
  AC:  '#6B5FE4',   // roxo accent (streak, badges premium)
  ACL: '#8B7FF4',   // roxo claro (hover, glow)

  // Bordas
  B1:  '#2A2840',   // borda padrão
  B2:  '#1E1C30',   // borda sutil

  // Status
  OK:  '#2D7A4F',   // verde sucesso
  ERR: '#7A2D2D',   // vermelho erro (NUNCA vermelho punitivo brilhante)
  WRN: '#7A5C2D',   // laranja warning

  // Coral (macros, gráficos)
  CO:  '#E8593C',   // coral quente
  COL: '#F07A5A',   // coral claro

  // Gradientes (usar com expo-linear-gradient)
  GP: ['#1A1830', '#07070D'],  // fundo gradiente padrão
  GH: ['#6B5FE4', '#4A3FA8'],  // gradiente header
}
```

---

## 2. TIPOGRAFIA

```typescript
// Hierarquia estrita — não misturar
const Typography = {
  // Cormorant Garamond — display, logo, títulos grandes
  display: { fontFamily: 'CormorantGaramond_300Light', letterSpacing: 8, textTransform: 'uppercase' },
  heading: { fontFamily: 'CormorantGaramond_600SemiBold', letterSpacing: 4 },

  // Jost — UI, labels, botões, navegação
  label:   { fontFamily: 'Jost_400Regular', letterSpacing: 2, textTransform: 'uppercase', fontSize: 11 },
  button:  { fontFamily: 'Jost_500Medium', letterSpacing: 3, textTransform: 'uppercase', fontSize: 12 },
  body:    { fontFamily: 'Jost_300Light', fontSize: 14, lineHeight: 22 },

  // DM Sans — dados numéricos, métricas, scores
  number:  { fontFamily: 'DMSans_400Regular', fontSize: 42, letterSpacing: -1 },
  metric:  { fontFamily: 'DMSans_300Light', fontSize: 28 },
  small:   { fontFamily: 'DMSans_400Regular', fontSize: 13 },
}
```

---

## 3. GRID E ESPAÇAMENTO

```
Padding horizontal: 20px (todas as telas)
Grid base: 8px
Border radius cards: 12px
Border radius botões: 6px
Border width padrão: 0.5px
Tab bar height: 60px
Status bar: sempre dark-content
```

---

## 4. COMPONENTES GLOBAIS

### NavBar (tab bar)
```
5 tabs: INÍCIO · JEJUM · [FAB +] · INSIGHTS · COMIDA
FAB central: círculo 56px, cor AC (#6B5FE4), ícone +
Tab ativa: ponto branco embaixo do ícone
Tab inativa: ícone W3 (#8A8070)
Background: C1 com border-top B1
```

### Botão primário
```
Background: WH (#EBE4D2)
Texto: BG (#07070D), Jost_500Medium, letterSpacing 3
Height: 52px, borderRadius: 6px
Width: 100% (com paddingHorizontal 20px)
```

### Botão secundário
```
Background: transparente
Borda: 0.5px B1
Texto: W2, mesma tipografia
Height: 52px
```

### Card padrão
```
Background: C1 (#0D0D17)
Border: 0.5px B1 (#2A2840)
BorderRadius: 12px
Padding: 16px
```

---

## 5. TELAS — SPEC COMPLETO

---

### TELA 01 — SPLASH (`(auth)/index.tsx`)

**Layout:** tela cheia, fundo BG, conteúdo centralizado verticalmente

```
TOPO (1/3):
  - Triângulo outline 24px, cor W3, centralizado
  - "P R A X I S" — CormorantGaramond_300Light, 32px, letterSpacing 8, WH
  - "N U T R I T I O N" — Jost_300Light, 11px, letterSpacing 6, W3
  - Linha horizontal 32px, 0.5px, W3, marginTop 12

MEIO (1/3):
  - "Nutrição de precisão." — CormorantGaramond_600SemiBold, 22px, WH, italic
  - "IA que analisa, aprende e evolui com você." — Jost_300Light, 13px, W3, marginTop 8

BAIXO (1/3):
  - Botão primário "COMEÇAR AGORA" — marginBottom 12
  - Texto link "JÁ TENHO CONTA" — Jost_400Regular, 11px, W3, letterSpacing 3
```

---

### TELA 02 — LOGIN (`(auth)/login.tsx`)

**Layout:** fundo BG, PRAXIS grande watermark em background (opacity 0.04)

```
TOPO:
  - Status bar area
  - "R A X I S" gigante — CormorantGaramond_300Light, 80px, WH, opacity 0.06, absolute

CONTEÚDO centralizado:
  - Triângulo outline 20px, W3
  - "P R A X I S" — 28px display
  - "N U T R I T I O N" — 10px label W3

  - "ENTRAR COM" — label 10px W3, marginTop 32, marginBottom 16

  - Botão Google: background C2, border B1, ícone G colorido + "CONTINUAR COM GOOGLE"
  - Botão Apple: background C2, border B1, ícone Apple WH + "CONTINUAR COM APPLE"
  
  - Linha divisória com "OU" — W4, marginVertical 16
  
  - Botão "ENTRAR COM E-MAIL" — botão primário completo
  
  - "Sem conta? Criar agora" — Jost_300Light 12px W3, "Criar agora" em itálico WH
```

---

### TELA 03 — HOME DASHBOARD (`(tabs)/index.tsx`)

**Layout:** ScrollView, fundo BG, padding 20px

```
HEADER:
  - "15:37" — DMSans 12px W3 (ou status bar nativa)
  - "SEG. 30 MARÇO" — Jost_300Light 11px W3
  - "△ PRAXIS" — triângulo + Jost_500Medium 13px WH
  - Badge "🔥 3 DIAS" — fundo AC, Jost 10px WH, borderRadius 20

CARD SALDO CALÓRICO (card padrão):
  - Label "SALDO CALÓRICO · HOJE" — label 10px W3
  - "2.732" — DMSans_300Light 48px WH, letterSpacing -2
  - "KCAL RESTANTES" — label 10px W3
  - Ring circular SVG 60px, progresso 19%, cor AC
  - Grid 3 colunas: META | CONS. | PROG. — valores DMSans 16px WH

CARD REFEIÇÕES (card padrão):
  - Lista refeições do dia com macros
  - Botão "REGISTRAR NOVAMENTE" inline

SEÇÃO HIDRATAÇÃO:
  - Label "HIDRATAÇÃO"
  - 8 círculos 24px, preenchidos proporcionalmente, cor AC
  - Tap em cada círculo adiciona 250ml

SUGESTÃO DO COACH:
  - Label "SUGESTÃO DO COACH" — 10px W3
  - Texto sugestão — Jost_300Light italic 14px WH
  - Macros inline — DMSans 12px W3

BOTTOM:
  - Botão "📷 REGISTRAR REFEIÇÃO" — botão primário
  - Tab bar
```

---

### TELA 04 — CÂMERA (`log/camera.tsx`)

```
HEADER:
  - "R E G I S T R A R" — display 24px WH
  - Botão ✕ — 44×44px hitSlop

VIEWFINDER:
  - Área câmera fullwidth, height 240px
  - Círculo shutter centralizado 56px, border 2px WH

BOTTOM:
  - Botão "CAPTURAR AGORA" — primário
  - Texto hint — Jost_300Light 12px W3
  - Input sugestão manual — border B1, C2
  - Tab bar com câmera ativa (FAB)
```

---

### TELA 05 — RESULTADO IA (`log/result.tsx`)

```
HEADER:
  - "PRAXIS · 2ª REFEIÇÃO" — label 10px W3
  - "RESULTADO IA" — display 24px WH

CARD IDENTIFICAÇÃO:
  - "Frango, arroz e salada" — CormorantGaramond 18px WH italic
  - "GEMINI VISION · 94% CONF." — label 10px AC
  - Botão "✎ EDITAR" — pequeno, border B1

CARD COMPOSIÇÃO:
  - Label "COMPOSIÇÃO ESTIMADA"
  - Linhas: KCAL | PROT | CARB | GORD — DMSans valores WH, labels W3

PORÇÃO:
  - "PORÇÃO" label + [ − ] [ 1× ] [ + ] — botões 44×44px

AÇÕES:
  - Botão "CONFIRMAR REFEIÇÃO" — primário
  - "EDITAR MANUALMENTE" — link W3
```

---

### TELA 06 — DETALHE REFEIÇÃO (`log/add.tsx`)

```
HEADER:
  - "← REFEIÇÃO" — display 20px WH

LISTA INGREDIENTES:
  - Cada item: nome Jost 14px WH + quantidade DMSans 13px W3
  - Border-bottom B1 entre items

RESUMO:
  - Dois valores grandes side-by-side (KCAL | BALANÇO)
  - Card insight coach — italic Jost 13px W2

FOOTER:
  - "VOLTAR" — W3 link
  - "REMOVER" — ERR (#7A2D2D) link
```

---

### TELA 07 — MACROS (`(tabs)/food.tsx` ou `scan.tsx`)

```
HEADER:
  - "M A C R O S" — display 24px WH
  - Data "27 MAR" — label 10px W3

CARD CALORIAS:
  - Label "CALORIAS · HOJE"
  - "527 / 2.205" — DMSans 42px WH / W3
  - Progress bar linear, cor AC

CARD MACRONUTRIENTES:
  - 3 linhas: PROT | CARB | GORD
  - Cada linha: nome label + valor atual DMSans + meta W3 + barra progresso

Tab bar com MACROS ativo
```

---

### TELA 08 — EVOLUÇÃO DE PESO (`(tabs)/insights.tsx`)

```
HEADER:
  - "PRAXIS · EVOLUÇÃO" — label W3
  - "EVOLUÇÃO DE PESO" — display 28px WH
  - "73.8 KG ATUAL" — DMSans 36px WH + label 10px W3

GRÁFICO:
  - Área chart últimos 30 dias — linha AC sobre fundo C1
  - Labels "1 MAR" e "30 MAR" — label 10px W3
  - Linha meta tracejada W3

CARD REGISTROS:
  - Lista últimas pesagens — data W3 + peso WH + variação (verde/vermelho sutil)

CARD IMC:
  - "23.5 NORMAL" — DMSans 32px WH + label AC
  - Barra gradiente ABAIXO→NORMAL→SOBREP→OBESO
  - Marcador na posição atual
```

---

### TELA 09 — COMPARAÇÃO METAS (`goals.tsx`)

```
HEADER:
  - "PRAXIS · ANÁLISE" — label W3
  - "COMPARAÇÃO DE METAS" — display 24px WH

GRID 2 CARDS:
  - META DIÁRIA: "2.732 KCAL" — DMSans 36px WH
  - CONSUMIDO: "527 KCAL · 19%" — DMSans 36px WH

CARD META vs REAL MACROS:
  - Tabela: nutriente | meta | real | % — DMSans valores
  - Ring circular por nutriente — SVG pequeno 40px

CARD TENDÊNCIA SEMANAL:
  - Mini barras D S T Q Q S S
  - Cor: atingiu meta = AC, abaixo = W4
```

---

### TELA 10 — FOTOS PROGRESSO (`(tabs)/photoprog.tsx`)

```
HEADER:
  - "PRAXIS · EVOLUÇÃO" — label W3
  - "FOTOS DE PROGRESSO" — display 24px WH

SLIDER ANTES/DEPOIS:
  - Duas fotos side-by-side com divisor central arrastável
  - Labels "ANTES" e "DEPOIS" — label 10px W3
  - Peso sobreposto: "76" coral + "8" WH + "KG · JAN 2025 · ANTES"

LINHA DO TEMPO:
  - Lista meses com peso + variação — DMSans + Jost

FOOTER:
  - "PROGRESSO TOTAL −2.7kg em 60 dias" — DMSans WH + label W3
  - Botão "+ FOTO" — secundário pequeno
```

---

### TELA 11 — COACH GROQ IA (`(tabs)/coach.tsx`)

```
HEADER:
  - "C O N S U L T A" — display 24px WH
  - Badge "● GROQ ONLINE" — ponto verde + Jost 10px W3

CONTEXTO HOJE (barra fixa):
  - 4 métricas: KCAL | PROT | ÁGUA | JEJUM — DMSans valores WH, labels W3

ÁREA CHAT (ScrollView flex:1):
  !! CRÍTICO: inicializar com mensagem de boas-vindas no useState
  
  Mensagem coach: 
    - "COACH PRAXIS · GROQ" — label 10px W3
    - Texto — Jost_300Light italic 14px WH
    - Container: border-left 2px AC, paddingLeft 12, C2 background
  
  Mensagem usuário:
    - Alinhada à direita
    - Container: C3 background, borderRadius 12, padding 12
    - "VOCÊ · AGORA" — label 10px W3, alinhado direita

INPUT:
  - TextInput — border B1, C2, borderRadius 6, Jost 14px WH
  - Botão send "›" — 44×44px, AC background

SUGESTÕES RÁPIDAS (quando chat vazio):
  - Pills horizontais: "O que comer agora?" | "Estou no déficit?" etc.
  - Border B1, C2, Jost 12px W2
```

---

### TELA 12 — PERFIL/IDENTIDADE (`(tabs)/profile.tsx`)

```
HEADER:
  - "I D E N T I D A D E" — display 24px WH
  - Ícone ⊙ settings — 44×44px

CARD USUÁRIO:
  - Avatar quadrado 48px, border B1, iniciais "FE" — Jost 16px WH
  - Nome — Jost_500Medium 18px WH
  - "MEMBRO PREMIUM" — label 10px AC
  - "desde jan 2025" — Jost 11px W3

STATS GRID:
  - 3-4 métricas pessoais em grid

LISTA CONQUISTAS:
  - Cada item: ícone + título + descrição + "›"
  - Border-bottom B1

CARD PLANO:
  - Detalhes assinatura RevenueCat
```

---

### TELA 13 — SISTEMA/SETTINGS (`settings.tsx`)

```
HEADER:
  - "← S I S T E M A" — display 20px WH
  - "v2.0" — DMSans 14px W3

SEÇÃO NOTIFICAÇÕES:
  - Toggle geral — Switch RN, cor AC quando ativo
  - Horário refeição — row com valor + "›"

SEÇÃO CONTA:
  - "SAIR DA CONTA" — Jost 13px WH, C2 background, border B1
  - "EXCLUIR CONTA" — Jost 11px ERR, opacidade 0.5
  - "AÇÃO IRREVERSÍVEL" — label 9px ERR abaixo

FOOTER:
  - "PRAXIS · GROQ · GEMINI · SUPABASE" — label 9px W4, centralizado
```

---

## 6. COMANDO PADRÃO PARA CLAUDE CODE

Use este template para cada tela:

```
claude "implemente a [NOME DA TELA] em [CAMINHO DO ARQUIVO] 
seguindo EXATAMENTE o PRAXIS_SPEC.md.

Tokens obrigatórios: importar de constants/Colors.ts
Fontes: CormorantGaramond_300Light para display, Jost para UI, DMSans para números
Padding horizontal: 20px
Fundo: sempre BG (#07070D)
Botões fechar: sempre 44×44px com hitSlop={6}

Estrutura da tela:
[colar seção específica do spec acima]

Não inventar nada que não esteja no spec.
Confirmar o arquivo após implementar."
```

---

## 7. ORDEM DE IMPLEMENTAÇÃO RECOMENDADA

```
FASE 1 — Fundação (fazer primeiro)
  1. constants/Colors.ts — tokens completos
  2. constants/Typography.ts — hierarquia de fontes  
  3. components/ui/PraxisRing.tsx — ring SVG reutilizável
  4. components/ui/MetallicButton.tsx — botão primário/secundário
  5. components/ui/NavBar — tab bar padrão

FASE 2 — Telas de entrada
  6. (auth)/index.tsx — Splash
  7. (auth)/login.tsx — Login

FASE 3 — Core do app
  8. (tabs)/index.tsx — Home Dashboard
  9. (tabs)/coach.tsx — Coach (fix bug chat vazio PRIMEIRO)
  10. (tabs)/food.tsx — Macros
  11. score.tsx — Score

FASE 4 — Secundárias
  12. settings.tsx — Sistema
  13. (tabs)/profile.tsx — Perfil
  14. (tabs)/insights.tsx — Evolução
  15. log/camera.tsx + log/result.tsx — Fluxo refeição
```

---

## 8. REGRAS INVIOLÁVEIS

```
❌ NUNCA usar fundo branco puro (#FFFFFF)
❌ NUNCA usar vermelho punitivo brilhante para erros
❌ NUNCA usar ALL-CAPS em labels sem letterSpacing mínimo de 2
❌ NUNCA usar boxShadow CSS — usar elevation + shadowColor RN
❌ NUNCA usar linear-gradient CSS — usar <LinearGradient> expo
❌ NUNCA botão menor que 44×44px sem hitSlop
❌ NUNCA W4 mais escuro que #4A4860 (contraste WCAG mínimo)
❌ NUNCA useState dentro de objeto literal (Rules of Hooks)

✅ SEMPRE SafeAreaView em todas as telas
✅ SEMPRE KeyboardAvoidingView em telas com input
✅ SEMPRE useMemo em componentes com cálculo pesado (WChart, Radar)
✅ SEMPRE cleanup em useEffect com setTimeout/interval
✅ SEMPRE testar no Expo web antes de commitar
```
