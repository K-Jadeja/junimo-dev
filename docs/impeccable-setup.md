# Impeccable UI skill

Junimo has the project-local [Impeccable](https://github.com/pbakaus/impeccable)
frontend design skill installed for Codex.

## Current setup

- Skill: `.agents/skills/impeccable/`
- Installed version: `4.0.4`
- Codex hook: `.codex/hooks.json`
- Skill payload: intentionally ignored by Git because it is a generated local
  bundle; reinstall it with the command below on a new checkout or machine.

After restarting or refreshing Codex, use `$impeccable` or
`$impeccable <command> <target>`. The first project-context step is:

```powershell
npx --yes impeccable skills install -y --providers=.agents --scope=project
```

Then run `$impeccable init` when ready. It asks for product context before
creating `PRODUCT.md` and optional design context, so setup deliberately does
not invent those decisions for the portfolio.

Codex must also approve the project hook from `/hooks` before automatic UI
checks run. The detector can always be run manually after a UI change:

```powershell
node .agents/skills/impeccable/scripts/detect.mjs --json <changed-targets>
```

## Windows installer recovery

The Impeccable installer currently invokes the Unix `unzip` command. If Windows
reports `'unzip' is not recognized`, create a temporary `unzip.cmd` in the
project root with this content, run the install command above, and delete the
shim afterward:

```bat
@echo off
setlocal
if /I not "%~3"=="-d" exit /b 2
tar -xf "%~2" -C "%~4"
exit /b %ERRORLEVEL%
```

The shim is only an installer compatibility workaround; it is not part of the
application or the committed project setup.
