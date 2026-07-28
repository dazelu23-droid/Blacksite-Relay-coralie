class_name WeaponState
extends RefCounted

var config: WeaponConfig
var ammo_in_magazine: int
var reserve_ammo: int
var _cooldown := 0.0
var _reload_remaining := 0.0

func _init(value: WeaponConfig) -> void:
	config = value
	ammo_in_magazine = config.magazine_size
	reserve_ammo = config.starting_reserve

func tick(delta: float) -> void:
	_cooldown = maxf(0.0, _cooldown - delta)
	if _reload_remaining > 0.0:
		_reload_remaining = maxf(0.0, _reload_remaining - delta)
		if is_zero_approx(_reload_remaining):
			var count := mini(config.magazine_size - ammo_in_magazine, reserve_ammo)
			ammo_in_magazine += count
			reserve_ammo -= count

func try_fire() -> bool:
	if _cooldown > 0.0 or _reload_remaining > 0.0 or ammo_in_magazine <= 0:
		return false
	ammo_in_magazine -= 1
	_cooldown = config.seconds_per_shot
	return true

func try_reload() -> bool:
	if _reload_remaining > 0.0 or ammo_in_magazine >= config.magazine_size or reserve_ammo <= 0:
		return false
	_reload_remaining = config.reload_seconds
	return true
