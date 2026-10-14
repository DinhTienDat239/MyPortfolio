import { useEffect, useLayoutEffect, useMemo, useRef, type RefObject } from 'react';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { BIOMES } from '../engine/biomes';
import { hash2 } from '../engine/paint';
import { projects, rarityOf, CATEGORY_ICON } from '../data';
import { navigate } from '../lib/router';
import type { MinedKind } from '../engine/CaveWorld';
import { FLOOR, WALL, WATER, generateWorld, toTile, toWorld, type OreType, type WorldMap } from './map';
import { floorTexture, glowTexture, spriteTexture, wallFaceTexture, wallTopTexture } from './textures';
import { exitPlay, input, nearProject, playing, pressAction } from './state';

/**
 * Thế giới 3D chơi được — camera trực giao nhìn nghiêng (kiểu game hang động 3/4),
 * tường là khối texture pixel, nhân vật/vật phẩm là sprite đứng, ánh sáng là đèn điểm thật.
 * Render ở 16 pixel/ô rồi phóng to (pixelated) → từng texel = 1 "pixel game".
 */

const CAM_OFFSET = new THREE.Vector3(0, 10, 7);
const TILT = -Math.atan2(CAM_OFFSET.y, CAM_OFFSET.z); // sprite quay mặt về camera
const COS = Math.cos(-TILT);
const SIN = Math.sin(-TILT);
/** vị trí tâm sprite kích thước s sao cho chân chạm sàn tại (x, z) */
const ground = (x: number, z: number, s = 1, lift = 0): [number, number, number] => [x, (s / 2) * Math.sin(Math.PI / 2 - -TILT) * 0 + (s / 2) * COS + lift, z + 0.25 - (s / 2) * SIN];

const RARITY_HEX: Record<string, string> = { common: '#e4e1d6', uncommon: '#8ad65e', rare: '#5fb0ff', epic: '#c08cff', legendary: '#ffae42' };
const ORE_KIND: Record<OreType, MinedKind> = { copper: 'copper', gold: 'gold', crystal: 'crystal' };

// ---------------- Trạng thái game (mutable, ngoài React) ----------------
const player = { x: 0, z: 0, dx: 0, dz: 1, face: 1, moving: false };
const api = {
  hit: (_i: number): boolean => false,
  burst: (_x: number, _z: number, _c: string, _n: number) => {},
};

function SpritePlane({ name, size = 1, position, basic = false, recolor, meshRef }: {
  name: Parameters<typeof spriteTexture>[0];
  size?: number;
  position: [number, number, number];
  basic?: boolean;
  recolor?: Record<string, string>;
  meshRef?: RefObject<THREE.Mesh | null>;
}) {
  const map = useMemo(() => spriteTexture(name, recolor), [name, recolor]);
  return (
    <mesh ref={meshRef} position={position} rotation-x={TILT}>
      <planeGeometry args={[size, size]} />
      {basic ? <meshBasicMaterial map={map} alphaTest={0.5} toneMapped={false} /> : <meshLambertMaterial map={map} alphaTest={0.5} />}
    </mesh>
  );
}

// ---------------- Sàn ----------------
function Floor({ map }: { map: WorldMap }) {
  const tex = useMemo(() => floorTexture(map), [map]);
  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, 0, 0]}>
      <planeGeometry args={[map.W, map.H]} />
      <meshLambertMaterial map={tex} />
    </mesh>
  );
}

// ---------------- Tường (instanced) + đào ----------------
type Variant = 'plain' | OreType;
const VARIANTS: Variant[] = ['plain', 'copper', 'gold', 'crystal'];
const ZERO = new THREE.Matrix4().makeScale(0, 0, 0);
const tmp = new THREE.Object3D();

