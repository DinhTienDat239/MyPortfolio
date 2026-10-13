import { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, MapPin } from 'lucide-react';
import { asset, content } from '../../data';
import { cn } from '../../lib/utils';
import SectionHeading from '../fx/SectionHeading';
import Counter from '../fx/Counter';

const EASE = [0.22, 1, 0.36, 1] as const;

function Portrait() {
  const pic = asset(content.profile.profilePic);
  const initials = content.profile.fullName
    .split(' ')
    .map((w) => w[0])
    .slice(-2)
    .join('');

  return (
    <motion.div
      initial={{ opacity: 0, clipPath: 'inset(100% 0 0 0)' }}
      whileInView={{ opacity: 1, clipPath: 'inset(0% 0 0 0)' }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 1.2, ease: EASE }}
      className="group relative mx-auto aspect-[4/5] w-full max-w-sm"
    >
      {/* Khung lệch + viền đỏ */}
      <div className="absolute inset-0 translate-x-4 translate-y-4 border border-blood-700 transition-transform duration-700 group-hover:translate-x-2 group-hover:translate-y-2" />
      <div className="relative h-full w-full overflow-hidden border border-ash bg-crypt">
        {pic ? (
          <>
            <img
              src={pic}
              alt={content.profile.fullName}
              className="h-full w-full object-cover grayscale contrast-125 transition duration-1000 group-hover:scale-105 group-hover:grayscale-0"
            />
            {/* duotone đỏ, tan đi khi hover */}
            <div className="absolute inset-0 bg-blood-700 mix-blend-multiply transition-opacity duration-1000 group-hover:opacity-0" />
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle,rgb(255_0_51/0.25),transparent_65%)]">
            <span className="font-display text-8xl font-black text-transparent" style={{ WebkitTextStroke: '1.5px var(--color-blood-400)' }}>
              {initials}
            </span>
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-void to-transparent p-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-blood-400">Specimen 239</p>
          <p className="font-display text-xl text-bone">{content.profile.fullName}</p>
        </div>
      </div>
    </motion.div>
  );
}

/** Thẻ câu chuyện dạng accordion ngang: thẻ đang chọn nở rộng ra. */
function StoryCards() {
  const [active, setActive] = useState(0);
  return (
    <div className="mt-16 flex flex-col gap-3 lg:h-80 lg:flex-row">
      {content.story.map((ch, i) => {
        const on = active === i;
        return (
          <motion.button
            key={ch.title}
            layout
            onMouseEnter={() => setActive(i)}
            onFocus={() => setActive(i)}
            onClick={() => setActive(i)}
            transition={{ layout: { duration: 0.6, ease: EASE } }}
            className={cn(
              'relative overflow-hidden border p-7 text-left transition-colors duration-500',
              on ? 'border-blood-600 bg-blood-900/40 lg:flex-[3]' : 'border-ash bg-crypt hover:border-blood-800 lg:flex-1',
            )}
          >
            <span
              aria-hidden
              className={cn('absolute -right-2 -top-6 font-display text-[8rem] font-black leading-none transition-colors duration-500', on ? 'text-blood-600/25' : 'text-ash/60')}
            >
              {ch.kicker}
            </span>
            <p className="relative font-mono text-[10px] uppercase tracking-[0.35em] text-blood-400">Chapter {ch.kicker}</p>
            <motion.h3 layout="position" className="relative mt-3 font-display text-2xl font-bold text-bone md:text-3xl">
              {ch.title}
            </motion.h3>
            <motion.p
              initial={false}
              animate={{ opacity: on ? 1 : 0.0, y: on ? 0 : 10 }}
              transition={{ duration: 0.5, delay: on ? 0.2 : 0 }}
              className={cn('relative mt-4 max-w-md leading-relaxed text-bone/80', !on && 'lg:pointer-events-none max-lg:hidden')}
            >
              {ch.body}
            </motion.p>
          </motion.button>
        );
      })}
    </div>
  );
}

export default function Origin() {
  const { profile, stats } = content;
  return (
    <section id="origin" className="relative px-5 py-28 md:px-8 md:py-40">
      <div className="mx-auto max-w-7xl">
        <SectionHeading chapter="I" kicker="Who hunts here" title="The Origin" />

        <div className="grid items-center gap-16 lg:grid-cols-[0.9fr_1.1fr]">
          <Portrait />
          <div>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.9, ease: EASE }}
              className="font-serif text-3xl italic leading-snug text-bone md:text-4xl"
            >
              “{profile.aboutMe}”
            </motion.p>
            <div className="mt-8 flex flex-wrap gap-3 font-mono text-xs uppercase tracking-[0.2em] text-fog">
              <span className="flex items-center gap-2 border border-ash px-3 py-2">
                <MapPin className="h-3.5 w-3.5 text-blood-500" /> {profile.location}
              </span>
              <a href={`mailto:${profile.email}`} className="flex items-center gap-2 border border-ash px-3 py-2 normal-case tracking-wider transition-colors hover:border-blood-600 hover:text-bone">
                <Mail className="h-3.5 w-3.5 text-blood-500" /> {profile.email}
              </a>
              <span className="border border-ash px-3 py-2">{profile.roles}</span>
            </div>

            {/* Stats */}
            <div className="mt-12 grid grid-cols-2 gap-px border border-ash bg-ash">
              {stats.map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="group bg-abyss p-6 transition-colors hover:bg-blood-900/30"
                >
                  <div className="font-display text-4xl font-black text-bone transition-colors group-hover:text-blood-400 md:text-5xl">
                    <Counter value={s.value} />
                  </div>
                  <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.25em] text-fog">{s.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        <StoryCards />
      </div>
    </section>
  );
}
