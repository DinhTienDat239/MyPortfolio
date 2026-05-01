import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot, collection, query, orderBy } from 'firebase/firestore';
import { auth, db } from './lib/firebase';
import Preloader from './components/Preloader';
import Header from './components/Header';
import Hero from './components/Hero';
import PlayableAds from './components/PlayableAds';
import GameDev from './components/GameDev';
import Footer from './components/Footer';
import LoginModal from './components/LoginModal';
import AdminDashboard from './components/AdminDashboard';

const DEFAULT_PROFILE = {
  fullName: 'Dinh Tien Dat',
  dob: '23/09/2003',
  roles: 'Playable Ads - Game Developer - Idea Creator',
  location: 'Hanoi, Vietnam',
  phone: '+84 368623903',
  email: 'scd239@gmail.com',
  aboutMe: 'Passionate Game Developer and Playable Ads Expert with a focus on creating engaging, high-performance interactive experiences. I specialize in HTML5 ad development and unique game mechanics.',
  profilePic: 'https://picsum.photos/seed/tibber/800/800',
  imageSize: 400,
  primaryColor: '#0ea5e9'
};

const DEFAULT_STATS = [
  { label: 'HTML Playables Built', value: '1000+' },
  { label: 'Ads Impressions', value: '10M+' },
  { label: 'Happy Clients', value: '50+' },
  { label: 'Years Experience', value: '3+' }
];

const DEFAULT_NETWORKS = [
  { name: 'AppLovin', logo: 'https://www.vectorlogo.zone/logos/applovin/applovin-icon.svg' },
  { name: 'Meta', logo: 'https://www.vectorlogo.zone/logos/facebook/facebook-icon.svg' },
  { name: 'Google Ads', logo: 'https://www.vectorlogo.zone/logos/google_adwords/google_adwords-icon.svg' },
  { name: 'Unity Ads', logo: 'https://www.vectorlogo.zone/logos/unity3d/unity3d-icon.svg' },
  { name: 'IronSource', logo: 'https://www.vectorlogo.zone/logos/ironsource/ironsource-icon.svg' },
  { name: 'Mintegral', logo: 'https://www.vectorlogo.zone/logos/mintegral/mintegral-icon.svg' }
];

const DEFAULT_PLAYABLES = [
  {
    id: 'p1',
    title: 'Interactive Puzzle Ad',
    description: 'A high-engagement puzzle playable built for AppLovin. Features smooth drag-and-drop mechanics.',
    iframeUrl: '/playables/sample-ad.html',
    thumbnail: 'https://picsum.photos/seed/p1/800/450',
    order: 0
  },
  {
    id: 'p2',
    title: 'Action RPG Preview',
    description: 'Mini-game preview for a mobile RPG. Optimized for low-end devices with high-quality visuals.',
    iframeUrl: '/playables/sample-ad.html',
    thumbnail: 'https://picsum.photos/seed/p2/800/450',
    order: 1
  }
];

const DEFAULT_GAMES = [
  {
    id: 'g1',
    title: 'Ocean Quest',
    description: 'An immersive underwater adventure game with unique physics-based movement and stunning visuals.',
    externalLink: 'https://example.com/ocean-quest',
    mainImage: 'https://picsum.photos/seed/g1/600/800',
    bgImage: 'https://picsum.photos/seed/g1bg/1920/1080',
    order: 0
  }
];

const DEFAULT_AWARDS = [
  {
    id: 'a1',
    name: 'Best Indie Game 2023',
    description: 'Awarded for outstanding gameplay and visual design in Ocean Quest.',
    image: 'https://picsum.photos/seed/award1/800/600',
    checkoutLink: 'https://example.com/award',
    showCheckout: true,
    order: 0
  }
];

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isAdminDashboardOpen, setIsAdminDashboardOpen] = useState(false);
  const [showPreloader, setShowPreloader] = useState(true);
  const [data, setData] = useState<any>({
    profile: DEFAULT_PROFILE,
    playables: DEFAULT_PLAYABLES,
    games: DEFAULT_GAMES,
    awards: DEFAULT_AWARDS,
    stats: DEFAULT_STATS,
    networks: DEFAULT_NETWORKS
  });

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user && user.email === 'scd239@gmail.com') {
        setUser(user);
      } else {
        setUser(null);
      }
    });

    // Real-time data fetching
    const unsubProfile = onSnapshot(doc(db, 'config', 'profile'), (doc) => {
      if (doc.exists()) {
        setData((prev: any) => ({ ...prev, profile: doc.data() }));
      }
    });

    const qPlayables = query(collection(db, 'playables'), orderBy('order', 'asc'));
    const unsubPlayables = onSnapshot(qPlayables, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setData((prev: any) => ({ ...prev, playables: items }));
    });

    const qGames = query(collection(db, 'games'), orderBy('order', 'asc'));
    const unsubGames = onSnapshot(qGames, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setData((prev: any) => ({ ...prev, games: items }));
    });

    const qAwards = query(collection(db, 'awards'), orderBy('order', 'asc'));
    const unsubAwards = onSnapshot(qAwards, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setData((prev: any) => ({ ...prev, awards: items }));
    });

    const qStats = query(collection(db, 'stats'), orderBy('order', 'asc'));
    const unsubStats = onSnapshot(qStats, (snapshot) => {
      if (!snapshot.empty) {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setData((prev: any) => ({ ...prev, stats: items }));
      }
    });

    const qNetworks = query(collection(db, 'networks'), orderBy('order', 'asc'));
    const unsubNetworks = onSnapshot(qNetworks, (snapshot) => {
      if (!snapshot.empty) {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setData((prev: any) => ({ ...prev, networks: items }));
      }
    });

    return () => {
      unsubscribeAuth();
      unsubProfile();
      unsubPlayables();
      unsubGames();
      unsubAwards();
      unsubStats();
      unsubNetworks();
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setShowPreloader(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  const handleHiddenTrigger = () => {
    if (user) {
      setIsAdminDashboardOpen(true);
    } else {
      setIsLoginModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen selection:bg-white selection:text-black">
      {showPreloader && <Preloader />}
      <Header brandName="Tibber Dinh" />
      
      <main>
        <Hero profile={data.profile} />
        <PlayableAds 
          playables={data.playables} 
          stats={data.stats} 
          networks={data.networks} 
        />
        <GameDev 
          awards={data.awards} 
          games={data.games} 
        />
      </main>

      <Footer 
        brandName="Tibber Dinh" 
        onHiddenTrigger={handleHiddenTrigger} 
      />

      {/* Admin UI */}
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
      />
      
      <AdminDashboard 
        isOpen={isAdminDashboardOpen} 
        onClose={() => setIsAdminDashboardOpen(false)} 
        data={data}
      />

      {/* Admin Floating Button (visible only when logged in) */}
      {user && (
        <button
          onClick={() => setIsAdminDashboardOpen(true)}
          className="fixed bottom-8 right-8 z-40 w-14 h-14 bg-white text-black rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform box-glow"
        >
          <div className="font-bold">AD</div>
        </button>
      )}
    </div>
  );
}
