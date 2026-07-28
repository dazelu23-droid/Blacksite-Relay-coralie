class_name TestSmoke
extends RefCounted

func run() -> Array[String]:
	var failures: Array[String] = []
	if 2 + 2 != 4:
		failures.append("test_arithmetic: expected 4")
	return failures
