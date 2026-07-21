# Blacksite Relay — Game Design and Technical Specification

## Product vision

Blacksite Relay is a session-based, large-map extraction FPS for 20 players. Five squads of four enter a storm-covered research zone, recover encrypted data, activate relay towers, fight security drones and rival squads, and extract before the zone becomes uninhabitable.

The first milestone is a polished vertical slice rather than a content-complete live service. It should prove that 20-player authoritative networking, satisfying combat, extraction tension, and reliable reward persistence work together in Godot 4.

## Design pillars

1. **Objectives create encounters.** Relay towers and timed extraction sites draw squads together without forcing a single route.
2. **Every minute changes the risk.** Staying longer improves the possible reward while the storm, drones, and other squads become more dangerous.
3. **Fair server authority.** Clients feel responsive, but the server decides movement validity, hits, damage, inventory transfers, and rewards.
4. **Finishable scope.** The vertical slice uses one map, a small weapon roster, one enemy family, and no vehicles, crafting, marketplace, or voice chat.

## Match format

- 20 players in five squads of four
- Dedicated authoritative server
- Target match duration: 20 minutes
- One approximately 1 km² map
- Three extraction sites that activate in sequence
- One selected item protected by each player's secure container

### Match phases

1. **Insertion, 0–3 minutes:** Squads spawn around the map perimeter, collect basic equipment, and choose a relay target.
2. **Data hunt, 3–10 minutes:** Relay towers activate. Decoding data takes time and alerts nearby players to the squad's approximate position.
3. **Storm collapse, 10–16 minutes:** Hazardous outer regions push squads toward the central research complex and remaining safe routes.
4. **Extraction, 16–20 minutes:** Extraction sites activate one after another. Each has limited capacity and creates a visible signal while in use.

Players may extract early with modest loot or remain for more valuable data. A downed player can be revived by a squadmate. A fully eliminated player spectates their squad until the match ends.

## World layout

The map contains five outer regions around a central research complex. Outer regions provide safer basic loot and distinct routes. The center contains the best rewards and strongest drone presence. Relay positions, storm closures, and the extraction activation order vary between matches within authored constraints.

The vertical slice uses stylized low-poly art, restrained environmental destruction, and authored cover. Vehicles are excluded because networked vehicle physics would compete with the core networking milestone.

## Combat

- Moderate time-to-kill, approximately 0.6–1.2 seconds under accurate sustained fire
- Three initial hitscan weapons: assault rifle, marksman rifle, and sidearm
- One server-simulated fragmentation grenade
- Health, armor, downed, revive, and elimination states
- Scarce armor repair and healing items
- Healing is interrupted by damage or significant movement
- Server rewind for hitscan validation, bounded to a configured latency window

The server validates fire rate, ammunition, weapon state, shot origin, aim bounds, and hit results. Client-side effects may appear immediately for responsiveness but are corrected by authoritative results.

## PvE

The first enemy family is a security drone with patrol, investigate, engage, and return behaviors. Drones protect high-value locations and react to combat events. AI perception and decisions run on the server. Navigation updates and replication use distance-based budgets so drones cannot consume the entire server frame.

## Progression

Players bring one insured starter weapon into a match. Extracted equipment and data expand loadout variety rather than granting permanent statistical dominance.

The first progression model includes:

- Account level
- Small persistent item stash
- Three weapon unlock paths
- Cosmetic badges
- Match and extraction statistics

The vertical slice excludes crafting, trading, a player marketplace, premium currency, and monetization.

## Technical architecture

Use Godot 4 and typed GDScript for both the game client and a headless dedicated server. Gameplay code is shared where practical, with explicit server-only and client-only boundaries.

### Core modules

