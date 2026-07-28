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
