# Stash Audit - zaproszeniaonline.com

<!-- ANTI-CORRUPTION-GOLDEN: Audyt 3 stashes z 2026-05-20 - dokumentacja dla user review.
     DO NOT REMOVE bez decyzji co zrobić z każdym stashem (apply / drop / archive).
     Każda lista poniżej to potencjalnie utracona praca. Pre-faza-3.6 audyt anti-corruption. -->

Status: 3 stashes na lokalnym repo, nie dotykane podczas naprawy anti-corruption. **Wymaga decyzji Nicolasa**: apply / drop / archive each.

---

## stash@{0} — `pre-rebase-2026-05-16-leftover`

**Branch:** main
**Stat:** 6 files changed, 1040 insertions(+), 6 deletions(-)

**Zawiera (ważne):**
- `privacy.html` (-6/+6) — zmiana 3 wystąpień `legal@zaproszeniaonline.com` → `kontakt@zaproszeniaonline.com`
- `terms.html` (-2/+2) — analogiczna zmiana
- `supabase/functions/notify-payment-success/index.ts` (-4/+4) — analogiczna zmiana
- **`supabase/functions/notify-review-submitted/index.ts`** — **NEW 451 lines** (Edge Function dla review pipeline)
- **`supabase/functions/send-review-request/index.ts`** — **NEW 378 lines**
- **`supabase/functions/submit-review/index.ts`** — **NEW 205 lines**

**Rekomendacja:**
- Sprawdź czy `notify-review-submitted` / `send-review-request` / `submit-review` istnieją już na main lub na branchu `chore/supabase-secret-key-migration` / `legal/minimal-mail-clause`. Memory z 2026-05-13 wspomina o pełnym review pipeline (commit `b9cd4d4` RODO + `78f2f6c`).
- Jeśli **zostały rebased na main**: `git stash drop stash@{0}` (zduplikowana praca).
- Jeśli **nie ma**: `git stash apply stash@{0}` na nowym branchu `feat/review-pipeline-from-stash` i przegląd.

**Komenda diagnostyczna:**
```bash
ls supabase/functions/ | grep -iE 'review|submit'
git log --all --oneline -- supabase/functions/notify-review-submitted/
```

---

## stash@{1} — `WIP feat/onepager pre-deploy stash 1778933177`

**Branch:** feat/onepager-strip-edit-ui
**Stat:** 4 files changed, 131 insertions(+), 45 deletions(-)

**Zawiera:**
- `index.html` (-45/+110) — fix `lf-radio input` z `width:0 height:0` na **sr-only pattern** (clip-path inset 50% + caret-color transparent)
- `privacy.html` (-1/+1)
- `terms.html` (-1/+1)
- **`supabase/migrations/20260516120000_discount_codes_dedicated_stripe_link.sql`** — **NEW 62 lines**

**Rekomendacja:**
- **Migracja JEST już applied** (jest w `supabase/migrations/`, weryfikacja `ls supabase/migrations/20260516120000*`). Tu jest tylko stash z gold state.
- Fix `lf-radio` sr-only pattern — **memory potwierdza że został wdrożony** (sesja 2026-05-16 bug fix, commit `c019953 fix(form): 5 bugów`).
- Najprawdopodobniej **`git stash drop stash@{1}`** (praca rebased na main).

**Komenda diagnostyczna:**
```bash
grep -n 'clip-path:inset(50%)' index.html  # sprawdz czy fix jest na live
git log --oneline -- supabase/migrations/20260516120000_discount_codes_dedicated_stripe_link.sql
```

---

## stash@{2} — `wip-onepager-supabase`

**Branch:** main
**Stat:** 10 files changed, 449 insertions(+), 697 deletions(-)

**Zawiera (UWAGA - net -248 linii):**
- `AUTOMATIONS.md` (+40) — dokumentacja review pipeline
- `blog/ile-kosztuje-strona-slubna-2026.html` (-4/+4) — drobna zmiana
- `dziekujemy.html` (-2/+2)
- `index.html` (-37/+37) — zmiany cross-cutting
- **`onepager/index.html` (-697/+940)** — **NET +243 linii** (nie -243, mój wcześniejszy audyt to source confusion)
- `returns.html` (-31/+31)
- `robots.txt` (+8)
- `supabase/functions/notify-new-lead/index.ts` (-4/+4)
- `supabase/functions/notify-payment-success/index.ts` (-9/+9)
- `terms.html` (-71/+71)

Główna treść: **onepager refactor** + dokumentacja AUTOMATIONS.md review pipeline. Cross-cutting email change (legal@ → kontakt@) na 5 plikach.

**Rekomendacja:**
- **NIE drop bez review.** AUTOMATIONS.md +40 linii może być nową dokumentacją review pipeline której nie ma na main.
- Apply na nowy branch: `git stash branch wip-onepager-review-from-stash stash@{2}` (zachowa stash automatycznie jeśli apply fail).
- Porównaj z `feat/onepager-strip-edit-ui` (już istnieje branch).

**Komenda diagnostyczna:**
```bash
git diff main..feat/onepager-strip-edit-ui -- onepager/index.html | head -50
git show stash@{2} -- AUTOMATIONS.md | grep -E '^\+' | head -50
```

---

## Łączny stan branchów (review by user)

**Lokalne branche** (14): `main`, `backup-local-main-2026-05-16`, 4× `feat/`, 4× `fix/hotfix/`, 3× `legal/`, `feature/repo-guardian`.

**Remote branche** (~30): w tym znaczna część prawdopodobnie merged. Sugerowany cleanup:
```bash
git fetch --prune
git branch -r --merged origin/main | grep -v 'origin/HEAD\|origin/main' | head -20
```

## Stash hygiene rules (anti-corruption mitigation #10)

1. **Każdy stash starszy niż 7 dni** → wymaga decision: apply / drop / archive.
2. **Stash z 100+ liniami zmian** → przed drop pokazać user diff przez `git stash show -p stash@{N}`.
3. **Stash zawierający migracje DB** → priority audit (może zawierać niezarejestrowaną zmianę schema).
4. **Stash zawierający Edge Functions** → priority audit (może zawierać nieskommitowaną automatyzację).

## Następne kroki (proponowane dla Nicolasa)

1. Uruchom diagnostykę dla stash@{0} - sprawdź czy `submit-review` / `send-review-request` / `notify-review-submitted` są w produkcji.
2. Uruchom diagnostykę dla stash@{1} - sprawdź czy `clip-path:inset(50%)` jest w live index.html (jeśli tak: drop stash).
3. Otwórz nowy branch z stash@{2} i przejrzyj cross-cutting changes do AUTOMATIONS.md.
4. Po decyzji - zaktualizuj ten plik (sekcja "Status: ..." + data review).
