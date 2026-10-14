import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { asset, content } from '../../data';
import { cn } from '../../lib/utils';
import { LayerHeading, LayerSection } from '../fx/Layer';
import Counter from '../fx/Counter';
import { Sprite } from '../pixel/Sprite';
import type { SpriteName } from '../pixel/sprites';

/** Level = tuổi, XP = % quãng đường tới sinh nhật tiếp theo (từ dob "dd/mm/yyyy"). */
function levelFromDob(dob?: string) {
  const m = dob?.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const birth = new Date(+m[3], +m[2] - 1, +m[1]);
  const now = new Date();
  let level = now.getFullYear() - birth.getFullYear();
  const thisYear = new Date(now.getFullYear(), birth.getMonth(), birth.getDate());
  if (now < thisYear) level--;
  const last = new Date(birth.getFullYear() + level, birth.getMonth(), birth.getDate());
  const next = new Date(birth.getFullYear() + level + 1, birth.getMonth(), birth.getDate());
  return { level, xp: (now.getTime() - last.getTime()) / (next.getTime() - last.getTime()) };
}

/** Ảnh đại diện được "pixel hoá" thật: vẽ xuống canvas 48px rồi phóng to. */
function PixelPortrait({ src, alt }: { src?: string; alt: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [ok, setOk] = useState(false);
  useEffect(() => {
    if (!src) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const c = ref.current;
      const ctx = c?.getContext('2d');
      if (!c || !ctx) return;
      const s = Math.min(img.width, img.height);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, c.width, c.height);
      // giảm bảng màu cho ra chất pixel-art
      const data = ctx.getImageData(0, 0, c.width, c.height);
      for (let i = 0; i < data.data.length; i += 4) {
        for (let k = 0; k < 3; k++) data.data[i + k] = Math.round(data.data[i + k] / 32) * 32;
      }
      ctx.putImageData(data, 0, 0);
      setOk(true);
    };
    img.src = src;
  }, [src]);

  return (
    <div className="px-slot relative aspect-square w-full overflow-hidden">
      {src && <canvas ref={ref} width={48} height={48} role="img" aria-label={alt} className={cn('pixelated h-full w-full', !ok && 'hidden')} />}
      {(!src || !ok) && (
        <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle,rgb(255_179_71/0.18),transparent_70%)]">
          <Sprite name="explorer" size={160} className="animate-bob" title={alt} />
        </div>
      )}
    </div>
  );
}

const EQUIPMENT: { icon: SpriteName; label: string }[] = [
  { icon: 'pickaxe', label: 'Trusty Pickaxe — digs through any deadline' },
  { icon: 'sword', label: 'Unity Blade — +5 Game Feel' },
  { icon: 'gem', label: 'Playable Crystal — compresses games to 3MB' },
  { icon: 'lantern', label: 'Idea Lantern — lights up dark brainstorms' },
];

const STAT_ICONS: SpriteName[] = ['gem', 'coin', 'heart', 'star'];

function CharacterCard() {
  const { profile } = content;
  const lv = levelFromDob(profile.dob);
  const [tip, setTip] = useState<string | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5 }}
      className="px-panel p-5"
    >
      <PixelPortrait src={asset(profile.profilePic)} alt={profile.fullName} />

      <div className="mt-5 flex items-baseline justify-between gap-3">
        <h3 className="pixel-shadow text-2xl font-bold text-parchment">{profile.fullName}</h3>
        {lv && <span className="font-label text-xs text-torch">Lv.{lv.level}</span>}
      </div>
      <p className="mt-1 font-label text-[10px] uppercase text-mist">Class · {profile.roles.split(/[·\-–]/)[0].trim()}</p>

      {lv && (
        <div className="mt-3">
          <div className="px-slot h-3 p-0.5">
            <motion.div
              className="h-full bg-crystal"
              initial={{ width: 0 }}
              whileInView={{ width: `${Math.round(lv.xp * 100)}%` }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
            />
          </div>
          <p className="mt-1 font-label text-[9px] uppercase text-mist">XP to next level · {Math.round(lv.xp * 100)}%</p>
        </div>
      )}

      <dl className="mt-5 space-y-2 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-mist">Home biome</dt>
          <dd className="text-parchment">{profile.location}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-mist">Status</dt>
          <dd className={profile.available ? 'text-uncommon' : 'text-parchment'}>{profile.available ? 'Recruitable' : 'On an expedition'}</dd>
        </div>
      </dl>

      {/* Ô trang bị */}
      <p className="mt-6 font-label text-[10px] uppercase text-mist">Equipment</p>
      <div className="relative mt-2 grid grid-cols-4 gap-3">
        {EQUIPMENT.map((e) => (
          <button
            key={e.icon}
            onMouseEnter={() => setTip(e.label)}
            onMouseLeave={() => setTip(null)}
            onFocus={() => setTip(e.label)}
            onBlur={() => setTip(null)}
            onClick={() => setTip((t) => (t === e.label ? null : e.label))}
            className="px-slot flex aspect-square items-center justify-center hover:bg-torch/10"
            aria-label={e.label}
          >
            <Sprite name={e.icon} size={32} />
          </button>
        ))}
        <AnimatePresence>
          {tip && (
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="px-panel absolute -bottom-12 left-0 right-0 z-10 px-3 py-2 text-xs text-parchment"
            >
              {tip}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/** Nhật ký: giấy da + các tab chương. */
function Journal() {
  const { profile, story } = content;
  const [page, setPage] = useState(0);
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <div className="relative bg-parchment p-6 text-ink shadow-[0_-4px_0_0_#14121f,0_4px_0_0_#14121f,-4px_0_0_0_#14121f,4px_0_0_0_#14121f,inset_0_-6px_0_0_#c9b48e] md:p-8">
        <p className="font-label text-[10px] uppercase text-[#8a5a34]">Explorer's journal</p>
        <p className="mt-3 text-xl leading-relaxed md:text-2xl">“{profile.aboutMe}”</p>
      </div>

      <div className="mt-8 flex gap-2">
        {story.map((ch, i) => (
          <button
            key={ch.title}
            onClick={() => setPage(i)}
            className={cn('px-btn-stone !px-4 !py-2', page === i && '!bg-torch !text-ink')}
          >
            {ch.kicker}
          </button>
        ))}
      </div>
      <div className="px-panel mt-5 min-h-44 p-6">
        <AnimatePresence mode="wait">
          <motion.div key={page} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
            <p className="font-label text-[10px] uppercase text-torch">Log {story[page].kicker}</p>
            <h3 className="mt-2 text-3xl font-bold text-parchment">{story[page].title}</h3>
            <p className="mt-3 text-lg leading-relaxed text-mist">{story[page].body}</p>
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default function Character() {
  const { stats } = content;
  return (
    <LayerSection id="origin" tile="dirt">
      <LayerHeading id="origin" title="Character" icon="heart" intro="Every explorer has a backstory. Here's mine — and the gear I carry." />

      <div className="grid gap-12 lg:grid-cols-[minmax(0,360px)_1fr]">
        <CharacterCard />
        <div>
          <Journal />
          {/* Chỉ số */}
          <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="px-panel group p-4"
              >
                <Sprite name={STAT_ICONS[i % STAT_ICONS.length]} size={32} className="transition-transform group-hover:-translate-y-1" />
                <div className="pixel-shadow mt-3 text-3xl font-bold text-gold">
                  <Counter value={s.value} />
                </div>
                <div className="mt-1 font-label text-[9px] uppercase leading-relaxed text-mist">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </LayerSection>
  );
}