function Walls({ map, interactive, onMine }: { map: WorldMap; interactive: boolean; onMine?: (k: MinedKind) => void }) {
  const groups = useMemo(() => {
    const g: Record<Variant, number[]> = { plain: [], copper: [], gold: [], crystal: [] };
    map.tiles.forEach((t, i) => t === WALL && g[(map.ore[i] ?? 'plain') as Variant].push(i));
    return g;
  }, [map]);
  const where = useMemo(() => {
    const m = new Map<number, { v: Variant; k: number }>();
    VARIANTS.forEach((v) => groups[v].forEach((tile, k) => m.set(tile, { v, k })));
    return m;
  }, [groups]);
  const materials = useMemo(() => {
    const top = new THREE.MeshLambertMaterial({ map: wallTopTexture() });
    const out = {} as Record<Variant, THREE.Material[]>;
    VARIANTS.forEach((v) => {
      const faceTex = wallFaceTexture(BIOMES.burrow, v === 'plain' ? undefined : v);
      const face = new THREE.MeshLambertMaterial({
        map: faceTex,
        ...(v === 'crystal' || v === 'gold' ? { emissiveMap: faceTex, emissive: new THREE.Color(v === 'crystal' ? '#5ef2e6' : '#f2c14e'), emissiveIntensity: 0.35 } : {}),
      });
      out[v] = [face, face, top, top, face, face];
    });
    return out;
  }, []);
  const refs = {
    plain: useRef<THREE.InstancedMesh>(null!),
    copper: useRef<THREE.InstancedMesh>(null!),
    gold: useRef<THREE.InstancedMesh>(null!),
    crystal: useRef<THREE.InstancedMesh>(null!),
  };
  const hits = useRef(new Uint8Array(map.W * map.H));
  const shake = useRef<{ tile: number; t: number } | null>(null);

  const place = (tile: number, jitter = 0) => {
    const [wx, wz] = toWorld(map, tile % map.W, Math.floor(tile / map.W));
    tmp.position.set(wx + jitter, 0.5, wz);
    tmp.rotation.set(0, 0, 0);
    tmp.scale.set(1, 1, 1);
    tmp.updateMatrix();
    return tmp.matrix;
  };

  useLayoutEffect(() => {
    VARIANTS.forEach((v) => {
      const mesh = refs[v].current;
      if (!mesh) return;
      groups[v].forEach((tile, k) => mesh.setMatrixAt(k, place(tile)));
      mesh.count = groups[v].length;
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingSphere();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups]);

  useEffect(() => {
    api.hit = (tile: number) => {
      const x = tile % map.W;
      const y = Math.floor(tile / map.W);
      if (x <= 0 || y <= 0 || x >= map.W - 1 || y >= map.H - 1 || map.tiles[tile] !== WALL) return false;
      const w = where.get(tile);
      if (!w) return false;
      const [wx, wz] = toWorld(map, x, y);
      hits.current[tile]++;
      shake.current = { tile, t: 0.18 };
      api.burst(wx, wz + 0.5, BIOMES.burrow.wallFace[0], 5);
      if (hits.current[tile] >= 3) {
        const mesh = refs[w.v].current;
        mesh.setMatrixAt(w.k, ZERO);
        mesh.instanceMatrix.needsUpdate = true;
        map.tiles[tile] = FLOOR;
        shake.current = null;
        const ore = map.ore[tile];
        api.burst(wx, wz, ore ? (ore === 'copper' ? '#e8873f' : ore === 'gold' ? '#f2c14e' : '#5ef2e6') : BIOMES.burrow.wallLip, 16);
        onMine?.(ore ? ORE_KIND[ore] : hash2(x, y, 4) < 0.5 ? 'dirt' : 'stone');
      }
      return true;
    };
  }, [map, where, onMine]);

  useFrame((_, dt) => {
    const s = shake.current;
    if (!s) return;
    s.t -= dt;
    const w = where.get(s.tile);
    if (!w) return;
    const mesh = refs[w.v].current;
    mesh.setMatrixAt(w.k, place(s.tile, s.t > 0 ? Math.sin(s.t * 120) * 0.05 : 0));
    mesh.instanceMatrix.needsUpdate = true;
    if (s.t <= 0) shake.current = null;
  });

  const onClick = (v: Variant) => (e: ThreeEvent<MouseEvent>) => {
    if (!interactive || playing.get() || e.instanceId === undefined) return;
    if ((e.nativeEvent.target as HTMLElement | null)?.closest?.('a, button')) return;
    e.stopPropagation();
    api.hit(groups[v][e.instanceId]);
  };

  return (
    <group>
      {VARIANTS.map((v) => (
        <instancedMesh key={v} ref={refs[v]} args={[undefined, undefined, Math.max(1, groups[v].length)]} material={materials[v]} onClick={onClick(v)}>
          <boxGeometry args={[1, 1, 1]} />
        </instancedMesh>
      ))}
    </group>
  );
}

// ---------------- Mảnh vụn ----------------
const DEBRIS = 80;
function Debris() {
  const ref = useRef<THREE.InstancedMesh>(null!);
  const parts = useMemo(() => Array.from({ length: DEBRIS }, () => ({ life: 0, p: new THREE.Vector3(), v: new THREE.Vector3() })), []);
  const cursor = useRef(0);
  const color = useMemo(() => new THREE.Color(), []);
  useEffect(() => {
    api.burst = (x, z, c, n) => {
      color.set(c);
      for (let i = 0; i < n; i++) {
        const k = cursor.current++ % DEBRIS;
        const d = parts[k];
        d.life = 0.6 + Math.random() * 0.4;
        d.p.set(x + (Math.random() - 0.5) * 0.6, 0.6 + Math.random() * 0.4, z + (Math.random() - 0.5) * 0.3);
        d.v.set((Math.random() - 0.5) * 3, 2 + Math.random() * 2.5, (Math.random() - 0.2) * 2.5);
        ref.current.setColorAt(k, color);
      }
      if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
    };
  }, [parts, color]);
  useFrame((_, dt) => {
    const mesh = ref.current;
    parts.forEach((d, i) => {
      if (d.life > 0) {
        d.life -= dt;
        d.v.y -= 12 * dt;
        d.p.addScaledVector(d.v, dt);
        if (d.p.y < 0.05) {
          d.p.y = 0.05;
          d.v.multiplyScalar(0.4);
        }
        const s = Math.max(0, Math.min(1, d.life * 2)) * 0.11;
        tmp.position.copy(d.p);
        tmp.rotation.set(0, 0, 0);
        tmp.scale.set(s, s, s);
        tmp.updateMatrix();
        mesh.setMatrixAt(i, tmp.matrix);
      } else mesh.setMatrixAt(i, ZERO);
    });
    mesh.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, DEBRIS]} frustumCulled={false}>
      <boxGeometry />
      <meshLambertMaterial />
    </instancedMesh>
  );
}

// ---------------- Đuốc ----------------
function Torch({ x, z, phase }: { x: number; z: number; phase: number }) {
  const a = useRef<THREE.Mesh>(null);
  const b = useRef<THREE.Mesh>(null);
  const light = useRef<THREE.PointLight>(null!);
  useFrame((state) => {
    const t = state.clock.elapsedTime * 9 + phase;
    const f = 0.85 + Math.sin(t) * 0.07 + Math.sin(t * 2.3) * 0.06;
    light.current.intensity = 7 * f;
    const on = Math.floor(state.clock.elapsedTime * 7 + phase) % 2 === 0;
    if (a.current) a.current.visible = on;
    if (b.current) b.current.visible = !on;
  });
  const pos = ground(x, z - 0.42, 1, 0.15);
  return (
    <group>
      <SpritePlane name="torch" position={pos} basic meshRef={a} />
      <SpritePlane name="torch2" position={pos} basic meshRef={b} />
      <pointLight ref={light} position={[x, 1.3, z - 0.1]} color="#ffaa58" distance={7.5} decay={1.6} />
    </group>
  );
}

// ---------------- Bệ pha lê trung tâm ----------------
function Shrine({ map }: { map: WorldMap }) {
  const [x, z] = toWorld(map, map.shrine.x, map.shrine.y);
  const gem = useRef<THREE.Mesh>(null);
  const light = useRef<THREE.PointLight>(null!);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (gem.current) gem.current.position.y = ground(x, z, 1.4, 0.75)[1] + Math.sin(t * 1.6) * 0.08;
    light.current.intensity = 9 + Math.sin(t * 1.6) * 1.2;
  });
  return (
    <group>
      <mesh position={[x, 0.18, z]}>
        <boxGeometry args={[2.6, 0.36, 1.7]} />
        <meshLambertMaterial color="#4c5070" />
      </mesh>
      <mesh position={[x, 0.45, z]}>
        <boxGeometry args={[1.5, 0.2, 1]} />
        <meshLambertMaterial color="#6b7096" />
      </mesh>
      <SpritePlane name="gem" size={1.4} position={ground(x, z, 1.4, 0.75)} basic meshRef={gem} />
      <pointLight ref={light} position={[x, 1.8, z + 0.3]} color="#5ef2e6" distance={9} decay={1.5} />
    </group>
  );
}

