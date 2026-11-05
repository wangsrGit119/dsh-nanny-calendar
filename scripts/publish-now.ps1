# Publish dsh-nanny-calendar to the public npm registry.
#
# Why this script exists: the account has 2FA enabled with a passkey/security key
# (WebAuthn), so there is no 6-digit TOTP code to type. The registry hands back a
# short-lived 16-char one-time pass instead, but only through the browser flow:
#   1. an authenticated request that needs OTP returns { authUrl, doneUrl }
#   2. the user approves in the browser (security key / passkey)
#   3. GET doneUrl returns { token }  -> that token is the --otp value
#
# Usage:
#   powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts\publish-now.ps1
#   powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts\publish-now.ps1 -DryRun
#
# Notes:
# - A brand new package gets a `0.0.0-stage` placeholder version from the registry.
#   That is normal and must NOT be cleaned up: deleting it unpublishes the whole
#   package and locks the name for 24 hours.
# - If a version was unpublished before, publishing the same version again fails
#   with "cannot be republished until 24 hours have passed" or "cannot be reused".
#   The script then bumps the patch version and retries once.

param(
  [switch]$DryRun,
  [int]$Minutes = 6
)

$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent $PSScriptRoot
Set-Location $repo

# PowerShell 5.1 reads files as ANSI by default, which mangles the Chinese strings in
# package.json and makes ConvertFrom-Json fail. Always read/write UTF-8 without BOM.
function Read-Utf8([string]$Path) {
  return [System.IO.File]::ReadAllText((Resolve-Path $Path), (New-Object System.Text.UTF8Encoding($false)))
}

function Write-Utf8([string]$Path, [string]$Text) {
  [System.IO.File]::WriteAllText((Resolve-Path $Path), $Text, (New-Object System.Text.UTF8Encoding($false)))
}

function Get-NpmToken {
  $npmrc = Join-Path $env:USERPROFILE '.npmrc'
  $line = (Get-Content $npmrc) | Where-Object { $_ -match '_authToken=' } | Select-Object -First 1
  if (-not $line) { throw "No _authToken found in $npmrc" }
  return ($line -replace '^.*_authToken=', '').Trim()
}

function Get-WebOtp {
  param([string]$Token, [int]$Minutes)

  $probeBody = '{"_id":"__probe__","name":"__probe__","dist-tags":{"latest":"1.0.0"},"versions":{"1.0.0":{"name":"__probe__","version":"1.0.0","dist":{"shasum":"0000000000000000000000000000000000000000"}}},"access":"public"}'
  $headers = @{
    Authorization   = "Bearer $Token"
    'Content-Type'  = 'application/json'
    'User-Agent'    = 'npm/11.15.0'
    'npm-auth-type' = 'web'
    'npm-command'   = 'publish'
  }

  $name = (Read-Utf8 'package.json' | ConvertFrom-Json).name
  $authUrl = $null; $doneUrl = $null

  for ($i = 1; $i -le 5; $i++) {
    $raw = $null
    try {
      Invoke-WebRequest -Uri "https://registry.npmjs.org/$name" -Method PUT -Body $probeBody -Headers $headers -UseBasicParsing -TimeoutSec 30 | Out-Null
      throw 'UNEXPECTED: request succeeded without OTP'
    } catch {
      $raw = $_.ErrorDetails.Message
      if ($raw -match 'cannot be republished until 24 hours') { return 'LOCKED' }
      if ($raw -match 'cannot be reused|already been used|previously published') { return 'BURNED' }
      if ($raw) {
        try {
          $j = $raw | ConvertFrom-Json
          if ($j.authUrl -and $j.doneUrl) { $authUrl = $j.authUrl; $doneUrl = $j.doneUrl; break }
        } catch { }
      }
      Start-Sleep -Seconds 3
    }
  }
  if (-not $authUrl) { throw "Could not start an npm web-auth session (last body: $raw)" }

  Write-Host "AUTH_URL  $authUrl"
  Write-Host "DONE_URL  $doneUrl"
  Write-Host ''
  Write-Host 'Opening the browser. Approve with your security key / passkey, then leave the tab open.' -ForegroundColor Cyan
  Start-Process $authUrl

  $deadline = (Get-Date).AddMinutes($Minutes)
  $last = $null
  while ((Get-Date) -lt $deadline) {
    try {
      $r = Invoke-WebRequest -Uri $doneUrl -Headers @{ 'User-Agent' = 'npm/11.15.0' } -UseBasicParsing -TimeoutSec 20
      if ($r.StatusCode -eq 200) {
        $otp = ($r.Content | ConvertFrom-Json).token
        if ($otp) { return $otp }
      }
    } catch {
      $code = $_.Exception.Response.StatusCode.value__
      if ($code -ne $last) { Write-Host "  waiting ($code)"; $last = $code }
      if ($code -eq 404) { throw 'Auth session expired, run the script again' }
    }
    Start-Sleep -Seconds 3
  }
  throw "Timed out after $Minutes minutes waiting for browser approval"
}

