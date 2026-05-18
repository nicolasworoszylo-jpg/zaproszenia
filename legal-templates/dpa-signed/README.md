# Dowody akceptacji DPA (art. 28 RODO)

> Dwa rodzaje dowodów dla każdego procesora:
> 1. **Screenshot** (PNG) z panelu administracyjnego — gdy procesor wymaga ręcznej akceptacji
> 2. **PDF** pełnej treści DPA — gdy auto-binding przez umowę ramową (Stripe Services Agreement, Vercel ToS itp.) lub jako dokumentacja referencyjna obok screenshota

## Stan na 2026-05-13

| Procesor | Status | Plik | Mechanizm |
|---|---|---|---|
| **Stripe** | ✅ archived | `stripe-dpa-2025-11-18.pdf` | auto-binding przez Stripe Services Agreement, brak osobnego przycisku |
| **Supabase** | ⏳ TODO | (oczekiwany) `supabase-dpa-YYYY-MM-DD.png` | Dashboard → Settings → Compliance → Sign DPA |
| **Vercel** | 🟠 **DECYZJA NICOLASA** | brak | **Hobby plan NIE jest pokryty** przez Vercel DPA (sekcja 1: tylko Pro/Enterprise). Patrz `/DECISION_VERCEL_DPA.md` |
| **Resend** | ✅ archived | `resend-dpa-2025-12-31.pdf` | auto-binding przez Terms of Service (sekcja 12 DPA), wersja executed pobrana z dashboardu 2026-05-13. Bonus: Resend ma certyfikację EU-U.S. DPF (sekcja 11) — dodatkowa podstawa transferu obok SCC |

## Gotowe prompty Claude in Chrome

Zobacz `CLAUDE_IN_CHROME_PROMPTS.md` w korzeniu repo. **Uwaga 2026-05-13:** sekcja Vercel w tym promptcie była nieaktualna (zakładała przycisk "Accept DPA" który nie istnieje) — została zaktualizowana po manualnej weryfikacji.

## Po co to trzymamy

Przy ewentualnej kontroli PUODO — dowód że spełniliśmy art. 28 RODO ust. 3
(umowa powierzenia w formie pisemnej, w tym elektronicznej).

Bez tych dowodów: każde powierzenie danych Supabase/Vercel/Stripe/Resend = nielegalne.
