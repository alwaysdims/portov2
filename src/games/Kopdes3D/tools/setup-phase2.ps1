$ErrorActionPreference = 'Stop'
$repo = (Resolve-Path (Join-Path $PSScriptRoot '../../../..')).Path
$node = Join-Path $repo 'node_modules/node/bin/node.exe'
$npm = 'C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js'
Set-Location -LiteralPath $repo
& $node $npm install --save-exact node@26.9.0 three@0.186.1 @react-three/fiber@9.8.2 @react-three/drei@10.7.9 @react-three/rapier@2.2.0 zustand@5.0.16
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
& $node $npm install --save-dev --save-exact vitest@5.0.5
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
$utf8 = [System.Text.UTF8Encoding]::new($false)
$appFile = Join-Path $repo 'src/App.jsx'
$app = [IO.File]::ReadAllText($appFile)
if (!$app.Contains('const Kopdes3D =')) {
  $app = $app.Replace('import { useTheme }', 'const Kopdes3D = lazy(() => import("./games/Kopdes3D/Kopdes3D"));' + "`n" + 'import KopdesBoundary from "./games/Kopdes3D/KopdesBoundary";' + "`n`n" + 'import { useTheme }')
  $app = $app.Replace('gamePath === "/games/wowo-jump"', 'gamePath === "/games/kopdes-3d"' + "`n" + '      ? <KopdesBoundary><Suspense fallback={<div role="status">Memuat KOPDES 3D...</div>}><Kopdes3D /></Suspense></KopdesBoundary>' + "`n" + '      : gamePath === "/games/wowo-jump"')
  [IO.File]::WriteAllText($appFile, $app, $utf8)
}
$gateFile = Join-Path $repo 'src/games/GameGates.jsx'
$gate = [IO.File]::ReadAllText($gateFile)
$gate = $gate.Replace('{ name: "Game 3", available: false }', '{ name: "KOPDES 3D: Belanja Hemat", path: "/games/kopdes-3d", available: true }')
[IO.File]::WriteAllText($gateFile, $gate, $utf8)