- **NetworkManager:** sessions, connections, RPC validation, snapshots, relevance, reconnects, and disconnect cleanup
- **MatchManager:** lobby readiness, phase transitions, storm timing, extraction state, and match completion
- **PlayerController:** input collection, local prediction, reconciliation, remote interpolation, movement, and interaction
- **CombatSystem:** weapon state, lag-compensated hit validation, damage, armor, downing, revive, and elimination
- **InventorySystem:** equipment slots, containers, pickups, secure items, and transactional transfers
- **WorldDirector:** loot, relay activation, storm regions, extraction order, and drone spawning
- **PersistenceService:** profiles, stash, loadouts, idempotent match rewards, and statistics

Each module exposes signals or narrow service methods and owns one type of state. UI observes replicated state and sends requests; it does not mutate gameplay state directly.

### Network model

- Dedicated server is authoritative over all gameplay state.
- Clients send timestamped input commands rather than transforms or damage claims.
- Local movement uses prediction and server reconciliation.
- Remote entities use buffered snapshot interpolation.
- Initial target is a 30 Hz server simulation with snapshot frequency and detail adjusted by relevance.
- Interest management divides the map into spatial cells and always includes squadmates, nearby threats, active objectives, and relevant projectiles.
- Reliable RPCs are reserved for discrete events; frequent state uses unreliable ordered delivery where supported.

The architecture must be profiled under simulated latency, loss, and a full 20-player bot load before content expansion.

## Persistence and integrity

The prototype may use SQLite behind the `PersistenceService` interface. Public deployment should move profiles and inventories to an authenticated backend without changing gameplay callers.

Each match has a unique ID. Reward settlement is an idempotent transaction: replaying the same settlement request cannot duplicate items or currency. The server records a compact match ledger before applying account rewards.

Clients never submit authoritative inventory contents or extraction rewards. They submit actions, and the server derives results from server-owned match state.

## Failure handling

- Disconnected players receive a 90-second reconnection window; their character remains present and vulnerable.
- After the window, the character drops non-secured carried items and is eliminated.
- Invalid or rate-limited requests are rejected and logged with player, match, request type, and reason.
- A failed reward write remains pending and is retried safely using the match ID.
- If the match server crashes before settlement, the ledger determines whether completed extractions can be recovered; uncertain rewards are not duplicated.
- Snapshot gaps cause interpolation fallback and a visible connection warning rather than client authority.
- Server overload reduces nonessential AI and snapshot detail before degrading player simulation.

## Testing and acceptance criteria

### Automated tests

- Unit tests for inventory transactions, damage, armor, match phases, secure containers, reward idempotency, and RPC validation
- Deterministic simulation tests for movement reconciliation and weapon timing
- Integration tests that launch a headless server with automated clients
- Persistence tests covering duplicate settlement, partial failure, reconnect, and crash recovery

### Network and performance tests

- 20 automated clients complete repeated matches at 30, 80, and 150 ms latency
- Test profiles include 0%, 1%, and 3% packet loss with jitter
- The target server maintains its configured simulation rate during representative combat near an active relay
- No client can create items, exceed fire rate, report its own damage, or extract from outside the extraction volume
- Reconciliation errors remain rare and visually bounded under the supported latency range

### Playtest acceptance

- A new player understands looting, relay activation, storm danger, and extraction after one match
- The first meaningful squad decision occurs within three minutes
- At least two viable routes exist during every storm phase
- Relay and extraction signals create encounters without making all matches follow the same path
- A complete match can be played, settled, and followed by a new loadout without developer intervention

## Delivery sequence

1. Offline movement and weapon sandbox
2. Two-player authoritative networking with prediction and reconciliation
3. Combat validation, lag compensation, health, and downed states
4. Match state machine, relay objective, storm, and extraction
5. Inventory, loot, secure container, and transactional persistence
6. Drone AI and server-side performance budgets
7. Interest management and automated 20-client load testing
8. Full-map art pass, audio, UI polish, and closed playtests

The project does not add more weapons, enemies, maps, or progression depth until a 20-client match meets the networking and settlement acceptance criteria.

## Recommended first release boundary

The first externally playable build contains one map, three guns, one grenade, one drone family, five squads, relay objectives, three extraction sites, a small stash, and reconnect support. Its success criterion is a stable and replayable 20-player match—not live-service breadth.
