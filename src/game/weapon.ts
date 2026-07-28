export const WEAPON_DAMAGE = 24;
export const SHOT_INTERVAL = 0.1;
export const RELOAD_SECONDS = 2.2;

export class WeaponState {
  ammoInMagazine = 30;
  reserveAmmo = 90;
  private cooldown = 0;
  private reloadRemaining = 0;

  get isReloading(): boolean {
    return this.reloadRemaining > 0;
  }

  get reloadProgress(): number {
    return this.isReloading ? 1 - this.reloadRemaining / RELOAD_SECONDS : 0;
  }

  tick(delta: number): void {
    this.cooldown = Math.max(0, this.cooldown - delta);
    if (!this.isReloading) return;

    this.reloadRemaining = Math.max(0, this.reloadRemaining - delta);
    if (this.reloadRemaining > 1e-9) return;

    this.reloadRemaining = 0;
    const rounds = Math.min(30 - this.ammoInMagazine, this.reserveAmmo);
    this.ammoInMagazine += rounds;
    this.reserveAmmo -= rounds;
  }

  tryFire(): boolean {
    if (this.cooldown > 0 || this.isReloading || this.ammoInMagazine <= 0) return false;
    this.ammoInMagazine -= 1;
    this.cooldown = SHOT_INTERVAL;
    return true;
  }

  tryReload(): boolean {
    if (this.isReloading || this.ammoInMagazine >= 30 || this.reserveAmmo <= 0) return false;
    this.reloadRemaining = RELOAD_SECONDS;
    return true;
  }
}
