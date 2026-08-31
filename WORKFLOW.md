# Workflow — Arena agent ↔ local VS Code (PowerShell)

The contract below governs every change made in this repository.

## Environments

- **Agent sandbox** (`/home/user/hisaab-ai`, Linux): writes code, commits, and
  pushes to `origin` at the end of every turn that changes files.
- **Local desktop** (Windows, VS Code, PowerShell): where you review, run, and
  test. The local `.env` file is the single source of truth for configuration
  and secrets.

## Ground rules

1. **One working branch.** All agent work happens on
   `arena/01a05887-hisaab-ai`, pushed to GitHub after each turn. `main` only
   moves when you explicitly merge or open a PR, so your local `main` never
   changes unexpectedly.
2. **`.env` stays local.** It is gitignored and never committed. When a change
   needs new variables, the agent supplies additive lines for you to append;
   you fill in real values locally. The agent never asks for secret values in
   chat.
3. **Every change ships with mirroring instructions.** Any turn that creates,
   edits, or deletes files must include:
   - a summary table of every file touched,
   - **Option A** — git sync commands (recommended),
   - **Option B** — per-file PowerShell commands to reproduce the exact change
     by hand,
   - additive `.env` snippets when new keys are introduced.

## Option A — sync with git (recommended)

```powershell
# from your local repo root
git fetch origin
git switch arena/01a05887-hisaab-ai   # first time only; afterwards: git pull
git pull
```

Pulls never touch `.env` because it is gitignored. If your git is older than
2.23, use `git checkout arena/01a05887-hisaab-ai` instead of `git switch`.

## Option B — manual, per-file mirroring

For when you want to stay on `main` or cherry-pick changes.

- **New or fully replaced file:** the agent provides the complete file content
  wrapped in a single-quoted PowerShell here-string (nothing is interpolated),
  piped to `Set-Content -Encoding utf8`. A here-string's closing delimiter
  must be the first thing on its own line at column 0.
- **Edited file:** the agent shows either the complete new file content (paste
  as above) or an exact "find this text → replace with this text" pair to
  apply in VS Code.
- **Deleted file:** `Remove-Item .\path\to\file.ext`

After applying, check `git status` and `git diff` before committing.

## PowerShell notes

- Run all commands from the repository root.
- On Windows PowerShell 5.1, `-Encoding utf8` writes a BOM. It is harmless for
  these file types, or re-save from VS Code (encoding picker → "Save with
  Encoding" → UTF-8). PowerShell 7+ (`pwsh`) avoids the BOM entirely.
- Long here-strings must be pasted whole; if a paste looks truncated, re-copy
  the entire fenced block.

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
