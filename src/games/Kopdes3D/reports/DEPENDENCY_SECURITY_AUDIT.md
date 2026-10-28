# Dependency security audit — Checkpoint 2.1

Date: 2026-10-28. Repository: `E:/Portofolio/portov2`. Package manager: npm 10.8.2, lockfile v3. Commands use local Node 26.9.0 because system Node 20.20.2 cannot run the existing tests or Vitest 5.

## Result

Initial `npm audit --json`: **9 affected packages: 7 high, 1 moderate, 1 low, 0 critical**. Multiple advisories can affect one package; this is not a count of independent exploits. After compatible remediation and a separate registry audit: **0 vulnerabilities**, exit 0. No finding remains deferred.

Registry access initially failed inside the filesystem/network sandbox. The audit was rerun with explicit execution approval. No security protection was disabled.

## Findings and reachability

All paths start at the repository root. Every package below is transitive except Vite. “Production dependency” describes npm placement, not proof that a package ships to browsers.

| Package | Severity | Dependency path / placement | Reachability before fix | Locked update |
|---|---|---|---|---|
| @babel/core | low | eslint-plugin-react-hooks → @babel/core; development | Linting source maps; arbitrary local file read requires crafted source input. Not browser runtime. [Advisory](https://github.com/advisories/GHSA-4x5r-pxfx-6jf8) | 7.29.0 → 7.29.7 |
| baseline-browser-mapping | moderate | eslint-plugin-react-hooks → @babel/core → @babel/helper-compilation-targets → browserslist → baseline-browser-mapping; development | Invalid build/lint targeting input can terminate process. No player input reaches it. [Advisory](https://github.com/advisories/GHSA-w5vr-8v7q-w6rv) | 2.10.24 → 2.11.34 |
| brace-expansion | high | eslint → minimatch → brace-expansion; development | Crafted glob expansion can exhaust CPU, memory or stack. Lint configuration is trusted; not runtime. All reported vulnerable ranges end before installed 5.0.12. [Advisory](https://github.com/advisories/GHSA-qhr7-859c-m2p7) | 5.0.5 → 5.0.12 |
| browserslist | high | eslint-plugin-react-hooks → @babel/core → @babel/helper-compilation-targets → browserslist; development | Unbounded query cache and crafted custom stats can crash/write prototypes in tooling. No user-controlled stats service exists. [Advisory](https://github.com/advisories/GHSA-73wf-gq98-2v4g) | 4.28.2 → 4.29.5 |
| nanoid | high | vite → postcss → nanoid; development | Invalid generator sizes can hang or overflow. No application import or externally supplied size. [Advisory](https://github.com/advisories/GHSA-xwg4-73v4-xw9w) | 3.3.11 → 3.3.20 |
| postcss | high | vite → postcss; development | Crafted CSS sourceMappingURL can disclose local map files during processing. Repository CSS is trusted; not browser runtime. [Advisory](https://github.com/advisories/GHSA-r28c-9q8g-f849) | 8.5.12 → 8.5.32 |
| source-map-js | high | @tailwindcss/vite → @tailwindcss/node → source-map-js; production placement, build use; also vite → postcss | Crafted indexed maps can block event loop in build tooling. Not imported by application source. [Advisory](https://github.com/advisories/GHSA-68fv-2mgg-jv7q) | 1.2.1 → 1.2.2 |
| vite | high | direct devDependency; also plugin-react, Tailwind and Vitest peer | Dev-server/editor endpoints are relevant on Windows: command injection, UNC credential disclosure and filesystem deny/allow bypasses. Never expose dev server publicly. Static production output does not run Vite server. [Advisory](https://github.com/advisories/GHSA-587h-7wmj-h5pm) | 8.0.10 → 8.3.5 |
| zod | high | eslint-plugin-react-hooks → zod / zod-validation-error; also openai optional peer, production placement | Oversized constrained collection validation can exhaust memory. `openai` and `zod` have no imports in application source; no public validator endpoint exists. [Advisory](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5) | 4.4.1 → 4.6.7 |

## Remediation and compatibility

Ran `npm audit fix --dry-run --ignore-scripts --json`, inspected planned versions, then `npm audit fix --ignore-scripts --json`. No `--force`, overrides, new direct dependency, or major-version migration. The manifest's Vite range remains `^8.0.10`; lockfile resolves patched 8.3.5. Other changes are compatible transitive updates and their platform bindings.

React and React DOM remain 19.2.5. R3F 9.8.2 accepts React `>=19 <19.4` and Three `>=0.156`. Drei 10.7.9 accepts React 19, R3F 9 and Three `>=0.159`. Rapier 2.2.0 accepts React 19, R3F `^9.0.4` and Three `>=0.159.0`. Three remains 0.186.1. `stats-gl` has its own Three 0.170.0; Drei is not imported into this checkpoint and this copy is not part of the emitted game route.

Vite 8.3.5 satisfies plugin-react 6.0.1's `^8.0.0` and Vitest 5.0.5's Vite 8 peer. Node 26.9.0 satisfies both engines. Vite minor and Rolldown updates carry build-output risk; the focused lint, unchanged global lint baseline, 48 existing tests, dependency tree and production build all passed after remediation. Browser execution remains NOT TESTED and is not inferred from these checks.

The npm run emitted an EPERM cleanup warning for an old loaded Rolldown binding in `node_modules`. Installation exited 0, the updated binding built successfully, and audit returned zero. No unrelated process was killed or native file forcibly removed.

Manifest/lock root dependency maps match. `npm ls` reports no invalid peer tree. A clean `npm ci` was not performed: the existing Node package depends on its installation script, and this recovery deliberately avoided reinstalling working dependencies. Lifecycle scripts were disabled for remediation. Registry audit detects known advisories, not every supply-chain threat.

## Verification

- `npm audit --json`: 0 vulnerabilities after remediation, exit 0.
- Local Node `src/games/Kopdes3D/tools/verify.mjs`: 48/48 existing tests; focused ESLint PASS; global baseline unchanged at 8 errors and 1 warning; Vite production build PASS.
- HTTP routes on patched Vite, explicitly bound to `127.0.0.1:3001`: `/`, `/games`, `/games/kopdes-3d`, `/games/wowo-jump`, `/games/serangan-fajar` all 200.
- Computer Use stopped because Windows browser URL could not be verified reliably. Playwright/Puppeteer and Chrome DevTools MCP unavailable. **HTTP VERIFIED / BROWSER NOT TESTED**.
- Re-audit before the next checkpoint/release or any dependency change. Do not process untrusted source/maps/stats through build tools.
