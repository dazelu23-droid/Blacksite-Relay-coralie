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
