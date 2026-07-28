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
