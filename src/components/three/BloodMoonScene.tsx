import { useRef, type RefObject } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sparkles } from '@react-three/drei';
import * as THREE from 'three';

/**
 * "Blood Moon": khối cầu méo động phát sáng đỏ + tàn lửa bay lơ lửng,
 * nghiêng/trôi theo chuột. Được lazy-load từ Hero nên three.js
 * tách thành chunk riêng, không làm chậm lần hiển thị đầu tiên.
 */

function BloodMoon({ intense }: { intense: boolean }) {
  const group = useRef<THREE.Group>(null!);
  const mesh = useRef<THREE.Mesh>(null!);

  useFrame((state, delta) => {
    const { pointer } = state; // -1..1, lấy từ eventSource (cả section Hero)
    mesh.current.rotation.y += delta * (intense ? 0.4 : 0.08);
    // damp = lerp không phụ thuộc framerate → mượt cả ở 60Hz lẫn 144Hz
    group.current.position.x = THREE.MathUtils.damp(group.current.position.x, pointer.x * 0.5, 2.5, delta);
    group.current.position.y = THREE.MathUtils.damp(group.current.position.y, pointer.y * 0.3, 2.5, delta);
    group.current.rotation.x = THREE.MathUtils.damp(group.current.rotation.x, -pointer.y * 0.25, 2.5, delta);
    group.current.rotation.z = THREE.MathUtils.damp(group.current.rotation.z, pointer.x * 0.15, 2.5, delta);
  });

  return (
    <group ref={group}>
      <Float speed={1.2} rotationIntensity={0.2} floatIntensity={0.6}>
        <mesh ref={mesh} scale={1.7}>
          {/* detail 24 ≈ 12.5k tam giác – đủ mịn cho distort, nhẹ cho GPU */}
          <icosahedronGeometry args={[1, 24]} />
          <MeshDistortMaterial
            color="#1f0007"
            emissive="#ff0033"
            emissiveIntensity={intense ? 0.75 : 0.28}
            roughness={0.3}
            metalness={0.75}
            distort={intense ? 0.55 : 0.32}
            speed={intense ? 3.5 : 1.3}
          />
        </mesh>
      </Float>
    </group>
  );
}

interface Props {
  /** false khi Hero ra khỏi viewport → dừng render, GPU nghỉ */
  active: boolean;
  /** Blood Mode (easter egg) */
  intense?: boolean;
  /** Element nhận sự kiện chuột (để canvas có thể pointer-events: none) */
  eventSource: RefObject<HTMLElement | null>;
}

export default function BloodMoonScene({ active, intense = false, eventSource }: Props) {
  return (
    <Canvas
      frameloop={active ? 'always' : 'never'}
      dpr={[1, 1.75]}
      camera={{ position: [0, 0, 6], fov: 45 }}
      gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
      eventSource={eventSource as RefObject<HTMLElement>}
      eventPrefix="client"
      style={{ pointerEvents: 'none' }}
    >
      <fog attach="fog" args={['#0a0a0a', 6, 14]} />
      <ambientLight intensity={0.15} />
      {/* Rim light đỏ phía sau tạo viền sáng ma mị */}
      <pointLight position={[-3, 2, -3]} intensity={intense ? 90 : 40} color="#ff0033" />
      <pointLight position={[3, -2, 2]} intensity={8} color="#ff6b84" />
      <directionalLight position={[0, 4, 5]} intensity={0.4} color="#efe7e4" />

      <BloodMoon intense={intense} />

      {/* Tàn lửa / bụi máu */}
      <Sparkles count={70} scale={[10, 6, 4]} size={2.2} speed={intense ? 1.2 : 0.35} color="#ff2d55" opacity={0.7} />
      <Sparkles count={30} scale={[12, 7, 6]} size={4} speed={0.15} color="#8f001d" opacity={0.5} />
    </Canvas>
  );
}
