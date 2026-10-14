import { useState } from 'react';
import { motion } from 'motion/react';
import { Sprite } from '../pixel/Sprite';
import { WallBand } from '../fx/Layer';

const TRAILER_ID = 'ga6q6vUluzE'; // trailer chính thức (Release Date Trailer)
const STEAM_APP = 1621690; // Core Keeper trên Steam

/**
 * Game đã truyền cảm hứng cho site. Hình ảnh của game chỉ hiện qua
 * trình nhúng chính thức của YouTube và Steam — không lưu asset nào trong repo.
 */
export default function Inspiration() {
  const [playing, setPlaying] = useState(false);
  return (
    <section id="inspiration" className="relative overflow-hidden bg-floor-crystal">
      <WallBand biome="crystal" />
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_75%_65%_at_50%_45%,transparent_45%,rgb(6_7_14/0.7)_100%)]" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 pb-28 pt-14 md:px-8 lg:grid-cols-[1.15fr_0.85fr]">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
          <div className="px-panel overflow-hidden p-2">
            <div className="relative aspect-video overflow-hidden rounded-md bg-void">
              {playing ? (
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${TRAILER_ID}?autoplay=1&rel=0`}
                  title="Core Keeper — official trailer"
                  allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                  allowFullScreen
                  className="absolute inset-0 h-full w-full border-0"
                />
              ) : (
                <button onClick={() => setPlaying(true)} className="group absolute inset-0" aria-label="Play the official Core Keeper trailer">
                  <img
                    src={`https://i.ytimg.com/vi/${TRAILER_ID}/hqdefault.jpg`}
                    alt="Core Keeper official trailer"
                    loading="lazy"
                    className="h-full w-full object-cover opacity-85 transition group-hover:opacity-100"
                  />
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="px-btn">▶ Watch trailer</span>
                  </span>
                </button>
              )}
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }}>
          <p className="mb-3 flex items-center gap-2 font-label text-[10px] uppercase text-crystal">
            <Sprite name="heart" size={16} /> The game that inspired this cave
          </p>
          <h2 className="title-glow text-6xl md:text-7xl">Core Keeper</h2>
          <p className="soft-shadow mt-5 text-lg leading-relaxed text-mist">
            My favourite game. The torchlight, the slow dig into the dark, the joy of breaking into a new biome — this whole portfolio is a love letter to
            it. Go play it.
          </p>
          <iframe
            src={`https://store.steampowered.com/widget/${STEAM_APP}/`}
            title="Core Keeper on Steam"
            loading="lazy"
            className="mt-7 h-[190px] w-full max-w-[646px] rounded-lg border-0"
          />
          <a href="https://core-keeper.fandom.com/wiki/Core_Keeper_Wiki" target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 font-label text-[10px] uppercase text-mist hover:text-gold">
            Explore the wiki ▶
          </a>
        </motion.div>
      </div>
    </section>
  );
}
