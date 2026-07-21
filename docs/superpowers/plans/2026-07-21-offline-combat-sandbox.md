# Blacksite Relay Offline Combat Sandbox Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (\`- [ ]\`) syntax for tracking.

**Goal:** Build a testable Godot 4 first-person movement and hitscan weapon sandbox that establishes the shared gameplay foundation for Blacksite Relay.

**Architecture:** Pure typed GDScript classes own movement calculations and weapon state. Scene nodes adapt those classes to Godot input, physics, ray queries, and presentation. Networking is reserved for the next plan so the offline game feel and reusable interfaces are verified first.

**Tech Stack:** Godot 4.x, typed GDScript, Godot headless mode, project-owned test runner

## Global Constraints

- Use Godot 4 and typed GDScript.
- Target moderate combat time-to-kill, approximately 0.6–1.2 seconds under accurate sustained fire.
- The first weapon is a hitscan assault rifle.
- Keep gameplay state separate from UI and effects.
- Exclude networking, persistence, AI, inventory, vehicles, crafting, voice chat, and additional maps.

---

## File map

- \`project.godot\`: input actions, physics rate, and main scene.
- \`src/shared/player_command.gd\`: input value object reusable by offline and network controllers.
- \`src/player/player_movement.gd\`: deterministic horizontal movement.
- \`src/player/player_controller.gd\`: CharacterBody3D adapter, gravity, jump, and camera.
- \`src/combat/weapon_config.gd\`: assault-rifle tuning.
- \`src/combat/weapon_state.gd\`: ammunition, cooldown, and reload state.
- \`src/combat/hitscan_weapon.gd\`: physics query and damage dispatch.
- \`src/combat/damageable_target.gd\`: sandbox health target.
- \`scenes/player/player.tscn\`: reusable player.
- \`scenes/sandbox/combat_sandbox.tscn\`: playable test range.
- \`tests/test_suite.gd\`: headless test entry point.
- \`tests/unit/test_player_movement.gd\`: movement behavior.
- \`tests/unit/test_weapon_state.gd\`: weapon timing and ammunition.
- \`tests/integration/test_damageable_target.gd\`: damage behavior.

## Task 1: Bootstrap the project and test runner

**Files:**
- Create: \`.gitignore\`
- Create: \`project.godot\`
- Create: \`tests/test_suite.gd\`
- Create: \`tests/unit/test_smoke.gd\`

**Interfaces:**
- Consumes: Godot 4 executable available as \`godot\`
- Produces: tests exposing \`run() -> Array[String]\` and one suite command

- [ ] **Step 1: Initialize version control**

~~~powershell
git init
~~~

Expected: an empty repository is initialized.

- [ ] **Step 2: Create \`.gitignore\`**

~~~gitignore
.godot/
*.tmp
~~~

- [ ] **Step 3: Create \`project.godot\`**

~~~ini
config_version=5

[application]
config/name="Blacksite Relay"
run/main_scene="res://scenes/sandbox/combat_sandbox.tscn"

[input]
move_forward={"deadzone":0.2,"events":[Object(InputEventKey,"physical_keycode":87)]}
move_back={"deadzone":0.2,"events":[Object(InputEventKey,"physical_keycode":83)]}
move_left={"deadzone":0.2,"events":[Object(InputEventKey,"physical_keycode":65)]}
move_right={"deadzone":0.2,"events":[Object(InputEventKey,"physical_keycode":68)]}
jump={"deadzone":0.2,"events":[Object(InputEventKey,"physical_keycode":32)]}
fire={"deadzone":0.2,"events":[Object(InputEventMouseButton,"button_index":1)]}
reload={"deadzone":0.2,"events":[Object(InputEventKey,"physical_keycode":82)]}

[physics]
common/physics_ticks_per_second=60

[rendering]
renderer/rendering_method="gl_compatibility"
~~~

- [ ] **Step 4: Write the smoke test**

\`tests/unit/test_smoke.gd\`:

~~~gdscript
class_name TestSmoke
extends RefCounted

func run() -> Array[String]:
	var failures: Array[String] = []
	if 2 + 2 != 4:
		failures.append("test_arithmetic: expected 4")
	return failures
~~~

\`tests/test_suite.gd\`:

~~~gdscript
extends SceneTree

const TEST_CLASSES: Array = [
	preload("res://tests/unit/test_smoke.gd"),
]

func _initialize() -> void:
	var failures: Array[String] = []
	for test_class in TEST_CLASSES:
		failures.append_array(test_class.new().run())
	if failures.is_empty():
		print("PASS: %d test file(s)" % TEST_CLASSES.size())
		quit(0)
		return
	for failure in failures:
		push_error(failure)
	quit(1)
~~~

- [ ] **Step 5: Run the smoke test and commit the bootstrap**

~~~powershell
godot --headless --path . --script res://tests/test_suite.gd
~~~

Expected: `PASS: 1 test file(s)`.

~~~powershell
git add .gitignore project.godot tests/test_suite.gd tests/unit/test_smoke.gd
git commit -m "chore: bootstrap Godot project"
~~~

## Task 2: Implement and test pure gameplay models

**Files:**
- Create: \`src/shared/player_command.gd\`
- Create: \`src/player/player_movement.gd\`
- Create: \`src/combat/weapon_config.gd\`
- Create: \`src/combat/weapon_state.gd\`
- Create: \`src/combat/damageable_target.gd\`
- Create: \`tests/unit/test_player_movement.gd\`
- Create: \`tests/unit/test_weapon_state.gd\`
- Create: \`tests/integration/test_damageable_target.gd\`

**Interfaces:**
- Produces: \`PlayerCommand\`, \`PlayerMovement.next_horizontal_velocity(...)\`, \`WeaponState.tick(delta)\`, \`try_fire() -> bool\`, \`try_reload() -> bool\`, and \`DamageableTarget.apply_damage(amount)\`

- [ ] **Step 1: Write the failing movement test**

~~~gdscript
class_name TestPlayerMovement
extends RefCounted

const Movement = preload("res://src/player/player_movement.gd")

func run() -> Array[String]:
	var failures: Array[String] = []
	var movement := Movement.new()
	var accelerated := movement.next_horizontal_velocity(Vector3.ZERO, Vector3.FORWARD, true, 0.1)
	if not is_equal_approx(accelerated.z, -2.4):
		failures.append("ground acceleration: expected -2.4")
	var capped := movement.next_horizontal_velocity(Vector3(0, 0, -9), Vector3.FORWARD, true, 0.1)
	if not is_equal_approx(capped.length(), 7.0):
		failures.append("speed cap: expected 7.0")
	var stopped := movement.next_horizontal_velocity(Vector3(3, 0, 0), Vector3.ZERO, true, 0.25)
	if not stopped.is_zero_approx():
		failures.append("deceleration: expected zero")
	return failures
~~~

- [ ] **Step 2: Write the failing weapon test**

~~~gdscript
class_name TestWeaponState
extends RefCounted

const Config = preload("res://src/combat/weapon_config.gd")
const State = preload("res://src/combat/weapon_state.gd")

func run() -> Array[String]:
	var failures: Array[String] = []
	var config := Config.new()
	var state := State.new(config)
	if not state.try_fire() or state.ammo_in_magazine != 29:
		failures.append("first shot: expected accepted shot and 29 rounds")
	if state.try_fire():
		failures.append("fire rate: immediate second shot was accepted")
	state.tick(config.seconds_per_shot)
	if not state.try_fire():
		failures.append("cooldown: shot was rejected after cooldown")
	state.ammo_in_magazine = 10
	if not state.try_reload():
		failures.append("reload: failed to start")
	state.tick(config.reload_seconds)
	if state.ammo_in_magazine != 30 or state.reserve_ammo != 70:
		failures.append("reload: expected 30/70")
	return failures
~~~

- [ ] **Step 3: Write the failing damage test**

~~~gdscript
class_name TestDamageableTarget
extends RefCounted

const Target = preload("res://src/combat/damageable_target.gd")

func run() -> Array[String]:
	var failures: Array[String] = []
	var target := Target.new()
	target.reset_health()
	target.apply_damage(24.0)
	if not is_equal_approx(target.health, 76.0):
		failures.append("damage: expected 76 health")
	target.apply_damage(200.0)
	if not is_zero_approx(target.health):
		failures.append("damage floor: expected zero")
	return failures
~~~

- [ ] **Step 4: Register the three new test files**

Replace `TEST_CLASSES` in `tests/test_suite.gd` with:

~~~gdscript
const TEST_CLASSES: Array = [
	preload("res://tests/unit/test_smoke.gd"),
	preload("res://tests/unit/test_player_movement.gd"),
	preload("res://tests/unit/test_weapon_state.gd"),
	preload("res://tests/integration/test_damageable_target.gd"),
]
~~~

- [ ] **Step 5: Run tests to verify missing implementations**

~~~powershell
godot --headless --path . --script res://tests/test_suite.gd
~~~

Expected: nonzero exit because the gameplay scripts do not exist.

- [ ] **Step 6: Implement the command and movement classes**

\`src/shared/player_command.gd\`:

~~~gdscript
class_name PlayerCommand
extends RefCounted

var move_input: Vector2
var jump_pressed: bool
var fire_pressed: bool
var reload_pressed: bool
var sequence: int

func _init(move := Vector2.ZERO, jump := false, fire := false, reload := false, seq := 0) -> void:
	move_input = move.limit_length(1.0)
	jump_pressed = jump
	fire_pressed = fire
	reload_pressed = reload
	sequence = seq
~~~

\`src/player/player_movement.gd\`:

~~~gdscript
class_name PlayerMovement
extends RefCounted

const SPEED := 7.0
const GROUND_ACCEL := 24.0
const GROUND_DECEL := 18.0
const AIR_ACCEL := 8.0

func next_horizontal_velocity(current: Vector3, wish: Vector3, grounded: bool, delta: float) -> Vector3:
	var horizontal := Vector3(current.x, 0, current.z)
	var desired := wish.normalized() * SPEED if not wish.is_zero_approx() else Vector3.ZERO
	var rate := AIR_ACCEL
	if grounded:
		rate = GROUND_ACCEL if not desired.is_zero_approx() else GROUND_DECEL
	return horizontal.move_toward(desired, rate * delta)
~~~

- [ ] **Step 7: Implement weapon configuration and state**

\`src/combat/weapon_config.gd\`:

~~~gdscript
class_name WeaponConfig
extends Resource

@export var damage := 24.0
@export var rounds_per_minute := 600.0
@export var magazine_size := 30
@export var starting_reserve := 90
@export var reload_seconds := 2.2
@export var range_meters := 200.0

var seconds_per_shot: float:
	get: return 60.0 / rounds_per_minute
~~~

\`src/combat/weapon_state.gd\`:

~~~gdscript
class_name WeaponState
extends RefCounted

var config: WeaponConfig
var ammo_in_magazine: int
var reserve_ammo: int
var _cooldown := 0.0
var _reload_remaining := 0.0

func _init(value: WeaponConfig) -> void:
	config = value
	ammo_in_magazine = config.magazine_size
	reserve_ammo = config.starting_reserve

func tick(delta: float) -> void:
	_cooldown = maxf(0.0, _cooldown - delta)
	if _reload_remaining > 0.0:
		_reload_remaining = maxf(0.0, _reload_remaining - delta)
		if is_zero_approx(_reload_remaining):
			var count := mini(config.magazine_size - ammo_in_magazine, reserve_ammo)
			ammo_in_magazine += count
			reserve_ammo -= count

func try_fire() -> bool:
	if _cooldown > 0.0 or _reload_remaining > 0.0 or ammo_in_magazine <= 0:
		return false
	ammo_in_magazine -= 1
	_cooldown = config.seconds_per_shot
	return true

func try_reload() -> bool:
	if _reload_remaining > 0.0 or ammo_in_magazine >= config.magazine_size or reserve_ammo <= 0:
		return false
	_reload_remaining = config.reload_seconds
	return true
~~~

- [ ] **Step 8: Implement the damage target**

~~~gdscript
class_name DamageableTarget
extends StaticBody3D

signal eliminated
@export var max_health := 100.0
var health := 100.0

func _ready() -> void:
	reset_health()

func reset_health() -> void:
	health = max_health

func apply_damage(amount: float) -> void:
	if amount <= 0.0 or health <= 0.0:
		return
	health = maxf(0.0, health - amount)
	if is_zero_approx(health):
		eliminated.emit()
~~~

- [ ] **Step 9: Run tests and commit**

~~~powershell
godot --headless --path . --script res://tests/test_suite.gd
git add src tests
git commit -m "feat: add tested movement and weapon models"
~~~

Expected: \`PASS: 4 test file(s)\`.

## Task 3: Adapt models to a playable first-person scene

**Files:**
- Create: \`src/player/player_controller.gd\`
- Create: \`src/combat/hitscan_weapon.gd\`
- Create: \`scenes/player/player.tscn\`

**Interfaces:**
- Consumes: all Task 2 model interfaces
- Produces: reusable player with \`Camera3D\`, movement, jump, fire, reload, and \`ammo_changed(current, reserve)\`

- [ ] **Step 1: Implement \`player_controller.gd\`**

~~~gdscript
class_name PlayerController
extends CharacterBody3D

@export var mouse_sensitivity := 0.002
@onready var view: Node3D = $View
var movement := PlayerMovement.new()
var sequence := 0

func _ready() -> void:
	Input.mouse_mode = Input.MOUSE_MODE_CAPTURED

func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventMouseMotion:
		rotate_y(-event.relative.x * mouse_sensitivity)
		view.rotation.x = clamp(view.rotation.x - event.relative.y * mouse_sensitivity, -1.5, 1.5)
	if event.is_action_pressed("ui_cancel"):
		Input.mouse_mode = Input.MOUSE_MODE_VISIBLE

func _physics_process(delta: float) -> void:
	sequence += 1
	var command := PlayerCommand.new(
		Input.get_vector("move_left", "move_right", "move_forward", "move_back"),
		Input.is_action_just_pressed("jump"),
		Input.is_action_pressed("fire"),
		Input.is_action_just_pressed("reload"),
		sequence
	)
	var local_wish := Vector3(command.move_input.x, 0, command.move_input.y)
	var horizontal := movement.next_horizontal_velocity(velocity, global_basis * local_wish, is_on_floor(), delta)
	velocity.x = horizontal.x
	velocity.z = horizontal.z
	if is_on_floor() and command.jump_pressed:
		velocity.y = 5.5
	elif not is_on_floor():
		velocity.y -= 18.0 * delta
	move_and_slide()
~~~

- [ ] **Step 2: Implement \`hitscan_weapon.gd\`**

~~~gdscript
class_name HitscanWeapon
extends Node3D

signal ammo_changed(current: int, reserve: int)
@export var camera_path: NodePath
@onready var camera: Camera3D = get_node(camera_path)
var config := WeaponConfig.new()
var state := WeaponState.new(config)

func _process(delta: float) -> void:
	state.tick(delta)
	if Input.is_action_pressed("fire"):
		try_fire()
	if Input.is_action_just_pressed("reload") and state.try_reload():
		ammo_changed.emit(state.ammo_in_magazine, state.reserve_ammo)

func try_fire() -> bool:
	if not state.try_fire():
		return false
	var origin := camera.global_position
	var end := origin - camera.global_basis.z * config.range_meters
	var query := PhysicsRayQueryParameters3D.create(origin, end)
	query.exclude = [get_parent().get_rid()]
	var hit := get_world_3d().direct_space_state.intersect_ray(query)
	if not hit.is_empty() and hit.collider.has_method("apply_damage"):
		hit.collider.apply_damage(config.damage)
	ammo_changed.emit(state.ammo_in_magazine, state.reserve_ammo)
	return true
~~~

- [ ] **Step 3: Create \`player.tscn\`**

~~~ini
[gd_scene load_steps=4 format=3]

[ext_resource type="Script" path="res://src/player/player_controller.gd" id="1"]
[ext_resource type="Script" path="res://src/combat/hitscan_weapon.gd" id="2"]
[sub_resource type="CapsuleShape3D" id="1"]

[node name="Player" type="CharacterBody3D"]
script = ExtResource("1")
[node name="CollisionShape3D" type="CollisionShape3D" parent="."]
shape = SubResource("1")
[node name="View" type="Node3D" parent="."]
position = Vector3(0, 0.65, 0)
[node name="Camera3D" type="Camera3D" parent="View"]
current = true
[node name="HitscanWeapon" type="Node3D" parent="."]
script = ExtResource("2")
camera_path = NodePath("../View/Camera3D")
~~~

- [ ] **Step 4: Parse-check and commit**

~~~powershell
godot --headless --path . --editor --quit
git add src/player src/combat/hitscan_weapon.gd scenes/player
git commit -m "feat: add first-person combat controller"
~~~

Expected: exit code \`0\` with no parser errors.

## Task 4: Build and verify the combat sandbox

**Files:**
- Create: \`scenes/sandbox/combat_sandbox.tscn\`

**Interfaces:**
- Consumes: \`player.tscn\` and \`DamageableTarget\`
- Produces: main scene containing a floor, player spawn, lighting, and two damageable targets

- [ ] **Step 1: Create the sandbox scene**

~~~ini
[gd_scene load_steps=8 format=3]

[ext_resource type="PackedScene" path="res://scenes/player/player.tscn" id="1"]
[ext_resource type="Script" path="res://src/combat/damageable_target.gd" id="2"]
[sub_resource type="BoxShape3D" id="1"]
size = Vector3(40, 1, 40)
[sub_resource type="BoxMesh" id="2"]
size = Vector3(40, 1, 40)
[sub_resource type="BoxShape3D" id="3"]
size = Vector3(1, 2, 1)
[sub_resource type="BoxMesh" id="4"]
size = Vector3(1, 2, 1)

[node name="CombatSandbox" type="Node3D"]
[node name="Light" type="DirectionalLight3D" parent="."]
rotation_degrees = Vector3(-55, -25, 0)
shadow_enabled = true
[node name="Floor" type="StaticBody3D" parent="."]
position = Vector3(0, -0.5, 0)
[node name="Collision" type="CollisionShape3D" parent="Floor"]
shape = SubResource("1")
[node name="Mesh" type="MeshInstance3D" parent="Floor"]
mesh = SubResource("2")
[node name="Player" parent="." instance=ExtResource("1")]
position = Vector3(0, 1.1, 6)
[node name="TargetA" type="StaticBody3D" parent="."]
position = Vector3(0, 1, -12)
script = ExtResource("2")
[node name="Collision" type="CollisionShape3D" parent="TargetA"]
shape = SubResource("3")
[node name="Mesh" type="MeshInstance3D" parent="TargetA"]
mesh = SubResource("4")
[node name="TargetB" type="StaticBody3D" parent="."]
position = Vector3(5, 1, -18)
script = ExtResource("2")
[node name="Collision" type="CollisionShape3D" parent="TargetB"]
shape = SubResource("3")
[node name="Mesh" type="MeshInstance3D" parent="TargetB"]
mesh = SubResource("4")
~~~

- [ ] **Step 2: Run automated verification**

~~~powershell
godot --headless --path . --script res://tests/test_suite.gd
godot --headless --path . --editor --quit
godot --headless --path . --quit-after 120
~~~

Expected: four test files pass; import and main-scene runs exit with code \`0\`.

- [ ] **Step 3: Run the manual acceptance pass**

~~~powershell
godot --path .
~~~

Verify WASD movement, grounded jumping, captured mouse look, 600-RPM automatic fire, five-hit target elimination, 2.2-second reload, and Escape cursor release.

- [ ] **Step 4: Commit the milestone**

~~~powershell
git add scenes/sandbox/combat_sandbox.tscn
git commit -m "feat: complete offline combat sandbox"
~~~

## Milestone boundary

After this plan passes, create a separate plan for a two-player dedicated-server prototype. It will reuse \`PlayerCommand\`, \`PlayerMovement\`, \`WeaponConfig\`, and \`WeaponState\`, then introduce input sequencing, authoritative simulation, prediction, reconciliation, interpolation, and server-validated fire.
