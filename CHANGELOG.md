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

- **Fixed**: `/onepager` palette-switch self-loop bug — w `navy-rose.html`, `bordo.html`, `terracotta.html` pierwszy link `nav.palette-switch` wskazywał na siebie zamiast na `/onepager/forest`. Skutek: brak możliwości skoku do zielonej palety z trzech pozostałych onepagerów. Fix: pierwszy `<a data-pal="forest">` ma teraz `href="/onepager/forest" title="Leśna zieleń"` w każdym z 4 plików (4×4 = 16 unikalnych dirs w palette-switch). _(2026-05-13)_
- **Added**: `/onepager/galeria` stopka `.exits` z 3 wyjściami (Wróć do demo / Strona główna / Workflow GitHub) — architektura I/O bez ślepych zaułków po obejrzeniu palet. Domyka pętlę: demo → galeria → palety → powrót. _(2026-05-13)_
- **Added**: `demo.html` + `magda-tomek.html` floating button "Karta do druku · QR" (top-right) → `/onepager/galeria` lub bezpośredni link palette-matched (terracotta dla magda-tomek). Palette-aware przez te same `--audio-gold` / `--audio-deep` CSS vars co audio player — auto-sync z React palette switcher. Domknięcie pipeline: zaproszenie cyfrowe → karta do druku w 1 kliknięciu. _(2026-05-13)_
- **Changed**: Polityka zwrotów - wpłata 699 zł **bezzwrotna** po rozpoczęciu świadczenia (art. 38 ust. 1 pkt 1 + art. 38 pkt 3 UoPK). `terms.html` § 4 rewrite (moment rozpoczęcia świadczenia = zaksięgowanie wpłaty), § 10 rewrite (5 punktów + id="paragraf-10"), nowy § 10a "Polityka anulowania i gwarancje zamiast zwrotów" (6 pkt). `returns.html` § 2-3 rewrite. `index.html` FAQ refund rewrite + checkbox consent wzmocniony ("niezwłocznie po zaksięgowaniu wpłaty" + bezzwrotność). Gwarancje zamiast zwrotów: 3 rundy poprawek (z 2), 12 mc hostingu, przesunięcie terminu wydarzenia, voucher uznaniowy w sytuacjach losowych _(2026-05-13)_
- **Changed**: Standard pakietu **3 rundy poprawek** zamiast 2 (powyżej rynkowego 1-2). Harmonizacja w 7 miejscach: `index.html` (schema.org Service/HowTo/FAQ, hero step, cennik), `terms.html` § 3 ust. 2, `dziekujemy.html`, `blog/ile-kosztuje-strona-slubna-2026.html` schema FAQ + footer _(2026-05-13)_
- **Added**: `notify-payment-success/index.ts` klauzula prawna w stopce maila (HTML + plain text) - "Niniejszym potwierdzamy rozpoczęcie świadczenia usługi..." z cytatami art. 38 UoPK. Stanowi dowód dla mechaniki art. 38 ust. 1 pkt 1 (pouczenie + zgoda + faktyczne rozpoczęcie świadczenia). Wymaga osobnego deploy w Supabase Dashboard _(2026-05-13)_
- **Fixed**: Gramatyka "Waszą skrzynkę" → "Waszej skrzynce" (4 wystąpienia - "ląduje na" + miejscownik). `index.html` features + FAQ + `notify-new-lead/index.ts` HTML + plain text _(2026-05-13)_
- **Added**: `/onepager` 4 palety dark-mode + galeria — `forest.html` (Leśna zieleń #2C3E2D), `navy-rose.html` (Granat+róż #1B2838), `bordo.html` (Bordo+kość #4A1C2B), `terracotta.html` (Rdzawa terracotta #6B2F22). Każda paleta wyciągnięta 1:1 z demo zaproszenia (vendor/demo-compiled.js). Shared `_assets/onepager.css` z 4 paletami przez `:root[data-palette="X"]`. `galeria.html` z 4 dark mode preview cards. Premium ornaments: passe-partout, botanical corner SVG, monogram gold ring, L-bracket QR, Fraunces variable opsz italic. noindex + Disallow w robots.txt. _(2026-05-13)_
- **Added**: `terms.html` § 8b nowy paragraf "Muzyka w tle - prawa autorskie" (5 ust.) — źródła (biblioteka royalty-free vs własny utwór klienta), oświadczenia klienta (prawa, świadomość że plik audio ≠ licencja na publiczne udostępnianie, ZAIKS/STOART/SAWP/ZPAV), indemnifikacja (klient zwalnia + pokrywa koszty obrony i odszkodowań), prawo odmowy + takedown 24h (art. 14 UŚUDE + art. 16 DSA UE 2022/2065), ograniczenie kręgu odbiorców (noindex + krąg towarzyski art. 23 PrAut) _(2026-05-13)_
- **Changed**: `index.html` formularz sekcja MUSIC — placeholder bez sugestii Spotify/YouTube (sugerował naruszenie), disclaimer ZAIKS + link do § 8b, checkbox akceptacji § 8b przy wyborze własnego utworu klienta _(2026-05-13)_
- **Added**: `audio/LICENSE.md` — proweniencja `demo.mp3` (Pixabay 375839 leberch, Pixabay Content License), procedura dodawania nowych utworów, whitelist (Pixabay/YouTube Audio Library/FMA/Incompetech/Bensound), blacklist (Spotify/Apple Music/Tidal/ZAIKS bez licencji) _(2026-05-13)_
- **Added**: `FIRST_CLIENT_CHECKLIST.md` + `CLAUDE_IN_CHROME_PROMPTS.md` + reguła `.repo-rules.yml` `match: sprzedaz/**` — kompletny pakiet do aktywacji przy pierwszej sprzedaży: 4× DPA, 3× skrzynki OVH, IBAN, rachunek, RCP review, limit nieewidencjonowanej. Gotowe prompty Claude in Chrome dla każdego z 6 paneli (Supabase, Vercel, Stripe, Resend, OVH email, verification). Placeholder folders `legal-templates/dpa-signed/` i `sprzedaz/` _(2026-05-13)_
- **Fixed**: `.github/workflows/conditional-reminders.yml` — `contents: write` permission + `continue-on-error` na commit comment step. Workflow failował HTTP 403 "Resource not accessible by integration" na createCommitComment dla push events _(2026-05-13)_
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
