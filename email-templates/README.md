# Email Templates Library - Zaproszenia Online

Gotowe wzory maili do **manualnego wysyłania** w scenariuszach które nie są pokryte automatami (notify-new-lead / notify-payment-success / send-review-request / notify-review-submitted).

Wszystkie zachowują brand: forest `#2C3E2D` + cream `#FAF6EF` + gold `#C9A96E` + Fraunces serif italic + Inter sans.

## Jak używać

1. **Mail standardowy (Gmail/iCloud/Outlook):** otwórz plik `*-html.html` w przeglądarce → kopiuj formatted text → wklej do okna „nowy mail" w Gmailu (paste zachowuje formatowanie).
2. **Mail przez Resend (API):** użyj treści `*.txt` + `*-html.html` w `email-templates/send-template.sh` (przykład w `send-template.sh`).
3. **Personalizacja:** zamień placeholdery `{{ImiePary}}`, `{{DataSlubu}}`, `{{LinkPodgladu}}` itp.

## Lista scenariuszy

| # | Plik | Kiedy wysłać | Trigger |
|---|------|--------------|---------|
| 01 | `01-preview-ready` | 24h po opłaceniu (link do podglądu strony) | Manual po przygotowaniu projektu |
| 02 | `02-materials-request` | Klient zapłacił, nie wysłał materiałów (zdjęcia/historia) | 48h po paid bez maila zwrotnego |
| 03 | `03-revisions-followup` | Po wysłaniu poprawek - "czy wszystko OK?" | 24h po wysłaniu wersji 2/3 |
| 04 | `04-final-delivery` | Strona finalna gotowa, link produkcyjny | Po zaakceptowaniu finalnej wersji |
| 05 | `05-pre-event-reminder` | 14 dni przed datą wydarzenia - "sprawdźcie ostatnie szczegóły" | Cron (manual przed startem cron) |
| 06 | `06-post-event-followup` | 3 dni PO wydarzeniu - "jak było?" przed prośbą o opinię | Manual po dacie eventu |
| 07 | `07-abandoned-cart` | Lead wypełnił formularz, nie zapłacił (7 dni) | Manual / cron |
| 08 | `08-referral-thanks` | Po otrzymaniu rekomendacji (znajomy pary użył kodu POLEC50) | Manual po Stripe event |
| 09 | `09-anniversary` | Rok po dacie wydarzenia - "dziękujemy że byliście częścią" | Cron (manual) |
| 10 | `10-winback` | 6 mies brak kontaktu - "może znacie kogoś?" | Manual |
| 11 | `11-photo-license-check` | Klient przysłał profesjonalne zdjęcia - prośba o potwierdzenie licencji od fotografa (§ 8c Regulaminu) | Manual - Dominika podczas odbioru zdjęć, zgodnie z [SOP](../legal-templates/sop-przyjmowanie-zdjec.md) |
| 12 | `12-takedown-ack` | Ktoś zgłosił naruszenie praw na kontakt@ - potwierdzenie otrzymania (§ 8d Regulaminu, DSA art. 16) | Manual w 24h od zgłoszenia |
| 13 | `13-takedown-decision` | Decyzja po rozpatrzeniu zgłoszenia (usunięcie LUB brak podstaw) - wariant USUNIĘTO / wariant ODDALONO | Manual w 72h od zgłoszenia |

## Struktura każdego scenariusza

```
NN-scenario-name/
├── subject.txt              ← linia tematu maila
├── preheader.txt            ← preview text (Gmail Inbox)
├── plain.txt                ← wersja tekstowa
├── html.html                ← pełny HTML z brand stylem
└── notes.md                 ← KIEDY, JAK, na co uważać
```

## Wspólne brand tokens

```css
--bg: #FAFAF8
--card: #FFFFFF
--ink: #0A0A0A
--ink-soft: #4A4A4A
--ink-mute: #999999
--accent: #2C3E2D (forest)
--accent-h: #1E2B1F
--gold: #C9A96E
--cream: #FAF6EF
--line: #EBEBEB
font-display: Georgia 'Times New Roman' serif italic
font-body: -apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, sans-serif
```

## Złota zasada copy

- **Pierwsze imię** zawsze (`{{ImiePary}}` = "Anna", nie "Anna i Michał")
- **Pojedyncze CTA** - jedna akcja per mail
- **No-stress tone** - nie naciskać, dawać opcję "odpisz mailem zamiast formularzem"
- **Personal signature** - "Nicolas" + "Zespół Zaproszenia Online" (nie generic "Team")
- **Edyycyjny gold callout** - jedno highlight per mail (nie więcej)
