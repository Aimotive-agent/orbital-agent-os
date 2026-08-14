# Orbital Agent OS

A Linux-first control surface for the apps, coding tools, and AI agents on one machine.

## Run locally

```bash
npm install
npm run build      # production web bundle into dist/
node server.cjs    # full app — dashboard, auth, and service proxies — on http://localhost:5173
```

Hot-reload development mode (Vite + API server side by side):

```bash
PORT=5174 node server.cjs   # terminal 1: auth API + app proxies for dev
npm run dev                 # terminal 2: Vite dev server on http://localhost:5173
```

In dev mode the Vite proxy forwards `/api/*` and `/app/*` to the API server on port 5174. Override the login with `AUTH_USER` / `AUTH_PASS` environment variables.

## Current MVP

- Single-window workspace dashboard
- Agent/app registry with status and resource-use presentation
- Resource-health panel and live CPU animation
- Task queue with agent handoff action
- Append-only-style activity feed
- Responsive desktop/mobile layout

The current dashboard uses safe demo data for operating-system information. It deliberately does not claim to read processes or control apps from the browser.

## Linux integration plan

The next implementation layer should be a small local Tauri/Rust sidecar with explicit user-granted permissions. It will expose a local-only API for:

1. `/health` — CPU, memory, disks, network and GPU through Linux system APIs.
2. `/processes` — process discovery and per-process resource samples.
3. `/adapters` — opt-in integrations for Ollama, OpenCode/Codex, terminals and browser sessions.
4. `/events` — an append-only local SQLite audit log.
5. `/commands` — allow-listed launch/focus/stop actions; no arbitrary shell execution from the UI.

This separation is important: the desktop shell can embed web apps or present controlled app workspaces, while the local sidecar owns system access and keeps private telemetry on your PC.
