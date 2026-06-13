param(
  [switch]$SetSecrets
)

$ErrorActionPreference = "Stop"

Write-Host "Deploying Supabase Edge Functions..."
supabase functions deploy admin-create-user
supabase functions deploy track-page-view

if ($SetSecrets) {
  Write-Host ""
  Write-Host "Set required function secrets by running:"
  Write-Host 'supabase secrets set SUPABASE_URL="..." SUPABASE_ANON_KEY="..." SUPABASE_SERVICE_ROLE_KEY="..."'
}

Write-Host "Done."
