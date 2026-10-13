import { motion } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import { asset, content } from '../../data';
import SectionHeading from '../fx/SectionHeading';

/** Chỉ render khi content.json có awards. */
export default function Trophies() {
  if (!content.awards.length) return null;
  return (
    <section id="trophies" className="relative px-5 py-28 md:px-8 md:py-40">
      <div className="mx-auto max-w-7xl">
        <SectionHeading chapter="IV" kicker="Spoils of the hunt" title="Trophies" />
        <div className="divide-y divide-ash border-y border-ash">
          {content.awards.map((a, i) => {
            const inner = (
              <>
                {a.image ? (
                  <img src={asset(a.image)} alt="" loading="lazy" className="aspect-video w-full object-cover grayscale transition group-hover:grayscale-0 md:w-56" />
                ) : (
                  <span className="font-display text-5xl font-black text-blood-700">✦</span>
                )}
                <div>
                  {a.year && <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-blood-400">{a.year}</p>}
                  <h3 className="font-display text-2xl font-bold text-bone md:text-3xl">{a.name}</h3>
                  <p className="mt-2 max-w-2xl text-fog">{a.description}</p>
                </div>
                {a.link && <ArrowUpRight className="h-6 w-6 text-fog transition group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-blood-500" />}
              </>
            );
            const cls = 'group grid items-center gap-6 py-8 transition-colors hover:bg-blood-900/20 md:grid-cols-[auto_1fr_auto] md:px-4';
            return (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                {a.link ? (
                  <a href={a.link} target="_blank" rel="noopener noreferrer" className={cls}>
                    {inner}
                  </a>
                ) : (
                  <div className={cls}>{inner}</div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
