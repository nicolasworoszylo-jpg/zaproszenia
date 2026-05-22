# 📬 INBOX — wiadomości między Dominiką a Nicolasem

> **Po co ten plik:** Dominika nie ma fizycznego dostępu do MacBooka Nicolasa, więc nie wskoczy „na chwilę do Claude" sama. Ten plik to pseudo-skrzynka: przez Claude Code na swoim urządzeniu (lub przez GitHub web) pisze wiadomość, commituje, pushuje. Nicolas widzi w `git pull` lub w GitHub notifications.

## Jak Dominika wysyła wiadomość (3 sposoby)

### Sposób A — Claude Code na laptopie Dominiki (najprościej)
W jej Claude Code (na jej PC/Mac/iPad) wpisuje:
```
/inbox "Treść wiadomości - może być dowolnie długa, multiline, z linkami, listami"
```
Slash command zrobi za nią cały flow: edit pliku → commit → push do `main` na GitHub. Nicolas dostaje email od GitHub + widzi przy `git pull`.

### Sposób B — GitHub web edit (jeśli Claude nie pod ręką)
1. Otwórz https://github.com/nicolasworoszylo-jpg/zaproszenia/edit/main/INBOX.md
2. Dopisz wpis w sekcji **„Wiadomości aktywne"** wg formatu poniżej
3. Klik „Commit changes" (zostaw `main` jako target branch)

### Sposób C — Telefon / cokolwiek z mailem
Wyślij maila na `kontakt@zaproszeniaonline.com` z tematem `[DLA NICOLASA] <krótki opis>`. Nicolas i tak czyta tę skrzynkę, ale nie ma jak filtrować, więc to fallback gdy A i B padną.

## Format wpisu (skopiuj i wklej)

```markdown
### 2026-MM-DD HH:MM — Dominika → Nicolas
**Pilność:** 🔴 pilne / 🟡 średnie / 🟢 spokojnie
**Temat:** krótko o co chodzi

Treść wiadomości tutaj. Dowolnie długa, z linkami, listami, kodem.

**Co Nicolas ma zrobić:** konkretne action (jeśli jest) - np. "odpisz mi" / "kup X" / "zatwierdź to przed czwartkiem" / "FYI tylko"
```

## Jak Nicolas reaguje

1. Czyta wiadomość (dostaje notyfikację od GitHub na maila + widzi w `git pull`)
2. Jeśli odpowiada — edytuje TEN sam wpis dodając pod spodem:
   ```
   **Odpowiedź Nicolasa (2026-MM-DD HH:MM):** Treść.
   ```
3. Po załatwieniu sprawy — przenosi wpis do sekcji **„Wiadomości załatwione"** poniżej

---

## ✉️ Wiadomości aktywne

*(jeszcze brak — Dominika dopisuje tutaj nowe)*

---

## ✅ Wiadomości załatwione (archiwum)

### 2026-05-22 — Bootstrap INBOX
**Pilność:** 🟢 spokojnie  
**Temat:** Założenie systemu komunikacji

Nicolas i Claude Code utworzyli ten plik 22 maja 2026 jako odpowiedź na realne ograniczenie: Dominika i Nicolas pracują na różnych maszynach, MacBook M4 Pro jest tylko u Nicolasa. GitHub jako wspólny punkt. Każdy ma dostęp.

**Odpowiedź Nicolasa (2026-05-22):** OK gotowe. Dominika może już pisać. Slash command `/inbox` dostępny w Claude Code obojga.
