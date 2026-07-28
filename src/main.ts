import "./style.css";
import { InputController } from "./game/input";
import { moveVelocity } from "./game/movement";
import { WeaponState } from "./game/weapon";
import { CombatWorld } from "./game/world";

function requireElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing #${id}`);
  return element as T;
}

const canvas = requireElement<HTMLCanvasElement>("game");
const overlay = requireElement<HTMLDivElement>("start-overlay");
const startButton = requireElement<HTMLButtonElement>("start-button");
const lockMessage = requireElement<HTMLElement>("lock-message");
const magazine = requireElement<HTMLElement>("magazine");
const reserve = requireElement<HTMLElement>("reserve");
const weaponState = requireElement<HTMLElement>("weapon-state");
const status = requireElement<HTMLElement>("status");
const targetCount = requireElement<HTMLElement>("target-count");
const stance = requireElement<HTMLElement>("stance");
const range = requireElement<HTMLElement>("range");
const hitmarker = requireElement<HTMLElement>("hitmarker");

const world = new CombatWorld(canvas);
const weapon = new WeaponState();
const player = {
  x: 0,
  y: 1.72,
  z: 5,
  velocityX: 0,
  velocityY: 0,
  velocityZ: 0,
  grounded: true,
};

const input = new InputController(canvas, (locked) => {
  overlay.classList.toggle("hidden", locked);
  status.textContent = locked ? "SIMULATION ACTIVE" : "SIMULATION PAUSED";
});

startButton.addEventListener("click", async () => {
  try {
    await input.requestLock();
    lockMessage.textContent = "CURSOR CAPTURED · ESC TO RELEASE";
  } catch {
    lockMessage.textContent = "POINTER LOCK DENIED · CLICK TO RETRY";
  }
});

window.addEventListener("resize", () => world.resize());
world.camera.position.set(player.x, player.y, player.z);

function fire(): void {
  if (!weapon.tryFire()) return;
  document.body.classList.remove("recoil");
  void document.body.offsetWidth;
  document.body.classList.add("recoil");
  const result = world.shoot();
  status.textContent = result.eliminated ? "THREAT NEUTRALIZED" : result.hit ? "IMPACT CONFIRMED" : "ROUND EXPENDED";
  if (result.hit) {
    range.textContent = `${result.range.toFixed(0).padStart(2, "0")} M`;
    hitmarker.classList.remove("show");
    void hitmarker.offsetWidth;
    hitmarker.classList.add("show");
  }
}

function updateHud(): void {
  magazine.textContent = weapon.ammoInMagazine.toString().padStart(2, "0");
  reserve.textContent = weapon.reserveAmmo.toString().padStart(3, "0");
  weaponState.textContent = weapon.isReloading
    ? `RELOADING ${Math.round(weapon.reloadProgress * 100)
        .toString()
        .padStart(2, "0")}%`
    : weapon.ammoInMagazine === 0
      ? "MAGAZINE EMPTY"
      : "READY";
  targetCount.textContent = `HOSTILES ${world.targets
    .filter((target) => !target.state.eliminated)
    .length.toString()
    .padStart(2, "0")}`;
  stance.textContent = player.grounded ? "GROUNDED" : "AIRBORNE";
}

function simulate(delta: number): void {
  weapon.tick(delta);
  if (input.consumeReload()) weapon.tryReload();
  if (input.firing) fire();

  const movement = input.movement;
  const sin = Math.sin(input.yaw);
  const cos = Math.cos(input.yaw);
  const wishX = movement.x * cos - movement.z * sin;
  const wishZ = movement.x * sin + movement.z * cos;
  const velocity = moveVelocity(
    { x: player.velocityX, z: player.velocityZ },
    { x: wishX, z: wishZ },
    player.grounded,
    delta,
  );
  player.velocityX = velocity.x;
  player.velocityZ = velocity.z;

  if (input.consumeJump() && player.grounded) {
    player.velocityY = 5.5;
    player.grounded = false;
  }
  if (!player.grounded) player.velocityY -= 18 * delta;

  player.x = Math.max(-13.7, Math.min(13.7, player.x + player.velocityX * delta));
  player.z = Math.max(-38.5, Math.min(7.5, player.z + player.velocityZ * delta));
  player.y += player.velocityY * delta;
  if (player.y <= 1.72) {
    player.y = 1.72;
    player.velocityY = 0;
    player.grounded = true;
  }

  world.camera.position.set(player.x, player.y, player.z);
  world.camera.rotation.set(input.pitch, input.yaw, 0);
  world.updateTargets(performance.now());
  updateHud();
}

function frame(): void {
  const delta = world.render();
  if (input.locked) simulate(delta);
  requestAnimationFrame(frame);
}

updateHud();
frame();
