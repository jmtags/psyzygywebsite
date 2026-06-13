$ErrorActionPreference = "Stop"

Write-Host "Deploying Supabase Edge Functions..."
supabase functions deploy admin-create-user
supabase functions deploy track-page-view

Write-Host "Do not manually set SUPABASE_* secrets; Supabase provides those defaults to Edge Functions."
Write-Host "Done."
