import { useRef, useState, type PointerEvent } from 'react';
import { motion } from 'motion/react';
import { content } from '../../data';
import { cn } from '../../lib/utils';
import { LayerHeading, LayerSection } from '../fx/Layer';
import { Sprite } from '../pixel/Sprite';
import { SPRITES, type SpriteName } from '../pixel/sprites';

const isSprite = (s?: string): s is SpriteName => !!s && s in SPRITES;

/**
 * Khối lập phương voxel xoay 3D bằng CSS (không WebGL) — mỗi mặt là 1 nhánh kỹ năng.
 * Kéo chuột để xoay, thả ra nó tự quay tiếp.
 */
function SkillCube() {
  const groups = content.skills;
  const faces = Array.from({ length: 6 }, (_, i) => groups[i % groups.length]);
  const SIZE = 180;
  const transforms = [
    `rotateY(0deg) translateZ(${SIZE / 2}px)`,
    `rotateY(90deg) translateZ(${SIZE / 2}px)`,
    `rotateY(180deg) translateZ(${SIZE / 2}px)`,
    `rotateY(-90deg) translateZ(${SIZE / 2}px)`,
    `rotateX(90deg) translateZ(${SIZE / 2}px)`,
    `rotateX(-90deg) translateZ(${SIZE / 2}px)`,
  ];
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null);
  const [rot, setRot] = useState({ x: -22, y: 30 });
  const start = useRef({ x: 0, y: 0, rx: 0, ry: 0 });

  const down = (e: PointerEvent<HTMLDivElement>) => {
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    start.current = { x: e.clientX, y: e.clientY, rx: rot.x, ry: rot.y };
    setDrag({ x: e.clientX, y: e.clientY });
  };
  const move = (e: PointerEvent<HTMLDivElement>) => {
    if (!drag) return;
    setRot({ x: start.current.rx - (e.clientY - start.current.y) * 0.4, y: start.current.ry + (e.clientX - start.current.x) * 0.4 });
  };
  const up = () => setDrag(null);

  return (
    <div
      className="relative mx-auto flex h-72 w-72 touch-none select-none items-center justify-center [perspective:900px]"
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      data-cursor
      aria-label="Rotating skill cube — drag to spin"
    >
      {/* bóng đổ dưới khối */}
      <div className="absolute bottom-2 h-6 w-40 rounded-[50%] bg-black/50 blur-md" />
      <div
        className={cn('relative', !drag && 'skill-cube')}
        style={{ width: SIZE, height: SIZE, transformStyle: 'preserve-3d', transform: drag ? `rotateX(${rot.x}deg) rotateY(${rot.y}deg)` : undefined }}
      >
        {faces.map((g, i) => (
          <div
            key={i}
            className="bg-tile-crystal absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 text-center"
            style={{
              transform: transforms[i],
              backfaceVisibility: 'hidden',
              boxShadow: 'inset 0 0 0 6px #14121f, inset 0 0 0 10px rgb(94 242 230 / 0.35), inset 0 0 40px rgb(94 242 230 / 0.25)',
            }}
          >
            <Sprite name={isSprite(g.icon) ? g.icon : 'gem'} size={56} />
            <span className="pixel-shadow font-label text-xs uppercase text-parchment">{g.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SkillNode({ name, level, note, last }: { name: string; level: number; note?: string; last: boolean }) {
  return (
    <li className="group/node relative pl-8">
      {/* đường nối dọc + nhánh ngang */}
      <span aria-hidden className={cn('absolute left-2.5 top-0 w-1 bg-edge transition-colors group-hover/node:bg-crystal', last ? 'h-5' : 'h-full')} />
      <span aria-hidden className="absolute left-2.5 top-4 h-1 w-4 bg-edge transition-colors group-hover/node:bg-crystal" />
      <div className="px-slot relative mb-3 px-3 py-2 transition-shadow group-hover/node:shadow-crystal">
        <div className="flex items-center justify-between gap-3">
          <span className="text-base text-parchment transition-colors group-hover/node:text-crystal">{name}</span>
          <span className="flex gap-1" aria-label={`Level ${level} of 5`}>
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} className="h-2.5 w-2.5" style={{ background: i < level ? 'var(--color-crystal)' : 'rgb(255 255 255 / 0.08)' }} />
            ))}
          </span>
        </div>
        {note && <p className="max-h-0 overflow-hidden font-label text-[10px] uppercase text-mist transition-all duration-300 group-hover/node:mt-1 group-hover/node:max-h-12">{note}</p>}
      </div>
    </li>
  );
}

export default function SkillTree() {
  return (
    <LayerSection id="arsenal" tile="crystal">
      <LayerHeading id="arsenal" title="Skill Tree" icon="pickaxe" intro="Points spent so far. Hover a node for details — drag the cube to spin it." />

      <div className="grid items-start gap-12 lg:grid-cols-[320px_1fr]">
        <div className="px-panel p-4 lg:sticky lg:top-28">
          <p className="text-center font-label text-[10px] uppercase text-crystal">Skill codex</p>
          <SkillCube />
          <p className="text-center text-sm text-mist">
            {content.skills.reduce((n, g) => n + g.skills.reduce((a, s) => a + s.level, 0), 0)} skill points allocated
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {content.skills.map((group, gi) => (
            <motion.div
              key={group.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.45, delay: gi * 0.08 }}
              className="px-panel p-5"
            >
              <div className="mb-4 flex items-center gap-3">
                <span className="px-slot flex h-12 w-12 items-center justify-center">
                  <Sprite name={isSprite(group.icon) ? group.icon : 'gem'} size={32} />
                </span>
                <div>
                  <p className="font-label text-[10px] uppercase text-crystal">Branch {group.sigil}</p>
                  <h3 className="text-2xl font-bold text-parchment">{group.name}</h3>
                </div>
              </div>
              <ul>
                {group.skills.map((s, i) => (
                  <SkillNode key={s.name} {...s} last={i === group.skills.length - 1} />
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </LayerSection>
  );
}
