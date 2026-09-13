$ErrorActionPreference = 'Continue'
$repo = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$logDir = Join-Path $repo 'artifacts\frozen-exam-wave1d\test-logs'
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$checks = @(
  @{ Name='test-wave1d'; Command='npm.cmd run test:wave1d' },
  @{ Name='test-domain'; Command='npm.cmd run test:domain' },
  @{ Name='test-scenario'; Command='npm.cmd run test:scenario' },
  @{ Name='test-stage4'; Command='npm.cmd run test:stage4' },
  @{ Name='test-stage5a'; Command='npm.cmd run test:stage5a' },
  @{ Name='test-wave-e'; Command='npm.cmd run test:wave-e' },
  @{ Name='test-wave-k'; Command='npm.cmd run test:wave-k' },
  @{ Name='test-wave-n'; Command='npm.cmd run test:wave-n' },
  @{ Name='test-wave-o'; Command='npm.cmd run test:wave-o' },
  @{ Name='test-wave-u1'; Command='npm.cmd run test:wave-u1' },
  @{ Name='test-main-architecture'; Command='npm.cmd run test:main-architecture' },
  @{ Name='test-stage3-block-preflight'; Command='npm.cmd run test:stage3:block-preflight' },
  @{ Name='typecheck'; Command='npm.cmd run typecheck' },
  @{ Name='lint'; Command='npm.cmd run lint' }
)
$results = foreach($check in $checks){
  Write-Host "WAVE1D_CHECK $($check.Name)"
  $started = Get-Date
  $output = & cmd.exe /d /s /c $check.Command 2>&1 | Out-String
  $code = $LASTEXITCODE
  $output | Set-Content -Encoding UTF8 -LiteralPath (Join-Path $logDir "$($check.Name).log")
  [pscustomobject]@{ name=$check.Name; command=$check.Command; exitCode=$code; passed=($code -eq 0); durationSeconds=[math]::Round(((Get-Date)-$started).TotalSeconds,2) }
}
$results | ConvertTo-Json -Depth 4 | Set-Content -Encoding UTF8 -LiteralPath (Join-Path $logDir 'host-validation-summary.json')
$failed = @($results | Where-Object { -not $_.passed })
$results | Format-Table -AutoSize
if($failed.Count){exit 1}
