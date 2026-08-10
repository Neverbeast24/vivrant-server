# VIVRΛNT QA Evidence Log

**Date:** 4 August 2026 (re-verified ~10:52–10:53 local)  
**Owner:** Daniella Sayson  
**Document:** VIVRANT-SDLC-MASTER **v2.1**  
**Repositories:** `vivrant-server` (web), `vivrant-mobile` (Flutter)

## Gate summary

| Check | Web (viva-server) | Mobile (vivrant-mobile) | Result |
| --- | --- | --- | --- |
| Typecheck / analyze | `npm run typecheck` PASS | `flutter analyze` (info-only) | PASS |
| Lint | `npm run lint` PASS | `flutter_lints` via analyze | PASS |
| Unit / widget tests | `npm run test` — **21/21 PASS** | `flutter test` — **13/13 PASS** | PASS |
| Production smoke | `npm run qa:smoke` — **5/5 PASS** | N/A (client) | PASS |
| Combined QA script | `npm run qa` PASS | `flutter test` PASS | PASS |

## Latest local re-verification (owner machine)

```text
npm run qa          → typecheck + lint + Vitest 21/21 PASS
npm run qa:smoke    → 5/5 PASS vs https://viva-server-delta.vercel.app
flutter test        → 13/13 PASS
```

Smoke lines: landing 200, login 200, firebase SW 200, mobile today unauth 401, auth login validation 400.

## Tooling note

- Vitest config is `vitest.config.mts` (ESM) so `npm run qa` no longer prints the Vite `configLoader: 'native'` warning.

## Automated suites

### Web (`vitest`)
- `src/lib/security/safe-path.test.ts`
- `src/lib/reminders/schedule.test.ts`
- `src/lib/health/body-metrics.test.ts`
- `src/lib/mobile/http.test.ts`

### Mobile (`flutter_test`)
- `test/ai_text_test.dart`
- `test/validators_test.dart`
- `test/humanize_formatters_test.dart`
- `test/widget_test.dart`

## Residual risks / follow-ups

| ID | Item | Severity | Owner action |
| --- | --- | --- | --- |
| QA-R1 | Mobile FCM needs Firebase native config | Medium | Add `google-services.json` / iOS plist |
| QA-R2 | Android release still uses debug signing | High for store | Configure upload keystore |
| QA-R3 | Confirm `20260730_security_and_indexes.sql` on prod | High | Run in Supabase SQL editor |
| QA-R4 | Expand E2E (Playwright / integration_test) | Medium | Next sprint |
| QA-R5 | Auth/AI rate limits not yet implemented | Medium | Add KV/Upstash limits |

## Commands for re-verification

```bash
cd viva-server
npm run qa
npm run qa:smoke

cd vivrant-mobile
flutter test
```
