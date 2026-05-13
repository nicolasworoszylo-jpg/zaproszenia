# Changelog

Wszystkie istotne zmiany w projekcie zaproszeniaonline.com.

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
wersjonowanie: [SemVer](https://semver.org/spec/v2.0.0.html).

Każdy commit z plikami źródłowymi (`*.html`, `*.jsx`, `api/*`, `supabase/*` itd.)
**musi** mieć wpis w sekcji `[Unreleased]`. Wymusza to Repo Guardian (pre-commit + GitHub Action).

Szybkie dodanie wpisu: `npm run report` (lub `bash scripts/report.sh`).

## [Unreleased]

- **Changed**: Repo Guardian — poluzowano wymóg Co/Czemu/Test (z hard-fail na soft-warning + minimalny body 30 chars). Workflow + commit-msg hook _(2026-05-13)_
- **Added**: Conditional Reminders system — `.repo-rules.yml` (19 reguł deklaratywnych), `.githooks/post-commit` (lokalne reminders + macOS notification), `.github/workflows/conditional-reminders.yml` (auto-komentarze na PR/commit) _(2026-05-13)_
- **Added**: `scripts/setup-multi-pc.sh` — jedno-klikowy installer dla 2-laptop workflow (aktywuje core.hooksPath, pull.rebase, rerere) _(2026-05-13)_
- **Added**: `MULTI_PC_SYSTEM.md` — pełna dokumentacja 4-warstwowego systemu samoregulacji repo _(2026-05-13)_
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
