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