function Invoke-Publish {
  param([string]$Otp, [switch]$DryRun)

  $npmArgs = @('publish', '--registry=https://registry.npmjs.org', '--access', 'public')
  if ($Otp) { $npmArgs += "--otp=$Otp" }
  if ($DryRun) { $npmArgs += '--dry-run' }

  # npm writes its notices to stderr; with $ErrorActionPreference = 'Stop' that would
  # turn a successful publish into a terminating NativeCommandError.
  $prev = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  try {
    $out = & npm @npmArgs 2>&1 | Out-String
    $code = $LASTEXITCODE
  } finally {
    $ErrorActionPreference = $prev
  }
  return @{ ExitCode = $code; Output = $out }
}

# ---- main -------------------------------------------------------------

$pkg = Read-Utf8 'package.json' | ConvertFrom-Json
Write-Host "package: $($pkg.name)@$($pkg.version)"
Write-Host "registry: https://registry.npmjs.org"
Write-Host ''

if ($DryRun) {
  $res = Invoke-Publish -Otp '' -DryRun
  Write-Host $res.Output
  exit $res.ExitCode
}

$token = Get-NpmToken
$otp = Get-WebOtp -Token $token -Minutes $Minutes

if ($otp -eq 'LOCKED' -or $otp -eq 'BURNED') {
  Write-Host ''
  Write-Host 'The registry refused the publish before asking for a pass.' -ForegroundColor Yellow
  Write-Host 'A previously unpublished package name stays locked for 24 hours.' -ForegroundColor Yellow
  Write-Host 'Bumping the version does not help; wait for the lock to expire.' -ForegroundColor Yellow
  try {
    $meta = Invoke-RestMethod -Uri "https://registry.npmjs.org/$($pkg.name)" -TimeoutSec 20
    $unpublishedAt = $meta.time.unpublished.time
    if ($unpublishedAt) {
      $unlock = ([datetimeoffset]::Parse($unpublishedAt)).AddHours(24).ToLocalTime()
      Write-Host ("Unlocked at: {0} (local time)" -f $unlock.ToString('yyyy-MM-dd HH:mm:ss')) -ForegroundColor Yellow
    }
  } catch { }
  exit 2
}

Write-Host ''
Write-Host "got one-time pass ($($otp.Length) chars), publishing..." -ForegroundColor Green

$res = Invoke-Publish -Otp $otp
Write-Host $res.Output

if ($res.ExitCode -eq 0) {
  Write-Host ''
  Write-Host 'Published. Registry may take ~1 minute to serve the new version.' -ForegroundColor Green
  Start-Sleep -Seconds 20
  & npm view $pkg.name version --registry=https://registry.npmjs.org
  exit 0
}

$retryable = $res.Output -match 'cannot be republished|cannot be reused|already been used|previously published'

if ($res.Output -match 'cannot be republished until 24 hours') {
  Write-Host ''
  Write-Host 'The package name is locked for 24 hours after the unpublish.' -ForegroundColor Yellow
  Write-Host 'Bumping the version does not help. Wait for the lock to expire, then re-run this script.' -ForegroundColor Yellow
  $unpublished = try { (Invoke-RestMethod -Uri "https://registry.npmjs.org/$(Read-Utf8 'package.json' | ConvertFrom-Json | Select-Object -ExpandProperty name)" -TimeoutSec 20).time.unpublished.time } catch { $null }
  if ($unpublished) {
    $unlock = ([datetimeoffset]::Parse($unpublished)).AddHours(24).ToLocalTime()
    Write-Host ("Unlocked at: {0} (local time)" -f $unlock.ToString('yyyy-MM-dd HH:mm:ss')) -ForegroundColor Yellow
  }
  exit 2
}

if (-not $retryable) {
  Write-Host ''
  Write-Host 'Publish failed and the error does not look like a burned version. Not retrying.' -ForegroundColor Red
  exit $res.ExitCode
}

# The version was unpublished earlier: bump patch, commit nothing, publish again.
$parts = $pkg.version.Split('.')
$next = "$($parts[0]).$($parts[1]).$([int]$parts[2] + 1)"
Write-Host ''
Write-Host "Version $($pkg.version) is burned. Bumping to $next and retrying..." -ForegroundColor Yellow

$raw = Read-Utf8 'package.json'
$raw = $raw.Replace("`"version`": `"$($pkg.version)`"", "`"version`": `"$next`"")
Write-Utf8 'package.json' $raw

$token = Get-NpmToken
$otp = Get-WebOtp -Token $token -Minutes $Minutes
if ($otp -eq 'LOCKED' -or $otp -eq 'BURNED') {
  Write-Host "Version $next is not publishable yet (registry lock). Stopping." -ForegroundColor Yellow
  exit 2
}
$res = Invoke-Publish -Otp $otp
Write-Host $res.Output
if ($res.ExitCode -eq 0) {
  Write-Host ''
  Write-Host "Published $($pkg.name)@$next" -ForegroundColor Green
  Write-Host "Remember to commit the version bump: git add package.json && git commit -m 'chore: release $next'"
  exit 0
}
exit $res.ExitCode
