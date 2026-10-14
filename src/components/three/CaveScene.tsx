import { useEffect, useMemo, useRef, type RefObject } from 'react';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Hang động voxel nguyên bản: địa hình sinh bằng noise, quặng phát sáng, đuốc,
 * cụm pha lê lơ lửng, đèn lồng theo chuột, click để đào khối.
 * Render ở độ phân giải thấp (dpr ~0.34) + image-rendering: pixelated → chất pixel-art 3D.
 */

export type MinedKind = 'stone' | 'dirt' | 'copper' | 'gold' | 'crystal';
type MeshKey = 'terrain' | 'copper' | 'gold' | 'crystal';

interface Block {
  x: number;
  y: number;
  z: number;
  kind: MinedKind;
  mesh: MeshKey;
  index: number;
  wall: boolean;
}

const W = 30;
const D = 20;
const RESPAWN_MS = 15000;

// ---------- Noise tất định (cùng 1 hang mỗi lần load) ----------
function hash(x: number, z: number, seed = 239) {
  let h = Math.imul(x, 374761393) + Math.imul(z, 668265263) + Math.imul(seed, 2147483647);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}
function noise(x: number, z: number) {
  const xi = Math.floor(x);
  const zi = Math.floor(z);
  const xf = x - xi;
  const zf = z - zi;
  const s = (t: number) => t * t * (3 - 2 * t);
  const lerp = THREE.MathUtils.lerp;
  return lerp(lerp(hash(xi, zi), hash(xi + 1, zi), s(xf)), lerp(hash(xi, zi + 1), hash(xi + 1, zi + 1), s(xf)), s(zf));
}

const TERRAIN_COLORS: Record<'stone' | 'dirt' | 'moss', string[]> = {
  stone: ['#4b4e6d', '#44465f', '#555878', '#3d3f5a'],
  dirt: ['#5a3e2b', '#6e4d36', '#4f3626', '#634431'],
  moss: ['#3f7a32', '#4c8c3a', '#37692c'],
};
const ORE: Record<'copper' | 'gold' | 'crystal', { color: string; emissive: string; intensity: number }> = {
  copper: { color: '#e07a3f', emissive: '#a8401a', intensity: 0.6 },
  gold: { color: '#f5c542', emissive: '#b8862a', intensity: 0.8 },
  crystal: { color: '#5ef2e6', emissive: '#1f9c9a', intensity: 1.6 },
};
export const DEBRIS_COLOR: Record<MinedKind, string> = {
  stone: '#6b6f93',
  dirt: '#8a5a34',
  copper: '#e07a3f',
  gold: '#f5c542',
  crystal: '#5ef2e6',
};

function generateCave() {
  const blocks: Block[] = [];
  const counts: Record<MeshKey, number> = { terrain: 0, copper: 0, gold: 0, crystal: 0 };
  const columns = new Map<string, number[]>(); // "x,z" → block ids từ dưới lên
  const push = (b: Omit<Block, 'index'>) => {
    const id = blocks.length;
    blocks.push({ ...b, index: counts[b.mesh]++ });
    const key = `${b.x},${b.z}`;
    if (!columns.has(key)) columns.set(key, []);
    columns.get(key)!.push(id);
  };

  for (let gx = 0; gx < W; gx++) {
    for (let gz = 0; gz < D; gz++) {
      const x = gx - W / 2 + 0.5;
      const z = gz - D / 2 + 0.5;
      const n = noise(gx * 0.28, gz * 0.28);
      // Khoảng trống hình elip ở giữa, viền méo theo noise
      const e = (x / 9.5) ** 2 + (z / 5.6) ** 2 + (n - 0.5) * 0.7;
      const floorKind: MinedKind = n > 0.55 ? 'stone' : 'dirt';
      push({ x, y: 0, z, kind: floorKind, mesh: 'terrain', wall: false });

      if (e > 1) {
        const h = Math.min(4, 1 + Math.floor((e - 1) * 2.2 + n * 1.6));
        for (let y = 1; y <= h; y++) {
          const r = hash(gx * 7 + y, gz * 13 - y, 42);
          if (r < 0.035) push({ x, y, z, kind: 'crystal', mesh: 'crystal', wall: true });
          else if (r < 0.08) push({ x, y, z, kind: 'gold', mesh: 'gold', wall: true });
          else if (r < 0.14) push({ x, y, z, kind: 'copper', mesh: 'copper', wall: true });
          else push({ x, y, z, kind: y === h && n < 0.45 ? 'dirt' : 'stone', mesh: 'terrain', wall: true });
        }
      }
    }
  }
  return { blocks, counts, columns };
}

