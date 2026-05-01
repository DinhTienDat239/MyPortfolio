import React from 'react';
import { motion } from 'motion/react';
import { Trophy, ExternalLink } from 'lucide-react';
import LazyImage from './LazyImage';

interface Award {
  id: string;
  name: string;
  description: string;
  image: string;
  checkoutLink?: string;
  showCheckout?: boolean;
}

interface Game {
  id: string;
  title: string;
  tagline?: string;
  publishedAt?: string;
  description: string;
  externalLink: string;
  mainImage: string;
  bgImage?: string;
}

interface GameDevProps {
  awards: Award[];
  games: Game[];
  imageSize?: number;
  aspectRatio?: number;
}

export default function GameDev({ awards, games, imageSize = 288, aspectRatio = 1.77 }: GameDevProps) {
  // Sort games by order if they have it, otherwise use original order
  const sortedGames = [...games].sort((a, b) => (a as any).order - (b as any).order);

  return (
    <section id="games" className="py-20 px-6 bg-black relative">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold mb-4"
          >
            Game Development
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-neutral-400 max-w-2xl mx-auto"
          >
            Passionate about creating unique mechanics, smooth logic, and immersive experiences that push the boundaries of web-based gaming.
          </motion.p>
        </div>

        {/* Awards */}
        {awards.length > 0 && (
          <div className="mb-24">
            <h3 className="text-2xl font-bold mb-8 flex items-center gap-3">
              <Trophy className="text-yellow-500" />
              Awards & Achievements
            </h3>
            <div className="grid md:grid-cols-2 gap-8">
              {awards.map((award, i) => (
                <motion.div
                  key={award.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="glass p-6 rounded-3xl flex flex-col gap-6 border-white/5 group hover:bg-white/5 transition-colors"
                >
                  <div className="w-full aspect-video rounded-2xl bg-neutral-900/50 overflow-hidden border border-white/5">
                    <LazyImage src={award.image} alt={award.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" referrerPolicy="no-referrer" />
                  </div>
                  <div className="flex flex-col flex-1">
                    <h4 className="text-2xl font-bold text-white mb-3">{award.name}</h4>
                    <p className="text-neutral-400 leading-relaxed flex-1">{award.description}</p>
                    {award.showCheckout && award.checkoutLink && (
                      <div className="mt-6 pt-6 border-t border-white/10">
                        <a
                          href={award.checkoutLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white text-neutral-300 hover:text-black font-bold rounded-xl transition-all group/btn"
                        >
                          Checkout
                          <ExternalLink className="w-4 h-4 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                        </a>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Game Projects */}
        <div className="grid gap-8">
          {sortedGames.map((game, i) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.2 }}
              className="group relative rounded-[2rem] overflow-hidden min-h-[350px] md:min-h-[400px] flex items-end p-6 md:p-12"
            >
              {/* Background Image */}
              <div className="absolute inset-0 z-0">
                <LazyImage
                  src={game.bgImage || 'https://picsum.photos/seed/gamebg/1920/1080'}
                  alt=""
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                {/* Darker overlay on mobile for better text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent md:from-black/50 md:via-black/30 md:to-transparent" />
              </div>

              <div className="relative z-10 flex flex-col md:flex-row gap-10 items-center justify-between w-full">
                <div className="flex-1 w-full text-center md:text-left">
                  <div className="flex flex-col md:flex-row items-center md:items-end gap-3 mb-2">
                    <h3 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter">
                      {game.title}
                    </h3>
                    {game.publishedAt && (
                      <span className="px-3 py-1 bg-white/20 backdrop-blur-md border border-white/10 rounded-full text-[10px] font-black text-white uppercase tracking-widest mb-2 shadow-2xl">
                        Published: {game.publishedAt}
                      </span>
                    )}
                  </div>
                  {game.tagline && (
                    <p className="text-sm font-bold text-neutral-400 uppercase tracking-[0.2em] mb-4">
                      {game.tagline}
                    </p>
                  )}
                  <p className="text-lg text-neutral-300 max-w-xl mx-auto md:mx-0 mb-8 leading-relaxed">
                    {game.description}
                  </p>
                  
                  <div className="flex flex-col md:flex-row items-center gap-8">
                    <a
                      href={game.externalLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-3 px-8 py-4 bg-white hover:bg-neutral-200 text-black font-bold rounded-full transition-all hover:gap-5 box-glow text-sm uppercase tracking-widest order-2 md:order-1"
                    >
                      PLAY NOW
                      <ExternalLink className="w-5 h-5" />
                    </a>

                    <div className="md:hidden w-full max-w-[280px] order-1">
                       <motion.div
                        className="rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10 flex items-center justify-center bg-neutral-900"
                        style={{ 
                          width: '100%',
                          aspectRatio: `${aspectRatio}`
                        }}
                      >
                        <LazyImage
                          src={game.mainImage || 'https://picsum.photos/seed/game/600/400'}
                          alt={game.title}
                          className="w-full h-full object-cover object-center"
                          referrerPolicy="no-referrer"
                        />
                      </motion.div>
                    </div>
                  </div>
                </div>

                <div className="hidden md:flex flex-shrink-0 items-center justify-center">
                  <motion.div
                    whileHover={{ scale: 1.05, rotate: -1, x: -10, y: -10 }}
                    className="rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10 flex items-center justify-center bg-neutral-900"
                    style={{ 
                      width: `${imageSize}px`,
                      aspectRatio: `${aspectRatio}`
                    }}
                  >
                    <LazyImage
                      src={game.mainImage || 'https://picsum.photos/seed/game/600/400'}
                      alt={game.title}
                      className="w-full h-full object-cover object-center"
                      referrerPolicy="no-referrer"
                    />
                  </motion.div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
