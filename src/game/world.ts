import * as THREE from "three";
import { TargetState } from "./target";

interface TargetRig {
  state: TargetState;
  root: THREE.Group;
  plate: THREE.Mesh;
  resetAt: number;
}

const concrete = new THREE.MeshStandardMaterial({ color: 0x273138, roughness: 0.94 });
const darkMetal = new THREE.MeshStandardMaterial({ color: 0x11191e, roughness: 0.72, metalness: 0.55 });
const amber = new THREE.MeshStandardMaterial({
  color: 0xa96213,
  emissive: 0x3d1700,
  emissiveIntensity: 0.8,
  roughness: 0.55,
});

export class CombatWorld {
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(74, 1, 0.05, 180);
  readonly renderer: THREE.WebGLRenderer;
  readonly targets: TargetRig[] = [];
  private readonly raycaster = new THREE.Raycaster();
  private readonly clock = new THREE.Clock();

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.scene.background = new THREE.Color(0x050b0e);
    this.scene.fog = new THREE.FogExp2(0x071015, 0.018);
    this.camera.rotation.order = "YXZ";
    this.buildRange();
    this.resize();
  }

  private box(
    size: [number, number, number],
    position: [number, number, number],
    material: THREE.Material = concrete,
  ): THREE.Mesh {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
    mesh.position.set(...position);
    mesh.receiveShadow = true;
    mesh.castShadow = true;
    this.scene.add(mesh);
    return mesh;
  }

  private buildRange(): void {
    this.scene.add(new THREE.HemisphereLight(0x8eb8c3, 0x10100d, 1.45));
    const key = new THREE.DirectionalLight(0xd5f5ff, 2.3);
    key.position.set(-7, 14, 7);
    key.castShadow = true;
    this.scene.add(key);

    this.box([30, 0.5, 52], [0, -0.25, -15]);
    this.box([30, 7, 0.5], [0, 3.5, -41]);
    this.box([0.5, 7, 52], [-15, 3.5, -15]);
    this.box([0.5, 7, 52], [15, 3.5, -15]);
    this.box([30, 0.5, 52], [0, 7, -15], darkMetal);

    for (let z = 6; z >= -38; z -= 8) {
      this.box([28, 0.06, 0.08], [0, 0.03, z], amber);
      const light = new THREE.PointLight(0x65d7ff, 4.2, 15, 2);
      light.position.set(z % 16 === 6 ? -8 : 8, 5.8, z - 3);
      this.scene.add(light);
      this.box([5, 0.12, 0.35], [light.position.x, 6.7, light.position.z], darkMetal);
    }

    this.box([5, 1.4, 1.2], [-6, 0.7, -9], darkMetal);
    this.box([5, 2.3, 1.2], [6, 1.15, -18], darkMetal);
    this.box([3.5, 0.9, 1], [0, 0.45, -28], darkMetal);

    this.targets.push(this.createTarget(-3.8, -14, "A1"));
    this.targets.push(this.createTarget(4.8, -25, "B2"));

    const grid = new THREE.GridHelper(52, 52, 0x32454e, 0x17232a);
    grid.position.set(0, 0.015, -15);
    this.scene.add(grid);
  }

  private createTarget(x: number, z: number, label: string): TargetRig {
    const root = new THREE.Group();
    root.position.set(x, 0, z);
    const stem = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.3, 0.12), darkMetal);
    stem.position.y = 0.65;
    root.add(stem);
    const plateMaterial = new THREE.MeshStandardMaterial({
      color: 0xc7d8d9,
      emissive: 0x10242a,
      metalness: 0.72,
      roughness: 0.35,
    });
    const plate = new THREE.Mesh(new THREE.BoxGeometry(1.3, 2.2, 0.18), plateMaterial);
    plate.position.y = 2.3;
    plate.userData.targetIndex = this.targets.length;
    root.add(plate);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.42, 12, 8), plateMaterial);
    head.position.y = 3.65;
    head.userData.targetIndex = this.targets.length;
    root.add(head);

    const tag = document.createElement("canvas");
    tag.width = 256;
    tag.height = 64;
    const context = tag.getContext("2d");
    if (context) {
      context.fillStyle = "#081015";
      context.fillRect(0, 0, 256, 64);
      context.fillStyle = "#ffb23e";
      context.font = "700 30px monospace";
      context.textAlign = "center";
      context.fillText(`THREAT ${label}`, 128, 42);
    }
    const tagMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1.7, 0.42),
      new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(tag), transparent: true }),
    );
    tagMesh.position.set(0, 0.32, 0.12);
    root.add(tagMesh);
    this.scene.add(root);
    return { state: new TargetState(), root, plate, resetAt: 0 };
  }

  shoot(): { hit: boolean; eliminated: boolean; range: number } {
    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    const meshes = this.targets.flatMap((target) =>
      target.root.children.filter((child): child is THREE.Mesh => child instanceof THREE.Mesh),
    );
    const hit = this.raycaster.intersectObjects(meshes, false)[0];
    if (!hit) return { hit: false, eliminated: false, range: 0 };

    const index = hit.object.userData.targetIndex as number | undefined;
    if (index === undefined) return { hit: false, eliminated: false, range: 0 };
    const target = this.targets[index];
    if (!target || target.state.eliminated) return { hit: false, eliminated: false, range: 0 };
    target.state.applyDamage(24);
    const material = target.plate.material as THREE.MeshStandardMaterial;
    material.emissive.setHex(target.state.eliminated ? 0x5e0909 : 0x8c4100);
    material.color.setHex(target.state.eliminated ? 0x2c3334 : 0xf4d091);
    if (target.state.eliminated) {
      target.root.rotation.z = xDirection(target.root.position.x) * 1.42;
      target.resetAt = performance.now() + 3200;
    } else {
      window.setTimeout(() => material.emissive.setHex(0x10242a), 85);
    }
    return { hit: true, eliminated: target.state.eliminated, range: hit.distance };
  }

  updateTargets(now: number): void {
    for (const target of this.targets) {
      if (target.resetAt === 0 || now < target.resetAt) continue;
      target.state.reset();
      target.root.rotation.z = 0;
      target.resetAt = 0;
      const material = target.plate.material as THREE.MeshStandardMaterial;
      material.color.setHex(0xc7d8d9);
      material.emissive.setHex(0x10242a);
    }
  }

  resize(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  render(): number {
    const delta = Math.min(this.clock.getDelta(), 0.05);
    this.renderer.render(this.scene, this.camera);
    return delta;
  }
}

function xDirection(x: number): number {
  return x < 0 ? -1 : 1;
}