const tmp = new THREE.Object3D();
const ZERO = new THREE.Matrix4().makeScale(0, 0, 0);

function matrixOf(b: Block) {
  tmp.position.set(b.x, b.y, b.z);
  tmp.rotation.set(0, 0, 0);
  tmp.scale.set(1, 1, 1);
  tmp.updateMatrix();
  return tmp.matrix.clone();
}

// ---------- Mảnh vụn khi đào ----------
const DEBRIS = 60;
function useDebris() {
  const ref = useRef<THREE.InstancedMesh>(null!);
  const state = useMemo(
    () =>
      Array.from({ length: DEBRIS }, () => ({
        life: 0,
        p: new THREE.Vector3(),
        v: new THREE.Vector3(),
      })),
    [],
  );
  const cursor = useRef(0);
  const color = useMemo(() => new THREE.Color(), []);

  const spawn = (pos: THREE.Vector3, hex: string) => {
    color.set(hex);
    for (let i = 0; i < 12; i++) {
      const k = cursor.current++ % DEBRIS;
      const d = state[k];
      d.life = 0.9 + Math.random() * 0.4;
      d.p.copy(pos);
      d.v.set((Math.random() - 0.5) * 5, 3 + Math.random() * 3, (Math.random() - 0.5) * 5);
      ref.current.setColorAt(k, color);
    }
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
  };

  useFrame((_, delta) => {
    const mesh = ref.current;
    if (!mesh) return;
    let any = false;
    state.forEach((d, i) => {
      if (d.life > 0) {
        any = true;
        d.life -= delta;
        d.v.y -= 14 * delta;
        d.p.addScaledVector(d.v, delta);
        tmp.position.copy(d.p);
        tmp.rotation.set(d.life * 6, d.life * 4, 0);
        const s = Math.max(0, Math.min(1, d.life)) * 0.22;
        tmp.scale.set(s, s, s);
        tmp.updateMatrix();
        mesh.setMatrixAt(i, tmp.matrix);
      } else {
        mesh.setMatrixAt(i, ZERO);
      }
    });
    if (any || mesh.userData.dirty !== false) {
      mesh.instanceMatrix.needsUpdate = true;
      mesh.userData.dirty = any;
    }
  });

  const node = (
    <instancedMesh ref={ref} args={[undefined, undefined, DEBRIS]} frustumCulled={false}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial roughness={1} />
    </instancedMesh>
  );
  return { node, spawn };
}

