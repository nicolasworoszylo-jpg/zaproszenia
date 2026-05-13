# Repo Guardian

System wymuszający **raportowanie procesu** i **auto-weryfikację repo** dla zaproszeniaonline.com.

Zaprojektowany pod jeden problem: **Nicolas pracuje na dwóch laptopach**. Bez dyscypliny → rozjazd, zgubione commity, zaskoczenia po pull.

## Co robi (skrót)

| Warstwa | Plik | Cel |
|---|---|---|
| **pre-commit** | `.githooks/pre-commit` | blokuje commit jeśli zmiany w kodzie a brak wpisu w CHANGELOG.md; skanuje pod sekrety; odrzuca `.env*`; cap 5 MB |
| **prepare-commit-msg** | `.githooks/prepare-commit-msg` | wstawia szablon raportu (Co/Czemu/Test) jak otwierasz `git commit` |
| **commit-msg** | `.githooks/commit-msg` | waliduje Conventional Commits + obecność sekcji raportu |
| **pre-push** | `.githooks/pre-push` | `git fetch`, sprawdza behind/ahead, blokuje force-push na main, ostrzega o dirty tree |
| **post-merge** | `.githooks/post-merge` | log + macOS notify o tym co przyszło z drugiego laptopa |
| **post-checkout** | `.githooks/post-checkout` | sync hint po zmianie brancha |
| **GitHub Action** | `.github/workflows/repo-guardian.yml` | te same walidacje na remote — działa nawet jeśli ktoś ominie lokalne hooki |
| **Branch protection** | `scripts/setup-branch-protection.sh` | GitHub blokuje force-push i merge bez zielonego workflow |
| **PR template** | `.github/PULL_REQUEST_TEMPLATE.md` | wymuszony report w każdym PR |

## Setup na nowej maszynie (laptop B)

```bash
git clone https://github.com/nicolasworoszylo-jpg/zaproszenia.git zaproszeniaonline.com
cd zaproszeniaonline.com
npm install         # lub: bash scripts/setup-hooks.sh
```

`npm install` odpala `postinstall` który uruchamia `setup-hooks.sh`. Jeśli nie masz npm:

```bash
bash scripts/setup-hooks.sh
```

Co się dzieje:

1. `git config core.hooksPath .githooks` — wskazuje gitowi gdzie szukać hooków (in-repo)
2. `chmod +x .githooks/*` — uzbraja je
3. `git config commit.template .gitmessage` — template otwiera się przy `git commit`
4. `mkdir .guardian/` — folder na audit logi (gitignored)
5. Sanity check: git, gh, curl

Po tym hooki są aktywne. Sprawdź: `bash scripts/preflight.sh`.

## Codzienny workflow

```bash
# 1. Otwierasz laptopa rano
bash scripts/preflight.sh
# → pokazuje czy jesteś sync z drugim laptopem, czy ktoś coś pchnął

# 2. Pull jeśli trzeba
git pull --rebase

# 3. Stwórz branch dla zmiany (PR-driven, nie direct main)
git checkout -b fix/audio-palette

# 4. Edytujesz pliki, dodajesz do CHANGELOG
npm run report      # interaktywnie: kategoria + opis → wpisuje pod [Unreleased]
git add .

# 5. Commit
git commit
# → otwiera szablon, wypełniasz Co/Czemu/Test
# → pre-commit waliduje, commit-msg waliduje

# 6. Push
git push -u origin fix/audio-palette
# → pre-push fetch + sprawdza behind/ahead

# 7. PR
gh pr create --fill
# → szablon PR się wypełnia, Action się odpala
# → merge gdy zielone (squash lub rebase, NIE merge commit)
```

## Konfiguracja branch protection (raz, z jednego laptopa)

```bash
npm run guardian:protect
# wymaga: gh auth login (raz)
```

Po tym GitHub blokuje:

- Direct push do `main`
- Force-push do `main`
- Merge bez przejścia workflow "Repo Guardian / validate"
- Skasowanie brancha `main`

Sprawdzenie aktualnego stanu: `npm run guardian:status`.

Cofnięcie (jeśli chcesz wyłączyć):

```bash
gh api -X DELETE repos/nicolasworoszylo-jpg/zaproszenia/branches/main/protection
```

## Bypass — emergency only

Czasem trzeba pchnąć hotfix kiedy się pali (np. domena down). Sposób:

```bash
SKIP_HOOKS=1 SKIP_REASON="domain down, fix CSP" git commit -m "fix(security): adjust CSP"
SKIP_HOOKS=1 SKIP_REASON="domain down" git push
```

Każde użycie ląduje w `.guardian/skip-hooks.log` z timestampem, hostem, branchem, powodem. Po awarii — przejrzyj log i zrób follow-up commit z normalnym raportem.

**Ważne:** branch protection na GitHub **nie ma bypassu**. Force-push do `main` zablokowany twardo — nawet `SKIP_HOOKS=1` Cię nie przepuści przez GitHub. To celowe.

## Co kiedy hook zawiódł / coś dziwnego

| Objaw | Diagnoza | Naprawa |
|---|---|---|
| `git commit` nie odpala hooków | `core.hooksPath` nie ustawione | `bash scripts/setup-hooks.sh` |
| hook nie działa "permission denied" | brak `+x` | `chmod +x .githooks/*` lub setup-hooks |
| pre-push: "remote unreachable" | offline | hook wpuszcza push, fail-open |
| commit-msg: "brak sekcji Co:/Czemu:/Test:" | typowo commitujesz docs-only? | Dla zmian w `*.md / .github / .githooks` ten check nie wymaga raportu |
| GitHub Action FAIL "header invalid" | ktoś commitował z `SKIP_HOOKS=1` | Zsquashuj + napraw message, push --force-with-lease do brancha PR (NIE na main) |
| chcę inny model raportu | edytuj `.gitmessage` + `commit-msg` | PR z opisem czemu |

## Audyt

```bash
# Aktywność (commity/push/merge/checkout) na obu laptopach
cat .guardian/activity.log | tail -50

# Wszystkie bypassy
cat .guardian/skip-hooks.log

# Branch protection status
npm run guardian:status

# Czy lokalne hooki działają identycznie jak Action
bash scripts/preflight.sh
```

## Filozofia

- **Hard-gate raportowania**: nie commitujesz bez wyjaśnienia. Po 2 tygodniach pamiętasz tylko *co* zrobiłeś — *czemu* już nie. Repo Guardian wymusza zapis czemu, gdy jeszcze pamiętasz.
- **Działa identycznie wszędzie**: hooki w repo, GitHub Action w repo, branch protection skonfigurowane. Nowy laptop = `clone && setup` = działa tak samo.
- **Fail-open na sieć, fail-closed na sekrety i sync**: offline nie blokuje pracy. Ale "behind origin" — tak.
- **Auditable bypass**: nie banujemy emergency overrides, ale każdy zostawia ślad.
- **Server jest źródłem prawdy**: lokalny hook można obejść. GitHub Action + branch protection nie. To finalna brama.
