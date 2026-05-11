# Módulos Nativos Pendentes — PRAXIS v2

Este documento lista os módulos nativos que requerem configuração EAS Build antes da instalação.

---

## react-native-purchases (RevenueCat)

### Descrição
Integração com RevenueCat para gerenciamento de assinaturas in-app (iOS App Store e Google Play).

### Instalação
```bash
npx expo install react-native-purchases
```

### Configuração Necessária

#### 1. EAS Build Configuration
Adicionar ao `app.json`:
```json
{
  "expo": {
    "plugins": [
      [
        "react-native-purchases",
        {
          "ios": {
            "appStoreAPIKey": "SUAKEY_AQUI"
          },
          "android": {
            "playServiceAccountJsonPath": "./secrets/play-service-account.json"
          }
        }
      ]
    ]
  }
}
```

#### 2. Secrets Setup
- iOS: Configurar App Store Connect API Key no RevenueCat Dashboard
- Android: Baixar JSON de Service Account do Google Play Console e colocar em `./secrets/`
- Adicionar `secrets/` ao `.gitignore` (já configurado)

#### 3. Bundle IDs
- iOS: `com.praxis.nutrition` (já configurado em app.json)
- Android: `com.praxis.nutrition` (já configurado em app.json)

#### 4. EAS Build
```bash
eas build --platform ios --profile production
eas build --platform android --profile production
```

### Documentação
- RevenueCat SDK: https://www.revenuecat.com/docs/react-native
- Expo Config Plugin: https://docs.expo.dev/versions/latest/sdk/revenue-cat/

---

## react-native-health-connect

### Descrição
Integração com HealthKit (iOS) e Health Connect (Android) para sincronizar dados de atividade física e saúde.

### Instalação
```bash
npx expo install react-native-health-connect
```

### Configuração Necessária

#### 1. iOS — HealthKit Permissions
Adicionar ao `app.json` em `expo.ios.infoPlist`:
```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "NSHealthShareUsageDescription": "O PRAXIS precisa acessar seus dados de saúde para calcular gasto calórico diário.",
        "NSHealthUpdateUsageDescription": "O PRAXIS precisa gravar dados de nutrição no Apple Health."
      }
    }
  }
}
```

#### 2. iOS — Capabilities
Habilitar HealthKit no Apple Developer Portal:
- Acessar https://developer.apple.com/account/resources/identifiers/
- Selecionar Bundle ID `com.praxis.nutrition`
- Marcar "HealthKit"
- Salvar

#### 3. Android — Health Connect Permissions
Adicionar ao `app.json` em `expo.android.permissions`:
```json
{
  "expo": {
    "android": {
      "permissions": [
        "android.permission.health.READ_ACTIVE_CALORIES_BURNED",
        "android.permission.health.READ_STEPS",
        "android.permission.health.READ_EXERCISE",
        "android.permission.health.WRITE_NUTRITION"
      ]
    }
  }
}
```

#### 4. Plugin Configuration
Adicionar ao `app.json`:
```json
{
  "expo": {
    "plugins": [
      [
        "react-native-health-connect",
        {
          "ios": {
            "healthSharePermissionDescription": "O PRAXIS precisa acessar seus dados de saúde para calcular gasto calórico diário.",
            "healthUpdatePermissionDescription": "O PRAXIS precisa gravar dados de nutrição no Apple Health."
          },
          "android": {
            "permissions": [
              "ACTIVE_CALORIES_BURNED",
              "STEPS",
              "EXERCISE",
              "NUTRITION"
            ]
          }
        }
      ]
    ]
  }
}
```

#### 5. EAS Build
```bash
eas build --platform ios --profile production
eas build --platform android --profile production
```

### Documentação
- React Native Health Connect: https://github.com/matinzd/react-native-health-connect
- Apple HealthKit: https://developer.apple.com/documentation/healthkit
- Android Health Connect: https://developer.android.com/guide/health-and-fitness/health-connect

---

## Próximos Passos

1. Configurar RevenueCat Dashboard (API Keys, Produtos)
2. Configurar Apple Developer Portal (HealthKit Capability)
3. Configurar Google Play Console (Service Account, Health Connect)
4. Instalar EAS CLI: `npm install -g eas-cli`
5. Configurar EAS: `eas build:configure`
6. Instalar módulos nativos
7. Build para production

---

**Nota:** Módulos nativos DEVEM ser instalados APÓS configuração EAS Build. Instalação local sem EAS causará erros de build.
