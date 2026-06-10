#!/usr/bin/env bash
# Supabase Keepalive - LOCAL backup (LaunchAgent na macOS Nicolasa).
# Czyta klucz z ~/.claude/secrets/supabase-anon.txt (NIE z repo - bezpieczna praktyka).

SUPABASE_URL="https://kuyniyyieejvambyjnxy.supabase.co"
SECRET_FILE="$HOME/.claude/secrets/supabase-anon.txt"
LOG="$HOME/.claude/logs/supabase-keepalive.log"
mkdir -p "$(dirname "$LOG")"

ts() { date -u +%Y-%m-%dT%H:%M:%SZ; }

if [ ! -f "$SECRET_FILE" ]; then
  echo "[$(ts)] ERR: brak $SECRET_FILE - zapisz tam ANON key Supabase (chmod 600)" >> "$LOG"
  exit 1
fi
ANON_KEY=$(cat "$SECRET_FILE" | tr -d '\n\r ')

{
  echo "═══ $(ts) Local Supabase Keepalive ═══"
  
  # Ping 1: PostgREST
  CODE=$(curl -s -o /dev/null -w "%{http_code}" \
    "${SUPABASE_URL}/rest/v1/discount_codes?select=code&limit=1" \
    -H "apikey: ${ANON_KEY}" -H "Authorization: Bearer ${ANON_KEY}")
  echo "Ping 1 (PostgREST): $CODE"
  
  # Ping 2: Edge Function
  CODE=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST -H "Content-Type: application/json" \
    -d '{"keepalive":true}' \
    "${SUPABASE_URL}/functions/v1/stripe-webhook")
  echo "Ping 2 (Edge Fn): $CODE"
  
  # Ping 3: Storage
  CODE=$(curl -s -o /dev/null -w "%{http_code}" \
    "${SUPABASE_URL}/storage/v1/bucket" \
    -H "apikey: ${ANON_KEY}" -H "Authorization: Bearer ${ANON_KEY}")
  echo "Ping 3 (Storage): $CODE"
  
  echo "✓ Done"
  echo ""
} >> "$LOG" 2>&1