// ---------------- Bệ trưng bày dự án ----------------
function Pedestal({ map, index }: { map: WorldMap; index: number }) {
  const p = map.pedestals[index];
  const project = projects[index];
  const [x, z] = toWorld(map, p.x, p.y);
  const item = useRef<THREE.Mesh>(null);
  const ring = useRef<THREE.Mesh>(null);
  const color = RARITY_HEX[project ? rarityOf(project) : 'common'];
  const glowMat = useMemo(() => new THREE.MeshBasicMaterial({ map: glowTexture(), color, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }), [color]);
  useFrame((state) => {
    const t = state.clock.elapsedTime + index;
    if (item.current) item.current.position.y = ground(x, z, 0.8, 0.62)[1] + Math.sin(t * 2) * 0.06;
    if (ring.current) {
      const near = nearProject.get() === project?.slug;
      (ring.current.material as THREE.MeshBasicMaterial).opacity = near ? 0.95 : 0.45 + Math.sin(t * 2) * 0.08;
      ring.current.scale.setScalar(near ? 2.4 : 1.8);
    }
  });
  if (!project) return null;
  return (
    <group>
      <mesh ref={ring} position={[x, 0.02, z]} rotation-x={-Math.PI / 2} material={glowMat}>
        <planeGeometry args={[1, 1]} />
      </mesh>
      <mesh position={[x, 0.22, z]}>
        <boxGeometry args={[0.8, 0.44, 0.8]} />
        <meshLambertMaterial color="#555a7c" />
      </mesh>
      <mesh position={[x, 0.47, z]}>
        <boxGeometry args={[0.9, 0.08, 0.9]} />
        <meshLambertMaterial color="#757aa3" />
      </mesh>
      <SpritePlane name={CATEGORY_ICON[project.category]} size={0.8} position={ground(x, z, 0.8, 0.62)} basic meshRef={item} />
    </group>
  );
}