// ---------- Địa hình + đào ----------
function Terrain({ onMine }: { onMine?: (kind: MinedKind) => void }) {
  const { blocks, counts, columns } = useMemo(generateCave, []);
  const refs = {
    terrain: useRef<THREE.InstancedMesh>(null!),
    copper: useRef<THREE.InstancedMesh>(null!),
    gold: useRef<THREE.InstancedMesh>(null!),
    crystal: useRef<THREE.InstancedMesh>(null!),
  };
  // tra ngược: mesh + instanceId → block id
  const lookup = useMemo(() => {
    const map: Record<MeshKey, number[]> = { terrain: [], copper: [], gold: [], crystal: [] };
    blocks.forEach((b, id) => (map[b.mesh][b.index] = id));
    return map;
  }, [blocks]);
  const mined = useRef(new Set<number>());
  const selection = useRef<THREE.LineSegments>(null!);
  const debris = useDebris();
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const color = new THREE.Color();
    blocks.forEach((b, id) => {
      const mesh = refs[b.mesh].current;
      mesh.setMatrixAt(b.index, matrixOf(b));
      if (b.mesh === 'terrain') {
        const isTop = b.wall ? columns.get(`${b.x},${b.z}`)!.at(-1) === id : false;
        const palette = !b.wall && b.kind === 'dirt' && hash(b.x * 3, b.z * 5, 7) < 0.25 ? TERRAIN_COLORS.moss : TERRAIN_COLORS[b.kind === 'dirt' ? 'dirt' : 'stone'];
        color.set(palette[Math.floor(hash(b.x * 11 + b.y, b.z * 17, 3) * palette.length)]);
        if (isTop) color.offsetHSL(0, 0, 0.04);
        mesh.setColorAt(b.index, color);
      }
    });
    (Object.keys(refs) as MeshKey[]).forEach((k) => {
      const m = refs[k].current;
      m.instanceMatrix.needsUpdate = true;
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
      m.computeBoundingSphere();
    });
    const t = timers.current;
    return () => t.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blocks]);

  /** Khối trên cùng còn lại của cột chứa block id */
  const topOf = (id: number) => {
    const b = blocks[id];
    const col = columns.get(`${b.x},${b.z}`)!;
    for (let i = col.length - 1; i >= 0; i--) {
      const cand = blocks[col[i]];
      if (!mined.current.has(col[i]) && cand.wall) return col[i];
    }
    return -1;
  };

  const resolve = (key: MeshKey, e: ThreeEvent<PointerEvent | MouseEvent>) => {
    if (e.instanceId === undefined) return -1;
    return topOf(lookup[key][e.instanceId]);
  };

  const ignore = (e: ThreeEvent<PointerEvent | MouseEvent>) => !!(e.nativeEvent.target as HTMLElement | null)?.closest?.('a, button, input, textarea');

  const onMove = (key: MeshKey) => (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const id = ignore(e) ? -1 : resolve(key, e);
    const sel = selection.current;
    if (id < 0) {
      sel.visible = false;
      return;
    }
    const b = blocks[id];
    sel.position.set(b.x, b.y, b.z);
    sel.visible = true;
  };

  const onDown = (key: MeshKey) => (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (ignore(e)) return;
    const id = resolve(key, e);
    if (id < 0) return;
    const b = blocks[id];
    const mesh = refs[b.mesh].current;
    mined.current.add(id);
    mesh.setMatrixAt(b.index, ZERO);
    mesh.instanceMatrix.needsUpdate = true;
    debris.spawn(new THREE.Vector3(b.x, b.y, b.z), DEBRIS_COLOR[b.kind]);
    selection.current.visible = false;
    onMine?.(b.kind);
    // hồi lại sau một lúc để hang không bị đào trụi
    timers.current.push(
      window.setTimeout(() => {
        mined.current.delete(id);
        mesh.setMatrixAt(b.index, matrixOf(b));
        mesh.instanceMatrix.needsUpdate = true;
      }, RESPAWN_MS),
    );
  };

  const handlers = (key: MeshKey) => ({
    onPointerMove: onMove(key),
    onClick: onDown(key),
    onPointerOut: () => (selection.current.visible = false),
  });

  return (
    <group>
      <instancedMesh ref={refs.terrain} args={[undefined, undefined, counts.terrain]} {...handlers('terrain')}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial roughness={1} />
      </instancedMesh>
      {(['copper', 'gold', 'crystal'] as const).map((k) => (
        <instancedMesh key={k} ref={refs[k]} args={[undefined, undefined, Math.max(1, counts[k])]} {...handlers(k)}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={ORE[k].color} emissive={ORE[k].emissive} emissiveIntensity={ORE[k].intensity} roughness={0.6} />
        </instancedMesh>
      ))}
      <lineSegments ref={selection} visible={false}>
        <edgesGeometry args={[new THREE.BoxGeometry(1.06, 1.06, 1.06)]} />
        <lineBasicMaterial color="#ffd76a" />
      </lineSegments>
      {debris.node}
    </group>
  );
}

