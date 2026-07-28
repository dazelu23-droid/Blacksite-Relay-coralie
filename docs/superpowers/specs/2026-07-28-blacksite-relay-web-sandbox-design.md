# Blacksite Relay Web Combat Sandbox Design

## Goal

Replace the Godot prototype with a desktop browser game that preserves its core first-person combat loop. The result runs as a static web application and requires only a keyboard and mouse.

## Scope

The web sandbox includes pointer-lock mouse look, WASD movement, grounded jumping, a 600-RPM automatic hitscan rifle, a 30-round magazine, 90 reserve rounds, a 2.2-second reload, two 100-health targets, target reset behavior, an ammunition HUD, a crosshair, and clear hit/elimination feedback.

Networking, AI, persistence, inventory, mobile controls, additional maps, and progression remain out of scope.

## Technical architecture

Use Vite, TypeScript, and Three.js. Pure TypeScript modules own movement calculations, weapon timing, ammunition, and damage state. A browser adapter owns keyboard and mouse input, pointer lock, the animation loop, and DOM presentation. A Three.js world adapter owns the camera, collision surfaces, raycasting, lights, and low-poly scene geometry.

The web application replaces all Godot runtime files. The existing product and design documentation remains because it describes the broader game direction and records the migration.

## Gameplay and data flow

Keyboard and mouse events update an input state object. Each animation frame advances fixed-step gameplay simulation, applies movement to the player capsule, updates the camera, advances weapon timers, and processes held fire or reload requests. Accepted shots raycast from the center of the camera. A hit sends damage to the target model, then updates target presentation. UI reads game state but does not mutate it directly.

The player starts in a compact blacksite firing range with concrete walls, hazard accents, overhead lighting, distance markers, and two elevated targets. Clicking the start overlay captures the pointer. Escape releases it and restores the overlay.

## Visual direction

Use a restrained industrial palette: near-black blue, cool concrete, signal amber, warning red, and pale cyan HUD elements. Geometry stays intentionally low-poly and readable. The interface resembles a tactical visor without obscuring the play area.

## Error handling

If pointer lock is unavailable or denied, the start overlay remains visible with a short retry message. The simulation clamps large frame deltas to prevent movement or weapon timing jumps after a suspended tab. Window resizing updates the renderer and camera projection.

## Testing and acceptance

Vitest covers movement acceleration, speed caps, weapon cooldown and reload behavior, ammunition limits, target damage, and elimination. The production build must complete without TypeScript errors.

Browser acceptance requires:

- Clicking the overlay captures the mouse.
- WASD moves relative to view direction.
- Space jumps only while grounded.
- Holding the left mouse button fires at 600 RPM.
- Five rifle hits eliminate a full-health target.
- R reloads in 2.2 seconds and updates ammunition.
- Escape releases the pointer.
- The scene remains usable at common desktop viewport sizes.
