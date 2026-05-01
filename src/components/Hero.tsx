import React from 'react';
import { motion } from 'motion/react';
import { MapPin, Mail, Phone, Calendar } from 'lucide-react';
import LazyImage from './LazyImage';

interface HeroProps {
  profile: {
    fullName: string;
    dob: string;
    roles: string;
    location: string;
    phone: string;
    email: string;
    aboutMe: string;
    profilePic: string;
    imageSize?: number;
  };
}

export default function Hero({ profile }: HeroProps) {
  return (
    <section id="about" className="pt-32 pb-20 px-6 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-neutral-800/20 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-[120px] -z-10" />

      <div className="max-w-7xl mx-auto grid md:grid-cols-[1fr_1.5fr] gap-12 items-center">
        {/* Profile Pic */}
        <div className="flex justify-center md:justify-end w-full">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="relative group"
            style={{ width: profile.imageSize ? `${profile.imageSize}px` : '100%', maxWidth: '100%' }}
          >
            <div className="absolute -inset-4 bg-gradient-to-tr from-neutral-800 to-white rounded-3xl blur-2xl opacity-10 group-hover:opacity-30 transition-opacity" />
            <div className="relative aspect-square rounded-3xl overflow-hidden border-2 border-white/10 box-glow">
              <LazyImage
                src={profile.profilePic || 'https://picsum.photos/seed/gamer/800/800'}
                alt={profile.fullName}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                referrerPolicy="no-referrer"
              />
            </div>
          </motion.div>
        </div>

        {/* Info */}
        <div className="flex flex-col gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-5xl md:text-7xl font-extrabold mb-2 bg-gradient-to-r from-white to-neutral-500 bg-clip-text text-transparent">
              {profile.fullName}
            </h1>
            <p className="text-xl md:text-2xl font-mono text-neutral-400 font-medium">
              {profile.roles}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid sm:grid-cols-2 gap-4 text-neutral-300"
          >
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-white" />
              <span>{profile.dob}</span>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-white" />
              <span>{profile.location}</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-white" />
              <span>{profile.phone}</span>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-white" />
              <span>{profile.email}</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass p-6 rounded-2xl border-white/5"
          >
            <h3 className="text-xl font-bold mb-3 text-white">About Me</h3>
            <p className="text-neutral-400 leading-relaxed whitespace-pre-wrap">
              {profile.aboutMe}
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
