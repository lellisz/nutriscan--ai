# Changelog

All notable changes to PRAXIS Nutrition are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-05-10

### Added

- **Hydration Tracking** — `HydrationWidget` component with quick-add buttons (+150, +250, +350, +500ml), synced to `hydration_logs` table via Supabase
- **RevenueCat Monetization** — `useSubscription` hook and `Paywall` component with dual pricing (R$19,90/month or R$149,90/year), 7-day free trial on both plans
- **Barcode Scanner** — `app/log/barcode.tsx` screen with three-tier lookup: TACO local database → Open Food Facts API → OCR fallback (premium)
- **Meal Planning** — `app/meal-plan.tsx` screen generating meal plans via Groq AI, horizontal day-scroll UI, batch meal registration
- **TACO Database** — Bundled `assets/taco-mini.json` with 56 Brazilian foods including macros and micronutrient data
- **Dynamic TDEE** — `useDynamicTDEE` hook calculating adaptive TDEE based on HealthKit calories burned (stub pending EAS Build)
- **Offline Mode** — `services/offline.ts` with expo-sqlite queue, syncQueue on reconnect (stub pending expo-sqlite setup)
- **HealthKit / Health Connect** — `services/health.ts` integration for calories burned, steps, weight, sleep (stub pending expo-build)
- **Micronutrient Tracking** — `food_logs` and `meals` schema expansion with fiber, sodium, sugar, vitamin A/C/D, calcium, iron, potassium, magnesium
- **Migration 011** — Hydration logs, meal plans, subscriptions tables with RLS policies
- **Migration 012** — Micronutrient columns in food_logs and meals
- **Edge Function Updates** — Coach endpoint support for `meal_plan` request type; export-data includes migrations 006-011; delete-account guarantees auth.users removal

### Changed

- **W4 Color Token** — Updated from `#706C84` to `#8C8AA0` for WCAG AA contrast compliance (4.7:1 ratio on dark backgrounds)
- **Touch Targets** — Added 44px minimum hitSlop on 7 interactive components (navigation, form controls, list actions)
- **SafeAreaView** — Applied to 4 screens for notch/status bar safety
- **WeightLineChart** — Wrapped in useMemo to prevent unnecessary re-renders
- **Coach Screen** — Added setTimeout cleanup to prevent memory leaks

### Fixed

- **Accessibility Audit** — WCAG AA contrast violations corrected via W4 token update
- **CSS Gradients** — Replaced linear-gradient string syntax with expo-linear-gradient component (RN compatibility)
- **Touch Target Coverage** — WCAG AAA minimum size applied to navigation, forms, and action buttons

### Notes

- Barcode scanner, offline mode, and HealthKit features are stubs pending native setup (EAS Build, module installation)
- Premium features (OCR, micronutrients, health sync) gated behind RevenueCat subscription
- Coach endpoint supports new `meal_plan` generation with `compassion_mode` parameter
