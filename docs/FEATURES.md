# PRAXIS — Documentação de Features

## LogModal v3 (`app/log/add.tsx`)

### Como usar

Acesse via `router.push("/log/add")` ou `router.push({ pathname: "/log/add", params: { type: "lunch" } })`.

O parâmetro `type` é opcional e aceita `"breakfast" | "lunch" | "dinner" | "snack"`.

### Comportamento

1. **Seleção de tipo de refeição** — chips no topo (Café / Almoço / Jantar / Lanche). Pré-selecionado pelo parâmetro `type`.
2. **Busca** — campo com placeholder `Buscar alimento...`. Dispara com 2+ caracteres. Filtra o banco local (`FOOD_DB`) com 30 itens.
3. **Refeições frequentes** — exibidas quando a busca está vazia. Carregadas via `getFrequentMeals(userId)` do `services/daily.ts`. Máximo 5 itens.
4. **Seleção e quantidade** — ao pressionar um item, expande inline com stepper de gramas (mín 10g, máx 1000g, step 10g). Macros recalculadas em tempo real.
5. **Salvar** — insere em `scan_history` via Supabase. Invalida a query `["nutrition", "daily"]`. Exibe `Alert.alert("✓ Registrado", ...)` e navega para `/(tabs)`.

### Exemplo de chamada

```typescript
import { router } from "expo-router";

// Abrir direto para almoço
router.push({ pathname: "/log/add", params: { type: "lunch" } });
```

---

## CoachScreen (`app/(tabs)/coach.tsx`)

### Comportamento

- Header fixo **"Coach Praxi"** — `fonts.sansLight`, 18px, `#EBE4D2`
- `FlatList` de mensagens com duas variantes de bolha:
  - Usuário: `backgroundColor: #7F77DD` (purple)
  - Coach: `backgroundColor: #100F15` (surface)
- `TextInput` fixo no rodapé para digitar mensagem
- Botão **Send** chama a Edge Function `/coach` com o Bearer token da sessão Supabase
- `ActivityIndicator` enquanto aguarda resposta
- Mensagens adicionadas otimisticamente e atualizadas com a resposta

### Integração com Edge Function

```typescript
const session = await supabase.auth.getSession();
const token = session.data.session?.access_token;

const res = await fetch(`${SUPABASE_URL}/functions/v1/coach`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({ message, userId: user.id }),
});

const { reply } = await res.json();
```

---

## Hook `useFrequentMeals` (`hooks/useFrequentMeals.ts`)

### Assinatura

```typescript
function useFrequentMeals(userId: string | undefined): UseQueryResult<FrequentMeal[]>
```

### Tipo retornado

```typescript
interface FrequentMeal {
  id: string;       // UUID do registro mais recente
  name: string;     // Nome do alimento
  calories: number; // Calorias por 100g
  protein: number;  // Proteína por 100g
  count: number;    // Vezes consumido na última semana
}
```

### Comportamento

- Busca os registros de `scan_history` dos últimos 7 dias
- Agrupa por `food_name` e conta ocorrências
- Retorna os 5 mais frequentes, ordenados por contagem decrescente
- Validado com Zod
- `staleTime` de 5 minutos
- Desabilitado quando `userId` é `undefined`

### Exemplo

```typescript
import { useFrequentMeals } from "@/hooks/useFrequentMeals";
import { useAuthStore } from "@/stores/authStore";

function MyComponent() {
  const { user } = useAuthStore();
  const { data: meals, isLoading } = useFrequentMeals(user?.id);

  if (isLoading) return <ActivityIndicator />;

  return (
    <>
      {meals?.map((meal) => (
        <Text key={meal.id}>{meal.name} — usado {meal.count}×</Text>
      ))}
    </>
  );
}
```

---

## Edge Function Coach (`supabase/functions/coach/index.ts`)

### Endpoint

```
POST /functions/v1/coach
Authorization: Bearer <supabase_session_token>
Content-Type: application/json

{ "message": "string", "userId": "string" }
```

### Resposta

```json
{ "reply": "string" }
```

### Regras

- Valida Bearer token via Supabase Auth
- Sanitiza a mensagem removendo dados pessoais antes de enviar ao Claude Haiku
- Rate limit: 10 requisições/min por `userId`
- CORS: `localhost:8081`, `localhost:19006`, `praxis-gold.vercel.app`
- Modelo: `claude-haiku-4-5-20251001`, `max_tokens: 500`
