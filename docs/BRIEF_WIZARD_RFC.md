# RFC: Brief Wizard - klient self-service

**Status:** PARKED do ~10 klienta (2026-05-18)
**Powod parkingu:** workflow recznie + new-client.py jest wystarczajacy dla 0-10 klientow. Wizard ma ROI dopiero powyzej 5-10/tyg.
**Trigger do wdrozenia:** gdy Nicolas zacznie spedzac >2h/tydzien na manualne wypelnianie brief.json.

---

## Cel

Klient sam wypelnia formularz po platnosci Stripe -> automatyczne wygenerowanie zaproszenia w 60-90 sekund -> email z URL.

**Twoja praca na klienta:** 0 minut.

## Decyzje architektoniczne (z dyskusji 2026-05-18)

| # | Decyzja | Wybor | Powod |
|---|---------|-------|-------|
| 1 | Kiedy wizard? | PO platnosci Stripe | Konwersja wyzsza, no-show risk niski |
| 2 | Live preview? | TAK | Klient widzi wynik real-time, mniej poprawek |
| 3 | Storage zdjec | Supabase Storage | Juz uzywamy, RLS, tanio |
| 4 | UX format | Stepper 4 kroki | 30% wyzsza completion rate |
| 5 | Auto-save | TAK, co 30s | Klient moze wrocic, dokonczyc |
| 6 | Validation | Hybrid (hard required, soft nice-to-have) | UX |
| 7 | Paleta | Klient widzi 4 preview, klika | Wieksza pewnosc decyzji |

## Architektura

```
~/Projekty/zaproszeniaonline.com/
├── brief-wizard/
│   ├── index.html         (entry: /brief?token=abc123)
│   ├── vendor/            (self-host React + Supabase, JAK nicolas-test)
│   ├── styles.css         (4 palety swap-on-click)
│   ├── app.js             (esbuild, ~80 KB)
│   └── photos/            (sample defaults dla preview)
├── supabase/
│   └── functions/
│       └── generate-invitation/   (Edge Function: brief -> trigger GH Action)
│           └── index.ts
└── .github/
    └── workflows/
        └── new-client.yml         (GH Action: workflow_dispatch trigger)
```

## Flow

```
1. Klient platnosci Stripe (juz dziala)
2. Twoja Edge Function notify-payment-success generuje TOKEN UUID
3. Token w Supabase `briefs` table (paid=true, email, expires_at=now+30d)
4. Email do klienta: https://zaproszeniaonline.com/brief/<token>
5. Klient widzi WIZARD - 4 kroki:

   STEP 1/4 - Para + Data (1 min):
     - Imie panny mlodej / pana mlodego (lub single name)
     - Data + godzina slubu (date picker)
     - Cytat (textarea)
     - Termin RSVP (auto: data - 5 tyg)

   STEP 2/4 - Miejsce + Plan (2 min):
     - Ceremony venue (Google Places autocomplete)
     - Reception venue (Google Places autocomplete)
     - Timeline drag&drop (preset 5 entries do edycji)
     - Dress code (textarea + 5 color pickerow)

   STEP 3/4 - Zdjecia (1 min):
     - 1 zdjecie hero (drop-zone, square crop guide 1:1)
     - 4 zdjecia side (drop-zone, portrait 3:4 / 4:5 crop guide)
     - Upload bezposrednio do Supabase Storage

   STEP 4/4 - Paleta + Prezenty (1 min):
     - Live preview w 4 paletach (forest/navy/bordo/terracotta)
     - Klika palete = preview zmienia kolor real-time
     - Gifts text + IBAN
     - Music URL (optional)

6. Submit -> Edge Function `generate-invitation`:
   - Pobiera brief z DB + zdjecia z Storage
   - POST na GitHub API: workflow_dispatch z brief.json + slug
   - GitHub Action runs new-client.py -> git push -> Vercel deploy (30s)
   - Edge Function POST na OVH API: A record dla slug (jezeli wildcard nie wystarcza)
   - Email klientowi: "Twoje zaproszenie gotowe: https://anna-michal.zaproszeniaonline.com/"

7. KLIENT MA LINK W 60-90s OD KLIKNIECIA SUBMIT
   Nicolas: 0 minut pracy.
```

## Implementation roadmap (gdy unkick: ~6-10h)

### Phase 1 - Skelet (2h)
- [ ] `brief-wizard/index.html` + scripts skeleton
- [ ] Stepper component (4 steps, progress bar)
- [ ] Auto-save localStorage + Supabase
- [ ] Validation framework (hybrid)

### Phase 2 - Live preview (2h)
- [ ] iframe `<iframe src="/preview?data=base64(brief)">`
- [ ] Debounce 500ms na re-render
- [ ] Mobile responsive (tabs Form/Preview)

### Phase 3 - Backend integration (2h)
- [ ] Supabase Storage uploads (zdjecia)
- [ ] `briefs` table + RLS policies
- [ ] Edge Function `generate-invitation`
- [ ] GitHub workflow_dispatch trigger

### Phase 4 - DNS automation (1h)
- [ ] OVH API call dla A record (lub wildcard skip)
- [ ] Wait + smoke test
- [ ] Email klienta z URL

### Phase 5 - Edge cases (1-2h)
- [ ] Token expired -> nowy link z payment
- [ ] Email niewyslany -> retry queue
- [ ] Brief incompletny -> klient wraca do wizard
- [ ] Zdjecia broken -> reupload prompt

## Kod skeleton

```js
// brief-wizard/app.js
const TOKEN = new URLSearchParams(location.search).get('token');
const sb = supabase.createClient(URL, KEY);

const [brief, setBrief] = useState({ step: 1, /* defaults */ });

// Auto-save co 30s
useEffect(() => {
  const interval = setInterval(() => {
    localStorage.setItem(`brief-${TOKEN}`, JSON.stringify(brief));
    sb.from('briefs').update({ data: brief, updated_at: new Date() }).eq('token', TOKEN);
  }, 30000);
  return () => clearInterval(interval);
}, [brief]);

// Submit -> Edge Function
const submit = async () => {
  await sb.functions.invoke('generate-invitation', { body: { token: TOKEN } });
  // Klient widzi spinner + "Twoje zaproszenie generuje sie..."
};
```

## Bottleneck'i wizarda

1. **Google Places API** - $0.005/autocomplete request, $5/1000 klientow. Negligible.
2. **Supabase Storage** - 1 GB free, $0.021/GB potem. 100 klientow x 1.8 MB = 180 MB/dziennie. Po roku 65 GB = $1.40/m. OK.
3. **GitHub Actions** - 2000 min/mc free. 1 client = 1 min. 100/dziennie = 3000 min = OK na Pro ($4/mc).
4. **Vercel builds** - 100 builds/dzien hobby, 6000/m Pro. Pro OK dla 100/dzien.
5. **OVH API rate limit** - undocumented ale "fair use". 100 requests/dzien znika.

## TL;DR

Wizard to **OPTIMIZATION** - nie potrzebny do startu. Recznie + new-client.py wystarcza do ~10 klientow/tydz. Wykonaj gdy:
- Spendsz >2h/tydz na manualne briefe
- Klient bezposrednio prosi "moge sam wypelnic?"
- Albo masz wolny weekend na 6-10h projekt
