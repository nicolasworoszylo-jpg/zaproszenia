# Dane prawne — zaproszeniaonline.com

> ⚠️ TO JEDYNE MIEJSCE GDZIE TRZYMAMY DANE FIRMY. Po edycji uruchom `python3 update_legal.py`.

## Forma działalności

**Wybierz jedną opcję** (zaznacz `[x]`):

- [ ] Spółka cywilna (Nicolas + Dominika, wspólny NIP)
- [ ] Dwie osobne JDG (Nicolas i Dominika prowadzą osobno, współpracują)
- [ ] Inna forma — uzupełnij niżej

## Nicolas Woroszyło

- Imię i nazwisko: **Nicolas Woroszyło**
- NIP: `[NIP_NICOLAS]`
- REGON: `[REGON_NICOLAS]`
- Adres siedziby: `[ADRES_NICOLAS]`
- Adres do korespondencji: `[KORESPONDENCJA_NICOLAS]`
- E-mail: `kontakt@zaproszeniaonline.com`

## Dominika Kuś

- Imię i nazwisko: **Dominika Kuś**
- NIP: `[NIP_DOMINIKA]`
- REGON: `[REGON_DOMINIKA]`
- Adres siedziby: `[ADRES_DOMINIKA]`
- Adres do korespondencji: `[KORESPONDENCJA_DOMINIKA]`
- E-mail: `kontakt@zaproszeniaonline.com`

## Spółka cywilna (wypełnij JEŚLI prowadzicie s.c.)

- Nazwa: `[NAZWA_SC]` (np. "zaproszeniaonline.com Nicolas Woroszyło, Dominika Kuś s.c.")
- NIP s.c.: `[NIP_SC]`
- REGON s.c.: `[REGON_SC]`
- Adres siedziby s.c.: `[ADRES_SC]`

## Status VAT

- [ ] Aktywny VAT-owiec (sprzedaż >240 tys. zł rocznie)
- [ ] Zwolnienie z VAT (art. 113 ust. 1 ustawy o VAT — sprzedaż <240 tys. zł rocznie)
- [ ] Zwolnienie podmiotowe (np. art. 43 ust. 1 ustawy o VAT)

## Konto bankowe

- IBAN: `[IBAN_FIRMOWE]`
- Nazwa: `[NAZWA_W_BANKU]`
- Bank: `[BANK]`

## Stripe

- Link do Payment Linka: `https://buy.stripe.com/28E00i2UgfYsayo8XQgMw01` ✅
- Stripe account ID: `[acct_xxx]` (z Stripe dashboard → Settings → Account)

---

## Pliki gdzie te dane są używane (auto-update przez `update_legal.py`)

- `privacy.html` — § 1 Współadministratorzy
- `terms.html` — § 1 Definicje (Usługodawca)
- `returns.html` — § 1 Definicje
- `LICENSE.md` — copyright

## Co zrobić po wypełnieniu

1. Wypełnij placeholdery `[NIP_NICOLAS]` itd. konkretnymi wartościami
2. Uruchom `python3 update_legal.py` — propaguje dane do 4 plików
3. `git add -A && git commit -m "legal: update NIP/REGON" && git push`
4. Vercel auto-deploy ~30s

## Status uzupełnień

| Pole | Status |
|---|---|
| Forma działalności | ⏳ wybierz w sekcji wyżej |
| NIP Nicolas | ⏳ |
| REGON Nicolas | ⏳ |
| Adres Nicolas | ⏳ |
| NIP Dominika | ⏳ |
| REGON Dominika | ⏳ |
| Adres Dominika | ⏳ |
| Status VAT | ⏳ |
| IBAN firmowe | ⏳ |