// ---------------- Nhân vật + điều khiển ----------------
function Player({ map }: { map: WorldMap }) {
  const mesh = useRef<THREE.Mesh>(null);
  const shadow = useRef<THREE.Mesh>(null);
  const lantern = useRef<THREE.PointLight>(null!);
  const { camera, pointer, raycaster } = useThree();
  const floorPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), []);
  const hitPoint = useMemo(() => new THREE.Vector3(), []);
  const blocked = useMemo(() => {
    const s = new Set<number>();
    for (let y = map.shrine.y - 1; y <= map.shrine.y; y++) for (let x = map.shrine.x - 1; x <= map.shrine.x + 1; x++) s.add(y * map.W + x);
    map.pedestals.forEach((p) => s.add(p.y * map.W + p.x));
    return s;
  }, [map]);

  useLayoutEffect(() => {
    const [sx, sz] = toWorld(map, map.spawn.x, map.spawn.y);
    Object.assign(player, { x: sx, z: sz, dx: 0, dz: 1, face: 1, moving: false });
  }, [map]);

  const solid = (wx: number, wz: number) => {
    const R = 0.28;
    for (const [ox, oz] of [[-R, -R], [R, -R], [-R, R], [R, R]]) {
      const [tx, ty] = toTile(map, wx + ox, wz + oz);
      if (tx < 0 || ty < 0 || tx >= map.W || ty >= map.H) return true;
      const i = ty * map.W + tx;
      if (map.tiles[i] === WALL || map.tiles[i] === WATER || blocked.has(i)) return true;
    }
    return false;
  };

  useFrame((state, dt) => {
    const play = playing.get();
    const k = input.keys;
    let mx = input.x + (k.has('d') || k.has('arrowright') ? 1 : 0) - (k.has('a') || k.has('arrowleft') ? 1 : 0);
    let mz = input.y + (k.has('s') || k.has('arrowdown') ? 1 : 0) - (k.has('w') || k.has('arrowup') ? 1 : 0);
    const len = Math.hypot(mx, mz);
    if (len > 1) {
      mx /= len;
      mz /= len;
    }
    player.moving = play && len > 0.15;
    if (player.moving) {
      const speed = 4.2 * dt;
      const nx = player.x + mx * speed;
      const nz = player.z + mz * speed;
      if (!solid(nx, player.z)) player.x = nx;
      if (!solid(player.x, nz)) player.z = nz;
      const l = Math.hypot(mx, mz);
      player.dx = mx / l;
      player.dz = mz / l;
      if (Math.abs(mx) > 0.15) player.face = mx > 0 ? 1 : -1;
    }

    // dự án gần nhất
    if (play) {
      let best: string | null = null;
      let bd = 1.6;
      map.pedestals.forEach((p, i) => {
        const [px, pz] = toWorld(map, p.x, p.y);
        const d = Math.hypot(px - player.x, pz - player.z);
        if (d < bd && projects[i]) {
          bd = d;
          best = projects[i].slug;
        }
      });
      if (nearProject.get() !== best) nearProject.set(best);

      if (input.action) {
        input.action = false;
        const near = nearProject.get();
        if (near) {
          exitPlay();
          navigate(`/work/${near}`);
        } else {
          const [tx, ty] = toTile(map, player.x + player.dx * 0.85, player.z + player.dz * 0.85);
          if (!api.hit(ty * map.W + tx)) {
            // thử ô kề theo hướng ngang/dọc chính
            const [ax, ay] = Math.abs(player.dx) > Math.abs(player.dz) ? toTile(map, player.x + Math.sign(player.dx) * 0.85, player.z) : toTile(map, player.x, player.z + Math.sign(player.dz) * 0.85);
            api.hit(ay * map.W + ax);
          }
        }
      }
    } else input.action = false;

    // sprite nhân vật
    const t = state.clock.elapsedTime;
    const bob = player.moving ? Math.abs(Math.sin(t * 12)) * 0.08 : Math.sin(t * 2.2) * 0.02;
    if (mesh.current) {
      const [gx, gy, gz] = ground(player.x, player.z, 1);
      mesh.current.position.set(gx, gy + bob, gz);
      mesh.current.scale.x = player.face;
    }
    shadow.current?.position.set(player.x, 0.02, player.z + 0.1);

    // đèn lồng: theo chuột khi chưa chơi, theo nhân vật khi chơi
    let lx = player.x;
    let lz = player.z;
    if (!play && state.pointer.x !== 0) {
      raycaster.setFromCamera(pointer, camera);
      if (raycaster.ray.intersectPlane(floorPlane, hitPoint)) {
        lx = hitPoint.x;
        lz = hitPoint.z;
      }
    }
    lantern.current.position.x = THREE.MathUtils.damp(lantern.current.position.x, lx, 10, dt);
    lantern.current.position.z = THREE.MathUtils.damp(lantern.current.position.z, lz, 10, dt);
  });

  const shadowMat = useMemo(() => new THREE.MeshBasicMaterial({ map: glowTexture(), color: '#000', transparent: true, opacity: 0.55, depthWrite: false }), []);
  return (
    <group>
      <mesh ref={shadow} rotation-x={-Math.PI / 2} material={shadowMat}>
        <planeGeometry args={[0.8, 0.5]} />
      </mesh>
      <SpritePlane name="explorer" position={[0, 0, 0]} meshRef={mesh} />
      <pointLight ref={lantern} position={[0, 1.4, 0]} color="#ffd29a" intensity={6} distance={6} decay={1.6} />
    </group>
  );
}

