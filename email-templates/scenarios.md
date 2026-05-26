# 10 scenariuszy mailowych - gotowe wzory do wysyłki manualnej

Każdy scenariusz: kiedy wysłać → temat → preheader → wersja tekstowa → HTML body (bez shella - wkleja się przez `send-template.sh` albo Resend).

**Placeholdery:**
- `{{ImiePary}}` → pierwsze imię (np. „Anna")
- `{{ImionaPelne}}` → „Anna i Michał"
- `{{DataSlubu}}` → „14 czerwca 2026"
- `{{LinkStrony}}` → np. https://zaproszeniaonline.com/anna-michal
- `{{LinkPodgladu}}` → np. https://preview.zaproszeniaonline.com/abc123 (lub link tymczasowy)
- `{{LinkOpinii}}` → https://zaproszeniaonline.com/opinia?t=<token> (z send-review-request)
- `{{NumerZamowienia}}` → 8 znaków z lead.id

---

## 01 - Preview Ready (po 24h oknie odstąpienia + max 48h realizacji od kompletu danych, link do podglądu)

**SUBJECT:** `Wasza strona ślubna - link do podglądu`
**PREHEADER:** `Pierwsza wersja gotowa, {{ImiePary}}. Sprawdźcie i odpiszcie z uwagami - 2 rundy poprawek w cenie.`

### Plain text

```
Cześć {{ImiePary}},

Pierwsza wersja Waszej strony ślubnej jest gotowa - prosto z briefu, ze wszystkimi sekcjami które wybraliście.

LINK DO PODGLĄDU:
{{LinkPodgladu}}

CO TERAZ:
1. Otwórzcie link na telefonie i na laptopie (chcemy żeby działało wszędzie).
2. Sprawdźcie: imiona, datę, miejsce, harmonogram, kolory, fotki.
3. Wszystkie uwagi - odpiszcie na tego maila (lista pkt-pkt jest najszybsza). W cenie macie 2 rundy poprawek.

W razie pytań - po prostu odpowiedz na tego maila. Czytam wszystko osobiście.

Nicolas
Zespół Zaproszenia Online · zaproszeniaonline.com
```

### HTML body (insert in `_shell.html` {{BODY}})

```html
<div class="hero" style="background:linear-gradient(135deg,#2C3E2D 0%,#243325 100%);color:#FAF6EF;padding:44px 36px 38px;text-align:center;">
  <p style="margin:0;font-size:0.74rem;letter-spacing:0.16em;text-transform:uppercase;color:rgba(250,246,239,0.85);font-weight:500;">
    <span style="display:inline-block;width:5px;height:5px;background:#C9A96E;border-radius:50%;margin-right:8px;vertical-align:2px;"></span>Pierwsza wersja
  </p>
  <h1 class="h1" style="margin:14px 0 8px;font-family:Georgia,'Times New Roman',serif;font-style:italic;font-weight:400;font-size:2.1rem;letter-spacing:-0.022em;line-height:1.15;color:#FAF6EF;">
    Wasza strona ślubna<br/>czeka na Was
  </h1>
  <p style="margin:6px 0 0;font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:1rem;color:rgba(250,246,239,0.82);">
    {{ImionaPelne}}
  </p>
</div>
<div class="body" style="padding:36px 36px 32px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,sans-serif;font-size:0.98rem;line-height:1.65;color:#0A0A0A;">
  <p style="margin:0 0 16px;">Cześć {{ImiePary}},</p>
  <p style="margin:0 0 22px;">Pierwsza wersja gotowa - prosto z briefu, ze wszystkimi sekcjami które wybraliście. Otwórzcie na telefonie i na laptopie - chcemy żeby działało wszędzie.</p>
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 24px;">
    <tr><td style="background:#0A0A0A;border-radius:100px;">
      <a href="{{LinkPodgladu}}" class="cta" style="display:inline-block;padding:16px 32px;color:#FFFFFF;font-size:1rem;font-weight:500;">Otwórz podgląd →</a>
    </td></tr>
  </table>
  <div style="margin:24px 0;padding:20px 22px;background:rgba(201,169,110,0.08);border-left:3px solid #C9A96E;border-radius:8px;">
    <p style="margin:0 0 8px;font-size:0.74rem;letter-spacing:0.12em;text-transform:uppercase;color:#999;font-weight:600;">
      <span style="display:inline-block;width:5px;height:5px;background:#C9A96E;border-radius:50%;margin-right:8px;vertical-align:2px;"></span>2 rundy poprawek w cenie
    </p>
    <p style="margin:0;font-size:0.96rem;line-height:1.6;color:#0A0A0A;">Wszystkie uwagi - odpiszcie listą pkt-pkt na tego maila (najszybciej). Większość zmian wprowadzam w 24h od listy uwag.</p>
  </div>
  <p style="margin:24px 0 0;color:#4A4A4A;font-size:0.93rem;">Pytania? Po prostu odpiszcie na tego maila.</p>
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-top:28px;">
    <tr><td style="padding-right:14px;"><div style="width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#2C3E2D,#1E2B1F);color:#FAF6EF;text-align:center;line-height:44px;font-family:Georgia,serif;font-style:italic;font-size:0.98rem;">N</div></td>
    <td><p style="margin:0;font-family:Georgia,serif;font-style:italic;font-size:1.15rem;color:#2C3E2D;">Nicolas</p><p style="margin:1px 0 0;font-size:0.82rem;color:#999;">Zespół Zaproszenia Online</p></td></tr>
  </table>
</div>
```

---

## 02 - Materials Request (48h paid, brak materiałów)

**SUBJECT:** `{{ImiePary}}, brakuje nam Waszych materiałów`
**PREHEADER:** `Imiona, data, miejsce + do 7 zdjęć pary (1 kwadrat + 6 pionowych). Bez tego nie ruszę.`

### Plain text

```
Cześć {{ImiePary}},

Mamy Waszą wpłatę i jestem gotów zacząć projekt - ale brakuje mi materiałów do strony. Bez nich nie ruszę.

POTRZEBUJĘ (na kontakt@zaproszeniaonline.com):

1. Pełne imiona pary
2. Data ślubu (i miejsce ceremonii + przyjęcia)
3. Harmonogram dnia (najważniejsze godziny: ceremonia, obiad, oczepiny)
4. Ulubione zdjęcia pary (do 7 — najlepiej 1 kwadratowe na centerpiece + do 6 pionowych do galerii bocznej; poziome przyjmiemy, ale zostaną mocno wykadrowane; im wyższa rozdzielczość, tym lepiej)
5. Krótka historia (3-5 zdań - jak się poznaliście?)
6. Preferowane kolory albo motyw (jeśli już macie)

Jeśli czegoś brakuje, prześlijcie to co macie - resztę dopytamy.

W razie czego po prostu odpiszcie na tego maila.

Nicolas
Zespół Zaproszenia Online · zaproszeniaonline.com
```

### HTML body

```html
<div class="hero" style="background:linear-gradient(135deg,#2C3E2D 0%,#243325 100%);color:#FAF6EF;padding:40px 36px 36px;text-align:center;">
  <p style="margin:0;font-size:0.74rem;letter-spacing:0.16em;text-transform:uppercase;color:rgba(250,246,239,0.85);font-weight:500;">
    <span style="display:inline-block;width:5px;height:5px;background:#C9A96E;border-radius:50%;margin-right:8px;vertical-align:2px;"></span>Brief
  </p>
  <h1 class="h1" style="margin:14px 0 6px;font-family:Georgia,serif;font-style:italic;font-weight:400;font-size:2rem;color:#FAF6EF;">
    Czekamy na Wasze materiały
  </h1>
  <p style="margin:4px 0 0;font-size:0.96rem;color:rgba(250,246,239,0.78);">Bez nich nie ruszymy z projektem.</p>
</div>
<div class="body" style="padding:36px 36px 32px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:0.98rem;line-height:1.65;color:#0A0A0A;">
  <p style="margin:0 0 16px;">Cześć {{ImiePary}},</p>
  <p style="margin:0 0 22px;">Mamy Waszą wpłatę i jestem gotów zacząć projekt - ale brakuje mi materiałów. Wyślijcie na <a href="mailto:kontakt@zaproszeniaonline.com" style="color:#2C3E2D;text-decoration:underline;">kontakt@zaproszeniaonline.com</a>:</p>
  <ol style="margin:0 0 24px;padding-left:1.4em;color:#0A0A0A;">
    <li style="margin-bottom:10px;"><strong>Pełne imiona pary</strong></li>
    <li style="margin-bottom:10px;"><strong>Data ślubu + miejsce</strong> (ceremonia + przyjęcie)</li>
    <li style="margin-bottom:10px;"><strong>Harmonogram dnia</strong> (ceremonia, obiad, oczepiny)</li>
    <li style="margin-bottom:10px;"><strong>Ulubione zdjęcia pary</strong> (do 7 — najlepiej 1 kwadratowe na centerpiece + do 6 pionowych do galerii bocznej; poziome wykadrujemy; wysoka rozdzielczość)</li>
    <li style="margin-bottom:10px;"><strong>Historia</strong> (3-5 zdań - jak się poznaliście?)</li>
    <li><strong>Preferowane kolory</strong> (jeśli już macie)</li>
  </ol>
  <div style="margin:24px 0;padding:18px 20px;background:rgba(201,169,110,0.08);border-left:3px solid #C9A96E;border-radius:8px;">
    <p style="margin:0;font-size:0.96rem;color:#0A0A0A;">Jeśli czegoś brakuje - prześlijcie to co macie. Resztę dopytamy.</p>
  </div>
  <p style="margin:24px 0 0;color:#4A4A4A;font-size:0.93rem;">Po prostu odpiszcie na tego maila z załącznikami.</p>
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-top:28px;">
    <tr><td style="padding-right:14px;"><div style="width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#2C3E2D,#1E2B1F);color:#FAF6EF;text-align:center;line-height:44px;font-family:Georgia,serif;font-style:italic;font-size:0.98rem;">N</div></td>
    <td><p style="margin:0;font-family:Georgia,serif;font-style:italic;font-size:1.15rem;color:#2C3E2D;">Nicolas</p><p style="margin:1px 0 0;font-size:0.82rem;color:#999;">Zespół Zaproszenia Online</p></td></tr>
  </table>
</div>
```

---

## 03 - Revisions Follow-up (24h po wysłaniu wersji 2/3)

**SUBJECT:** `{{ImiePary}}, wszystko OK z poprawkami?`
**PREHEADER:** `Sprawdziliście wczorajszą wersję? Jeszcze runda poprawek czy zatwierdzamy?`

### Plain text

```
Cześć {{ImiePary}},

Wczoraj wysłałem Wam zaktualizowaną wersję strony z poprawkami. Chciałem sprawdzić - czy wszystko zagrało?

DWIE OPCJE:
A. Wszystko OK → odpiszcie "akceptujemy", finalizuję i wysyłam link produkcyjny.
B. Jeszcze jedna runda → wypiszcie pkt-pkt co dopracować (macie jeszcze {{IloscRund}} w cenie).

Jeśli czegoś nie widzieliście / coś nie dotarło - dajcie znać, prześlę ponownie.

Nicolas
Zespół Zaproszenia Online · zaproszeniaonline.com
```

### HTML body

```html
<div class="hero" style="background:linear-gradient(135deg,#2C3E2D 0%,#243325 100%);color:#FAF6EF;padding:38px 36px 32px;text-align:center;">
  <p style="margin:0;font-size:0.74rem;letter-spacing:0.16em;text-transform:uppercase;color:rgba(250,246,239,0.85);font-weight:500;">
    <span style="display:inline-block;width:5px;height:5px;background:#C9A96E;border-radius:50%;margin-right:8px;vertical-align:2px;"></span>Iteracja
  </p>
  <h1 class="h1" style="margin:12px 0 4px;font-family:Georgia,serif;font-style:italic;font-weight:400;font-size:1.85rem;color:#FAF6EF;">
    Wszystko zagrało, {{ImiePary}}?
  </h1>
</div>
<div class="body" style="padding:32px 36px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:0.98rem;line-height:1.65;color:#0A0A0A;">
  <p style="margin:0 0 16px;">Cześć {{ImiePary}},</p>
  <p style="margin:0 0 22px;">Wczoraj wysłałem zaktualizowaną wersję z poprawkami. Chciałem sprawdzić - dotarło wszystko?</p>
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 24px;">
    <tr>
      <td width="50%" style="padding-right:8px;vertical-align:top;">
        <div style="padding:18px 16px;background:rgba(44,62,45,0.05);border-left:3px solid #2C3E2D;border-radius:8px;">
          <p style="margin:0 0 6px;font-size:0.78rem;letter-spacing:0.1em;text-transform:uppercase;color:#2C3E2D;font-weight:600;">A · Wszystko OK</p>
          <p style="margin:0;font-size:0.92rem;color:#0A0A0A;">Odpisz „akceptujemy" → finalizuję + wysyłam link produkcyjny.</p>
        </div>
      </td>
      <td width="50%" style="padding-left:8px;vertical-align:top;">
        <div style="padding:18px 16px;background:rgba(201,169,110,0.08);border-left:3px solid #C9A96E;border-radius:8px;">
          <p style="margin:0 0 6px;font-size:0.78rem;letter-spacing:0.1em;text-transform:uppercase;color:#C9A96E;font-weight:600;">B · Jeszcze runda</p>
          <p style="margin:0;font-size:0.92rem;color:#0A0A0A;">Wypisz pkt-pkt co dopracować ({{IloscRund}} w cenie).</p>
        </div>
      </td>
    </tr>
  </table>
  <p style="margin:18px 0 0;color:#4A4A4A;font-size:0.93rem;">Jeśli coś nie dotarło - dajcie znać, prześlę ponownie.</p>
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-top:28px;">
    <tr><td style="padding-right:14px;"><div style="width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#2C3E2D,#1E2B1F);color:#FAF6EF;text-align:center;line-height:44px;font-family:Georgia,serif;font-style:italic;font-size:0.98rem;">N</div></td>
    <td><p style="margin:0;font-family:Georgia,serif;font-style:italic;font-size:1.15rem;color:#2C3E2D;">Nicolas</p><p style="margin:1px 0 0;font-size:0.82rem;color:#999;">Zespół Zaproszenia Online</p></td></tr>
  </table>
</div>
```

---

## 04 - Final Delivery (strona live)

**SUBJECT:** `Wasza strona ślubna jest live - {{LinkStrony}}`
**PREHEADER:** `{{ImionaPelne}}, gotowe. Możecie wysyłać link gościom.`

### Plain text

```
{{ImiePary}}, Wasza strona jest live!

Link produkcyjny do udostępniania gościom:
{{LinkStrony}}

CO MOŻECIE Z TYM ZROBIĆ:
- Wysłać link mailem albo Messengerem do gości
- Wkleić w wiadomości tekstowej
- Wydrukować QR kod (mogę przygotować, jeśli zechcecie - odpiszcie)
- Postować na social media

CO PAMIĘTAĆ:
- Strona działa 12 miesięcy od dziś
- RSVP-y z formularza zobaczycie pod {{LinkRSVP}} (instrukcja w mailu z briefem)
- Po roku - na życzenie - dostaniecie kopię HTML do archiwizacji za darmo

W razie pytań albo zmian (np. dodać sekcję, zmienić zdjęcie) - odpiszcie na tego maila. Drobne zmiany robię w 24h.

Powodzenia w przygotowaniach!

Nicolas
Zespół Zaproszenia Online · zaproszeniaonline.com
```

### HTML body

```html
<div class="hero" style="background:linear-gradient(135deg,#2C3E2D 0%,#243325 100%);color:#FAF6EF;padding:48px 36px 40px;text-align:center;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:0 auto 18px;">
    <tr><td style="background:rgba(201,169,110,0.18);border:2px solid #C9A96E;border-radius:50%;width:64px;height:64px;text-align:center;line-height:60px;">
      <span style="font-family:Georgia,serif;font-size:2rem;color:#C9A96E;">✓</span>
    </td></tr>
  </table>
  <p style="margin:0;font-size:0.74rem;letter-spacing:0.16em;text-transform:uppercase;color:rgba(250,246,239,0.85);font-weight:500;">
    <span style="display:inline-block;width:5px;height:5px;background:#C9A96E;border-radius:50%;margin-right:8px;vertical-align:2px;"></span>Strona live
  </p>
  <h1 class="h1" style="margin:14px 0 8px;font-family:Georgia,serif;font-style:italic;font-weight:400;font-size:2.1rem;color:#FAF6EF;">
    Gotowe, {{ImiePary}}.
  </h1>
  <p style="margin:0;font-size:1rem;color:rgba(250,246,239,0.82);">Możecie wysyłać link gościom.</p>
</div>
<div class="body" style="padding:36px 36px 32px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:0.98rem;line-height:1.65;color:#0A0A0A;">
  <p style="margin:0 0 20px;font-size:0.78rem;letter-spacing:0.12em;text-transform:uppercase;color:#999;font-weight:600;">Link produkcyjny</p>
  <div style="margin:0 0 24px;padding:20px;background:#FAFAF8;border:1px solid #EBEBEB;border-radius:12px;text-align:center;">
    <a href="{{LinkStrony}}" style="font-family:Georgia,serif;font-style:italic;font-size:1.2rem;color:#2C3E2D;text-decoration:underline;text-underline-offset:3px;word-break:break-all;">{{LinkStrony}}</a>
  </div>
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 24px;">
    <tr><td style="background:#0A0A0A;border-radius:100px;">
      <a href="{{LinkStrony}}" class="cta" style="display:inline-block;padding:16px 32px;color:#FFFFFF;font-size:1rem;font-weight:500;">Otwórz stronę →</a>
    </td></tr>
  </table>

  <div style="margin:24px 0;padding:20px 22px;background:rgba(201,169,110,0.08);border-left:3px solid #C9A96E;border-radius:8px;">
    <p style="margin:0 0 10px;font-size:0.74rem;letter-spacing:0.12em;text-transform:uppercase;color:#999;font-weight:600;">Co pamiętać</p>
    <ul style="margin:0;padding-left:1.2em;color:#0A0A0A;font-size:0.96rem;line-height:1.6;">
      <li style="margin-bottom:6px;">Strona działa <strong>12 miesięcy</strong> od dziś</li>
      <li style="margin-bottom:6px;">RSVP-y z formularza znajdziecie pod <a href="{{LinkRSVP}}" style="color:#2C3E2D;text-decoration:underline;">{{LinkRSVP}}</a></li>
      <li>Drobne zmiany (zdjęcie, sekcja) - odpiszcie na tego maila, robię w 24h</li>
    </ul>
  </div>

  <p style="margin:24px 0 0;font-size:0.96rem;">Powodzenia w przygotowaniach. Trzymam kciuki za Wasz dzień.</p>
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-top:28px;">
    <tr><td style="padding-right:14px;"><div style="width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#2C3E2D,#1E2B1F);color:#FAF6EF;text-align:center;line-height:44px;font-family:Georgia,serif;font-style:italic;font-size:0.98rem;">N</div></td>
    <td><p style="margin:0;font-family:Georgia,serif;font-style:italic;font-size:1.15rem;color:#2C3E2D;">Nicolas</p><p style="margin:1px 0 0;font-size:0.82rem;color:#999;">Zespół Zaproszenia Online</p></td></tr>
  </table>
</div>
```

---

## 05 - Pre-Event Reminder (14 dni przed ślubem)

**SUBJECT:** `{{ImiePary}}, 14 dni do ślubu - ostatnie sprawdzenie strony?`
**PREHEADER:** `Drobne literówki? Brakujące godziny? Coś dorzucić? Jeszcze jest czas.`

### Plain text

```
Cześć {{ImiePary}},

Za 14 dni Wasz wielki dzień! Pomyślałem, że to dobry moment żeby sprawdzić stronę raz jeszcze - świeżym okiem.

NA CO ZWRÓCIĆ UWAGĘ:
- Czy harmonogram się nie zmienił (godziny, miejsca)?
- Czy wszystkie miejsca są zaktualizowane (link Google Maps, dojazd)?
- Czy lista piosenek/sekcja muzyczna jest aktualna?
- Czy jakiś gość się skarżył że RSVP nie działa?

Drobne zmiany robię w 24h, bez naliczania. Coś większego - dajcie znać, wycenię.

LINK DO WASZEJ STRONY:
{{LinkStrony}}

RSVP-y do tej pory:
{{LinkRSVP}}

Powodzenia w finiszu przygotowań - wiem że to teraz bardzo intensywny czas.

Nicolas
Zespół Zaproszenia Online · zaproszeniaonline.com
```

### HTML body

```html
<div class="hero" style="background:linear-gradient(135deg,#2C3E2D 0%,#243325 100%);color:#FAF6EF;padding:40px 36px 32px;text-align:center;">
  <p style="margin:0;font-size:0.74rem;letter-spacing:0.16em;text-transform:uppercase;color:rgba(250,246,239,0.85);font-weight:500;">
    <span style="display:inline-block;width:5px;height:5px;background:#C9A96E;border-radius:50%;margin-right:8px;vertical-align:2px;"></span>14 dni do ślubu
  </p>
  <h1 class="h1" style="margin:12px 0 6px;font-family:Georgia,serif;font-style:italic;font-weight:400;font-size:1.95rem;color:#FAF6EF;">
    Czas na finalne sprawdzenie
  </h1>
  <p style="margin:0;font-size:0.96rem;color:rgba(250,246,239,0.78);">Świeżym okiem, póki jeszcze jest czas.</p>
</div>
<div class="body" style="padding:32px 36px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:0.98rem;line-height:1.65;color:#0A0A0A;">
  <p style="margin:0 0 18px;">Cześć {{ImiePary}}, za 14 dni Wasz wielki dzień. Pomyślałem, że to dobry moment żeby sprawdzić stronę raz jeszcze.</p>
  <p style="margin:0 0 14px;font-size:0.78rem;letter-spacing:0.1em;text-transform:uppercase;color:#999;font-weight:600;">Na co zwrócić uwagę</p>
  <ul style="margin:0 0 22px;padding-left:1.3em;color:#0A0A0A;">
    <li style="margin-bottom:8px;">Harmonogram - <strong>czy godziny i miejsca aktualne?</strong></li>
    <li style="margin-bottom:8px;">Dojazd - czy linki Google Maps prowadzą gdzie trzeba?</li>
    <li style="margin-bottom:8px;">Muzyka - lista propozycji od gości</li>
    <li>RSVP - czy ktoś się skarżył że nie działa?</li>
  </ul>
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 20px;">
    <tr>
      <td style="padding-right:10px;"><a href="{{LinkStrony}}" style="display:inline-block;padding:13px 22px;background:#0A0A0A;color:#FFFFFF;border-radius:100px;font-size:0.94rem;font-weight:500;">Wasza strona →</a></td>
      <td><a href="{{LinkRSVP}}" style="display:inline-block;padding:13px 22px;background:#FFFFFF;color:#0A0A0A;border:1px solid #EBEBEB;border-radius:100px;font-size:0.94rem;font-weight:500;">Lista RSVP →</a></td>
    </tr>
  </table>
  <div style="margin:24px 0;padding:18px 20px;background:rgba(201,169,110,0.08);border-left:3px solid #C9A96E;border-radius:8px;">
    <p style="margin:0;font-size:0.96rem;color:#0A0A0A;">Drobne zmiany robię w 24h, bez naliczania. Coś większego - dajcie znać, wycenię.</p>
  </div>
  <p style="margin:18px 0 0;color:#4A4A4A;font-size:0.93rem;">Trzymam kciuki za finisz przygotowań.</p>
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-top:28px;">
    <tr><td style="padding-right:14px;"><div style="width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#2C3E2D,#1E2B1F);color:#FAF6EF;text-align:center;line-height:44px;font-family:Georgia,serif;font-style:italic;font-size:0.98rem;">N</div></td>
    <td><p style="margin:0;font-family:Georgia,serif;font-style:italic;font-size:1.15rem;color:#2C3E2D;">Nicolas</p><p style="margin:1px 0 0;font-size:0.82rem;color:#999;">Zespół Zaproszenia Online</p></td></tr>
  </table>
</div>
```

---

## 06 - Post-Event Follow-up (3 dni po ślubie, przed prośbą o opinię)

**SUBJECT:** `{{ImiePary}}, jak było?`
**PREHEADER:** `Wracam z luźnym pytaniem - bez formularza. Po prostu dwie linijki, jeśli macie chwilę.`

### Plain text

```
Cześć {{ImiePary}},

Wiem, że pewnie odsypiacie po weselu (i słusznie - bo to maraton). Wracam tylko na chwilę z jednym pytaniem:

JAK BYŁO?

Bez formularza, bez gwiazdek. Po prostu - jeśli macie 2 minuty - dwie linijki w odpowiedzi. Najbardziej ciekawi mnie:
- Czy strona zagrała tak jak miała (goście trafili na RSVP, znaleźli harmonogram)?
- Czy coś byście dodali / poprawili / zrobili inaczej?

Za tydzień wrócę z prośbą o oficjalną opinię (formularz, kod rabatowy dla znajomych pary), ale na razie - po prostu zwykła rozmowa.

Mam nadzieję, że pogoda dopisała i że jutro budzicie się w innym świecie. Gratulacje!

Nicolas
Zespół Zaproszenia Online · zaproszeniaonline.com
```

### HTML body

```html
<div class="hero" style="background:linear-gradient(135deg,#2C3E2D 0%,#243325 100%);color:#FAF6EF;padding:44px 36px 36px;text-align:center;">
  <p style="margin:0;font-size:0.74rem;letter-spacing:0.16em;text-transform:uppercase;color:rgba(250,246,239,0.85);font-weight:500;">
    <span style="display:inline-block;width:5px;height:5px;background:#C9A96E;border-radius:50%;margin-right:8px;vertical-align:2px;"></span>Po ślubie
  </p>
  <h1 class="h1" style="margin:14px 0 6px;font-family:Georgia,serif;font-style:italic;font-weight:400;font-size:2.2rem;color:#FAF6EF;">
    Jak było?
  </h1>
  <p style="margin:0;font-size:0.98rem;color:rgba(250,246,239,0.78);">Bez formularza. Po prostu dwie linijki, jeśli macie chwilę.</p>
</div>
<div class="body" style="padding:36px 36px 32px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:0.98rem;line-height:1.65;color:#0A0A0A;">
  <p style="margin:0 0 16px;">Cześć {{ImiePary}},</p>
  <p style="margin:0 0 18px;">Wiem, że pewnie odsypiacie po weselu (i słusznie - to maraton). Wracam tylko na chwilę z jednym pytaniem.</p>
  <p style="margin:0 0 18px;">Najbardziej ciekawi mnie:</p>
  <ul style="margin:0 0 22px;padding-left:1.3em;color:#0A0A0A;">
    <li style="margin-bottom:8px;">Czy strona <strong>zagrała</strong>? Goście trafili na RSVP, znaleźli harmonogram?</li>
    <li>Czy coś byście <strong>dodali / poprawili</strong> / zrobili inaczej?</li>
  </ul>
  <div style="margin:24px 0;padding:18px 20px;background:rgba(201,169,110,0.08);border-left:3px solid #C9A96E;border-radius:8px;">
    <p style="margin:0;font-size:0.96rem;color:#0A0A0A;">Za tydzień wrócę z prośbą o <strong>oficjalną opinię</strong> (krótki formularz, kod rabatowy dla znajomych pary). Na razie - po prostu zwykła rozmowa.</p>
  </div>
  <p style="margin:18px 0 0;color:#4A4A4A;font-size:0.96rem;">Mam nadzieję, że pogoda dopisała. Gratulacje!</p>
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-top:28px;">
    <tr><td style="padding-right:14px;"><div style="width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#2C3E2D,#1E2B1F);color:#FAF6EF;text-align:center;line-height:44px;font-family:Georgia,serif;font-style:italic;font-size:0.98rem;">N</div></td>
    <td><p style="margin:0;font-family:Georgia,serif;font-style:italic;font-size:1.15rem;color:#2C3E2D;">Nicolas</p><p style="margin:1px 0 0;font-size:0.82rem;color:#999;">Zespół Zaproszenia Online</p></td></tr>
  </table>
</div>
```

---

## 07 - Abandoned Cart (7 dni: lead bez płatności)

**SUBJECT:** `{{ImiePary}}, mam dla Was 15 minut?`
**PREHEADER:** `Wypełniliście formularz w zeszłym tygodniu - chciałbym sprawdzić, czy mogę pomóc.`

### Plain text

```
Cześć {{ImiePary}},

Tydzień temu wypełniliście formularz na zaproszeniaonline.com - dziękuję, że wzięliście mnie pod uwagę! Chciałem sprawdzić, na jakim jesteście etapie.

NAJCZĘSTSZE POWODY DLACZEGO PARY ODKŁADAJĄ DECYZJĘ:

1. „Nie jesteśmy pewni jak to będzie wyglądać"
   → Mogę przygotować szybki mockup z Waszymi imionami za darmo. Odpiszcie - bez zobowiązań.

2. „699 zł to dużo"
   → Rozumiem. Możemy podzielić na 2 raty. Albo - jeśli macie znajomych którzy chcą podobną stronę - 2 strony 1099 zł zamiast 1398 zł.

3. „Mamy więcej pytań"
   → 15 minut rozmowy telefonicznej? Odpiszcie z numerem i kiedy zadzwonić.

Strona ślubna jest mała rzeczą, ale potrafi zaoszczędzić Wam dużo nerwów (RSVP w jednym miejscu, harmonogram pod ręką, gości można aktualizować w 5 minut). Jeśli to nie jest dla Was - zero pretensji, dajcie znać że odpuszczacie i przestaję pisać.

Nicolas
Zespół Zaproszenia Online · zaproszeniaonline.com
```

### HTML body

```html
<div class="hero" style="background:linear-gradient(135deg,#2C3E2D 0%,#243325 100%);color:#FAF6EF;padding:40px 36px 36px;text-align:center;">
  <p style="margin:0;font-size:0.74rem;letter-spacing:0.16em;text-transform:uppercase;color:rgba(250,246,239,0.85);font-weight:500;">
    <span style="display:inline-block;width:5px;height:5px;background:#C9A96E;border-radius:50%;margin-right:8px;vertical-align:2px;"></span>Tydzień temu
  </p>
  <h1 class="h1" style="margin:14px 0 6px;font-family:Georgia,serif;font-style:italic;font-weight:400;font-size:1.95rem;color:#FAF6EF;">
    Mam dla Was<br/>15 minut?
  </h1>
</div>
<div class="body" style="padding:36px 36px 32px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:0.98rem;line-height:1.65;color:#0A0A0A;">
  <p style="margin:0 0 18px;">Cześć {{ImiePary}}, dziękuję że wzięliście mnie pod uwagę. Chciałem sprawdzić, na jakim jesteście etapie.</p>
  <p style="margin:0 0 14px;font-size:0.78rem;letter-spacing:0.1em;text-transform:uppercase;color:#999;font-weight:600;">Najczęstsze powody odkładania decyzji</p>
  <div style="margin:0 0 14px;padding:16px 18px;background:#FAFAF8;border-left:3px solid #2C3E2D;border-radius:8px;">
    <p style="margin:0 0 4px;font-weight:600;color:#0A0A0A;">„Nie jesteśmy pewni jak to będzie wyglądać"</p>
    <p style="margin:0;font-size:0.94rem;color:#4A4A4A;">Mogę przygotować mockup z Waszymi imionami <strong>za darmo</strong>. Odpiszcie - bez zobowiązań.</p>
  </div>
  <div style="margin:0 0 14px;padding:16px 18px;background:#FAFAF8;border-left:3px solid #C9A96E;border-radius:8px;">
    <p style="margin:0 0 4px;font-weight:600;color:#0A0A0A;">„699 zł to dużo"</p>
    <p style="margin:0;font-size:0.94rem;color:#4A4A4A;">Możemy podzielić na 2 raty. Albo - z parą znajomych - <strong>2 strony 1099 zł</strong> zamiast 1398.</p>
  </div>
  <div style="margin:0 0 22px;padding:16px 18px;background:#FAFAF8;border-left:3px solid #2C3E2D;border-radius:8px;">
    <p style="margin:0 0 4px;font-weight:600;color:#0A0A0A;">„Mamy więcej pytań"</p>
    <p style="margin:0;font-size:0.94rem;color:#4A4A4A;">15 minut telefonu? Odpiszcie z numerem i kiedy zadzwonić.</p>
  </div>
  <p style="margin:18px 0 0;color:#4A4A4A;font-size:0.93rem;">Jeśli to nie jest dla Was - zero pretensji, dajcie znać że odpuszczacie i przestaję pisać.</p>
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-top:28px;">
    <tr><td style="padding-right:14px;"><div style="width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#2C3E2D,#1E2B1F);color:#FAF6EF;text-align:center;line-height:44px;font-family:Georgia,serif;font-style:italic;font-size:0.98rem;">N</div></td>
    <td><p style="margin:0;font-family:Georgia,serif;font-style:italic;font-size:1.15rem;color:#2C3E2D;">Nicolas</p><p style="margin:1px 0 0;font-size:0.82rem;color:#999;">Zespół Zaproszenia Online</p></td></tr>
  </table>
</div>
```

---

## 08 - Referral Thanks (znajomy pary użył kodu POLEC50)

**SUBJECT:** `{{ImiePary}}, dzięki za polecenie!`
**PREHEADER:** `{{ImiePolecanego}} właśnie zamówił stronę z Waszym kodem POLEC50. Macie kawę u nas.`

### Plain text

```
Cześć {{ImiePary}},

Wiadomość, na którą mam nadzieję uśmiechnęliście się: {{ImiePolecanego}} właśnie zamówił stronę ślubną z Waszym kodem POLEC50. Czyli macie 50 zł rabatu zastosowane - i prowizję od nas.

CO TO ZNACZY DLA WAS:

Najbliższe miesiące - po prostu wiedzieliście, że Wasza opinia faktycznie pomogła komuś. To dla mnie więcej niż złoty review w Google.

JEŚLI JEST KOLEJNA PARA W ZASIĘGU:

Możecie używać kodu dalej, jest ważny jeszcze {{IloscMiesiecy}} miesięcy. Nie ma limitu - im więcej znajomych, tym więcej polecam Wasze imię w mailach do nich (z Waszą zgodą oczywiście).

Trzymam Was w pamięci. Powodzenia z resztą przygotowań!

Nicolas
Zespół Zaproszenia Online · zaproszeniaonline.com
```

### HTML body

```html
<div class="hero" style="background:linear-gradient(135deg,#2C3E2D 0%,#243325 100%);color:#FAF6EF;padding:44px 36px 36px;text-align:center;">
  <p style="margin:0;font-size:0.74rem;letter-spacing:0.16em;text-transform:uppercase;color:rgba(250,246,239,0.85);font-weight:500;">
    <span style="display:inline-block;width:5px;height:5px;background:#C9A96E;border-radius:50%;margin-right:8px;vertical-align:2px;"></span>Polecenie zarejestrowane
  </p>
  <h1 class="h1" style="margin:14px 0 8px;font-family:Georgia,serif;font-style:italic;font-weight:400;font-size:2rem;color:#FAF6EF;">
    Macie kawę u nas
  </h1>
  <p style="margin:0;font-size:1rem;color:rgba(250,246,239,0.82);">{{ImiePolecanego}} właśnie użył Waszego kodu POLEC50.</p>
</div>
<div class="body" style="padding:36px 36px 32px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:0.98rem;line-height:1.65;color:#0A0A0A;">
  <p style="margin:0 0 18px;">Cześć {{ImiePary}},</p>
  <p style="margin:0 0 22px;">Wiadomość, na którą mam nadzieję uśmiechnęliście się: <strong>{{ImiePolecanego}}</strong> właśnie zamówił stronę ślubną z Waszym kodem POLEC50. Ma 50 zł rabatu, a Wasza opinia faktycznie pomogła komuś podjąć decyzję.</p>
  <div style="margin:24px 0;padding:20px 22px;background:rgba(201,169,110,0.08);border-left:3px solid #C9A96E;border-radius:8px;">
    <p style="margin:0 0 8px;font-size:0.74rem;letter-spacing:0.12em;text-transform:uppercase;color:#999;font-weight:600;">
      <span style="display:inline-block;width:5px;height:5px;background:#C9A96E;border-radius:50%;margin-right:8px;vertical-align:2px;"></span>Kod nadal aktywny
    </p>
    <p style="margin:0;font-size:0.96rem;color:#0A0A0A;">Możecie używać POLEC50 dalej (ważny {{IloscMiesiecy}} mies.). Bez limitu - im więcej polecicie, tym częściej polecam Wasze imię w mailach do nowych klientów (z Waszą zgodą).</p>
  </div>
  <p style="margin:24px 0 0;font-size:0.96rem;">Trzymam Was w pamięci. Powodzenia z resztą przygotowań.</p>
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-top:28px;">
    <tr><td style="padding-right:14px;"><div style="width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#2C3E2D,#1E2B1F);color:#FAF6EF;text-align:center;line-height:44px;font-family:Georgia,serif;font-style:italic;font-size:0.98rem;">N</div></td>
    <td><p style="margin:0;font-family:Georgia,serif;font-style:italic;font-size:1.15rem;color:#2C3E2D;">Nicolas</p><p style="margin:1px 0 0;font-size:0.82rem;color:#999;">Zespół Zaproszenia Online</p></td></tr>
  </table>
</div>
```

---

## 09 - Anniversary (rok po dacie ślubu)

**SUBJECT:** `{{ImiePary}}, rocznica - jeden mail i znikam`
**PREHEADER:** `Rok temu robiłem Wam stronę ślubną. Życzymy wszystkiego najlepszego.`

### Plain text

```
Cześć {{ImiePary}},

Rok temu - dokładnie tego dnia - przygotowywałem Waszą stronę ślubną. Nie odzywam się po to żeby coś sprzedać. Po prostu - z okazji pierwszej rocznicy - wszystkiego najlepszego.

JEDNA RZECZ NA ODCHODNE:

Strona po roku domyślnie wygasa. Jeśli chcielibyście:

A. Przedłużyć na kolejny rok (149 zł, ten sam link, mogę dodać sekcję „Po ślubie" z najlepszym zdjęciem z wesela)
B. Dostać kopię HTML do archiwizacji (za darmo, na życzenie)
C. Po prostu pozwolić jej zniknąć (zniknie sama)

Wystarczy odpisać literką A/B/C. Albo nic - wybiorę domyślnie B i wyślę archiwum.

Wszystkiego dobrego od (mam nadzieję) jeszcze niejednej rocznicy,

Nicolas
Zespół Zaproszenia Online · zaproszeniaonline.com
```

### HTML body

```html
<div class="hero" style="background:linear-gradient(135deg,#2C3E2D 0%,#243325 100%);color:#FAF6EF;padding:44px 36px 36px;text-align:center;">
  <p style="margin:0;font-size:0.74rem;letter-spacing:0.16em;text-transform:uppercase;color:rgba(250,246,239,0.85);font-weight:500;">
    <span style="display:inline-block;width:5px;height:5px;background:#C9A96E;border-radius:50%;margin-right:8px;vertical-align:2px;"></span>Pierwsza rocznica
  </p>
  <h1 class="h1" style="margin:14px 0 6px;font-family:Georgia,serif;font-style:italic;font-weight:400;font-size:2rem;color:#FAF6EF;">
    Wszystkiego najlepszego
  </h1>
  <p style="margin:0;font-size:0.96rem;color:rgba(250,246,239,0.78);">Rok od Waszego dnia. Trzymam kciuki za kolejne.</p>
</div>
<div class="body" style="padding:36px 36px 32px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:0.98rem;line-height:1.65;color:#0A0A0A;">
  <p style="margin:0 0 18px;">Cześć {{ImiePary}},</p>
  <p style="margin:0 0 22px;">Rok temu dokładnie tego dnia przygotowywałem Waszą stronę. Nie odzywam się żeby coś sprzedać - po prostu, z okazji rocznicy, wszystkiego najlepszego.</p>
  <p style="margin:0 0 14px;font-size:0.78rem;letter-spacing:0.1em;text-transform:uppercase;color:#999;font-weight:600;">Jedna rzecz na odchodne</p>
  <p style="margin:0 0 14px;font-size:0.96rem;">Strona domyślnie wygasa po roku. Jeśli chcielibyście:</p>
  <div style="margin:0 0 10px;padding:14px 16px;background:rgba(44,62,45,0.04);border-left:3px solid #2C3E2D;border-radius:6px;">
    <p style="margin:0;font-size:0.94rem;color:#0A0A0A;"><strong>A.</strong> Przedłużyć na kolejny rok (149 zł, sekcja „Po ślubie" z najlepszym zdjęciem)</p>
  </div>
  <div style="margin:0 0 10px;padding:14px 16px;background:rgba(201,169,110,0.06);border-left:3px solid #C9A96E;border-radius:6px;">
    <p style="margin:0;font-size:0.94rem;color:#0A0A0A;"><strong>B.</strong> Dostać kopię HTML do archiwizacji (za darmo)</p>
  </div>
  <div style="margin:0 0 22px;padding:14px 16px;background:#FAFAF8;border-left:3px solid #BBBBBB;border-radius:6px;">
    <p style="margin:0;font-size:0.94rem;color:#0A0A0A;"><strong>C.</strong> Pozwolić jej zniknąć (zniknie sama)</p>
  </div>
  <p style="margin:0 0 0;font-size:0.96rem;">Wystarczy odpisać literką. Albo nic - wybiorę B i wyślę archiwum.</p>
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-top:28px;">
    <tr><td style="padding-right:14px;"><div style="width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#2C3E2D,#1E2B1F);color:#FAF6EF;text-align:center;line-height:44px;font-family:Georgia,serif;font-style:italic;font-size:0.98rem;">N</div></td>
    <td><p style="margin:0;font-family:Georgia,serif;font-style:italic;font-size:1.15rem;color:#2C3E2D;">Nicolas</p><p style="margin:1px 0 0;font-size:0.82rem;color:#999;">Zespół Zaproszenia Online</p></td></tr>
  </table>
</div>
```

---

## 10 - Win-back (6 mies brak kontaktu - lead który nie kupił)

**SUBJECT:** `{{ImiePary}}, jeszcze przed ślubem czy już po?`
**PREHEADER:** `Pół roku temu rozmawialiśmy o stronie. Chciałem zapytać jak finalnie poszło.`

### Plain text

```
Cześć {{ImiePary}},

Pół roku temu rozmawialiśmy o stronie ślubnej. Nie kontynuowaliśmy tematu - i to OK, każdy ma swoje powody. Chciałem zapytać dwie rzeczy:

1. JAK FINALNIE POSZŁO?
   Wybraliście inną opcję? Zrobiliście sami? Bez strony w ogóle?

2. CZY JEST JESZCZE COŚ COBYM MÓGŁ ZROBIĆ?

   - Strona dla krewnych którzy się szykują → mam kod -50 zł dla Was do przekazania
   - Wasze własne (rocznica? chrzciny dziecka? domowa imprezka?) → mogę zrobić podobną stronę za pół ceny
   - Po prostu „odpiszcie i zakończmy temat" → też OK, usuwam Wasze dane z bazy

Bez naciskania, bez sprzedażówki. Po prostu - skoro rozmawialiśmy 6 mies temu - czuję się winien spytać.

Nicolas
Zespół Zaproszenia Online · zaproszeniaonline.com
```

### HTML body

```html
<div class="hero" style="background:linear-gradient(135deg,#2C3E2D 0%,#243325 100%);color:#FAF6EF;padding:40px 36px 32px;text-align:center;">
  <p style="margin:0;font-size:0.74rem;letter-spacing:0.16em;text-transform:uppercase;color:rgba(250,246,239,0.85);font-weight:500;">
    <span style="display:inline-block;width:5px;height:5px;background:#C9A96E;border-radius:50%;margin-right:8px;vertical-align:2px;"></span>Pół roku temu
  </p>
  <h1 class="h1" style="margin:12px 0 6px;font-family:Georgia,serif;font-style:italic;font-weight:400;font-size:1.95rem;color:#FAF6EF;">
    Jak finalnie poszło?
  </h1>
</div>
<div class="body" style="padding:32px 36px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:0.98rem;line-height:1.65;color:#0A0A0A;">
  <p style="margin:0 0 18px;">Cześć {{ImiePary}}, rozmawialiśmy pół roku temu o stronie ślubnej. Nie kontynuowaliśmy - i to OK. Chciałem tylko zapytać dwie rzeczy.</p>
  <p style="margin:0 0 14px;font-size:0.78rem;letter-spacing:0.1em;text-transform:uppercase;color:#999;font-weight:600;">Pytanie 1</p>
  <p style="margin:0 0 18px;font-size:0.96rem;">Jak finalnie poszło - inna opcja? Sami? Bez strony w ogóle?</p>
  <p style="margin:0 0 14px;font-size:0.78rem;letter-spacing:0.1em;text-transform:uppercase;color:#999;font-weight:600;">Pytanie 2 - czy jest jeszcze coś co mogę zrobić</p>
  <div style="margin:0 0 12px;padding:14px 16px;background:rgba(44,62,45,0.04);border-left:3px solid #2C3E2D;border-radius:6px;">
    <p style="margin:0;font-size:0.94rem;color:#0A0A0A;"><strong>Strona dla krewnych</strong> którzy się szykują → kod -50 zł do przekazania</p>
  </div>
  <div style="margin:0 0 12px;padding:14px 16px;background:rgba(201,169,110,0.06);border-left:3px solid #C9A96E;border-radius:6px;">
    <p style="margin:0;font-size:0.94rem;color:#0A0A0A;"><strong>Wasze własne</strong> (rocznica? domowa imprezka?) → podobna strona za pół ceny</p>
  </div>
  <div style="margin:0 0 22px;padding:14px 16px;background:#FAFAF8;border-left:3px solid #BBBBBB;border-radius:6px;">
    <p style="margin:0;font-size:0.94rem;color:#0A0A0A;"><strong>„Zakończmy temat"</strong> → odpiszcie, usuwam Wasze dane z bazy</p>
  </div>
  <p style="margin:18px 0 0;color:#4A4A4A;font-size:0.93rem;">Bez naciskania. Po prostu - skoro rozmawialiśmy - czuję się winien spytać.</p>
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-top:28px;">
    <tr><td style="padding-right:14px;"><div style="width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#2C3E2D,#1E2B1F);color:#FAF6EF;text-align:center;line-height:44px;font-family:Georgia,serif;font-style:italic;font-size:0.98rem;">N</div></td>
    <td><p style="margin:0;font-family:Georgia,serif;font-style:italic;font-size:1.15rem;color:#2C3E2D;">Nicolas</p><p style="margin:1px 0 0;font-size:0.82rem;color:#999;">Zespół Zaproszenia Online</p></td></tr>
  </table>
</div>
```

---

## 11 - Photo License Check (zdjęcia profesjonalne - prośba o licencję)

**SUBJECT:** `Wasze zdjęcia w zaproszeniu - jedno krótkie pytanie`
**PREHEADER:** `Zanim umieścimy zdjęcia od fotografa w Waszym zaproszeniu - potwierdzenie licencji (1 zdanie wystarczy).`

### Plain text

```
Cześć {{ImiePary}},

Dotarły zdjęcia do Waszego zaproszenia - świetne, profesjonalne ujęcia. Zanim umieścimy je w projekcie, jedno krótkie pytanie.

Część zdjęć wygląda na sesję od fotografa zawodowego (widzę {{Powod}}). To znaczy, że twórcą fotografii pozostaje fotograf, a Wy macie od niego licencję na konkretne pola eksploatacji.

Standardowo umowa z fotografem ślubnym obejmuje publikację online, ale dla porządku potrzebujemy potwierdzenia, że obejmuje ona również stronę internetową osoby trzeciej (naszą infrastrukturę). To wymóg z § 8c naszego Regulaminu i jednocześnie z art. 50 ustawy o prawie autorskim.

Wystarczy jedno z poniższych:
- jedno zdanie w odpowiedzi mailowej: „Tak, mam licencję od fotografa [imię/firma] na publikację tych zdjęć w sieci Internet, w tym na stronie zaproszenia"
- fragment umowy/regulaminu sesji z odpowiednią klauzulą (skan/zdjęcie),
- mail od fotografa potwierdzający zgodę.

Bez tego potwierdzenia - zgodnie z § 8c ust. 5 Regulaminu - nie możemy umieścić tych zdjęć w zaproszeniu. Reszta projektu idzie normalnie (2 rundy poprawek bez zmian), zdjęcie można dorzucić w trakcie poprawek po przesłaniu potwierdzenia.

Dzięki za zrozumienie - to dla bezpieczeństwa Waszego (i naszego), żeby fotograf nigdy nie miał podstaw do roszczeń.

{{ImiePodpis}}
Zaproszenia Online · kontakt@zaproszeniaonline.com
```

### HTML body

```html
<div class="hero" style="background:linear-gradient(135deg,#2C3E2D 0%,#243325 100%);color:#FAF6EF;padding:36px 36px 30px;text-align:center;">
  <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,sans-serif;font-size:0.74rem;letter-spacing:0.16em;text-transform:uppercase;color:#FAF6EF;opacity:0.85;font-weight:500;">
    <span style="display:inline-block;width:5px;height:5px;background:#C9A96E;border-radius:50%;margin-right:8px;vertical-align:2px;"></span>Licencja do zdjęć
  </p>
  <h1 style="margin:12px 0 4px;font-family:Georgia,'Times New Roman',serif;font-style:italic;font-weight:400;font-size:2rem;line-height:1.15;color:#FAF6EF;letter-spacing:-0.02em;">
    Jedno krótkie<br/>pytanie do Waszych zdjęć
  </h1>
</div>

<div class="body" style="padding:32px 36px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,sans-serif;color:#0A0A0A;font-size:1rem;line-height:1.65;">
  <p style="margin:0 0 14px;">Cześć <strong>{{ImiePary}}</strong>,</p>
  <p style="margin:0 0 14px;">Dotarły zdjęcia do Waszego zaproszenia - świetne, profesjonalne ujęcia. Zanim umieścimy je w projekcie, jedno krótkie pytanie.</p>
  <p style="margin:0 0 14px;">Część zdjęć wygląda na sesję od fotografa zawodowego (widzę <em>{{Powod}}</em>). To znaczy, że twórcą fotografii pozostaje fotograf, a Wy macie od niego licencję na konkretne pola eksploatacji.</p>
  <p style="margin:0 0 14px;">Standardowo umowa z fotografem ślubnym obejmuje publikację online, ale dla porządku potrzebujemy potwierdzenia, że obejmuje również stronę internetową osoby trzeciej (naszą infrastrukturę). To wymóg z <a href="https://zaproszeniaonline.com/terms#paragraf-8c" style="color:#2C3E2D;">§ 8c naszego Regulaminu</a> i z art. 50 ustawy o prawie autorskim.</p>

  <div style="margin:18px 0;padding:14px 18px;background:rgba(44,62,45,0.05);border-left:3px solid #2C3E2D;border-radius:6px;">
    <p style="margin:0 0 8px;font-size:0.92rem;color:#0A0A0A;"><strong>Wystarczy jedno z trzech:</strong></p>
    <ul style="margin:0;padding:0 0 0 18px;font-size:0.92rem;color:#4A4A4A;">
      <li style="margin:0 0 4px;">jedno zdanie w odpowiedzi: „Tak, mam licencję od fotografa {{NazwaFotografa}} na publikację tych zdjęć w sieci Internet",</li>
      <li style="margin:0 0 4px;">fragment umowy/regulaminu sesji ze stosowną klauzulą (skan / zdjęcie),</li>
      <li style="margin:0;">mail od fotografa potwierdzający zgodę (forward).</li>
    </ul>
  </div>

  <p style="margin:0 0 14px;font-size:0.92rem;color:#4A4A4A;">Bez potwierdzenia - zgodnie z § 8c ust. 5 - nie możemy umieścić tych konkretnych zdjęć. Reszta projektu idzie normalnie (2 rundy poprawek bez zmian), zdjęcia można dorzucić podczas poprawek po przesłaniu potwierdzenia.</p>
  <p style="margin:0;">Dzięki za zrozumienie - to dla bezpieczeństwa Waszego (i naszego), żeby fotograf nigdy nie miał podstaw do roszczeń.</p>
  <p style="margin:18px 0 0;">{{ImiePodpis}}<br/><span style="color:#999999;font-size:0.86rem;">Zaproszenia Online · kontakt@zaproszeniaonline.com</span></p>
</div>
```

**Placeholdery scenariusza 11:** `{{ImiePary}}`, `{{Powod}}` (np. „studio backdrop", „retuszowanie", „watermark «KowalskiPhoto»"), `{{NazwaFotografa}}` (jeśli znana), `{{ImiePodpis}}` (Nicolas / Dominika).

---

## 12 - Takedown Acknowledgement (potwierdzenie zgłoszenia naruszenia)

**SUBJECT:** `Potwierdzenie otrzymania zgłoszenia - {{NumerZgloszenia}}`
**PREHEADER:** `Otrzymaliśmy Państwa zgłoszenie. Rozpatrzymy w ciągu 72 godzin (DSA art. 16, UŚUDE art. 14).`

### Plain text

```
Szanowni Państwo,

Potwierdzamy otrzymanie zgłoszenia naruszenia z dnia {{DataZgloszenia}}, dotyczącego treści w zaproszeniu pod adresem {{LinkZaproszenia}}.

NUMER ZGŁOSZENIA: {{NumerZgloszenia}}
TYP ZGŁOSZENIA: {{TypZgloszenia}} (np. naruszenie praw autorskich / wizerunku / RODO)
DATA OTRZYMANIA: {{DataZgloszenia}}

Rozpatrzymy zgłoszenie w terminie maksymalnie 72 godzin od jego otrzymania, zgodnie z § 8d Regulaminu, art. 16 rozporządzenia (UE) 2022/2065 (Akt o usługach cyfrowych) oraz art. 14 ustawy z dnia 18 lipca 2002 r. o świadczeniu usług drogą elektroniczną.

W przypadku zgłoszeń oczywiście zasadnych (widoczny znak wodny fotografa, wyraźny dowód cudzego autorstwa) blokujemy treść w ciągu 24 godzin.

JEŚLI ZGŁOSZENIE NIE ZAWIERA WSZYSTKICH WYMAGANYCH ELEMENTÓW (§ 8d ust. 3 Regulaminu):
- imię, nazwisko/nazwa, dane kontaktowe zgłaszającego,
- dokładne wskazanie kwestionowanej treści (URL, opis),
- uzasadnienie zgłoszenia,
- w przypadku praw autorskich/pokrewnych - oświadczenie o byciu uprawnionym + ewentualne pełnomocnictwo,
- oświadczenie o prawdziwości pod rygorem odpowiedzialności karnej.

zwrócimy się o uzupełnienie i termin 72 godzin zacznie biec od kompletnego zgłoszenia.

O podjętej decyzji poinformujemy Państwa mailowo. W razie pytań - odpowiedź na ten mail.

Z poważaniem,
Zespół Zaproszenia Online
kontakt@zaproszeniaonline.com
```

### HTML body

```html
<div class="hero" style="background:linear-gradient(135deg,#2C3E2D 0%,#243325 100%);color:#FAF6EF;padding:32px 36px 28px;text-align:center;">
  <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,sans-serif;font-size:0.74rem;letter-spacing:0.16em;text-transform:uppercase;color:#FAF6EF;opacity:0.85;font-weight:500;">Notice &amp; Takedown</p>
  <h1 style="margin:10px 0 4px;font-family:Georgia,'Times New Roman',serif;font-style:italic;font-weight:400;font-size:1.7rem;line-height:1.15;color:#FAF6EF;letter-spacing:-0.02em;">
    Otrzymaliśmy Państwa zgłoszenie
  </h1>
  <p style="margin:8px 0 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,sans-serif;font-size:0.86rem;color:rgba(250,246,239,0.7);">
    Numer: <strong style="color:#C9A96E;">{{NumerZgloszenia}}</strong>
  </p>
</div>

<div class="body" style="padding:28px 36px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,sans-serif;color:#0A0A0A;font-size:0.95rem;line-height:1.6;">
  <p style="margin:0 0 14px;">Szanowni Państwo,</p>
  <p style="margin:0 0 14px;">Potwierdzamy otrzymanie zgłoszenia naruszenia dotyczącego treści w zaproszeniu pod adresem <code style="background:#F5F5F2;padding:2px 6px;border-radius:4px;font-size:0.88rem;">{{LinkZaproszenia}}</code>.</p>

  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border-collapse:collapse;font-size:0.9rem;margin:16px 0;background:#FAFAF8;border-radius:8px;">
    <tr><td style="padding:10px 14px;color:#999999;width:42%;font-size:0.78rem;letter-spacing:0.04em;text-transform:uppercase;">Typ zgłoszenia</td><td style="padding:10px 14px;color:#0A0A0A;">{{TypZgloszenia}}</td></tr>
    <tr><td style="padding:10px 14px;color:#999999;font-size:0.78rem;letter-spacing:0.04em;text-transform:uppercase;border-top:1px solid #EBEBEB;">Data otrzymania</td><td style="padding:10px 14px;color:#0A0A0A;border-top:1px solid #EBEBEB;">{{DataZgloszenia}}</td></tr>
    <tr><td style="padding:10px 14px;color:#999999;font-size:0.78rem;letter-spacing:0.04em;text-transform:uppercase;border-top:1px solid #EBEBEB;">Termin reakcji</td><td style="padding:10px 14px;color:#0A0A0A;border-top:1px solid #EBEBEB;"><strong>72 godziny</strong> (24 h w sprawach oczywistych)</td></tr>
  </table>

  <p style="margin:14px 0;font-size:0.88rem;color:#4A4A4A;">Procedura zgodna z § 8d Regulaminu, art. 16 rozporządzenia (UE) 2022/2065 (Akt o usługach cyfrowych) oraz art. 14 ustawy o świadczeniu usług drogą elektroniczną.</p>

  <p style="margin:14px 0;color:#0A0A0A;">O podjętej decyzji poinformujemy Państwa mailowo. W razie pytań - odpowiedź na ten mail.</p>
  <p style="margin:18px 0 0;font-size:0.88rem;color:#4A4A4A;">Z poważaniem,<br/>Zespół Zaproszenia Online</p>
</div>
```

**Placeholdery scenariusza 12:** `{{NumerZgloszenia}}` (np. „NT-2026-001"), `{{DataZgloszenia}}`, `{{LinkZaproszenia}}`, `{{TypZgloszenia}}` (np. „prawa autorskie do fotografii", „prawo do wizerunku", „RODO art. 17 - prawo do usunięcia").

---

## 13 - Takedown Decision (decyzja po rozpatrzeniu)

**SUBJECT:** `Decyzja w sprawie zgłoszenia {{NumerZgloszenia}}`
**PREHEADER:** `{{KrotkiOpisDecyzji}} - szczegóły w mailu.`

### Plain text - wariant „usunięto"

```
Szanowni Państwo,

Po rozpatrzeniu Państwa zgłoszenia nr {{NumerZgloszenia}} z dnia {{DataZgloszenia}} podjęliśmy następującą decyzję:

DECYZJA: USUNIĘCIE TREŚCI
ZGŁOSZONA TREŚĆ: {{OpisTresci}}
URL ZAPROSZENIA: {{LinkZaproszenia}}
DATA USUNIĘCIA: {{DataUsuniecia}}

Uzasadnienie:
{{Uzasadnienie}}

Klient (administrator zaproszenia) został poinformowany o usunięciu i jego podstawie. Treść została usunięta z aktywnych systemów hostingowych (Vercel CDN, Supabase Storage). Kopie zapasowe zostaną nadpisane w cyklu rotacyjnym w ciągu 7 dni.

Państwo i Klient mają prawo odwołać się od tej decyzji w terminie 14 dni od jej otrzymania, zgodnie z § 8d ust. 6 Regulaminu. Odwołanie należy kierować na ten sam adres mailowy z podaniem numeru zgłoszenia.

Decyzja po odwołaniu jest ostateczna w postępowaniu wewnętrznym; nie zamyka to drogi sądowej dla żadnej ze stron.

Z poważaniem,
Zespół Zaproszenia Online
kontakt@zaproszeniaonline.com
```

### Plain text - wariant „brak naruszenia / oddalenie"

```
Szanowni Państwo,

Po rozpatrzeniu Państwa zgłoszenia nr {{NumerZgloszenia}} z dnia {{DataZgloszenia}} podjęliśmy następującą decyzję:

DECYZJA: BRAK PODSTAW DO USUNIĘCIA
ZGŁOSZONA TREŚĆ: {{OpisTresci}}
URL ZAPROSZENIA: {{LinkZaproszenia}}

Uzasadnienie:
{{Uzasadnienie}}

(typowe uzasadnienia: Klient przedstawił dokument potwierdzający posiadanie licencji od fotografa / osoba uwieczniona na zdjęciu wyraziła zgodę pisemną na rozpowszechnianie wizerunku / zgłoszone treści mieszczą się w wyłączeniach z art. 81 ust. 2 ustawy o prawie autorskim).

Mają Państwo prawo odwołać się od tej decyzji w terminie 14 dni od jej otrzymania, zgodnie z § 8d ust. 6 Regulaminu. Odwołanie należy kierować na ten sam adres mailowy z podaniem numeru zgłoszenia.

Decyzja po odwołaniu jest ostateczna w postępowaniu wewnętrznym; nie zamyka to drogi sądowej dla żadnej ze stron - mogą się Państwo zwrócić również do sądu powszechnego.

Z poważaniem,
Zespół Zaproszenia Online
kontakt@zaproszeniaonline.com
```

### HTML body (jeden wariant z dwoma blokami warunkowymi)

```html
<div class="hero" style="background:linear-gradient(135deg,#2C3E2D 0%,#243325 100%);color:#FAF6EF;padding:32px 36px 28px;text-align:center;">
  <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,sans-serif;font-size:0.74rem;letter-spacing:0.16em;text-transform:uppercase;color:#FAF6EF;opacity:0.85;font-weight:500;">Notice &amp; Takedown · Decyzja</p>
  <h1 style="margin:10px 0 4px;font-family:Georgia,'Times New Roman',serif;font-style:italic;font-weight:400;font-size:1.7rem;line-height:1.2;color:#FAF6EF;letter-spacing:-0.02em;">
    Zgłoszenie {{NumerZgloszenia}}<br/>{{KrotkiOpisDecyzji}}
  </h1>
</div>

<div class="body" style="padding:28px 36px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,sans-serif;color:#0A0A0A;font-size:0.95rem;line-height:1.6;">
  <p style="margin:0 0 14px;">Szanowni Państwo,</p>
  <p style="margin:0 0 14px;">Po rozpatrzeniu zgłoszenia nr <strong>{{NumerZgloszenia}}</strong> z dnia {{DataZgloszenia}} podjęliśmy następującą decyzję:</p>

  <div style="margin:14px 0 18px;padding:14px 18px;background:rgba(44,62,45,0.05);border-left:3px solid #2C3E2D;border-radius:6px;">
    <p style="margin:0 0 6px;font-size:0.78rem;letter-spacing:0.04em;text-transform:uppercase;color:#2C3E2D;font-weight:500;">Decyzja</p>
    <p style="margin:0;font-size:1.05rem;color:#0A0A0A;"><strong>{{KrotkiOpisDecyzji}}</strong></p>
  </div>

  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border-collapse:collapse;font-size:0.9rem;margin:14px 0;">
    <tr><td style="padding:8px 0;color:#999999;width:35%;font-size:0.78rem;letter-spacing:0.04em;text-transform:uppercase;">Zgłoszona treść</td><td style="padding:8px 0;color:#0A0A0A;">{{OpisTresci}}</td></tr>
    <tr><td style="padding:8px 0;color:#999999;font-size:0.78rem;letter-spacing:0.04em;text-transform:uppercase;border-top:1px solid #EBEBEB;">URL zaproszenia</td><td style="padding:8px 0;color:#0A0A0A;border-top:1px solid #EBEBEB;"><code style="background:#F5F5F2;padding:2px 6px;border-radius:4px;font-size:0.84rem;">{{LinkZaproszenia}}</code></td></tr>
  </table>

  <p style="margin:14px 0 6px;font-size:0.78rem;letter-spacing:0.04em;text-transform:uppercase;color:#2C3E2D;font-weight:500;">Uzasadnienie</p>
  <p style="margin:0 0 14px;font-size:0.92rem;color:#4A4A4A;">{{Uzasadnienie}}</p>

  <p style="margin:18px 0 6px;font-size:0.86rem;color:#4A4A4A;"><strong>Odwołanie:</strong> 14 dni od otrzymania niniejszej decyzji, na ten sam adres mailowy z podaniem numeru zgłoszenia (§ 8d ust. 6 Regulaminu). Decyzja po odwołaniu jest ostateczna w postępowaniu wewnętrznym; nie zamyka to drogi sądowej.</p>

  <p style="margin:18px 0 0;font-size:0.88rem;color:#4A4A4A;">Z poważaniem,<br/>Zespół Zaproszenia Online</p>
</div>
```

**Placeholdery scenariusza 13:** `{{NumerZgloszenia}}`, `{{DataZgloszenia}}`, `{{KrotkiOpisDecyzji}}` (np. „Treść usunięta" / „Brak podstaw do usunięcia"), `{{OpisTresci}}`, `{{LinkZaproszenia}}`, `{{Uzasadnienie}}`, `{{DataUsuniecia}}` (jeśli usunięto).

---

## Bonus: 2 quick odpowiedzi (kopiuj-wklej do Gmaila)

### A. Klient odpowiedział „przepraszam, ślub był 2 tygodnie temu, zapomniałem"

> Cześć {{ImiePary}}, bez problemu - rozumiem, że po ślubie głowa jest zajęta wszystkim innym. Wracaj jak złapiesz oddech. Jeśli chcesz - prześlę link do formularza opinii jeszcze raz. Nicolas

### B. Klient zostawił negatywną opinię i nie wie czemu

> Cześć {{ImiePary}}, dzięki za szczerość. Zostawiłaś/eś 2★ - chcę zrozumieć co konkretnie poszło źle. Czy to było: 1) tempo realizacji, 2) wygląd strony, 3) komunikacja z naszej strony, 4) coś innego? Zaznacz tylko numer w odpowiedzi - jutro odpiszę z konkretną propozycją (rabat zwrotu / poprawki na koszt naszej strony / coś innego). Nicolas
