# Supabase Migrations - zaproszeniaonline.com

<!-- ANTI-CORRUPTION-GOLDEN: Sekwencja migracji DB Supabase project=kuyniyyieejvambyjnxy.
     DO NOT REMOVE chronologii ani komentarzy "Applied:" / "Reverse-engineered from".
     Każda migracja MUSI mieć: timestamp prefix YYYYMMDDHHMMSS, opis w pierwszej linii (--), opcjonalnie rollback comment.
     Format nazwy: `YYYYMMDDHHMMSS_short_snake_case_name.sql`. Outlier `2026-04-30-add-storage-bucket.sql` zachowany dla audit. -->

## Format

```
YYYYMMDDHHMMSS_descriptive_snake_case_name.sql
```

Pierwsza linia każdego pliku: `-- YYYY-MM-DD: <one-line description>`.
Jeśli ma kontekst (production-applied, rollback steps) - dodaj 2-3 linie komentarza.

## Stan na 2026-05-20

| # | Plik | Data | Co robi |
|---|---|---|---|
| 1 | `20260427114004_init_zaproszenia_schema.sql` | 2026-04-27 | Init `leads` table + RLS anon INSERT |
| 2 | `2026-04-30-add-storage-bucket.sql` | 2026-04-30 | Storage bucket `lead-attachments` (private). **Outlier nazwy** - powstał w trybie ad-hoc, zostaje dla audit. Nowe migracje używaj formatu timestamp. |
| 3 | `20260507120336_add_payment_columns_to_leads.sql` | 2026-05-07 | Kolumny payment status |
| 4 | `20260507195903_database_webhooks_for_lead_notifications.sql` | 2026-05-07 | DB webhooks → Edge Function |
| 5 | `20260513120000_consent_log_rodo.sql` | 2026-05-13 | 5 kolumn consent_*_at + version (RODO art. 7) |
| 6 | `20260513150407_review_pipeline.sql` | 2026-05-13 | Pipeline review/opinii |
| 7 | `20260516120000_discount_codes_dedicated_stripe_link.sql` | 2026-05-16 | Discount codes z dedicated Stripe Payment Link URL |
| 8 | `20260518180000_briefs_self_service.sql` | 2026-05-18 | Brief samoobsługowy (post-payment flow) |

## Reguły anti-corruption

1. **NIGDY nie edytuj zaaplikowanej migracji** (te z timestampem przed `dziś`). Twórz nową migrację z rollback + new state.
2. **ZAWSZE dodaj komentarz Applied** gdy odpalisz przez Supabase Studio: `-- Applied: YYYY-MM-DD HH:MM:SS UTC via Supabase Studio`.
3. **Rollback comment** jeśli migracja jest reversibla - jako trailing comment z DROP/ALTER REVERSE.
4. **Format nazwy** - tylko `YYYYMMDDHHMMSS_snake_case.sql`. Wszelkie odstępstwa wymagają wpisu w tym README.
5. **CSP-related changes** sync z `vercel.json` + `nicolas-test` template (memory feedback_zaproszenia_klienci anti-pattern #1).

## Apply via MCP

```
mcp__supabase__apply_migration(project_id="kuyniyyieejvambyjnxy", name="<filename_without_sql>", query="<content>")
```

Lub Supabase Studio → SQL Editor.

## Backup przed major migration

```bash
# Wystarczy zrobić git tag
cd ~/Projekty/zaproszeniaonline.com
git tag pre-migration-$(date +%Y%m%d-%H%M) HEAD
git push --tags
```
