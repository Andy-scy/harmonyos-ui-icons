# verify-templates.ps1
#
# Compile-and-run check for the ArkTS templates shipped in this repo.
#
# It takes an existing HarmonyOS project, runs the bootstrap if the icon assets
# are missing, drops the three templates into it (Tint / IconsaxIcon /
# IconsaxCatalog), swaps in the example page, and builds.
#
# Usage:
#   pwsh -File verify-templates.ps1 -ProjectPath 'C:\path\to\your-harmony-project'
#   pwsh -File verify-templates.ps1 -ProjectPath '...' -SkipBuild
#
# Notes:
#   * ASCII-only source on purpose: the host console codepage may be 936, so a
#     BOM-less UTF-8 .ps1 containing CJK text would be mis-decoded and break the
#     path literals.
#   * hvigor rejects project paths containing non-ASCII characters, so keep
#     -ProjectPath ASCII-only.
#   * A signed HAP needs a working signingConfigs section in the project's
#     build-profile.json5. Without one the build still succeeds and produces an
#     unsigned HAP.

param(
  [Parameter(Mandatory = $true)][string]$ProjectPath,
  [string]$DevEcoHome = 'C:\Program Files\Huawei\DevEco Studio',
  [string]$NodeExe    = 'node',
  [switch]$SkipBuild
)

$ErrorActionPreference = 'Continue'
$RepoRoot = Split-Path -Parent $PSScriptRoot                        # repo root = parent of examples/
$SkillDir = Join-Path $RepoRoot 'skills\harmonyos-ui-icons'         # the bundled skill

function Fail($msg) { Write-Host "ERROR: $msg"; exit 1 }

if (-not (Test-Path -LiteralPath $ProjectPath)) { Fail "project not found: $ProjectPath" }
if (-not (Test-Path -LiteralPath "$ProjectPath\oh-package.json5")) { Fail "not a HarmonyOS project (no oh-package.json5): $ProjectPath" }
if (-not (Test-Path -LiteralPath "$SkillDir\SKILL.md")) { Fail "bundled skill not found: $SkillDir" }

$ets = Join-Path $ProjectPath 'entry\src\main\ets'
if (-not (Test-Path -LiteralPath $ets)) { Fail "missing entry module ets dir: $ets" }

Write-Host "==> bootstrap icon assets (no-op if already present)"
& $NodeExe "$SkillDir\scripts\bootstrap.mjs"
if ($LASTEXITCODE -ne 0) { Fail "bootstrap.mjs failed" }

Write-Host "==> copy templates"
New-Item -ItemType Directory -Force -Path "$ets\common", "$ets\components", "$ets\model" | Out-Null
Copy-Item -LiteralPath "$SkillDir\templates\Tint.ets"           -Destination "$ets\common\Tint.ets"            -Force
Copy-Item -LiteralPath "$SkillDir\templates\IconsaxIcon.ets"    -Destination "$ets\components\IconsaxIcon.ets" -Force
Copy-Item -LiteralPath "$SkillDir\templates\IconsaxCatalog.ets" -Destination "$ets\model\IconsaxCatalog.ets"  -Force
Copy-Item -LiteralPath "$PSScriptRoot\IconsaxExamplePage.ets"   -Destination "$ets\pages\Index.ets"            -Force

if ($SkipBuild) { Write-Host "==> -SkipBuild set, done"; exit 0 }

$Hvigorw = Join-Path $DevEcoHome 'tools\hvigor\bin\hvigorw.bat'
$Ohpm    = Join-Path $DevEcoHome 'tools\ohpm\bin\ohpm.bat'
if (-not (Test-Path -LiteralPath $Hvigorw)) { Fail "hvigorw not found: $Hvigorw" }

$env:DEVECO_SDK_HOME = Join-Path $DevEcoHome 'sdk'
$env:JAVA_HOME       = Join-Path $DevEcoHome 'jbr'
$env:PATH            = "$(Join-Path $DevEcoHome 'tools\node');$env:PATH"

Push-Location $ProjectPath
Write-Host "==> ohpm install"
& $Ohpm install --all 2>&1 | ForEach-Object { $_ }
Write-Host "==> hvigorw assembleHap"
& $Hvigorw assembleHap --mode module -p product=default -p buildMode=debug --no-daemon 2>&1 | ForEach-Object { $_ }
$code = $LASTEXITCODE
Pop-Location

Write-Host "==> exit code: $code"
exit $code
