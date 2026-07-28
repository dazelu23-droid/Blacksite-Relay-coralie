import { describe, expect, it } from "vitest";
import { moveVelocity } from "./movement";
import { TargetState } from "./target";
import { WeaponState } from "./weapon";

describe("movement", () => {
  it("accelerates on the ground at 24 meters per second squared", () => {
    const velocity = moveVelocity({ x: 0, z: 0 }, { x: 0, z: -1 }, true, 0.1);
    expect(velocity.x).toBe(0);
    expect(velocity.z).toBeCloseTo(-2.4);
  });

  it("does not exceed the seven meter per second speed cap", () => {
    const velocity = moveVelocity({ x: 0, z: -9 }, { x: 0, z: -1 }, true, 0.1);
    expect(Math.hypot(velocity.x, velocity.z)).toBeCloseTo(7);
  });

  it("decelerates to a stop when movement input is released", () => {
    expect(moveVelocity({ x: 3, z: 0 }, { x: 0, z: 0 }, true, 0.25)).toEqual({
      x: 0,
      z: 0,
    });
  });
});

describe("assault rifle", () => {
  it("starts with a 30 round magazine and 90 rounds in reserve", () => {
    const weapon = new WeaponState();
    expect([weapon.ammoInMagazine, weapon.reserveAmmo]).toEqual([30, 90]);
  });

  it("fires at 600 RPM and rejects a shot during cooldown", () => {
    const weapon = new WeaponState();
    expect(weapon.tryFire()).toBe(true);
    expect(weapon.tryFire()).toBe(false);
    weapon.tick(0.1);
    expect(weapon.tryFire()).toBe(true);
  });

  it("reloads a partial magazine after 2.2 seconds", () => {
    const weapon = new WeaponState();
    weapon.ammoInMagazine = 10;
    expect(weapon.tryReload()).toBe(true);
    weapon.tick(2.19);
    expect(weapon.ammoInMagazine).toBe(10);
    weapon.tick(0.01);
    expect([weapon.ammoInMagazine, weapon.reserveAmmo]).toEqual([30, 70]);
  });
});

describe("targets", () => {
  it("takes damage, clamps health at zero, and becomes eliminated", () => {
    const target = new TargetState();
    target.applyDamage(24);
    expect(target.health).toBe(76);
    target.applyDamage(200);
    expect(target.health).toBe(0);
    expect(target.eliminated).toBe(true);
  });
});
