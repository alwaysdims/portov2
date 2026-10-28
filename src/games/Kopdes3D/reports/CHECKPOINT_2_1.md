# Checkpoint 2.1 — Dependencies and game route

Date: 2026-10-28. Branch: `docs/kopdes3d-phase1`. Status: **PARTIAL — automated code gates VERIFIED; HTTP VERIFIED / BROWSER NOT TESTED**.

## Recovered work

Started from HEAD `1d64d25`. Existing 2.1 work supplied exact 3D/Vitest dependencies, lazy `/games/kopdes-3d`, GameGates entry, primitive scene with Rapier, loading UI, WebGL fallback and route error/retry/exit boundary. No working implementation was replaced. Security remediation only updated compatible locked tooling/transitive versions.

Unrelated existing changes in SeranganFajar JSX, GameOverPanel, UpgradeIcon and `.claude/` remain outside staging. Local `tools/setup-phase2.ps1` is a one-time recovery/install helper, not required to run or reproduce the checkpoint; it remains unstaged. No reset, clean, deploy or main push.

## Evidence

| Check | Result |
|---|---|
| Existing Node test suite | PASS, 48/48 on Node 26.9.0 |
| Kopdes3D Vitest tests | Not present at 2.1; gameplay starts in 2.2 |
| Focused ESLint | PASS on Kopdes3D, App and GameGates |
| Global ESLint | Existing FAIL: 8 errors, 1 warning; exact baseline unchanged |
| Production build | PASS, Vite 8.3.5, 847 modules |
| Registry audit | PASS, 9 affected packages reduced to 0 |
| Manifest/lock and npm tree | PASS, root maps match; relevant tree has no invalid peers |
| Auto Codex review | PASS, CLI read-only, 1 round, 0 findings |
| HTTP route/source responses | PASS, patched Vite `127.0.0.1:3001`, five routes and two source modules return 200 |
| Canvas, runtime Console, assets, navigation/refresh/Back/Forward | NOT TESTED in browser |

The production graph has an entry chunk of 422,061 bytes importing game chunks dynamically. KOPDES chunk: 3,176,210 bytes, about 1,093.55 kB gzip, with dynamic Rapier bootstrap. No static Three import enters the portfolio chunk. This is build evidence, not measured browser transfer or FPS. Existing large Phaser chunk and KOPDES chunk trigger size warnings; deferred 3D loading and DPR cap limit initial impact.

## Browser recovery

An existing server on port 3000 returned HTTP 200. A separate patched Vite instance was started with explicit loopback host and strict port 3001 to avoid reusing the old loaded binary. All requested routes responded successfully. No public binding or browser security change was introduced.

Browser inventory exposed native windows but no connected browser automation surface. Computer Use was tried with Brave instead of the previously failing Chrome URL path. It stopped with: “could not determine the current browser URL on Windows with enough confidence to enforce policy.” The failure is in URL verification, before game interaction; there is no evidence that game code caused it. No repeated navigation or workaround of this protection was attempted. Chrome DevTools MCP and installed Playwright/Puppeteer packages are absent.

**BROWSER NOT TESTED — ENVIRONMENT LIMITATION**. Browser absence does not block this foundation commit under the recovery instructions. It does block claims that Canvas, collision, camera, runtime errors or navigation were verified interactively.

## Next slice

Checkpoint 2.2 is authorized for Owi prototype, camera-relative WASD, mouse look, smooth follow, sprint, ground/wall collision, camera obstruction and Rapier integration. Dash, combat, shopping and later phases remain outside 2.2. Use one fixed-step simulation authority and local refs. Require real Rapier integration tests plus focused lint/build/review; browser-dependent acceptance remains open until a permitted browser is available.
