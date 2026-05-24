# Agent Instructions

Build this as a small browser game using JavaScript, Vite, and Three.js.

The original scaffold request mentioned Phaser, but the active prototype has moved to a simple Three.js low-poly scene. Continue with the current Three.js implementation unless the user explicitly asks to change engines.

## Priorities

- simplicity
- readability
- interpretable code
- playable prototype first
- clear visual silhouettes
- no backend
- no multiplayer
- no TypeScript unless asked
- no complex architecture

If uncertain, choose the simplest working implementation.

## Run And Verify

Install:

```bash
npm install
```

Run locally:

```bash
npm run dev
```

Build:

```bash
npm run build
```

Preview mode URLs:

```text
http://127.0.0.1:5173/
http://127.0.0.1:5173/?npcPreview=1
http://127.0.0.1:5173/?npcPreview=1&focus=reference-tourists
```

Use the in-app browser or Playwright/browser tooling after visual changes. Check both normal gameplay and `?npcPreview=1` when NPC design code changes.

## Current Game Shape

- `src/main.js` contains the whole prototype: scene setup, world props, player, NPCs, water spray, ammo, fountains, cartridges, preview mode, and HUD state.
- `src/style.css` contains page and HUD styling.
- `TASKS.md` is the active product/design checklist.
- `design/` contains concept board assets. Use `design/Guiriland_game_esthetics.png` as the current primary reference for environment and NPC proportions.
- `docs/deploy.md` and `docs/supabase-leaderboard.sql` describe the Vercel + Supabase shareable leaderboard setup.

## Coding Guidance

- Keep helper functions small and named by visible game objects or behavior.
- Prefer adding a focused helper over introducing classes or framework structure.
- Reuse existing mesh helpers like `addBox`, `addCylinder`, `addCone`, `makeLabel`, and `createPerson`.
- The current playable round is a 30-second challenge with 10 randomized guiri targets: Guiri Gambas, Stag Crew groups, and `I ♥ MILFS` tourists. Stag Crew groups require 3 sprays before scoring and then scatter as separate members. Moving locals and police are separate non-target pedestrians, and spraying them should remain a penalty.
- The current web flow is name entry, location selection, round, final score, leaderboard. Without Supabase environment variables, leaderboard data is local-only.
- Keep preview-only NPC design work behind `?npcPreview=1` until designs are approved for gameplay.
- For NPC visuals, prefer the current concept-board language: chunky stylized-real adults, readable clothing/props, clear silhouettes, and grounded locals.
- When adding or changing a mechanic, update `TASKS.md` and any relevant README notes.
- Avoid large generated assets unless the user asks for them.
- Do not add backend services, build pipelines, state managers, or dependency-heavy systems for prototype features.