// ---------- Cụm pha lê trung tâm ----------
function CrystalCluster({ calm }: { calm: boolean }) {
  const group = useRef<THREE.Group>(null!);
  const orbit = useRef<THREE.Group>(null!);
  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const k = calm ? 0.25 : 1;
    group.current.rotation.y += delta * 0.4 * k;
    group.current.position.y = 1.9 + Math.sin(t * 1.4 * k) * 0.18;
    orbit.current.rotation.y -= delta * 0.9 * k;
  });
  return (
    <group position={[0, 0, 0]}>
      <group ref={group}>
        <mesh scale={[0.55, 1, 0.55]}>
          <octahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#5ef2e6" emissive="#1f9c9a" emissiveIntensity={1.8} flatShading roughness={0.2} />
        </mesh>
        <mesh position={[0.55, -0.45, 0.1]} scale={[0.25, 0.5, 0.25]} rotation={[0, 0, -0.5]}>
          <octahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#b77cff" emissive="#6d3fb3" emissiveIntensity={1.6} flatShading />
        </mesh>
        <mesh position={[-0.5, -0.5, -0.15]} scale={[0.22, 0.42, 0.22]} rotation={[0, 0, 0.6]}>
          <octahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#c9fffa" emissive="#5ef2e6" emissiveIntensity={1.2} flatShading />
        </mesh>
      </group>
      <group ref={orbit} position={[0, 1.6, 0]}>
        {Array.from({ length: 6 }).map((_, i) => {
          const a = (i / 6) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(a) * 1.6, Math.sin(a * 2) * 0.25, Math.sin(a) * 1.6]} scale={0.14}>
              <boxGeometry />
              <meshStandardMaterial color={i % 2 ? '#ffd76a' : '#5ef2e6'} emissive={i % 2 ? '#e8772e' : '#1f9c9a'} emissiveIntensity={1.5} />
            </mesh>
          );
        })}
      </group>
      {/* Bệ đá */}
      <mesh position={[0, 0.65, 0]} scale={[1.4, 0.3, 1.4]}>
        <boxGeometry />
        <meshStandardMaterial color="#555878" roughness={1} />
      </mesh>
      <mesh position={[0, 0.9, 0]} scale={[0.9, 0.2, 0.9]}>
        <boxGeometry />
        <meshStandardMaterial color="#6b6f93" roughness={1} />
      </mesh>
      <pointLight position={[0, 2.2, 0]} color="#5ef2e6" intensity={14} distance={11} decay={2} />
    </group>
  );
}

// ---------- Đuốc ----------
function TorchPost({ position, phase }: { position: [number, number, number]; phase: number }) {
  const light = useRef<THREE.PointLight>(null!);
  const flame = useRef<THREE.Mesh>(null!);
  useFrame((state) => {
    const t = state.clock.elapsedTime * 9 + phase;
    const f = 0.85 + Math.sin(t) * 0.08 + Math.sin(t * 2.7) * 0.07;
    light.current.intensity = 11 * f;
    flame.current.scale.setScalar(0.22 * (0.9 + f * 0.15));
  });
  return (
    <group position={position}>
      <mesh position={[0, 0.85, 0]} scale={[0.14, 0.75, 0.14]}>
        <boxGeometry />
        <meshStandardMaterial color="#8a5a34" roughness={1} />
      </mesh>
      <mesh ref={flame} position={[0, 1.32, 0]}>
        <boxGeometry />
        <meshStandardMaterial color="#ffd76a" emissive="#ff9a3c" emissiveIntensity={3} />
      </mesh>
      <pointLight ref={light} position={[0, 1.6, 0]} color="#ffb347" distance={7} decay={2} />
    </group>
  );
}

