#!/usr/bin/env bash
# Supabase Keepalive - LOCAL backup (LaunchAgent na macOS Nicolasa).
# Działa NIEZALEŻNIE od GitHub Actions (na wypadek gdyby GH był down).
# Codziennie wieczorem (21:00 lokalnie) pinguje Supabase z laptopa.

SUPABASE_URL="https://kuyniyyieejvambyjnxy.supabase.co"
ANON_KEY="sb_publishable_3XC8esfEtBvOOr78DgdRiA_wgzKEJJL"
LOG="$HOME/.claude/logs/supabase-keepalive.log"
mkdir -p "$(dirname "$LOG")"

ts() { date -u +%Y-%m-%dT%H:%M:%SZ; }

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