// ---------------- Camera ----------------
function CameraRig({ map, calm }: { map: WorldMap; calm: boolean }) {
  const { camera, size } = useThree();
  const target = useMemo(() => new THREE.Vector3(), []);
  const look = useMemo(() => new THREE.Vector3(), []);
  useFrame((state, dt) => {
    const play = playing.get();
    const wide = size.width >= 900;
    const [sx, sz] = toWorld(map, map.shrine.x, map.shrine.y);
    if (play) target.set(player.x, 0, player.z);
    else {
      const sway = calm ? 0 : Math.sin(state.clock.elapsedTime * 0.15) * 0.6;
      target.set(wide ? sx - 5.5 + sway : sx + sway * 0.5, 0, wide ? sz + 0.5 : sz + 3.2);
    }
    look.x = THREE.MathUtils.damp(look.x, target.x, play ? 6 : 2, dt);
    look.z = THREE.MathUtils.damp(look.z, target.z, play ? 6 : 2, dt);
    camera.position.set(look.x + CAM_OFFSET.x, CAM_OFFSET.y, look.z + CAM_OFFSET.z);
    camera.lookAt(look.x, 0, look.z);
    const zoom = play ? (wide ? 64 : 44) : wide ? 52 : 36;
    if (Math.abs(camera.zoom - zoom) > 0.05) {
      camera.zoom = THREE.MathUtils.damp(camera.zoom, zoom, 3, dt);
      camera.updateProjectionMatrix();
    }
  });
  return null;
}

