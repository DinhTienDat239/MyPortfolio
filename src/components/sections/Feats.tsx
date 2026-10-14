import { motion } from 'motion/react';
import { asset, content } from '../../data';
import { LayerHeading, LayerSection } from '../fx/Layer';
import { Sprite } from '../pixel/Sprite';

/** Thành tựu — chỉ hiện khi content.json có awards. */
export default function Feats() {
  if (!content.awards.length) return null;
  return (
    <LayerSection id="trophies" tile="stone">
      <LayerHeading id="trophies" title="Feats" icon="star" intro="Achievements unlocked along the way." />
      <div className="grid gap-6 md:grid-cols-2">
        {content.awards.map((a, i) => {
          const body = (
            <>
              <span className="px-slot flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden">
                {a.image ? <img src={asset(a.image)} alt="" className="h-full w-full object-cover" loading="lazy" /> : <Sprite name="star" size={48} />}
              </span>
              <div>
                <p className="font-label text-[10px] uppercase text-gold">Achievement unlocked{a.year ? ` · ${a.year}` : ''}</p>
                <h3 className="mt-1 text-2xl font-bold text-parchment">{a.name}</h3>
                <p className="mt-1 text-mist">{a.description}</p>
              </div>
            </>
          );
          const cls = 'px-panel flex items-center gap-5 p-5 transition-transform hover:-translate-y-1';
          return (
            <motion.div key={a.id} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
              {a.link ? (
                <a href={a.link} target="_blank" rel="noopener noreferrer" className={cls}>
                  {body}
                </a>
              ) : (
                <div className={cls}>{body}</div>
              )}
            </motion.div>
          );
        })}
      </div>
    </LayerSection>
  );
}
