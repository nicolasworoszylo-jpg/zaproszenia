# Rejestr Czynności Przetwarzania - nagłówek dokumentu

> Wymóg art. 30 ust. 1 lit. a RODO. Dokument wewnętrzny, nieupubliczniany. Okazywany na żądanie PUODO w trakcie kontroli (termin 14 dni).

## Administrator danych

- **Nicolas Woroszyło** - prowadzący działalność nieewidencjonowaną pod marką **zaproszeniaonline.com**
- Podstawa prawna działalności: art. 5 ust. 1 ustawy z dnia 6 marca 2018 r. - Prawo przedsiębiorców (Dz.U. 2018 poz. 646)
- Status: bez NIP, bez REGON, bez wpisu CEIDG (sprzedawca nie jest podatnikiem VAT)
- Adres do korespondencji elektronicznej (RODO art. 12 ust. 1):
  - Jedyny publiczny adres (od 2026-05-16): **kontakt@zaproszeniaonline.com** - obsługuje wszystkie sprawy (RODO art. 15-22, faktury, reklamacje, Notice & Takedown)
  - Legacy inbound (nie używane w UI): `rodo@`, `faktury@`, `zamowienia@` - forwardery aktywne dla DMARC raportów i starych maili
- Adres do doręczeń pisemnych: udostępniany na żądanie (działalność nieewidencjonowana nie ma adresu rejestrowego)

## Osoby upoważnione do przetwarzania (art. 29 RODO)

- **Dominika Kuś** (`dominikakus333@gmail.com`) - rola: pomoc operacyjna, działa wyłącznie pod kierunkiem Administratora. Nie jest współadministratorem ani odrębnym administratorem.

## Inspektor Ochrony Danych (DPO)

- **Nie powołano** - brak obowiązku z art. 37 RODO (działalność nieewidencjonowana, niewielka skala przetwarzania, brak głównego przedmiotu działalności wymagającego regularnej i systematycznej obserwacji osób na dużą skalę). Wszystkie sprawy prowadzi bezpośrednio Administrator.

## Procesory i transfery do państw trzecich

| Procesor | Lokalizacja | Rola | Podstawa transferu |
|----------|-------------|------|---------------------|
| Supabase Inc. | USA / eu-west-1 (Irlandia) | Hosting bazy danych | SCC + DPA Supabase |
| Vercel Inc. | USA | Hosting strony, CDN, Web Analytics, Speed Insights | SCC + DPA Vercel |
| Stripe Payments Europe Ltd. + Stripe Inc. | Irlandia + USA | Operator płatności | SCC + DPA Stripe (stripe.com/legal/dpa) |
| Resend Inc. | USA | Wysyłka maili transakcyjnych i opt-in marketingowych | SCC + DPA Resend (resend.com/legal/dpa) |
| Biuro rachunkowe | Polska | Obsługa księgowa (przy progowych przychodach) | Umowa o świadczenie usług księgowych |

## Status DPA (umowy powierzenia art. 28 RODO)

| Procesor | Status | Data podpisania | Lokalizacja dowodu |
|----------|--------|-----------------|---------------------|
| Supabase | DO PODPISANIA | - | Settings → Compliance → Sign DPA |
| Vercel | DO PODPISANIA | - | Team Settings → Security & Privacy → DPA |
| Stripe | DO POTWIERDZENIA | - | Akceptowane przy podpisaniu Stripe TOS - zrzut ekranu w `legal-templates/dpa-signed/` |
| Resend | DO PODPISANIA | - | Dashboard → Settings → Legal → DPA |

**TODO Nicolas:** po akceptacji każdego DPA wpisz datę + screenshot do `legal-templates/dpa-signed/<procesor>-<data>.png`.

## Wersjonowanie RCP

- Wersja: **1.0** (utworzona 2026-05-13)
- Obowiązuje od: 2026-05-13
- Przegląd zaplanowany co 6 miesięcy lub przy każdej zmianie infrastruktury
- Plik z procesami: `RCP_template.csv` (8 procesów aktualnie udokumentowanych)

## Historia zmian

| Data | Wersja | Zmiana |
|------|--------|--------|
| 2026-05-13 | 1.0 | Pierwsza wersja - 8 procesów (lead, umowa, RSVP, demo, afiliacje, księgowość, marketing, pipeline e-mail transakcyjnych Resend) |
