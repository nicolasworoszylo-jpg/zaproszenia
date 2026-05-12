# System integracji muzyki demo - instrukcja

**Plik:** `audio/demo.mp3` (1.25 MB, 96 kbps mono, 110 s)
**Skrypt:** `scripts/add-music.sh`
**Konfiguracja:** `wedding-enhanced.jsx` linia 47-48 (bgMusicUrl + bgMusicTitle)

---

## Kiedy zmieniasz utwór

Aby podmienic muzyke w demo na inny utwor:

```bash
cd /tmp/zaproszenia
bash scripts/add-music.sh ~/Downloads/nowy-utwor.mp3 "Tytul utworu"
```

Skrypt sam:
1. **Skompresuje** wejscie do 96 kbps mono + fade in 0.5s / fade out 1s (gladki loop)
2. **Zapisze** jako `audio/demo.mp3` (nadpisuje stary)
3. **Zaktualizuje** `wedding-enhanced.jsx` (bgMusicUrl + bgMusicTitle)
4. **Zrebuilduje** `vendor/demo-compiled.js` przez esbuild
5. **Pokaze** sugerowany commit message

Potem:
```bash
git add audio/ wedding-enhanced.jsx vendor/demo-compiled.js
git commit -m "feat(demo): muzyka - <Tytul>"
git push origin main
```

Vercel deploy ~30-60 s.

---

## Argumenty skryptu

```bash
bash scripts/add-music.sh <input> [tytul] [--flagi]
```

| Argument | Default | Opis |
|----------|---------|------|
| `<input>` | (wymagany) | Plik .mp3 / .m4a / .wav / .ogg / .flac |
| `[tytul]` | "Nasza piosenka" | Tekst wyswietlany przy hover na audio player |
| `--target=demo` | demo | demo \| magda \| both (gdzie aplikujemy) |
| `--bitrate=96k` | 96k | Bitrate output (64k = ~800 KB, 96k = ~1.2 MB, 128k = ~1.6 MB) |
| `--stereo` | mono | Wymus stereo (bg music = mono OK, oszczednosc 50%) |

### Przyklady

```bash
# Minimalny - utwor + default tytul
bash scripts/add-music.sh ~/Downloads/song.mp3

# Z tytulem
bash scripts/add-music.sh ~/Downloads/song.mp3 "Akustyczna gitara"

# Dla magda-tomek (drugi przyklad)
bash scripts/add-music.sh ~/Downloads/song.mp3 "Mazury 2026" --target=magda

# Dla obu demo + magda
bash scripts/add-music.sh ~/Downloads/song.mp3 "Default" --target=both

# Wyzsza jakosc dla finalnego klienta
bash scripts/add-music.sh ~/Downloads/song.mp3 "Anna i Michal" --bitrate=128k --stereo
```

---

## Skad brac muzyke (free / royalty-free)

Wszystkie te zrodla = mozna wykorzystac komercyjnie bez attribution:

| Zrodlo | URL | Licencja |
|--------|-----|----------|
| **Pixabay Music** | https://pixabay.com/music | Pixabay License (free commercial) |
| **YouTube Audio Library** | https://studio.youtube.com -> Audio Library | CC0 lub YouTube Royalty-Free |
| **Free Music Archive** | https://freemusicarchive.org (filter CC0) | Creative Commons |
| **Bensound** | https://www.bensound.com | Free (with attribution lub Pro $19/mc bez) |
| **Musopen** | https://musopen.org/music | Public Domain (klasyka) |
| **Incompetech** (Kevin MacLeod) | https://incompetech.com/music/royalty-free | CC-BY (wymaga attribution) |

### Co wybierac dla wesela

- **Cieple instrumentale**: gitara akustyczna, fortepian, light strings
- **Tempo**: 60-80 BPM (slow, romantic)
- **Dlugosc**: 60-180 s (loop bedzie powtorzony, nie ma znaczenia)
- **Bez wokalu**: bg music musi byc subtelna, glos rozprasza
- **Bez ostrych przejsc**: skoki dynamiczne irytuja w loop

### Wybor dla Nicolasa (sugestie z Pixabay Music)

Pierwsze 3 z high quality + matching mood:
- Pasujace tagi: `wedding`, `romantic`, `acoustic guitar`, `piano`, `instrumental`
- Sprawdz ratings + length 1:30 - 3:00

---

## Co robi audio player w demo

Komponent `Music()` w `wedding-enhanced.jsx`:
- **Pozycja**: floating button bottom-right (fixed, 48x48px)
- **Stan**: domyslnie OFF (autoplay zablokowany na iOS Safari)
- **Toggle**: klik = play/pause z volume 0.3 (cichy bg)
- **Loop**: `<audio loop>` (atrybut HTML5, infinite)
- **Hover tooltip**: pokazuje bgMusicTitle przy hover (desktop)
- **Touch friendly**: na mobile dziala click, brak sticky-hover dzieki @media (hover:hover)

### Jak ukryc audio player

```jsx
bgMusicUrl: null,  // Music() komponent return null -> player niewidoczny
```

---

## Limity / Best practices

### Rozmiar
- **Target**: 1-2 MB (96 kbps mono, 1-3 min)
- **Maks**: 3 MB (przy 128 kbps stereo i 3 min)
- **NIE wgrywaj**: oryginalow 320 kbps stereo - to 7+ MB, zabija mobile LCP

### Format
- **Preferred**: MP3 (najszerszy support, iOS Safari + Chrome + Firefox)
- **Akceptowane**: M4A (AAC), OGG (Vorbis), WAV (lossless ale duzy)
- **NIE**: FLAC, ALAC (lossless = 5-10x wiekszy, nie warto dla bg)

### Praw autorskich
- **Sprawdz licencje** przed commit (uniknij DMCA)
- **Pixabay/YouTube Audio Library** - bezpieczne (free commercial)
- **Spotify/Apple Music** - ZAKAZ (copyright)
- **Bensound free** - wymaga attribution gdzies (link w stopce np.)

---

## Troubleshooting

### "ffmpeg: command not found"
```bash
brew install ffmpeg
```

### "esbuild failed"
```bash
brew install node && npm i -g npx
```

### Muzyka nie gra na iOS Safari
- To nie blad. iOS blokuje **autoplay** audio z dzwiekiem. User musi kliknac
  audio button (krazek bottom-right) zeby zaczac.
- Po pierwszym kliku Safari pamieta uprawnienie dla tej domeny w ramach sesji.

### Plik za duzy mimo encode
- Sprawdz: `ffprobe audio/demo.mp3` - powinno byc bitrate=96000, channels=1
- Jak nie - re-encode: `bash scripts/add-music.sh <plik> --bitrate=64k`
