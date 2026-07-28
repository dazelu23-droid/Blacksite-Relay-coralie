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
