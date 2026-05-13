# Audio assets - licencje i proweniencja

Ten plik dokumentuje pochodzenie i licencję każdego pliku audio w katalogu `audio/`.
Zachowanie tej dokumentacji ma na celu udowodnienie legalności wykorzystania
utworów w razie ewentualnych roszczeń (twórcy, organizacji zbiorowego zarządzania).

---

## audio/demo.mp3

- **Tytuł:** Invitation Wedding
- **Wykonawca:** leberch
- **Źródło:** Pixabay (https://pixabay.com/music/375839/)
- **ID utworu:** 375839
- **Licencja:** Pixabay Content License
  - Tekst licencji: https://pixabay.com/service/license-summary/
  - Reasumując: irrevocable, worldwide, non-exclusive, royalty-free, dla użytku
    komercyjnego i niekomercyjnego, modyfikacja dozwolona, attribution opcjonalne.
- **Data pobrania oryginału:** 2026-05-12
- **Plik oryginalny:** `leberch-invitation-wedding-375839.mp3` (3.35 MB, oryginał
  pixabay - zachowany lokalnie poza repo dla zachowania dowodu proweniencji)
- **Modyfikacje wprowadzone przez Vidok Studio:**
  - Re-encoding: ffmpeg -> 64 kbps mono 44.1 kHz (-63% rozmiaru dla mobile LCP)
  - Fade in: 0.5s
  - Fade out: 1.0s (płynny loop)
  - Metadane ID3: encoder Lavf62.12.100 (ffmpeg)
- **Wykorzystanie:** muzyka w tle strony demo (demo.html), opcjonalnie również
  jako muzyka tła w Zaproszeniach Klientów (jako element biblioteki royalty-free
  oferowanej Klientom w ramach pakietu - zgodnie z § 8b Regulaminu zaproszeniaonline.com).

---

## Procedura dodawania nowych utworów do biblioteki

Każdy utwór dodawany do `audio/` MUSI mieć wpis w tym pliku zawierający:

1. Nazwę pliku
2. Tytuł i wykonawcę
3. Źródło (pełny URL z którego pobrano)
4. Treść licencji (link do tekstu licencji)
5. Datę pobrania
6. Lokalizację pliku oryginalnego (przed modyfikacjami)
7. Wprowadzone modyfikacje
8. Cel wykorzystania

W razie wątpliwości co do licencji - **NIE dodawać do biblioteki**.

## Dopuszczalne źródła muzyki

- **Pixabay** (https://pixabay.com/music/) - Pixabay Content License
- **YouTube Audio Library** (https://studio.youtube.com/) - YouTube Audio Library License
- **Free Music Archive** (https://freemusicarchive.org/) - CC0/CC-BY/CC-BY-SA
- **Incompetech** (https://incompetech.com/) - CC-BY (wymaga attribution)
- **Pixabay Stock Music** - jak wyżej
- **Bensound** (https://www.bensound.com/) - Free License (z attribution) lub Pro

## Niedopuszczalne źródła

- Spotify, Apple Music, Tidal, YouTube Music, Deezer (komercyjne katalogi z DRM)
- Utwory artystów reprezentowanych przez ZAIKS bez dokumentu licencji
- Pliki mp3 niewiadomego pochodzenia
- Sample/remixy bez weryfikacji praw do źródłowych sampli
