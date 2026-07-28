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
