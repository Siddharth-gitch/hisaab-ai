# Workflow — local VS Code (PowerShell) ↔ GitHub ↔ Arena agent

This repository moves through three places. The GitHub repo
(`Siddharth-gitch/hisaab-ai`) is the hub that keeps them in sync.

## Environments

1. **Local desktop** (Windows, VS Code, PowerShell) — your primary
   development environment. You edit code here. Your local `.env` is the
   single source of truth for configuration and secrets.
2. **GitHub** (`origin`) — the hub. Your local pushes land here (usually on
   `main`); the agent's pushes land on `arena/01a05887-hisaab-ai`.
3. **Arena chat workspace** (`/home/user/hisaab-ai`) — a clone of the repo
   where the agent picks up your latest code and builds improvements.

## Direction 1 — you change code, the agent picks it up

1. Edit files in VS Code as usual.
2. Commit and push from PowerShell (commands below).
3. Tell the agent in chat, e.g. "I've pushed to main".
4. The agent runs `git fetch origin` and merges `origin/main` into
   `arena/01a05887-hisaab-ai` in the workspace, then continues work on top of
   your latest code.

### Your local push commands (PowerShell)

```powershell
cd C:\path\to\hisaab-ai
git status              # review the change list
git add -A              # stage everything (or stage specific files)
git commit -m "Describe the change"
git push origin main    # or just: git push (if you are on another branch)
```

`.env` is gitignored, so `git add -A` will never stage it.

## Direction 2 — the agent changes code, you pick it up

1. The agent commits its work to `arena/01a05887-hisaab-ai` and pushes it to
   GitHub at the end of every turn that changes files.
2. Every such turn includes mirroring instructions:
   - **Option A (recommended):** `git pull` on the agent's branch, or merge
     that branch into your `main`.
   - **Option B (manual):** per-file PowerShell here-strings or exact
     find/replace pairs, so you can apply changes by hand while staying on
     `main`.
3. New `.env` keys are always given as additive `Add-Content` lines with
   placeholders; you fill in real values locally. Secrets are never committed
   and never requested in chat.

### Your local pull commands (PowerShell)

```powershell
cd C:\path\to\hisaab-ai
git fetch origin
git switch arena/01a05887-hisaab-ai   # first time only
git pull                              # gets the agent's latest
```

To bring the agent's work into your `main` instead:

```powershell
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
