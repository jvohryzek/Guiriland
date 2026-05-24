# Barcelona Guiriland Game

A small satirical browser arcade prototype set on a stylized La Rambla-inspired boulevard in Barcelona.

The current prototype is a JavaScript + Vite + Three.js game. Players enter a display name, choose La Rambla, play a 30-second round, and land on a leaderboard. The game can run with a browser-local leaderboard or connect to Supabase for shared scores.

## Run Locally

Requirements:
- Node.js 20 or newer
- npm

Install and run:

```bash
npm install
npm run dev
```

Open the local URL printed by Vite, usually:

```text
http://127.0.0.1:5173/
```

Build:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Controls

- Move: `WASD` or arrow keys
- Aim: mouse pointer
- Spray: mouse click or `Space`
- Refill: hold `E` near a fountain
- Restart: on-screen restart button after win or lose

## Deployment

The first shareable version is designed for Vercel + Supabase:

- Vercel hosts the Vite build.
- Supabase stores leaderboard scores.
- Vercel Deployment Protection can keep early test links private to friends.

Setup notes:
- `docs/deploy.md`
- `docs/supabase-leaderboard.sql`

Deployment helpers:
- `.env.example`: optional Supabase leaderboard variables
- `vercel.json`: Vercel build/output settings and SPA fallback

For the shared leaderboard, `VITE_SUPABASE_ANON_KEY` can be a current Supabase publishable key or the legacy anon key. Never use the secret/service role key in the browser app.

## URL Modes

Normal gameplay:

```text
http://127.0.0.1:5173/
```

NPC design review board:

```text
http://127.0.0.1:5173/?npcPreview=1
```

Focused review for the approved source-reference tourist trio:

```text
http://127.0.0.1:5173/?npcPreview=1&focus=reference-tourists
```

The NPC preview mode shows the 10 proposed archetypes as in-game low-poly character clusters. The focused `reference-tourists` view shows the current approved gameplay target set: Guiri Gamba, Stag Crew, and `I ♥ MILFS`.

## Current Gameplay

- One continuous boulevard scene
- Name entry and location selection
- Vertical movement along a La Rambla-inspired promenade
- 30-second randomized arcade rounds
- Player water pistol with limited ammo
- Water cartridge pickups
- Fountain refill stations
- 10 playable guiri targets per round: Guiri Gambas, Stag Crew groups, and `I ♥ MILFS` tourists
- Randomized target mix and spawn positions on restart
- Target panel with remaining Stag Crew, Gambas, and `I ♥ MILFS` counts
- Stag Crew groups need 3 sprays, then scatter in separate directions
- Stag Crew shirt colors and slogans vary by group
- Moving local pedestrians and police as non-targets
- Pigeons fly away when the player gets close
- NPC spray reactions with splash, speech bubble, and flee behavior
- Local spray penalty
- Score, timer, win, and lose states
- Local leaderboard fallback and optional Supabase leaderboard

## Visual Direction

Target style: stylized arcade Barcelona with readable Mediterranean atmosphere.

Primary concept reference:
- `design/Guiriland_game_esthetics.png`

Priorities:
- colorful, satirical tourist archetypes
- simplified geometry
- readable silhouettes from the game camera
- chunky stylized-real character proportions
- warm stone colors, trees, terraces, kiosks, flower stands, and facades
- gameplay readability over realism

Avoid:
- photorealism
- gritty realism
- excessive clutter
- generic European city styling

## Project Files

- `src/main.js`: game, scene, NPCs, player, HUD, interactions
- `src/style.css`: page and HUD styling
- `TASKS.md`: working task list and design notes
- `AGENTS.md`: coding guidance for future agents
- `design/`: visual concept assets and references created during iteration
- `docs/`: deployment and leaderboard setup
- `vercel.json`: Vercel deployment configuration
- `.env.example`: optional leaderboard environment variables

## Notes For Future Work

Keep changes simple and prototype-friendly. Prefer readable functions and small reusable helpers over a large architecture. The current gameplay route now uses the approved reference tourist archetypes; the next likely visual pass is refining their silhouettes, clothing detail, and spacing inside the boulevard.
