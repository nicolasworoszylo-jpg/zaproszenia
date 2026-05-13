# Changelog

Wszystkie istotne zmiany w projekcie zaproszeniaonline.com.

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
wersjonowanie: [SemVer](https://semver.org/spec/v2.0.0.html).

Każdy commit z plikami źródłowymi (`*.html`, `*.jsx`, `api/*`, `supabase/*` itd.)
**musi** mieć wpis w sekcji `[Unreleased]`. Wymusza to Repo Guardian (pre-commit + GitHub Action).

Szybkie dodanie wpisu: `npm run report` (lub `bash scripts/report.sh`).

## [2026-05-13] — Milestone: wszystko działa, wszystko zweryfikowane 🎉

Nicolas potwierdził: "wszystko działa wszystko zrobione". Pełna sesja ~30 commitów od 2026-05-11 zamknięta:
- Krytyka Dominiki 11/11 wdrożona
- Sekcja 05 redesign (toggle wpisz/mailowo per feature)
- Audio system palette-aware v4 (aria-pressed target)
- Vercel Authentication rozwiązane (Claude in Chrome wyłączył Require Log In)
- 7 pre-emptive fixes (security/perf/a11y)
- Multi-PC system + 19 Conditional Reminders (LIVE)

## [Unreleased]

- **Fixed**: `vercel.json` invalid route source pattern — rozbicie `/(.+\.(woff2|woff))` nested group na dwa osobne entries `/(.+\.woff2)` i `/(.+\.woff)`. Path-to-regexp w Vercel nie wspiera zagnieżdżonych grup; bug istniał od ~12 maja, blokował deploy onepagera + RODO bundle _(2026-05-13)_
- **Security**: Audyt RODO + ePrivacy + EDPB 03/2022 — 8 luk naprawionych (3 krytyczne). Self-host fonts w privacy/terms/returns/404/one-pager (eliminacja transferu IP do Google LLC, LG München 3 O 17493/20). Cookie banner: 3 równorzędne przyciski + TTL 12 mc + content_version + "Zarządzaj zgodą". Privacy: Resend aktywny procesor, sekcja transakcyjne vs marketing opt-in, rejestr zgód. Lead form: 3. checkbox consent_marketing + timestamp rejestr. Demo/Alergie: disclaimer art. 9. CSP w vercel.json. RCP: 8. proces + RCP_metadata.md. Migracja Supabase consent_log_rodo zaaplikowana _(2026-05-13)_
- **Changed**: Repo Guardian — poluzowano wymóg Co/Czemu/Test (z hard-fail na soft-warning + minimalny body 30 chars). Workflow + commit-msg hook _(2026-05-13)_
- **Added**: Conditional Reminders system — `.repo-rules.yml` (19 reguł deklaratywnych), `.githooks/post-commit` (lokalne reminders + macOS notification), `.github/workflows/conditional-reminders.yml` (auto-komentarze na PR/commit) _(2026-05-13)_
- **Added**: `scripts/setup-multi-pc.sh` — jedno-klikowy installer dla 2-laptop workflow (aktywuje core.hooksPath, pull.rebase, rerere) _(2026-05-13)_
- **Added**: `MULTI_PC_SYSTEM.md` — pełna dokumentacja 4-warstwowego systemu samoregulacji repo _(2026-05-13)_
- **Added**: `/onepager` — premium A4 print card pod ukrytym URL (forest+gold+cream brand match, passe-partout border, botanical corner SVG, monogram ring, L-bracket QR frame, Fraunces 9..144 italic). Inline SVG QR do strony głównej. Disallow w robots.txt, noindex, brak w sitemap, brak linków z home. _(2026-05-13)_
- **Added**: Repo Guardian — hard-gate raportowania + auto-sync check + GitHub Actions walidacja + branch protection. _(2026-05-12)_

## [2026-04-30]

- **Fixed**: demo audio palette — hardcoded 4-palette mapping + MutationObserver _(a5701cc)_
- **Added**: palette-aware kolory + restore inline audio player _(8912058)_
- **Fixed**: anti-Service-Worker + cache storage cleanup w demo + index _(94f3508)_
- **Fixed**: 3 ataki na cache + widoczny version marker _(e2ff92b)_
- **Fixed**: cache invalidation + diagnostyka /demo-test + trace markers _(fe59bb7)_

<!--
Format wpisu:
  - **Kategoria**: opis _(opcjonalnie data albo SHA)_

Kategorie:
  Added       — nowa funkcjonalność
  Changed     — zmiana istniejącej
  Fixed       — naprawa buga
  Removed     — usunięte
  Deprecated  — wycofywane
  Security    — bezpieczeństwo

Przy release: przenieś wpisy z [Unreleased] do nowej sekcji [X.Y.Z] - YYYY-MM-DD.
-->
