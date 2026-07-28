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
