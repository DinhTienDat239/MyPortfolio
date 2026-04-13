import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ExternalLink, Play } from 'lucide-react';

interface Playable {
  id: string;
  title: string;
  description: string;
  iframeUrl: string;
  thumbnail: string;
}

interface Stat {
  label: string;
  value: string;
}

interface Network {
  name: string;
  logo: string;
}

interface PlayableAdsProps {
  playables: Playable[];
  stats: Stat[];
  networks: Network[];
}

export default function PlayableAds({ playables, stats, networks }: PlayableAdsProps) {
  const [selectedPlayable, setSelectedPlayable] = useState<Playable | null>(null);

  return (
    <section id="playables" className="py-20 px-6 bg-ocean-900/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold mb-4"
          >
            Playable Ads Showcase
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-ocean-200 max-w-2xl mx-auto"
          >
            Expertise in building high-performance, interactive HTML5 ads that drive engagement and conversions across all major networks.
          </motion.p>
        </div>

        {/* Networks */}
        <div className="flex flex-wrap justify-center gap-8 mb-20 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
          {networks.map((network, i) => (
            <motion.div
              key={network.name}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-2"
            >
              <img src={network.logo} alt={network.name} className="h-8 object-contain" referrerPolicy="no-referrer" />
              <span className="font-bold text-sm uppercase tracking-widest">{network.name}</span>
            </motion.div>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass p-8 rounded-3xl text-center border-ocean-500/20"
            >
              <div className="text-4xl font-black text-ocean-400 mb-2 font-display">
                {stat.value}
              </div>
              <div className="text-sm font-medium text-ocean-200 uppercase tracking-wider">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {playables.map((playable, i) => (
            <motion.div
              key={playable.id}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -10 }}
              onClick={() => setSelectedPlayable(playable)}
              className="group cursor-pointer relative"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-ocean-500 to-cyan-500 rounded-3xl blur opacity-25 group-hover:opacity-75 transition duration-500" />
              <div className="relative glass rounded-3xl overflow-hidden aspect-video">
                <img
                  src={playable.thumbnail || 'https://picsum.photos/seed/playable/800/450'}
                  alt={playable.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-ocean-500 flex items-center justify-center text-white scale-75 group-hover:scale-100 transition-transform">
                    <Play className="fill-current ml-1" />
                  </div>
                </div>
              </div>
              <div className="mt-4 px-2">
                <h3 className="text-xl font-bold text-ocean-100 group-hover:text-ocean-400 transition-colors">
                  {playable.title}
                </h3>
                <p className="text-sm text-ocean-300 line-clamp-2 mt-1">
                  {playable.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {selectedPlayable && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8"
          >
            <div
              className="absolute inset-0 bg-black/90 backdrop-blur-sm"
              onClick={() => setSelectedPlayable(null)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-5xl aspect-video bg-ocean-950 rounded-3xl overflow-hidden border border-white/10 shadow-2xl"
            >
              <div className="absolute top-4 right-4 z-10">
                <button
                  onClick={() => setSelectedPlayable(null)}
                  className="p-2 rounded-full bg-black/50 text-white hover:bg-ocean-500 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <iframe
                src={selectedPlayable.iframeUrl}
                className="w-full h-full border-none"
                title={selectedPlayable.title}
                allow="autoplay; fullscreen"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
