export class InputController {
  private readonly keys = new Set<string>();
  private fireHeld = false;
  private jumpQueued = false;
  private reloadQueued = false;
  yaw = 0;
  pitch = 0;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly onLockChange: (locked: boolean) => void,
  ) {
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("mousedown", this.onMouseDown);
    window.addEventListener("mouseup", this.onMouseUp);
    window.addEventListener("mousemove", this.onMouseMove);
    document.addEventListener("pointerlockchange", this.handleLockChange);
    window.addEventListener("blur", this.clear);
  }

  get locked(): boolean {
    return document.pointerLockElement === this.canvas;
  }

  get movement(): { x: number; z: number } {
    return {
      x: Number(this.keys.has("KeyD")) - Number(this.keys.has("KeyA")),
      z: Number(this.keys.has("KeyS")) - Number(this.keys.has("KeyW")),
    };
  }

  get firing(): boolean {
    return this.fireHeld && this.locked;
  }

  requestLock(): Promise<void> {
    return this.canvas.requestPointerLock();
  }

  consumeJump(): boolean {
    const queued = this.jumpQueued;
    this.jumpQueued = false;
    return queued;
  }

  consumeReload(): boolean {
    const queued = this.reloadQueued;
    this.reloadQueued = false;
    return queued;
  }

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    this.keys.add(event.code);
    if (event.code === "Space" && !event.repeat) this.jumpQueued = true;
    if (event.code === "KeyR" && !event.repeat) this.reloadQueued = true;
  };

  private readonly onKeyUp = (event: KeyboardEvent): void => {
    this.keys.delete(event.code);
  };

  private readonly onMouseDown = (event: MouseEvent): void => {
    if (event.button === 0) this.fireHeld = true;
  };

  private readonly onMouseUp = (event: MouseEvent): void => {
    if (event.button === 0) this.fireHeld = false;
  };

  private readonly onMouseMove = (event: MouseEvent): void => {
    if (!this.locked) return;
    this.yaw -= event.movementX * 0.002;
    this.pitch = Math.max(-1.45, Math.min(1.45, this.pitch - event.movementY * 0.002));
  };

  private readonly handleLockChange = (): void => {
    this.onLockChange(this.locked);
    if (!this.locked) this.fireHeld = false;
  };

  private readonly clear = (): void => {
    this.keys.clear();
    this.fireHeld = false;
  };
}
