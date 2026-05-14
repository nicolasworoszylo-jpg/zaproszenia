# Wewnętrzne template'y one-pagerów

Ten katalog NIE jest publicznie serwowany (patrz `.vercelignore`). Trzymamy tu **edytowalne wersje** one-pagerów, które kiedyś wisiały publicznie pod `/onepager/...` zanim wycięliśmy z nich UI edycji.

## Co tu jest

| Plik | Co to |
|------|-------|
| `galeria-editable.html` | Galeria z headerem "Cztery palety...", info-blockiem o URL params i linkiem do GitHub workflow (stara wersja) |
| `forest-editable.html` | One-pager Leśna zieleń z przyciskiem "Edytuj dane" + modal + JS `applyConfig()` |
| `navy-rose-editable.html` | j.w. paleta Granat + róż |
| `bordo-editable.html` | j.w. paleta Bordo + kość |
| `terracotta-editable.html` | j.w. paleta Rdzawa terracotta |

## Po co je trzymać

Workflow generowania one-pagera per-klient (jak `magda-tomek.html`):

### Wariant A — link z URL params (nadal działa publicznie)

Publiczne palety (`/onepager/forest|navy-rose|bordo|terracotta`) zachowały JS czytający URL params. Generujesz dedykowany link:

```
/onepager/terracotta?names=Magda+i+Tomek&date=18+lipca+2026&venue=Pa%C5%82ac+Ma%C5%82a+Wie%C5%9B&url=https%3A%2F%2Fzaproszeniaonline.com%2Fmagda-tomek
```

Tak działa np. `magda-tomek.html` (floating button "Karta do druku").

### Wariant B — statyczna kopia per-klient

Skopiuj wybrany `<paleta>-editable.html` do np. `onepager/<klient-slug>.html`, otwórz w przeglądarce, kliknij "Edytuj dane", wpisz dane, "Zastosuj" → URL z params. Skopiuj wynikowy HTML (z domyślnymi wartościami w `init()` zastąpionymi przez wartości klienta) i wgraj jako statyczny plik. Klient dostaje czysty link bez query params.

### Wariant C — ręczna edycja `init()`

W skopiowanym pliku zmień wartości w `function init()`:

```js
const names = p.get('names') || 'Anna i Michał';     // <- tutaj wpisz domyślne dla klienta
const date = p.get('date') || '20 czerwca 2026';
const venue = p.get('venue') || 'Wrocław';
const url = p.get('url') || 'https://zaproszeniaonline.com';
```

Plus zaktualizuj statyczny HTML (linie ~78-95: `op-mono`, `op-names`, `op-date`, `op-venue`).

## Co zostało wycięte z wersji publicznych (2026-05-14)

W publicznych paletach (`onepager/forest.html`, `navy-rose.html`, `bordo.html`, `terracotta.html`):

- przycisk `<button class="secondary">Edytuj dane</button>` z toolbara
- `<div class="info-banner">` z opisem URL params
- `<dialog id="config-modal">` z formularzem i polami `cfg-*`
- funkcja `applyConfig()` w `<script>`
- linie wypełniające pola `cfg-*` w `init()`

Zachowane: `init()`, `renderNames()`, `renderQR()`, `escapeHtml()`, `computeRsvpDate()` — bo URL params nadal są używane (np. przez `magda-tomek.html`).

W `onepager/galeria.html`:

- header `.head` (eyebrow "Zaproszenie ślubne · karta A4 do druku" + h1 "Cztery palety jednego one-pagera" + lead)
- `.info` block z opisem URL params i przyciskiem "Edytuj dane"
- link "Workflow (GitHub)" w stopce `.exits`
- powiązany CSS dla `.head`, `.eyebrow`, `h1`, `.lead`, `.info`

Zostały: 4 karty palet + nawigacja back ("Wróć do demo" / "Strona główna").
