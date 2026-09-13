param(
  [string]$ProjectPath = "."
)

$ErrorActionPreference = "Stop"
$patchRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$filesRoot = Join-Path $patchRoot "files"
$target = Resolve-Path $ProjectPath

Write-Host "Applying English Output Trainer MVP v0.3 patch to $target"

Get-ChildItem -Path $filesRoot -Recurse -File | ForEach-Object {
  $relative = $_.FullName.Substring($filesRoot.Length + 1)
  $destination = Join-Path $target $relative
  $destinationDir = Split-Path -Parent $destination
  if (!(Test-Path $destinationDir)) {
    New-Item -ItemType Directory -Path $destinationDir -Force | Out-Null
  }
  Copy-Item $_.FullName $destination -Force
  Write-Host "  updated $relative"
}

Write-Host ""
Write-Host "v0.3 applied. Restart Metro with:"
Write-Host "  npx expo start -c"
