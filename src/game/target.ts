export class TargetState {
  readonly maxHealth = 100;
  health = this.maxHealth;

  get eliminated(): boolean {
    return this.health === 0;
  }

  applyDamage(amount: number): void {
    if (amount <= 0 || this.eliminated) return;
    this.health = Math.max(0, this.health - amount);
  }

  reset(): void {
    this.health = this.maxHealth;
  }
}