// ---------------- Bàn phím ----------------
function useKeyboard() {
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (!playing.get()) return;
      const k = e.key.toLowerCase();
      if (k === 'escape') return exitPlay();
      if (k === 'e' || k === ' ' || k === 'enter') {
        e.preventDefault();
        if (!e.repeat) pressAction();
        return;
      }
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) {
        e.preventDefault();
        input.keys.add(k);
      }
    };
    const up = (e: KeyboardEvent) => input.keys.delete(e.key.toLowerCase());
    const blur = () => input.keys.clear();
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', blur);
    };
  }, []);
}

interface Props {
  active: boolean;
  calm?: boolean;
  eventSource: RefObject<HTMLElement | null>;
  onMine?: (k: MinedKind) => void;
  bright?: boolean;
}

export default function World3D({ active, calm = false, eventSource, onMine, bright = false }: Props) {
  const map = useMemo(() => generateWorld(projects.length), []);
  useKeyboard();
  // 16 pixel render cho mỗi ô → dpr = 16 / (px CSS mỗi ô)
  const dpr = useMemo(() => 16 / (window.innerWidth >= 900 ? 52 : 36), []);

  return (
    <Canvas
      orthographic
      flat
      dpr={dpr}
      frameloop={active ? 'always' : 'never'}
      camera={{ position: [0, 10, 7], zoom: 50, near: 0.1, far: 100 }}
      gl={{ antialias: false, powerPreference: 'high-performance' }}
      eventSource={eventSource as RefObject<HTMLElement>}
      eventPrefix="client"
      onCreated={({ gl }) => {
        gl.domElement.style.imageRendering = 'pixelated';
      }}
    >
      <color attach="background" args={['#05060b']} />
      <ambientLight intensity={bright ? 0.9 : 0.32} color="#7c80b8" />
      <Floor map={map} />
      <Walls map={map} interactive onMine={onMine} />
      <Shrine map={map} />
      {map.pedestals.map((p) => (
        <Pedestal key={p.index} map={map} index={p.index} />
      ))}
      {map.torches.map((t, i) => {
        const [x, z] = toWorld(map, t.x, t.y);
        return <Torch key={i} x={x} z={z} phase={i * 1.7} />;
      })}
      <Player map={map} />
      <Debris />
      <CameraRig map={map} calm={calm} />
    </Canvas>
  );
}
