param(
  [string]$Root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path,
  [string]$OutputPath = (Join-Path $Root 'PETSYNC_AUDIT_REPORT.txt')
)

$ErrorActionPreference = 'Stop'

function Write-Section {
  param([string]$Title)
  Add-Content -Path $OutputPath -Value ''
  Add-Content -Path $OutputPath -Value ('=' * 88)
  Add-Content -Path $OutputPath -Value $Title
  Add-Content -Path $OutputPath -Value ('=' * 88)
}

function Write-Lines {
  param([object[]]$Lines)
  if (-not $Lines -or $Lines.Count -eq 0) {
    Add-Content -Path $OutputPath -Value '(none found)'
    return
  }
  $Lines | ForEach-Object { Add-Content -Path $OutputPath -Value $_ }
}

$AppPath = Join-Path $Root 'App.js'
$PackagePath = Join-Path $Root 'package.json'
$AppJsonPath = Join-Path $Root 'app.json'

if (-not (Test-Path $AppPath)) {
  throw "App.js not found at $AppPath"
}

$app = Get-Content $AppPath -Raw
$package = if (Test-Path $PackagePath) { Get-Content $PackagePath -Raw | ConvertFrom-Json } else { $null }
$appJson = if (Test-Path $AppJsonPath) { Get-Content $AppJsonPath -Raw | ConvertFrom-Json } else { $null }

