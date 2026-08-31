# Workflow — local VS Code (PowerShell) ↔ GitHub ↔ Arena agent

The GitHub repo (`Siddharth-gitch/hisaab-ai`) is the hub. Development happens
in the Arena chat workspace; changes are applied locally only at the end, when
everything is complete and verified working.

## Environments

1. **Local desktop** (Windows, VS Code, PowerShell) — the primary development
   environment. The local `.env` is the single source of truth for
   configuration and secrets.
2. **GitHub** (`origin`, `Siddharth-gitch/hisaab-ai`) — the hub and backup.
3. **Arena chat workspace** (`/home/user/hisaab-ai`) — where the agent does
   all development work.

## Phase 1 — development (now)

- The agent builds and tests features in the workspace, committing to
  `arena/01a05887-hisaab-ai` and pushing to GitHub after every turn as a
  checkpoint.
- **No action is required locally.** The local checkout, `main`, and `.env`
  stay untouched during this phase.
- Every turn ends with a change summary, and `DEVLOG.md` in the repo keeps a
  running manifest of every file created, modified, or deleted. Full
  PowerShell mirroring instructions are provided at handoff (or on request at
  any point).

## Phase 2 — final handoff (when everything works)

When the work is done and verified, the agent produces one complete handoff
package:

1. **Full change manifest** — every file touched across all turns, sourced
   from `DEVLOG.md`.
2. **Option A (recommended):** git commands to merge the agent's branch into
   `main` (or open a PR) and pull locally.
3. **Option B (manual):** per-file PowerShell here-strings / find-replace
   pairs to recreate every change by hand.
4. **`.env` additions** — every new variable introduced during development,
   as additive `Add-Content` lines with placeholders; real values are filled
   in locally. Secrets are never committed and never requested in chat.

The user then runs the app locally, verifies, and pushes to `main`:

```powershell
cd C:\path\to\hisaab-ai
git fetch origin
git switch main
git pull
git merge arena/01a05887-hisaab-ai
git push origin main
```

## PowerShell notes

- On Windows PowerShell 5.1, `Set-Content -Encoding utf8` writes a BOM. It is
  harmless for these file types, or re-save from VS Code with "Save with
  Encoding" → UTF-8. PowerShell 7+ (`pwsh`) avoids the BOM entirely.
- Paste here-string blocks whole; the closing `'@` must sit at column 0.
- Run all commands from the repository root.

## Local run checklist

```powershell
npm install
npm run dev   # Vite frontend + Express API on port 3001
```

First-time configuration:

```powershell
Copy-Item .env.example .env
notepad .env
```
