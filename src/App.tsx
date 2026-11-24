import { useEffect } from 'react';
import SmoothScroll from './components/fx/SmoothScroll';
import Preloader from './components/fx/Preloader';
import Cursor from './components/fx/Cursor';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import Hero from './components/sections/Hero';
import PlayableShowcase from './components/sections/PlayableShowcase';
import ProjectModal from './components/sections/ProjectModal';
import About from './components/sections/About';
import Experience from './components/sections/Experience';
import AiWorkflow from './components/sections/AiWorkflow';
import Ventures from './components/sections/Ventures';
import Awards from './components/sections/Awards';
import TechStack from './components/sections/TechStack';
import Contact from './components/sections/Contact';
import { usePlayRoute } from './hooks/useHashRoute';
import { content, findProject } from './data';

export default function App() {
  const play = usePlayRoute();

  useEffect(() => {
    const p = play.slug ? findProject(play.slug) : undefined;
    document.title = p ? `${p.title} — ${content.profile.fullName}` : `${content.profile.fullName} — Playable Ads Developer & Creative Director`;
  }, [play.slug]);

  return (
    <SmoothScroll>
      <Preloader />
      <Cursor />
      <Header />
      <main>
        <Hero onPlay={play.open} />
        <PlayableShowcase onPlay={play.open} />
        <About />
        <Experience />
        <AiWorkflow />
        <Ventures />
        <Awards />
        <TechStack />
        <Contact />
      </main>
      <Footer />
      <ProjectModal slug={play.slug} onClose={play.close} onNavigate={play.open} />
    </SmoothScroll>
  );
}
