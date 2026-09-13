param(
  [string]$ProjectPath = "."
)

$ErrorActionPreference = "Stop"
$project = (Resolve-Path $ProjectPath).Path
$filesRoot = Join-Path $PSScriptRoot "files"

if (-not (Test-Path (Join-Path $project "package.json"))) {
  throw "ProjectPath does not look like the Expo project root: $project"
}

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupRoot = Join-Path $project ".eot-backups\v0.2-$stamp"
New-Item -ItemType Directory -Path $backupRoot -Force | Out-Null

Write-Host "Backing up replaced files to $backupRoot"

Get-ChildItem -Path $filesRoot -Recurse -File | ForEach-Object {
  $relative = $_.FullName.Substring($filesRoot.Length + 1)
  $target = Join-Path $project $relative
  $backup = Join-Path $backupRoot $relative

  if (Test-Path $target) {
    New-Item -ItemType Directory -Path (Split-Path $backup -Parent) -Force | Out-Null
    Copy-Item $target $backup -Force
  }

  New-Item -ItemType Directory -Path (Split-Path $target -Parent) -Force | Out-Null
  Copy-Item $_.FullName $target -Force
  Write-Host "Updated $relative"
}

# SDK 57's default template uses src/app. It must not coexist with this project's root app/ router tree.
$legacyRouterRoot = Join-Path $project "src\app"
if (Test-Path $legacyRouterRoot) {
  Write-Host "Removing conflicting SDK template route tree: src/app"
  Remove-Item $legacyRouterRoot -Recurse -Force
}

Write-Host ""
Write-Host "English Output Trainer MVP 0.2 patch applied."
Write-Host "Next: npx expo start -c"
