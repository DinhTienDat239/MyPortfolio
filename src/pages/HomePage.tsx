import { useEffect } from 'react';
import HeroVamp from '../components/sections/HeroVamp';
import Origin from '../components/sections/Origin';
import Crypt from '../components/sections/Crypt';
import Arsenal from '../components/sections/Arsenal';
import Trophies from '../components/sections/Trophies';
import Summon from '../components/sections/Summon';
import { consumeHomeTarget } from '../lib/router';
import { jumpTo, scrollToTarget } from '../components/fx/SmoothScroll';

export default function HomePage() {
  // Quay về từ case study: tới section được yêu cầu, hoặc đúng chỗ đang xem trước đó
  useEffect(() => {
    const { section, y } = consumeHomeTarget();
    if (section) {
      const t = setTimeout(() => scrollToTarget(`#${section}`), 350);
      return () => clearTimeout(t);
    }
    if (y !== undefined) requestAnimationFrame(() => jumpTo(y));
  }, []);

  return (
    <>
      <HeroVamp />
      <Origin />
      <Crypt />
      <Arsenal />
      <Trophies />
      <Summon />
    </>
  );
}
