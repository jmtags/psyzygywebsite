#!/usr/bin/env bash
set -euo pipefail

echo "Deploying Supabase Edge Functions..."
supabase functions deploy admin-create-user
supabase functions deploy track-page-view

echo
echo "Do not manually set SUPABASE_* secrets; Supabase provides those defaults to Edge Functions."
echo "Done."
