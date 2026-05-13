# Multi-PC System — Repo Guardian + Conditional Reminders

System samoregulacji repo `zaproszeniaonline.com` dla pracy z 2+ komputerów.

**Cel:** zero ręcznej dyscypliny — repo wymusza raportowanie + weryfikację + przypomina o zewnętrznych akcjach (Google Business, GSC, Stripe Dashboard, Bing, etc.).

---

## Szybki start na nowym komputerze

```bash
# 1. Sklonuj repo
git clone https://github.com/nicolasworoszylo-jpg/zaproszenia.git ~/Projekty/zaproszenia
cd ~/Projekty/zaproszenia

# 2. Jednoklikowy setup (idempotent)
bash scripts/setup-multi-pc.sh

# 3. To wszystko.
```

Skrypt:
- Aktywuje `core.hooksPath = .githooks`
- Ustawia `pull.rebase=true` + `push.autoSetupRemote=true` + `rerere.enabled=true`
- Sprawdza zależności (git, curl, python3, jq/yq)
- Sugeruje host-aware user.name (dla audit trail commitów z 2 laptopów)
- Test reachability origin

---

## Architektura — 4 warstwy ochrony

```
┌─────────────────────────────────────────────────────────────┐
│ Twój commit → push                                          │
├─────────────────────────────────────────────────────────────┤
│ Warstwa 1: LOKALNE git hooks (.githooks/)                   │
│   - pre-commit:      blokuje secrets, env, >5MB, CHANGELOG  │
│   - prepare-commit-msg: wstrzykuje template Co/Czemu/Test   │
│   - commit-msg:      waliduje Conventional Commits format   │
│   - post-commit:     pokazuje reminders z .repo-rules.yml   │
│   - pre-push:        no-behind check + smoke test           │
│   - post-merge:      macOS notification po pull             │
│   - post-checkout:   info sync status z drugim laptopem     │
├─────────────────────────────────────────────────────────────┤
│ Warstwa 2: GitHub Actions (.github/workflows/)              │
│   - repo-guardian.yml:        re-validation server-side     │
│   - conditional-reminders.yml: PR/commit komentarze         │
├─────────────────────────────────────────────────────────────┤
│ Warstwa 3: CHANGELOG.md                                     │
│   - Każdy source change WYMAGA wpisu w [Unreleased]         │
│   - Audit trail co, kiedy, dlaczego                         │
├─────────────────────────────────────────────────────────────┤
│ Warstwa 4: .repo-rules.yml (conditional reminders)          │
│   - Deklaratywne reguły "jak zmieniono X → przypomnij Y"   │
│   - Łatwe rozszerzanie bez kodu                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Co dokładnie robi każdy hook

### `pre-commit` (gate przed commit)

**Blokuje:**
- Stripe/AWS/JWT/Supabase service role/Resend API w stagedfile
- Pliki `.env*`
- Pliki >5MB (przeniesć do Blob/Supabase Storage)
- Source change bez wpisu w CHANGELOG.md (under `[Unreleased]`)

**Bypass (tylko emergency):**
```bash
SKIP_HOOKS=1 SKIP_REASON="hotfix domain down" git commit ...
```

### `prepare-commit-msg` (template)

Gdy uruchamiasz `git commit` bez `-m`, wstrzykuje template:
```
type(scope): krotki opis zmiany (do 72 znaków)

Co:    <co dokładnie się zmieniło — pliki, sekcje, funkcje>
Czemu: <dlaczego — bug, feature, performance, design, klient>
Test:  <jak zweryfikowano — curl, manual w przeglądarce, lokalny serve>
```

### `commit-msg` (validation)

Waliduje że message:
- Ma valid Conventional Commit header (`feat:`, `fix:`, `docs:` etc.)
- Header ≤72 chars
- Ma Co/Czemu/Test (jeśli pełny commit, nie merge)

### `post-commit` (reminders) ⭐ NOWE

Po udanym commit:
1. Czyta `.repo-rules.yml`
2. Dla each rule sprawdza czy zmienione pliki matchują `match: [...]`
3. Wyświetla reminders w konsoli (kolory + emoji)
4. **macOS notification** gdy są critical reminders
5. Loguje do `.guardian/reminders.log`

### `pre-push` (final gate)

Przed push do GitHub:
- Sprawdza reachability origin (15s timeout)
- Blokuje jeśli lokal jest behind origin (force pull/rebase)
- Blokuje dirty tree
- Blokuje force-push do main/master/production

### `post-checkout` (sync hint)

Po `git checkout <branch>`:
- Pokazuje sync status (ahead/behind origin)
- Sugeruje `git pull --rebase` jeśli jesteś behind

### `post-merge` (audit + notify)

Po `git pull` lub `git merge`:
- Liczy ile commits przyszło
- Pokazuje HEAD summary
- **macOS notification**: "Repo Guardian: N nowych commitów na main"
- Warn gdy `package.json` lub `supabase/migrations/` się zmieniły

---

## Conditional Reminders — jak rozszerzać

Edytuj **`.repo-rules.yml`**. Format:

```yaml
rules:
  - match: ["index.html", "blog/*.html"]
    severity: important     # critical | important | info
    title: "🔍 Resubmit sitemap w GSC + Bing"
    remind: |
      Po zmianach landing / blog:
      1. search.google.com/search-console → Sitemaps → Resubmit
      2. bing.com/webmasters → Sitemaps → Submit
      3. IndexNow ping (1 komenda):
         curl "https://api.indexnow.org/indexnow?url=https://zaproszeniaonline.com/&key=..."
