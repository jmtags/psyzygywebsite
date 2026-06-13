#!/usr/bin/env bash
set -euo pipefail

echo "Deploying Supabase Edge Functions..."
supabase functions deploy admin-create-user
supabase functions deploy track-page-view

echo
echo "If secrets are not set yet, run:"
echo 'supabase secrets set SUPABASE_URL="..." SUPABASE_ANON_KEY="..." SUPABASE_SERVICE_ROLE_KEY="..."'
echo "Done."
