import { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import SmoothScroll, { jumpTo } from './components/fx/SmoothScroll';
import Preloader from './components/fx/Preloader';
import BloodCursor from './components/fx/BloodCursor';
import BloodModeOverlay from './components/fx/BloodModeOverlay';
import Curtain from './components/fx/Curtain';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import HomePage from './pages/HomePage';
import CaseStudyPage from './pages/CaseStudyPage';
import { matchWork, useRoute } from './lib/router';
import { useKonami } from './hooks/useKonami';
import { toggleBloodMode } from './lib/bloodMode';
import { play } from './lib/sound';
import { content, findProject } from './data';

export default function App() {
  const route = useRoute();
  const slug = matchWork(route);

  useKonami(toggleBloodMode);

  // Tiếng "tách" khi click link/nút (chỉ khi người dùng đã bật âm)
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      if ((e.target as HTMLElement).closest('a, button')) play('tick');
    };
    window.addEventListener('pointerdown', onDown);
    return () => window.removeEventListener('pointerdown', onDown);
  }, []);

  // Tiêu đề tab theo trang
  useEffect(() => {
    const p = slug ? findProject(slug) : undefined;
    document.title = p ? `${p.title} — ${content.profile.alias}` : `${content.profile.alias} · ${content.profile.fullName} — Game & Playable Ads Developer`;
  }, [slug]);

  // Lời chào cho ai mở DevTools
  useEffect(() => {
    console.log(
      `%c🦇 ${content.profile.alias.toUpperCase()} %c\nLooking under the hood? I like that. → ${content.profile.email}\nPsst: ↑↑↓↓←→←→BA`,
      'font: 900 28px serif; color: #ff0033;',
      'color: #8d8589;',
    );
  }, []);

  return (
    <SmoothScroll>
      <Preloader name={content.profile.alias} />
      <BloodCursor />
      <BloodModeOverlay />
      <Header />

      <AnimatePresence mode="wait" onExitComplete={() => jumpTo(0)}>
        <motion.main key={slug ?? 'home'} initial="initial" animate="enter" exit="exit">
          <Curtain />
          {slug ? <CaseStudyPage slug={slug} /> : <HomePage />}
        </motion.main>
      </AnimatePresence>

      <Footer />
    </SmoothScroll>
  );
}
