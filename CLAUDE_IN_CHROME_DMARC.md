# Prompt dla Claude in Chrome — DMARC w OVH DNS Zone

Skopiuj poniższy prompt do Claude in Chrome:

---

```
Cel: Dodać rekord DMARC dla domeny zaproszeniaonline.com w OVH DNS Zone Editor.

Kroki:
1. Otwórz https://www.ovh.com/manager/ — zaloguj się (poprosi o 2FA SMS)
2. Web Cloud → Domains → zaproszeniaonline.com → DNS zone
3. Sprawdź czy istnieje rekord DMARC (subdomain `_dmarc`, type TXT)
   - Jeśli istnieje → pokaż wartość, NIE zmieniaj bez mojej zgody
   - Jeśli NIE istnieje → kontynuuj kroki 4-7

4. Add an entry → TXT
5. Subdomain: `_dmarc`
6. Target value:
   v=DMARC1; p=none; rua=mailto:rodo@zaproszeniaonline.com; ruf=mailto:rodo@zaproszeniaonline.com; adkim=r; aspf=r; fo=1
7. TTL: 3600 (default) → Submit

Wyjaśnienie wartości:
- p=none → tryb monitoring (NIE blokuje, tylko zbiera raporty); to bezpieczne na start, później można podnieść do quarantine/reject gdy DKIM+SPF będą stabilne dla outbound (Resend)
- rua/ruf=mailto:rodo@... → adres do raportów aggregate i forensic (rodo alias już istnieje w OVH forwarding)
- adkim=r, aspf=r → relaxed alignment (toleruje subdomeny — domyślne dla większości setupów)
- fo=1 → forensic reports gdy SPF LUB DKIM zawiedzie

Po dodaniu:
8. Otwórz https://mxtoolbox.com/SuperTool.aspx?action=dmarc%3azaproszeniaonline.com — sprawdź czy DMARC propaguje (max 60s)
9. Pokaż mi wynik z mxtoolbox

UWAGA — czego NIE rób:
- NIE ruszaj rekordów A, CNAME, MX
- NIE usuwaj istniejących TXT (SPF, weryfikacja Stripe, etc.)
- NIE zmieniaj p=none na p=reject — to spowoduje że nasze obecne forwarding-only setup zacznie odrzucać maile

Czas: ~10 minut z propagacją.
```

---

## Po wykonaniu przez Claude in Chrome

Wróć do tego czatu i wyślij raport — zweryfikuję i przejdziemy do Resend setup.
