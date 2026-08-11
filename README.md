# Orbital Agent OS

A Linux-first control surface for the apps, coding tools, and AI agents on one machine.

## Run locally

```bash
npm install
npm run dev
```

Open the local address printed by Vite (normally `http://localhost:5173`). Build a production web bundle with `npm run build`.

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
