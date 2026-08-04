# VIVRΛNT QA Evidence Log

**Date:** 4 August 2026  
**Owner:** Daniella Sayson  
**Repositories:** `vivrant-server` (web), `vivrant-mobile` (Flutter)

## Gate summary

| Check | Web (viva-server) | Mobile (vivrant-mobile) | Result |
| --- | --- | --- | --- |
| Typecheck / analyze | `npm run typecheck` PASS | `flutter analyze lib test` | See run log |
| Lint | `npm run lint` PASS (0 errors) | `flutter_lints` via analyze | See run log |
| Unit / widget tests | `npm run test` — **21/21 PASS** | `flutter test` — **13/13 PASS** | PASS |
| Production smoke | `npm run qa:smoke` against `https://viva-server-delta.vercel.app` | N/A (client) | Re-run after deploy of auth harden |
| Combined QA script | `npm run qa` | `flutter test` | PASS |

## Automated suites added

### Web (`vitest`)
- `src/lib/security/safe-path.test.ts` — open-redirect / href allowlist
- `src/lib/reminders/schedule.test.ts` — next fire + schedule labels
- `src/lib/health/body-metrics.test.ts` — BMI math and bands
- `src/lib/mobile/http.test.ts` — JSON helpers, ID parsing, internal error redaction

### Mobile (`flutter_test`)
- `test/ai_text_test.dart` — nested AI payload formatting
- `test/validators_test.dart` — email/password validation
- `test/humanize_formatters_test.dart` — labels, currency, dates
- `test/widget_test.dart` — app mount smoke

## Defects found and fixed during this QA pass

1. ESLint: `module` variable shadowing Next.js reserved name in admin activity route → renamed to `moduleFilter`
2. ESLint: unused `today` prop in `SpendingOverview` → optional unused prop
3. ESLint: sync `setState` in effects (`today.tsx`, `journal.tsx`) → deferred via `setTimeout(0)`
4. Unauthenticated `/api/mobile/today` could 500 when cookie helpers throw → catch and return 401
5. Prior hardening (Aug 4): mobile reminder processing, refresh blip logout, search/AI parse, auth redirects

## Residual risks / follow-ups

| ID | Item | Severity | Owner action |
| --- | --- | --- | --- |
| QA-R1 | Mobile FCM requires Firebase native config files | Medium | Add `google-services.json` / iOS plist |
| QA-R2 | Android release still uses debug signing | High for store | Configure upload keystore |
| QA-R3 | Apply `supabase/20260730_security_and_indexes.sql` if not on prod | High | Run in Supabase SQL editor |
| QA-R4 | Expand integration/E2E (Playwright / integration_test) | Medium | Next sprint |
| QA-R5 | Auth/AI rate limits not yet implemented | Medium | Add KV/Upstash limits |

## Commands for re-verification

```bash
# Web
cd viva-server
npm run qa
npm run qa:smoke

# Mobile
cd vivrant-mobile
flutter analyze lib test
flutter test
```
