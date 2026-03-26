---
tags: [bug, nutriscan, build, esmodule, node]
data: 2026-03-13
status: resolvido
commit: 2957df9
---

## Erro
Build falha no Netlify com erro de `require()` no `build.js`:
```
ReferenceError: require is not defined in ES module scope
```

## Causa
O `package.json` declara `"type": "module"`, forcando **todos** os `.js` a usar ES module syntax. O `build.js` usava `require()` (CommonJS), incompativel com ES modules.

```javascript
// ERRADO (CommonJS)
const { execSync } = require("child_process");

// CORRETO (ES Module)
import { execSync } from "child_process";
```

## Solucao
Converter `build.js` de CommonJS para ES module syntax.

**Arquivo afetado:** `build.js`
**Commit:** `2957df9`

## Como detectar no futuro
- Erro `require is not defined` → verificar `"type"` no `package.json`
- Se `"type": "module"`, todo `.js` precisa usar `import/export`
- Alternativa: renomear arquivo para `.cjs` para forcar CommonJS

## Regra geral
| package.json type | .js usa | .cjs usa | .mjs usa |
|---|---|---|---|
| `"module"` | ESM | CommonJS | ESM |
| `"commonjs"` ou omitido | CommonJS | CommonJS | ESM |

## Relacionados
- [[bug-aspas-curvas-imports]] — mesma cadeia de bugs de build
- [[bug-netlify-build-command]] — proximo bug na cadeia
- [[decisao-es-modules]]
- [[Coach Nutri]]
