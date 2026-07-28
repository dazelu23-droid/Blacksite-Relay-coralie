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
