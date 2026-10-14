import { useEffect } from 'react';
import CaveHero from '../components/sections/CaveHero';
import Character from '../components/sections/Character';
import Vault from '../components/sections/Vault';
import SkillTree from '../components/sections/SkillTree';
import Feats from '../components/sections/Feats';
import Craft from '../components/sections/Craft';
import Inspiration from '../components/sections/Inspiration';
import { consumeHomeTarget } from '../lib/router';
import { jumpTo, scrollToTarget } from '../components/fx/SmoothScroll';

export default function HomePage() {
  // Quay về từ trang chi tiết: tới đúng tầng được yêu cầu, hoặc chỗ đang xem trước đó
  useEffect(() => {
    const { section, y } = consumeHomeTarget();
    if (section) {
      const t = setTimeout(() => scrollToTarget(`#${section}`), 400);
      return () => clearTimeout(t);
    }
    if (y !== undefined) requestAnimationFrame(() => jumpTo(y));
  }, []);

  return (
    <>
      <CaveHero />
      <Character />
      <Vault />
      <SkillTree />
      <Feats />
      <Craft />
      <Inspiration />
    </>
  );
}
