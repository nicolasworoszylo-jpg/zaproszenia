# System kodów rabatowych / afiliacji — instrukcja zarządzania

System pozwala domom weselnym, fotografom i wedding plannerom otrzymać unikalny **kod rabatowy** (np. `KORCZEW10`), który polecone przez nich pary wpisują w formularzu na zaproszeniaonline.com. Każde użycie jest zliczane — Nicolas widzi w panelu Supabase ile leadów przyszło z każdego partnera.

---

## Jak to działa (flow)

1. **Tworzysz kod** dla partnera w Supabase Studio (1 wstawka SQL — przykłady poniżej)
2. **Partner przekazuje kod** parom młodym (na ulotce, w korespondencji, przez stronę swojego domu weselnego)
3. **Para wchodzi na zaproszeniaonline.com** → wpisuje kod w polu „Kod współpracy" w formularzu kontaktowym
4. **Walidacja na żywo** (300 ms debounce) → status pojawia się pod inputem:
   - ✓ zielony: „Kod aktywny: -10% (Pałac w Korczewie)"
   - ✗ czerwony: „Kod nieznany / nieaktywny / wygasł / limit wyczerpany"
5. **Submit** → lead trafia do tabeli `leads` z polami `affiliate_code` + `affiliate_discount_pct`
6. **Licznik użycia** rośnie automatycznie w `discount_codes.uses_count`

---

## Panel: Supabase Studio

