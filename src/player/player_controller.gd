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
