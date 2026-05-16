#!/usr/bin/env bash
# scripts/review-ops/publish-review.sh
# Po przeczytaniu nowej opinii w mailu - moderacja i publikacja w sekcji "Co mówią pary".
#
# Użycie:
#   ./publish-review.sh                      # POKAŻ pending reviews (consent=true, is_published=false)
#   ./publish-review.sh --id <review_id>     # PUBLIKUJ tę opinię
#   ./publish-review.sh --reject <review_id> # ZAREJESTRUJ jako nie do publikacji (moderation_notes)

set -uo pipefail
SUPABASE_PROJECT="kuyniyyieejvambyjnxy"
SECRET_FILE="${HOME}/.claude/secrets/zaproszenia-service-role.txt"

if [[ -z "${SUPABASE_SERVICE_ROLE_KEY:-}" ]]; then
  [[ -r "$SECRET_FILE" ]] && SUPABASE_SERVICE_ROLE_KEY=$(tr -d '[:space:]' < "$SECRET_FILE") || {
    echo "BŁĄD: brak SUPABASE_SERVICE_ROLE_KEY (env albo $SECRET_FILE)" >&2; exit 1; }
fi

REST="https://${SUPABASE_PROJECT}.supabase.co/rest/v1"
H1="apikey: ${SUPABASE_SERVICE_ROLE_KEY}"
H2="Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}"

case "${1:-}" in
  --id)
    REVIEW_ID="$2"
    echo "Publikuję opinię ${REVIEW_ID}..."
    curl -sS -X PATCH "${REST}/reviews?id=eq.${REVIEW_ID}" \
      -H "${H1}" -H "${H2}" \
      -H "Content-Type: application/json" \
      -H "Prefer: return=representation" \
      -d "{\"is_published\":true,\"moderated_at\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" \
      | (command -v python3 >/dev/null && python3 -m json.tool || cat)
    ;;
  --reject)
    REVIEW_ID="$2"
    REASON="${3:-bez powodu}"
    echo "Odrzucam publikację ${REVIEW_ID} (powód: ${REASON})..."
    curl -sS -X PATCH "${REST}/reviews?id=eq.${REVIEW_ID}" \
      -H "${H1}" -H "${H2}" \
      -H "Content-Type: application/json" \
      -H "Prefer: return=representation" \
      -d "{\"is_published\":false,\"moderated_at\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"moderation_notes\":\"$(echo "$REASON" | sed 's/"/\\"/g')\"}" \
      | (command -v python3 >/dev/null && python3 -m json.tool || cat)
    ;;
  ""|--help|-h)
    echo "Pending opinie (czeka na moderację - klient zgodził się na publikację):"
    echo ""
    curl -sS "${REST}/reviews?select=id,created_at,rating,comment,best_part,display_name,consent_publish,is_published&consent_publish=eq.true&is_published=eq.false&order=created_at.desc" \
      -H "${H1}" -H "${H2}" \
      | (command -v python3 >/dev/null && python3 -m json.tool || cat)
    echo ""
    echo "Publikuj: $0 --id <review_id>"
    echo "Odrzuć:   $0 --reject <review_id> \"powód\""
    ;;
  *)
    echo "Nieznany arg: $1" >&2; exit 2 ;;
esac