Wszystko obsługujesz w Supabase Studio:
**[https://supabase.com/dashboard/project/kuyniyyieejvambyjnxy/editor](https://supabase.com/dashboard/project/kuyniyyieejvambyjnxy/editor)**

→ Lewe menu → **Table Editor** → tabela `discount_codes`

Tam możesz:
- Dodać nowy kod (przycisk **+ Insert** → Insert row)
- Edytować istniejący (kliknij wiersz → Edit)
- Wyłączyć (toggle `active = false` zamiast usuwać — zachowujesz historię)
- Zobaczyć licznik `uses_count`

---

## SQL do tworzenia kodów (alternatywa dla UI)

Otwórz Supabase Studio → **SQL Editor** → wklej i uruchom:

### Wzór 1 — kod stały dla domu weselnego (10% bez limitu)

```sql
insert into public.discount_codes
  (code, owner_name, owner_email, discount_pct, active, max_uses, notes)
values
  ('KORCZEW10', 'Pałac w Korczewie', 'kontakt@palackorczew.pl',
   10, true, NULL,
   'Współpraca: pałac przekazuje kod parom rezerwującym salę');
```

### Wzór 2 — kod limitowany dla fotografa (15%, max 50 użyć)

```sql
insert into public.discount_codes
  (code, owner_name, owner_email, discount_pct, active, max_uses, notes)
values
  ('ANNAFOTO15', 'Anna Nowak Fotografia', 'anna@annafoto.pl',
   15, true, 50,
   'Promo: pierwsze 50 par poleconych przez Annę');
```

### Wzór 3 — kod sezonowy (20%, wygasa 30 czerwca)

```sql
insert into public.discount_codes
  (code, owner_name, owner_email, discount_pct, active, expires_at, notes)
values
  ('LATO2026', 'Promocja sezonowa', NULL,
   20, true, '2026-06-30 23:59:59+02',
   'Promocja na lato 2026 — końcówka sezonu rezerwacji');
```

### Wzór 4 — kod testowy (już dodany przy migracji)

Już w bazie: `TEST10` — 10% rabat, do testów. **Po wdrożeniu produkcyjnym usuń**:

```sql
delete from public.discount_codes where code = 'TEST10';
```

---

## Zasady nazywania kodów

- **CAPS LOCK + cyfra** dla czytelności: `KORCZEW10` lepsze niż `korczew_10`
- **Krótko** (8-12 znaków), żeby się nie pomylili przy przepisywaniu
- **Unikalność** — `code` ma constraint UNIQUE, system odrzuci duplikat
- **Bez polskich znaków** — łatwiej dyktować przez telefon (`SLAB` zamiast `ŚLĄB`)
- **Wzór nazwy partnera + procent** — łatwiej Tobie skojarzyć kto polecił

---

## Tracking — kto przysłał ile leadów

```sql
-- Top 10 partnerów wg liczby leadów
select
  dc.code                                 as kod,
  dc.owner_name                           as partner,
  dc.discount_pct                         as rabat_pct,
  dc.uses_count                           as uzycia_zarejestrowane,
  count(l.id)                             as leady_w_bazie,
  count(l.id) filter (where l.created_at > now() - interval '30 days')
                                          as leady_30dni,
  max(l.created_at)                       as ostatni_lead
from public.discount_codes dc
left join public.leads l
  on upper(l.affiliate_code) = upper(dc.code)
group by dc.id
order by leady_w_bazie desc, dc.uses_count desc
limit 10;
```

```sql
-- Wszystkie leady z konkretnego kodu
select created_at, name, email, phone, event_type, event_date, message
from public.leads
where upper(affiliate_code) = upper('KORCZEW10')
order by created_at desc;
```

```sql
-- Konwersja w czasie: leady z kodami vs bez
select
  date_trunc('week', created_at)::date    as tydzien,
  count(*) filter (where affiliate_code is not null)  as z_kodem,
  count(*) filter (where affiliate_code is null)      as bez_kodu,
  count(*)                                            as total,
  round(100.0 * count(*) filter (where affiliate_code is not null) / nullif(count(*),0), 1) as proc_z_kodem
from public.leads
where created_at > now() - interval '90 days'
group by 1
order by 1 desc;
```

---

## Operacje serwisowe

### Wyłączenie kodu (np. partner przestał współpracować)

```sql
update public.discount_codes
   set active = false, notes = notes || ' | Wyłączono ' || now()::date
 where code = 'KORCZEW10';
```

### Reset licznika użyć (rzadko potrzebne)

```sql
update public.discount_codes set uses_count = 0 where code = 'KORCZEW10';
```

### Wydłużenie ważności kodu sezonowego

```sql
update public.discount_codes
   set expires_at = '2026-09-30 23:59:59+02'
 where code = 'LATO2026';
```

### Zmiana procentu rabatu

```sql
update public.discount_codes
   set discount_pct = 15
 where code = 'KORCZEW10';
```

---

## Architektura (dla referencji)

### Tabela `discount_codes`

| Pole | Typ | Opis |
|------|-----|------|
| `id` | uuid | klucz główny |
| `code` | text UNIQUE | kod do wpisania (case-insensitive na lookupie) |
| `owner_name` | text | nazwa partnera (Pałac w Korczewie) |
| `owner_email` | text | kontakt do partnera |
| `discount_pct` | smallint 0-50 | procent rabatu |
| `active` | boolean | czy kod aktywny |
| `max_uses` | int | limit użyć (NULL = bez limitu) |
| `uses_count` | int | aktualny licznik |
| `expires_at` | timestamptz | data wygaśnięcia (NULL = bez końca) |
| `notes` | text | wewnętrzne notatki |
| `created_at` | timestamptz | data utworzenia |

### RPC `validate_discount_code(p_code text)` — publiczna walidacja

```sql
select * from public.validate_discount_code('KORCZEW10');
-- → valid | discount_pct | owner_name | reason
```

`reason` może być: `ok`, `not_found`, `inactive`, `expired`, `max_uses_reached`, `empty`.

**Bezpieczeństwo:** RPC jest `SECURITY DEFINER` — anon NIE ma `SELECT` na samej tabeli (nie da się wyenumerować wszystkich kodów). Walidacja działa tylko per-kod.

### RPC `register_discount_code_use(p_code text)` — atomic increment

Po sukcesie INSERT do `leads` frontend wywołuje to RPC, które atomically zwiększa `uses_count`. Jeśli kod stał się nieaktywny między walidacją a submit-em, RPC wraca `false` — to OK, lead i tak jest zapisany z `affiliate_code` w polu (informacyjnie).

### Kolumny w tabeli `leads` (dodane migracją)

- `affiliate_code text` — kod (uppercase) wpisany przez parę
- `affiliate_discount_pct smallint` — % rabatu z momentu walidacji (snapshot)

---

## Co dalej (iteracje)

**Iteracja 2 — onepager B2B dla domów weselnych:**
W bazie wiedzy `umysl-ula` masz już model B2B (450/350/280 zł netto, marża 549-619 zł dla domu). Onepager będzie miał osobny pricing. Tu tylko system kodów — flow konwersji jest niezależny od pricingu.

**Iteracja 3 — automatyczne wystawianie kodów:**
Gdy podpisujesz partnerstwo, dziś kod tworzysz ręcznie SQL-em. W przyszłości:
- Panel admin (Astro + Supabase Auth) → formularz „Dodaj partnera" → kod generowany automatycznie
- Email do partnera z kodem + linkami marketingowymi
- Dashboard partnera (zobacz swój kod, ile leadów, ile konwersji)

**Iteracja 4 — payout system:**
Jeśli płacisz partnerom za konwersje (a nie tylko za leady), dodajesz tabelę `affiliate_payouts` z kolumnami `partner_id`, `period`, `amount_due`, `paid_at`. Płatności poza systemem (przelew tradycyjny / Stripe Connect dla automatu).