Set-Content -Path $OutputPath -Value 'PETSYNC+ CLEAN AUDIT REPORT'
Add-Content -Path $OutputPath -Value ("Generated: {0}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'))
Add-Content -Path $OutputPath -Value ("Root: {0}" -f $Root)
Add-Content -Path $OutputPath -Value ("App.js lines: {0}" -f ((Get-Content $AppPath).Count))
Add-Content -Path $OutputPath -Value ("App.js size: {0:N0} bytes" -f (Get-Item $AppPath).Length)

Write-Section '1. ACTIVE APP ENTRY / PLATFORM CONFIG'
$entryLines = @()
if ($package) {
  $entryLines += "package main: $($package.main)"
  $entryLines += "expo version: $($package.dependencies.expo)"
  $entryLines += "react-native version: $($package.dependencies.'react-native')"
  $entryLines += "react version: $($package.dependencies.react)"
  $entryLines += "expo-router installed: $([bool]$package.dependencies.'expo-router')"
  $entryLines += "expo-av installed: $([bool]$package.dependencies.'expo-av')"
  $entryLines += "expo-notifications installed: $([bool]$package.dependencies.'expo-notifications')"
  $entryLines += "react-native-purchases installed: $([bool]$package.dependencies.'react-native-purchases')"
}
if ($appJson) {
  $entryLines += "app name: $($appJson.expo.name)"
  $entryLines += "app version: $($appJson.expo.version)"
  $entryLines += "web output: $($appJson.expo.web.output)"
  $entryLines += "new architecture enabled: $($appJson.expo.newArchEnabled)"
}
Write-Lines $entryLines

Write-Section '2. SCREENS / LARGE COMPONENTS'
$screenMatches = [regex]::Matches($app, '(?m)^(?:function|const)\s+([A-Za-z0-9_]*(?:Screen|Modal|Navigator|Provider|Card|Section|View))\b')
$screens = $screenMatches | ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique
Write-Lines ($screens | ForEach-Object { $_ })
Add-Content -Path $OutputPath -Value ("TOTAL: {0}" -f $screens.Count)

Write-Section '3. NAVIGATION ROUTES'
$routeMatches = [regex]::Matches($app, '<(?:Stack|Tab)\.Screen\s+name=["'']([^"'']+)["'']')
$routes = $routeMatches | ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique
Write-Lines ($routes | ForEach-Object { $_ })
Add-Content -Path $OutputPath -Value ("TOTAL: {0}" -f $routes.Count)

Write-Section '4. NAVIGATION TARGETS USED IN CODE'
$navMatches = [regex]::Matches($app, '(?:navigate|push|replace)\(\s*["'']([^"'']+)["'']')
$navTargets = $navMatches | ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique
Write-Lines ($navTargets | ForEach-Object { $_ })
Add-Content -Path $OutputPath -Value ("TOTAL: {0}" -f $navTargets.Count)

Write-Section '5. NAVIGATION MISMATCHES'
$missingRoutes = $navTargets | Where-Object { $routes -notcontains $_ }
$unusedRoutes = $routes | Where-Object { $navTargets -notcontains $_ }
Add-Content -Path $OutputPath -Value 'Targets used but no matching declared route:'
Write-Lines ($missingRoutes | ForEach-Object { "  $_" })
Add-Content -Path $OutputPath -Value ''
Add-Content -Path $OutputPath -Value 'Declared routes with no direct navigate/push/replace reference:'
Write-Lines ($unusedRoutes | ForEach-Object { "  $_" })

Write-Section '6. CONTEXTS / PROVIDERS'
$contextMatches = [regex]::Matches($app, '(?m)^const\s+([A-Za-z0-9_]+Context)\s*=\s*createContext')
$contexts = $contextMatches | ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique
Write-Lines ($contexts | ForEach-Object { $_ })
Add-Content -Path $OutputPath -Value ("TOTAL: {0}" -f $contexts.Count)

Write-Section '7. SUPABASE TABLE REFERENCES'
$tableMatches = [regex]::Matches($app, '\.from\(\s*["'']([^"'']+)["'']\s*\)')
$tables = $tableMatches | ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique
Write-Lines ($tables | ForEach-Object { $_ })
Add-Content -Path $OutputPath -Value ("TOTAL: {0}" -f $tables.Count)

Write-Section '8. PREMIUM / FEATURE GATES'
$gateMatches = [regex]::Matches($app, 'openLockedFeature\(\s*["'']([^"'']+)["'']')
$gates = $gateMatches | ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique
Write-Lines ($gates | ForEach-Object { $_ })
Add-Content -Path $OutputPath -Value ("TOTAL: {0}" -f $gates.Count)

Write-Section '9. ADMIN-ONLY / PRIVILEGED CHECKS'
$adminLines = Select-String -Path $AppPath -Pattern 'ADMIN_EMAILS|isDiscoverAdmin|isPetSyncAdminProfile|Admin only|admin only|ControlCenter' | ForEach-Object {
  "Line $($_.LineNumber): $($_.Line.Trim())"
}
Write-Lines $adminLines

Write-Section '10. PLACEHOLDER / MOCK / TODO / FIXME / TEMP REFERENCES'
$placeholderLines = Select-String -Path $AppPath -Pattern 'TODO|FIXME|mock|placeholder|coming soon|phase 1|for now|temporary|temporarily|seed' -CaseSensitive:$false | ForEach-Object {
  "Line $($_.LineNumber): $($_.Line.Trim())"
}
Write-Lines $placeholderLines

Write-Section '11. DEPRECATED / WEB-SPECIFIC WARNINGS TO REVIEW'
$warningLines = @()
if ($package -and $package.dependencies.'expo-av') { $warningLines += 'expo-av is installed and should be migrated to expo-audio/expo-video.' }
if ($package -and $package.dependencies.'expo-router' -and $package.main -eq 'node_modules/expo/AppEntry.js') { $warningLines += 'expo-router is installed although the active entry point is classic Expo AppEntry.js / App.js.' }
if ($app -match 'Notifications\.getExpoPushTokenAsync') { $warningLines += 'Push token registration is present; verify web VAPID handling and Expo Go limitations.' }
if ($app -match 'shadowColor|shadowOpacity|shadowRadius|shadowOffset') { $warningLines += 'Legacy React Native shadow props are present; web reports shadow* deprecation warnings.' }
if ($app -match 'pointerEvents=') { $warningLines += 'pointerEvents prop usage is present; react-native-web recommends style.pointerEvents.' }
Write-Lines $warningLines

Write-Section '12. DUPLICATE FUNCTION / COMPONENT NAMES'
$nameMatches = [regex]::Matches($app, '(?m)^(?:function\s+([A-Za-z_$][A-Za-z0-9_$]*)|const\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*=\s*(?:\([^\n]*\)|[A-Za-z_$][A-Za-z0-9_$]*)\s*=>)')
$names = $nameMatches | ForEach-Object {
  if ($_.Groups[1].Success) { $_.Groups[1].Value } else { $_.Groups[2].Value }
}
$duplicates = $names | Group-Object | Where-Object { $_.Count -gt 1 } | Sort-Object -Property @{Expression='Count'; Descending=$true}, @{Expression='Name'; Descending=$false}
Write-Lines ($duplicates | ForEach-Object { "{0} x {1}" -f $_.Name, $_.Count })

Write-Section '13. LARGE / HISTORICAL APP SNAPSHOT FILES'
$historyFiles = Get-ChildItem -Path $Root -File -Filter 'App*.js' | Where-Object { $_.Name -ne 'App.js' } | Sort-Object Length -Descending
Write-Lines ($historyFiles | ForEach-Object { "{0,-55} {1,12:N0} bytes" -f $_.Name, $_.Length })
Add-Content -Path $OutputPath -Value ("TOTAL: {0}" -f $historyFiles.Count)

Write-Section '14. SOURCE TREE'
$sourceRoots = @('src','scripts','supabase','assets')
foreach ($sourceRoot in $sourceRoots) {
  $full = Join-Path $Root $sourceRoot
  if (Test-Path $full) {
    Add-Content -Path $OutputPath -Value "[$sourceRoot]"
    Get-ChildItem -Path $full -Recurse -File | ForEach-Object {
      $relative = $_.FullName.Substring($Root.Length).TrimStart('\','/')
      Add-Content -Path $OutputPath -Value ("  {0} ({1:N0} bytes)" -f $relative, $_.Length)
    }
  }
}

Write-Section '15. SUPABASE MIGRATIONS'
$migrationPath = Join-Path $Root 'supabase\migrations'
if (Test-Path $migrationPath) {
  $migrations = Get-ChildItem -Path $migrationPath -File | Sort-Object Name
  Write-Lines ($migrations | ForEach-Object { $_.Name })
  Add-Content -Path $OutputPath -Value ("TOTAL: {0}" -f $migrations.Count)
} else {
  Write-Lines @()
}

Write-Section '16. PACKAGE DEPENDENCIES'
if ($package) {
  $deps = @()
  $package.dependencies.PSObject.Properties | Sort-Object Name | ForEach-Object {
    $deps += ("{0} {1}" -f $_.Name, $_.Value)
  }
  Write-Lines $deps
} else {
  Write-Lines @()
}

Write-Section '17. QUICK AUDIT SUMMARY'
Add-Content -Path $OutputPath -Value ("Screens/components inventoried: {0}" -f $screens.Count)
Add-Content -Path $OutputPath -Value ("Declared routes: {0}" -f $routes.Count)
Add-Content -Path $OutputPath -Value ("Navigation targets: {0}" -f $navTargets.Count)
Add-Content -Path $OutputPath -Value ("Supabase tables referenced: {0}" -f $tables.Count)
Add-Content -Path $OutputPath -Value ("Premium feature gates found: {0}" -f $gates.Count)
Add-Content -Path $OutputPath -Value ("Historical App*.js snapshots: {0}" -f $historyFiles.Count)
Add-Content -Path $OutputPath -Value ("Placeholder/TODO-style lines: {0}" -f $placeholderLines.Count)
Add-Content -Path $OutputPath -Value ("Duplicate function/component names: {0}" -f $duplicates.Count)
Add-Content -Path $OutputPath -Value ''
Add-Content -Path $OutputPath -Value 'NEXT: Review this report before deleting, moving, or refactoring anything.'

Write-Host ''
Write-Host 'PetSync audit complete.'
Write-Host "Report: $OutputPath"
