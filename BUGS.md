# BUGS.md — Auditoria PRAXIS v2.0
> Gerado em: 2026-05-10
> Escopo: app/, components/, hooks/, stores/

## Sumário
| Categoria | Total |
|-----------|-------|
| Rules of Hooks | 0 |
| expo-linear-gradient | 0 |
| Touch Targets < 44px | 7 |
| Template Literals não renderizados | 0 |
| **TOTAL** | **7** |

---

## 1. Rules of Hooks

Nenhum bug encontrado nesta categoria.

Verificados: hooks em `app/_layout.tsx`, `app/log/camera.tsx`, `app/log/barcode.tsx`, `app/(tabs)/insights.tsx`, `app/(tabs)/coach.tsx`, `app/(tabs)/fasting.tsx`, `app/score.tsx`, `components/ui/DetailPanel.tsx` e demais. Todos os hooks estão no top-level dos componentes React, antes de qualquer `return` condicional.

---

## 2. expo-linear-gradient

Nenhum bug encontrado nesta categoria.

Os três arquivos que usam gradientes (`MetallicButton.tsx`, `MetallicText.tsx`, `ShimmerSkeleton.tsx`) importam e utilizam corretamente o componente `<LinearGradient>` de `expo-linear-gradient`, sem strings CSS.

---

## 3. Touch Targets < 44px

### [HIGH] app/log/add.tsx:421
**Problema:** Botão de fechar (✕) `backBtn` com área clicável de 32×32px, abaixo do mínimo de 44×44px. Sem `hitSlop` para compensar.
**Código:**
```tsx
// linha 244 — uso
<Pressable onPress={() => router.back()} style={styles.backBtn}>
  <Text style={styles.backText}>✕</Text>
</Pressable>

// linha 421 — estilo
backBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
```
**Correção:** Adicionar `hitSlop={6}` ao `Pressable`, ou aumentar `width`/`height` para 44.
```tsx
<Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={6}>
```

---

### [HIGH] app/log/index.tsx:63
**Problema:** Botão de fechar (✕) `backBtn` com área clicável de 32×32px. Sem `hitSlop`.
**Código:**
```tsx
// linha 24 — uso
<Pressable onPress={() => router.back()} style={styles.backBtn}>
  <Text style={styles.backText}>✕</Text>
</Pressable>

// linha 63 — estilo
backBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
```
**Correção:** Adicionar `hitSlop={6}` ao `Pressable`, ou aumentar para 44×44.

---

### [HIGH] app/log/restaurant.tsx:143
**Problema:** Botão de fechar (✕) `backBtn` com área clicável de 32×32px. Sem `hitSlop`.
**Código:**
```tsx
// linha 67 — uso
<Pressable onPress={() => router.back()} style={styles.backBtn}>
  <Text style={styles.backText}>✕</Text>
</Pressable>

// linha 143 — estilo
backBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
```
**Correção:** Adicionar `hitSlop={6}` ao `Pressable`, ou aumentar para 44×44.

---

### [HIGH] app/log/voice.tsx:244
**Problema:** Botão de fechar (✕) `backBtn` com área clicável de 32×32px. Sem `hitSlop`.
**Código:**
```tsx
// linha 160 — uso
<Pressable onPress={() => router.back()} style={styles.backBtn}>
  <Text style={styles.backText}>✕</Text>
</Pressable>

// linha 244 — estilo
backBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
```
**Correção:** Adicionar `hitSlop={6}` ao `Pressable`, ou aumentar para 44×44.

---

### [HIGH] app/score.tsx:355-365
**Problema:** Botão de voltar `BackButton` com área clicável de 32×32px. Sem `hitSlop`.
**Código:**
```tsx
// linhas 185-193 — componente BackButton
function BackButton() {
  return (
    <Pressable
      onPress={() => router.back()}
      style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
    >
      <Text style={styles.backIcon}>‹</Text>
    </Pressable>
  );
}

// linhas 355-366 — estilo
backBtn: {
  marginLeft: 22,
  marginBottom: 12,
  width: 32,
  height: 32,
  borderRadius: 16,
  backgroundColor: Colors.c2,
  borderWidth: 0.5,
  borderColor: Colors.b1,
  alignItems: 'center',
  justifyContent: 'center',
},
```
**Correção:** Adicionar `hitSlop={6}` ao `Pressable` em `BackButton`.
```tsx
<Pressable onPress={() => router.back()} hitSlop={6} style={...}>
```

---

### [HIGH] components/ui/DetailPanel.tsx:128-137
**Problema:** Botão de fechar do painel lateral `backBtn` com área clicável de 32×32px. Sem `hitSlop`.
**Código:**
```tsx
// linha 83 — uso
<Pressable style={styles.backBtn} onPress={onClose}>
  <Text style={styles.backIcon}>‹</Text>
</Pressable>

// linhas 128-137 — estilo
backBtn: {
  width: 32,
  height: 32,
  borderRadius: 16,
  backgroundColor: Colors.c2,
  borderWidth: 0.5,
  borderColor: Colors.b1,
  justifyContent: 'center',
  alignItems: 'center',
},
```
**Correção:** Adicionar `hitSlop={6}` ao `Pressable`.
```tsx
<Pressable style={styles.backBtn} onPress={onClose} hitSlop={6}>
```

---

### [MEDIUM] app/(tabs)/scan.tsx:363-372
**Problema:** Botão "+" de adicionar refeição (`addButton`) com área clicável de 28×28px. Sem `hitSlop`. É um alvo ainda menor que os backBtns.
**Código:**
```tsx
// linhas 174-179 — uso em MealRow
<Pressable
  style={({ pressed }) => [styles.addButton, pressed && styles.addButtonPressed]}
  onPress={() => console.log('add', meal.nome)}
>
  <Text style={styles.addButtonText}>+</Text>
</Pressable>

// linhas 363-372 — estilo
addButton: {
  width: 28,
  height: 28,
  borderRadius: 14,
  backgroundColor: Colors.c3,
  borderWidth: 1,
  borderColor: Colors.b1,
  alignItems: 'center',
  justifyContent: 'center',
},
```
**Correção:** Adicionar `hitSlop={8}` ao `Pressable` (compensar 8px de cada lado para atingir 44px).
```tsx
<Pressable
  style={({ pressed }) => [styles.addButton, pressed && styles.addButtonPressed]}
  onPress={() => console.log('add', meal.nome)}
  hitSlop={8}
>
```

---

## 4. Template Literals não renderizados

Nenhum bug encontrado nesta categoria.

Verificados todos os arquivos `.tsx`/`.ts` em `app/` e `components/`. Nenhuma ocorrência de `"${` ou `'${` (strings com interpolação em aspas simples/duplas ao invés de backticks).
