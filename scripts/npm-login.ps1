param(
  [switch]$LoginOnly,
  [int]$Minutes = 8
)

$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent $PSScriptRoot
Set-Location $repo

function Read-Utf8([string]$Path) {
  return [System.IO.File]::ReadAllText((Resolve-Path $Path), (New-Object System.Text.UTF8Encoding($false)))
}

function Write-Utf8([string]$Path, [string]$Text) {
  [System.IO.File]::WriteAllText((Resolve-Path $Path), $Text, (New-Object System.Text.UTF8Encoding($false)))
}

# ---------------------------------------------------------------- web login
# npm's browser login: POST /-/v1/login returns { loginUrl, doneUrl }; the user
# approves with the security key; polling doneUrl eventually yields { token }.
# The npm-command header matters: without it the endpoint answers 401.
function Invoke-WebLogin {
  param([int]$Minutes)

  $headers = @{
    'Content-Type' = 'application/json'
    'User-Agent'   = 'npm/11.15.0'
    'npm-command'  = 'login'
    'npm-auth-type' = 'web'
  }

  $res = Invoke-WebRequest -Uri 'https://registry.npmjs.org/-/v1/login' -Method POST -Body '{}' -Headers $headers -UseBasicParsing -TimeoutSec 30
  $j = $res.Content | ConvertFrom-Json
  $loginUrl = $j.loginUrl
  $doneUrl = $j.doneUrl
  if (-not $loginUrl -or -not $doneUrl) { throw "Unexpected login response: $($res.Content)" }

  Write-Host "LOGIN_URL $loginUrl"
  Write-Host "DONE_URL  $doneUrl"
  Write-Host ''
  Write-Host 'Opening the browser. Approve with your security key / passkey.' -ForegroundColor Cyan
  Start-Process $loginUrl

  $deadline = (Get-Date).AddMinutes($Minutes)
  $last = $null
  while ((Get-Date) -lt $deadline) {
    try {
      $r = Invoke-WebRequest -Uri $doneUrl -Headers @{ 'User-Agent' = 'npm/11.15.0' } -UseBasicParsing -TimeoutSec 20
      if ($r.StatusCode -eq 200) {
        $tok = ($r.Content | ConvertFrom-Json).token
        if ($tok) { return $tok }
      }
    } catch {
      $code = $_.Exception.Response.StatusCode.value__
      if ($code -ne $last) { Write-Host "  waiting ($code)"; $last = $code }
    }
    Start-Sleep -Seconds 3
  }
  throw "Timed out after $Minutes minutes waiting for browser approval"
}

function Save-NpmToken {
  param([string]$Token)

  $npmrc = Join-Path $env:USERPROFILE '.npmrc'
  $lines = @()
  if (Test-Path $npmrc) { $lines = Get-Content $npmrc }

  $replaced = $false
  $out = foreach ($line in $lines) {
    if ($line -match '^\s*//registry\.npmjs\.org/:_authToken=') {
      $replaced = $true
      "//registry.npmjs.org/:_authToken=$Token"
    } else { $line }
  }
  if (-not $replaced) { $out = @($out) + "//registry.npmjs.org/:_authToken=$Token" }

  Set-Content -Path $npmrc -Value $out -Encoding ASCII
  Write-Host "Saved new token to $npmrc (len $($Token.Length))" -ForegroundColor Green
}

# ---------------------------------------------------------------- main
$newToken = Invoke-WebLogin -Minutes $Minutes
Write-Host ''
Write-Host "got session token ($($newToken.Length) chars)" -ForegroundColor Green
Save-NpmToken -Token $newToken

$user = Invoke-RestMethod -Uri 'https://registry.npmjs.org/-/npm/v1/user' -Headers @{ Authorization = "Bearer $newToken"; 'User-Agent' = 'npm/11.15.0' } -TimeoutSec 20
Write-Host "authenticated as: $($user.name) ($($user.email))  tfa=$($user.tfa.mode)"

if ($LoginOnly) { exit 0 }

Write-Host ''
Write-Host 'Next: run scripts\publish-now.ps1 to publish.' -ForegroundColor Cyan
exit 0
