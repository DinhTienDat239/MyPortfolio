import { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import SmoothScroll, { jumpTo } from './components/fx/SmoothScroll';
import Preloader from './components/fx/Preloader';
import Curtain from './components/fx/Curtain';
import { ClickDebris, LanternLight, TreasureRain } from './components/fx/Ambience';
import Header from './components/layout/Header';
import Hotbar from './components/layout/Hotbar';
import Footer from './components/layout/Footer';
import HomePage from './pages/HomePage';
import CaseStudyPage from './pages/CaseStudyPage';
import { matchWork, useRoute } from './lib/router';
import { useKonami } from './hooks/useKonami';
import { startTreasureRain } from './lib/game';
import { play } from './lib/sound';
import { content, findProject } from './data';

const konami = () => startTreasureRain('konami');

export default function App() {
  const route = useRoute();
  const slug = matchWork(route);

  useKonami(konami);

  // Tiếng "tách" khi click link/nút (chỉ khi đã bật âm)
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      if ((e.target as HTMLElement).closest('a, button')) play('tick');
    };
    window.addEventListener('pointerdown', onDown);
    return () => window.removeEventListener('pointerdown', onDown);
  }, []);

  useEffect(() => {
    const p = slug ? findProject(slug) : undefined;
    document.title = p ? `${p.title} — ${content.profile.alias}` : `${content.profile.alias} · ${content.profile.fullName} — Game & Playable Ads Developer`;
  }, [slug]);

  useEffect(() => {
    console.log(
      `%c⛏ ${content.profile.alias.toUpperCase()} %c\nYou dug into the console. Nice. → ${content.profile.email}\nPsst: ↑↑↓↓←→←→BA`,
      'font: 700 26px monospace; color: #ffb347; text-shadow: 3px 3px 0 #14121f;',
      'color: #9a98b8;',
    );
  }, []);

  return (
    <SmoothScroll>
      <Preloader />
      <LanternLight />
      <ClickDebris />
      <TreasureRain />
      <Header />
      <Hotbar />

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
