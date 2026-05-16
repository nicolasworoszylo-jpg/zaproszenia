#!/usr/bin/env bash
# scripts/review-ops/send-review.sh
# Manualne wysłanie prośby o opinię - "na mój znak".
#
# Użycie:
#   ./send-review.sh <email@klienta.pl>           # po e-mailu (bierze ostatni lead)
#   ./send-review.sh --id <lead_uuid>             # po lead_id
#   ./send-review.sh --batch [--limit 50]         # masowo z v_review_candidates
#   ./send-review.sh --candidates                 # tylko POKAŻ listę kandydatów (dry-run)
#   ./send-review.sh --force --id <uuid>          # ponowne wysłanie (omija review_requested_at)
#
# Wymaga: SUPABASE_SERVICE_ROLE_KEY w env albo w ~/.claude/secrets/zaproszenia-service-role.txt
#
# Output: pretty-printed JSON z statusem (processed/sent/skipped/errors).

set -uo pipefail

SUPABASE_PROJECT="kuyniyyieejvambyjnxy"
FN_URL="https://${SUPABASE_PROJECT}.supabase.co/functions/v1/send-review-request"
SECRET_FILE="${HOME}/.claude/secrets/zaproszenia-service-role.txt"

# ─── Service role key ──────────────────────────────────────────────────────
if [[ -z "${SUPABASE_SERVICE_ROLE_KEY:-}" ]]; then
  if [[ -r "$SECRET_FILE" ]]; then
    SUPABASE_SERVICE_ROLE_KEY=$(tr -d '[:space:]' < "$SECRET_FILE")
  else
    echo "BŁĄD: ustaw SUPABASE_SERVICE_ROLE_KEY albo zapisz do $SECRET_FILE (chmod 600)." >&2
    echo "" >&2
    echo "Pobierz klucz: https://supabase.com/dashboard/project/${SUPABASE_PROJECT}/settings/api" >&2
    echo "→ 'service_role' (secret) → zapisz: echo 'eyJ...' > $SECRET_FILE && chmod 600 $SECRET_FILE" >&2
    exit 1
  fi
fi

# ─── Parse args ────────────────────────────────────────────────────────────
MODE=""
PAYLOAD=""
LIMIT=50
FORCE="false"
DRY_RUN="false"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --id)         MODE="id"; LEAD_ID="$2"; shift 2 ;;
    --batch)      MODE="batch"; shift ;;
    --candidates) MODE="candidates"; DRY_RUN="true"; shift ;;
    --limit)      LIMIT="$2"; shift 2 ;;
    --force)      FORCE="true"; shift ;;
    --help|-h)
      sed -n '2,15p' "$0"
      exit 0
      ;;
    *)
      if [[ -z "$MODE" && "$1" == *"@"* ]]; then
        MODE="email"; LEAD_EMAIL="$1"; shift
      else
        echo "Nieznany arg: $1" >&2; exit 2
      fi
      ;;
  esac
done

if [[ -z "$MODE" ]]; then
  echo "Użycie: $0 <email> | --id <uuid> | --batch | --candidates [--limit N] [--force]" >&2
  exit 2
fi

# ─── Candidates dry-run mode (read-only query) ─────────────────────────────
if [[ "$MODE" == "candidates" ]]; then
  echo "Kandydaci do prośby o opinię (paid + 7d po wydarzeniu / 14d po paid):"
  echo ""
  curl -sS -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
       -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
       "https://${SUPABASE_PROJECT}.supabase.co/rest/v1/v_review_candidates?select=name,email,event_date,paid_at,days_since_paid&limit=${LIMIT}" \
    | python3 -m json.tool 2>/dev/null \
    || curl -sS -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
            -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
            "https://${SUPABASE_PROJECT}.supabase.co/rest/v1/v_review_candidates?select=name,email,event_date,paid_at,days_since_paid&limit=${LIMIT}"
  exit 0
fi

# ─── Build POST payload ────────────────────────────────────────────────────
case "$MODE" in
  id)    PAYLOAD=$(printf '{"lead_id":"%s","force":%s}' "$LEAD_ID" "$FORCE") ;;
  email) PAYLOAD=$(printf '{"lead_email":"%s","force":%s}' "$LEAD_EMAIL" "$FORCE") ;;
  batch) PAYLOAD=$(printf '{"batch":true,"limit":%d,"force":%s}' "$LIMIT" "$FORCE") ;;
esac

echo "POST ${FN_URL}"
echo "payload: ${PAYLOAD}"
echo ""

# ─── Call Edge Function ────────────────────────────────────────────────────
RESPONSE=$(curl -sS -X POST "${FN_URL}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d "${PAYLOAD}")

# Pretty-print jeśli python3 dostępny, inaczej raw
if command -v python3 >/dev/null 2>&1; then
  echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
else
  echo "$RESPONSE"
fi

# Exit code z payload (jeśli errors w response → 1)
echo "$RESPONSE" | grep -qE '"errors":\s*\[' && exit 1
exit 0
