extends SceneTree

const TEST_CLASSES: Array = [
	preload("res://tests/unit/test_smoke.gd"),
	preload("res://tests/unit/test_player_movement.gd"),
	preload("res://tests/unit/test_weapon_state.gd"),
	preload("res://tests/integration/test_damageable_target.gd"),
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
