# Web Combat Sandbox Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Godot prototype with a tested desktop-only Three.js first-person combat sandbox.

**Architecture:** Pure TypeScript models own movement, weapon, and target state. A Three.js adapter owns the scene and raycasting, while a browser controller owns input, pointer lock, simulation, and HUD updates.

**Tech Stack:** Vite, TypeScript, Three.js, Vitest, CSS

## Global Constraints

- Desktop keyboard and mouse only.
- Preserve WASD movement, grounded jump, pointer-lock mouse look, automatic hitscan fire, reloading, and two targets.
- Keep gameplay state independent from rendering and DOM presentation.
- Remove all Godot scenes, scripts, metadata, project configuration, and Godot tests.
- Exclude networking, AI, persistence, inventory, mobile controls, and additional maps.

---

### Task 1: Replace Godot scaffolding with the web toolchain

**Files:**
- Delete: `project.godot`
- Delete: `scenes/`
- Delete: `src/**/*.gd`
- Delete: `src/**/*.uid`
- Delete: `tests/**/*.gd`
- Delete: `tests/**/*.uid`
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `index.html`
- Modify: `.gitignore`

**Interfaces:**
- Produces: `npm test`, `npm run build`, and a Vite entry at `/src/main.ts`

- [ ] Delete all tracked Godot runtime files and remove Godot ignore rules.
- [ ] Add Vite, TypeScript, Three.js, and Vitest dependencies with scripts for `dev`, `build`, and `test`.
- [ ] Add strict TypeScript configuration with DOM libraries.
- [ ] Add a full-page canvas host, start overlay, HUD, crosshair, and status regions to `index.html`.
- [ ] Install dependencies and verify `npm test` starts Vitest successfully.
- [ ] Commit with `chore: replace Godot scaffold with web toolchain`.

### Task 2: Implement test-first gameplay models

**Files:**
- Create: `src/game/movement.ts`
- Create: `src/game/weapon.ts`
- Create: `src/game/target.ts`
- Create: `src/game/gameplay.test.ts`

**Interfaces:**
- Produces: `moveVelocity(current, wish, grounded, delta)`, `WeaponState.tick(delta)`, `WeaponState.tryFire()`, `WeaponState.tryReload()`, and `TargetState.applyDamage(amount)`

- [ ] Write tests asserting 24 m/s² ground acceleration, 7 m/s cap, and 18 m/s² deceleration.
- [ ] Write tests asserting a 30/90 initial rifle state, 600-RPM cooldown, 24 damage, and a 2.2-second reload.
- [ ] Write tests asserting 100-health targets take damage, clamp at zero, and become eliminated.
- [ ] Run `npm test` and confirm failure because the modules do not exist.
- [ ] Implement the smallest typed models satisfying the tests.
- [ ] Run `npm test` and confirm all gameplay tests pass.
- [ ] Commit with `feat: add tested web gameplay models`.

### Task 3: Build the playable Three.js sandbox

**Files:**
- Create: `src/game/world.ts`
- Create: `src/game/input.ts`
- Create: `src/main.ts`
- Create: `src/style.css`

**Interfaces:**
- Consumes: gameplay models from Task 2
- Produces: a full-screen playable firing range initialized by `src/main.ts`

- [ ] Build an industrial low-poly range with floor, walls, cover, overhead lighting, distance markers, and two target meshes.
- [ ] Add keyboard state for WASD, Space, R, and Escape plus pointer-lock mouse look and held left-button fire.
- [ ] Add fixed-step movement, gravity, grounded jumping, arena collision boundaries, and camera motion.
- [ ] Raycast accepted shots from camera center, apply 24 damage, animate hit feedback, and reset eliminated targets after a short delay.
- [ ] Bind ammo, reload, hit confirmation, target state, instructions, and crosshair feedback to the HUD.
- [ ] Add responsive tactical styling and a start overlay with pointer-lock retry messaging.
- [ ] Run `npm test` and `npm run build`.
- [ ] Commit with `feat: build Three.js combat sandbox`.

### Task 4: Validate and present the browser game

**Files:**
- Modify: `README.md`

**Interfaces:**
- Consumes: production build from Task 3
- Produces: documented launch instructions and a deployed or previewable web game

- [ ] Update README with controls and local launch instructions.
- [ ] Run the complete test suite and production build from a clean tree.
- [ ] Start the development server and open the exact local URL in the in-app browser.
- [ ] Verify pointer capture, movement, jumping, automatic fire, five-hit elimination, reload timing, Escape release, and desktop resizing.
- [ ] Commit with `docs: add web game instructions`.
- [ ] Publish the verified web game through Sites and return its URL.