// ---------- Bào tử bay lơ lửng ----------
function Spores({ calm }: { calm: boolean }) {
  const ref = useRef<THREE.Points>(null!);
  const COUNT = 140;
  const positions = useMemo(() => {
    const arr = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      arr[i * 3] = (Math.random() - 0.5) * W;
      arr[i * 3 + 1] = Math.random() * 5;
      arr[i * 3 + 2] = (Math.random() - 0.5) * D;
    }
    return arr;
  }, []);
  useFrame((state, delta) => {
    const pos = ref.current.geometry.attributes.position as THREE.BufferAttribute;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < COUNT; i++) {
      let y = pos.getY(i) + delta * (0.25 + (i % 5) * 0.05) * (calm ? 0.3 : 1);
      if (y > 5) y = 0.5;
      pos.setY(i, y);
      pos.setX(i, pos.getX(i) + Math.sin(t + i) * delta * 0.15);
    }
    pos.needsUpdate = true;
  });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.09} color="#9ff7ef" transparent opacity={0.85} sizeAttenuation />
    </points>
  );
}

// ---------- Đèn lồng theo chuột + camera ----------
const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.6);
const hit = new THREE.Vector3();

function LanternAndCamera({ calm }: { calm: boolean }) {
  const light = useRef<THREE.PointLight>(null!);
  const { camera, size } = useThree();
  const narrow = size.width < size.height;
  const base = useMemo(() => (narrow ? new THREE.Vector3(0, 20, 15) : new THREE.Vector3(0, 13.5, 11)), [narrow]);

  useFrame((state, delta) => {
    state.raycaster.setFromCamera(state.pointer, camera);
    if (state.raycaster.ray.intersectPlane(plane, hit)) {
      light.current.position.x = THREE.MathUtils.damp(light.current.position.x, hit.x, 10, delta);
      light.current.position.z = THREE.MathUtils.damp(light.current.position.z, hit.z, 10, delta);
    }
    camera.position.x = THREE.MathUtils.damp(camera.position.x, base.x + (calm ? 0 : state.pointer.x * 1.2), 2, delta);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, base.y, 2, delta);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, base.z - (calm ? 0 : state.pointer.y * 0.8), 2, delta);
    camera.lookAt(0, 0.5, 0);
  });

  return <pointLight ref={light} position={[0, 2.2, 0]} color="#ffcf8a" intensity={9} distance={6.5} decay={2} />;
}

interface Props {
  active: boolean;
  intense?: boolean;
  /** người dùng bật giảm chuyển động → vẫn hiện hang nhưng chuyển động chậm, camera đứng yên */
  calm?: boolean;
  eventSource: RefObject<HTMLElement | null>;
  onMine?: (kind: MinedKind) => void;
}

export default function CaveScene({ active, intense = false, calm = false, eventSource, onMine }: Props) {
  return (
    <Canvas
      frameloop={active ? 'always' : 'never'}
      dpr={0.34}
      camera={{ position: [0, 13.5, 11], fov: 40 }}
      gl={{ antialias: false, alpha: false, powerPreference: 'high-performance' }}
      eventSource={eventSource as RefObject<HTMLElement>}
      eventPrefix="client"
      onCreated={({ gl }) => {
        gl.domElement.style.imageRendering = 'pixelated';
      }}
      style={{ pointerEvents: 'none' }}
    >
      <color attach="background" args={['#07070d']} />
      <fog attach="fog" args={['#07070d', 14, 30]} />
      <ambientLight intensity={intense ? 0.6 : 0.28} color="#7a7fc0" />
      <directionalLight position={[4, 10, 6]} intensity={0.35} color="#a6a9ff" />

      <Terrain onMine={onMine} />
      <CrystalCluster calm={calm} />
      <TorchPost position={[-6.2, 0, -2.6]} phase={0} />
      <TorchPost position={[6.4, 0, -2.2]} phase={2} />
      <TorchPost position={[-5.6, 0, 3.2]} phase={4} />
      <TorchPost position={[5.8, 0, 3.4]} phase={1} />
      <Spores calm={calm} />
      <LanternAndCamera calm={calm} />
    </Canvas>
  );
}
