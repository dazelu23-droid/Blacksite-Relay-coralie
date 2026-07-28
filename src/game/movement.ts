export interface HorizontalVector {
  x: number;
  z: number;
}

export const MOVE_SPEED = 7;
const GROUND_ACCELERATION = 24;
const GROUND_DECELERATION = 18;
const AIR_ACCELERATION = 8;

export function moveVelocity(
  current: HorizontalVector,
  wish: HorizontalVector,
  grounded: boolean,
  delta: number,
): HorizontalVector {
  const wishLength = Math.hypot(wish.x, wish.z);
  const desired =
    wishLength > 0
      ? { x: (wish.x / wishLength) * MOVE_SPEED, z: (wish.z / wishLength) * MOVE_SPEED }
      : { x: 0, z: 0 };
  const rate = grounded
    ? wishLength > 0
      ? GROUND_ACCELERATION
      : GROUND_DECELERATION
    : AIR_ACCELERATION;
  const maxChange = rate * delta;
  const dx = desired.x - current.x;
  const dz = desired.z - current.z;
  const distance = Math.hypot(dx, dz);

  if (distance <= maxChange || distance === 0) {
    return desired;
  }

  return {
    x: current.x + (dx / distance) * maxChange,
    z: current.z + (dz / distance) * maxChange,
  };
}
