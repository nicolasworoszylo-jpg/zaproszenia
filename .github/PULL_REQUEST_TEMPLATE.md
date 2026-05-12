<!--
Repo Guardian PR template — wymagany dla każdego PR do main.
Nie usuwaj sekcji, możesz wpisać "n/a" jeśli nie dotyczy.
-->

## Co się zmienia

<!-- 2-4 zdania. Plik(i), zachowanie, kontekst biznesowy. -->

## Czemu

<!-- Bug / feature / performance / klient. Linkuj issue jeśli jest. -->

Closes #

## Jak zweryfikowano

<!-- Konkretnie. Przykład:
- curl -I https://zaproszeniaonline.com/demo → 200
- Manual w przeglądarce (Safari + Chrome): formularz lead → Supabase row OK
- Stripe webhook test: stripe-mock + signature valid
-->

- [ ]

## Wpływ produkcyjny

- [ ] Zmienia zachowanie strony produkcyjnej (Vercel auto-deploy po merge)
- [ ] Zmienia schema Supabase (migracja w `supabase/migrations/`)
- [ ] Wymaga zmiany ENV variables w Vercel
- [ ] Może wpłynąć na SEO (URL, meta, robots)
- [ ] Zmienia płatności (Stripe)
- [ ] Wymaga komunikatu dla Dominiki / klientów

## Checklist Repo Guardian

- [ ] `CHANGELOG.md` zaktualizowany pod `[Unreleased]`
- [ ] Pre-commit + pre-push hooki przeszły lokalnie (bez `SKIP_HOOKS=1`)
- [ ] Brak zmian w `.env*`, `*.secret`, `**/secrets/*`
- [ ] Brak commitów z generycznym headerem ("wip", "fix", "update")
- [ ] Branch jest aktualny względem `main` (rebase done)

## Notatki dla drugiej maszyny

<!-- Czego Nicolas-na-laptopie-B musi się spodziewać po pull? Np.:
- "Po pull uruchom bash scripts/setup-hooks.sh — dodałem nowy hook."
- "Trzeba odpalić supabase db push — nowa migracja."
-->

n/a