```

**Patterns:**
- Glob (jak gitignore): `*.html`, `supabase/**`, `blog/*.html`
- Regex (prefix `r/`): `r/^supabase/functions/[a-z-]+/index\.ts$`

**Severity:**
- `critical` 🔴 → macOS notification + bold w PR comment
- `important` 🟡 → reminder w PR comment
- `info` 🟢 → tylko console, no notification

**Lokalnie:** widzisz reminders w terminalu po `git commit` + macOS notification (krytyczne).
**Serwerowo:** GitHub Actions komentuje PR / commit z markdown.

---

## Workflow na 2 laptopach (codzienne)

### Laptop A (rano, zaczynasz pracę)

```bash
cd ~/Projekty/zaproszenia
git pull --rebase origin main
# post-merge: macOS notification "3 nowych commitów na main" (z laptop B)
```

### Edycja + commit

```bash
# Edytuj pliki...
git add .
git commit
# prepare-commit-msg: editor otwarty z template Co/Czemu/Test
# pre-commit: sprawdza secrets, CHANGELOG, files
# post-commit: pokazuje reminders z .repo-rules.yml
```

### Push

```bash
git push
# pre-push: sprawdza no-behind, smoke test
# GitHub Actions: repo-guardian.yml + conditional-reminders.yml
```

### Laptop B (wieczorem, drugi laptop)

```bash
cd ~/Projekty/zaproszenia
git pull --rebase origin main
# post-merge: notification "8 nowych commitów na main z laptop A"
# post-merge: warn jeśli supabase/migrations/ się zmieniły → "rozważ migrację"
```

---

## CHANGELOG.md - jak prawidłowo wpisywać

```markdown
## [Unreleased]

- **Added**: nowa funkcja X _(2026-05-13)_
- **Fixed**: bug Y w demo _(2026-05-13)_
- **Changed**: refactor Z _(2026-05-13)_
```

**Kategorie:**
- `Added` — nowa funkcjonalność
- `Changed` — zmiana istniejącej
- `Fixed` — naprawa bugu
- `Removed` — usunięte
- `Security` — bezpieczeństwo

Przy release: przenieś `[Unreleased]` → `[YYYY-MM-DD]` w stable section.

---

## Emergency bypass

Wszystkie hooki słuchają `SKIP_HOOKS=1`:

```bash
SKIP_HOOKS=1 SKIP_REASON="hotfix: domain down" git commit -am "wip"
SKIP_HOOKS=1 SKIP_REASON="hotfix" git push
```

**Tylko w awarii.** Każdy skip jest logowany do `.guardian/activity.log` i podświetlony w GitHub Actions (server-side re-validation nie da się skipować).

---

## Troubleshooting

### "Hook się nie odpala"
```bash
git config --get core.hooksPath
# Powinno być .githooks
# Jeśli nie - odpal: git config core.hooksPath .githooks
# Albo: bash scripts/setup-multi-pc.sh
```

### "pre-commit blokuje CHANGELOG"
Otwórz CHANGELOG.md → dodaj wpis pod `[Unreleased]`:
```
- **Fixed**: krótki opis _(YYYY-MM-DD)_
```
Save + `git add CHANGELOG.md` + retry commit.

### "Reminders nie wyświetlają się po commit"
```bash
# Sprawdź czy pyyaml zainstalowane (potrzebne do parse .repo-rules.yml)
python3 -c "import yaml" || pip3 install pyyaml
```

### "macOS notification nie pokazuje się"
System Settings → Notifications → Terminal / iTerm → Allow Notifications.

### "Git pull konflikt z drugim laptopem"
```bash
git rerere status   # czy mamy cached resolution?
git rebase --abort  # spróbuj ponownie z merge:
git pull --no-rebase origin main
# Albo:
git fetch origin
git merge origin/main
```

---

## Plików w systemie

| Plik | Rola |
|------|------|
| `scripts/setup-multi-pc.sh` | One-click installer |
| `.githooks/_lib.sh` | Shared bash functions |
| `.githooks/pre-commit` | Secret scan + CHANGELOG gate + file size |
| `.githooks/prepare-commit-msg` | Template Co/Czemu/Test |
| `.githooks/commit-msg` | Conventional Commits validation |
| `.githooks/post-commit` | Reminders z .repo-rules.yml |
| `.githooks/pre-push` | Sync gate + smoke test |
| `.githooks/post-checkout` | Sync status info |
| `.githooks/post-merge` | macOS notify + warn deps |
| `.github/workflows/repo-guardian.yml` | Server-side re-validation |
| `.github/workflows/conditional-reminders.yml` | PR/commit comments z reminders |
| `.repo-rules.yml` | Deklaratywne reguły conditional reminders |
| `CHANGELOG.md` | Audit trail wszystkich zmian |
| `MULTI_PC_SYSTEM.md` | Ten plik — dokumentacja |
| `.guardian/` | Local state (gitignored): activity.log, reminders.log |
