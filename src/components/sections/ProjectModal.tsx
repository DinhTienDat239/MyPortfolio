import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { asset, findProject, formatSize, projects } from '../../data';
import { GENRE_LABEL } from '../../types/content';
import { lockScroll } from '../../lib/scroll';
import { cn } from '../../lib/utils';
import { CTA_MESSAGE, loadPlayable, storeName } from '../../lib/playable';
import PhoneFrame from '../ui/PhoneFrame';
import { EASE } from '../ui/Reveal';

interface Props {
  slug: string | null;
  onClose: () => void;
  onNavigate: (slug: string) => void;
}

/**
 * Simulator: chạy playable thật trong iframe (srcdoc + shim chặn CTA, xem lib/playable).
 * Esc đóng · ← → chuyển · Restart mount lại iframe · xoay dọc/ngang.
 */
export default function ProjectModal({ slug, onClose, onNavigate }: Props) {
  const project = slug ? findProject(slug) : undefined;

  useEffect(() => {
    if (!project) return;
    lockScroll(true);
    return () => lockScroll(false);
  }, [project]);

  return <AnimatePresence>{project && <Simulator key="sim" slug={project.slug} onClose={onClose} onNavigate={onNavigate} />}</AnimatePresence>;
}

function Simulator({ slug, onClose, onNavigate }: { slug: string; onClose: () => void; onNavigate: (s: string) => void }) {
  const p = findProject(slug)!;
  const idx = projects.findIndex((x) => x.slug === slug);
  const prev = projects[(idx - 1 + projects.length) % projects.length];
  const next = projects[(idx + 1) % projects.length];

  const [landscape, setLandscape] = useState(false);
  const [reload, setReload] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [html, setHtml] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  /** Store mà playable vừa cố mở (null = không hiện thông báo). nav = playable đã tự điều hướng iframe. */
  const [cta, setCta] = useState<{ url: string; nav: boolean } | null>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const url = asset(p.playableUrl);

  useEffect(() => setLoaded(false), [slug, reload, landscape]);
  useEffect(() => setCta(null), [slug, landscape]);

  // Tải HTML + chèn shim chặn CTA
  useEffect(() => {
    if (!url) return;
    let alive = true;
    setHtml(null);
    setFailed(false);
    loadPlayable(url).then(
      (h) => alive && setHtml(h),
      () => alive && setFailed(true),
    );
    return () => {
      alive = false;
    };
  }, [url]);

  // Nhận tín hiệu CTA từ shim trong iframe
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.source !== frame.current?.contentWindow || e.data?.type !== CTA_MESSAGE) return;
      const nav = !!e.data.nav;
      setCta({ url: String(e.data.url || ''), nav });
      // Playable tự điều hướng iframe đi nơi khác → mount lại ngay phía sau thông báo
      if (nav) setReload((r) => r + 1);
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, []);

  useEffect(() => {
    closeBtn.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onNavigate(next.slug);
      if (e.key === 'ArrowLeft') onNavigate(prev.slug);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, onNavigate, next.slug, prev.slug]);

  const specs: [string, string | undefined][] = [
    ['Genre', GENRE_LABEL[p.genre]],
    ['Format', 'Single HTML file'],
    ['Engine', p.engine],
    ['Platform', p.platform ?? 'iOS, Android'],
    ['Size', formatSize(p.sizeKB)],
    ['Installs', p.installs],
    ['Networks', p.networks?.join(', ')],
  ];

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={`${p.title} — playable`}
      data-lenis-prevent
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[60] overflow-y-auto bg-bg"
    >
      {/* Thanh trên: sticky trên mobile; nổi đè trên desktop để máy dùng trọn chiều cao */}
      <div className="sticky top-0 z-20 bg-bg/95 lg:pointer-events-none lg:fixed lg:inset-x-0 lg:bg-transparent">
        <div className="mx-auto flex h-14 max-w-[1500px] items-center justify-between px-5 text-[15px] sm:px-8 lg:[&>*]:pointer-events-auto">
          <span className="text-muted">
            {String(idx + 1).padStart(2, '0')} / {String(projects.length).padStart(2, '0')}
          </span>
          <button ref={closeBtn} onClick={onClose} className="link">
            Close
          </button>
        </div>
      </div>

      <div
        className={cn(
          'mx-auto grid max-w-[1500px] items-center gap-10 px-4 pb-16 sm:px-8 lg:min-h-svh lg:gap-12 lg:py-4',
          landscape ? 'lg:grid-cols-1 lg:pt-14' : 'lg:grid-cols-[minmax(18rem,26rem)_1fr] lg:pb-4',
        )}
      >
        {/* Thông tin */}
        <motion.div
          key={slug}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
          className={cn('order-2 px-1', landscape ? 'lg:mx-auto lg:w-full lg:max-w-3xl' : 'lg:order-1')}
        >
          <h2 className="text-4xl font-medium tracking-tight md:text-5xl">{p.title}</h2>
          <p className="mt-5 max-w-md leading-relaxed text-fg/80">{p.summary}</p>
          <dl className="mt-8 border-t border-line text-[15px]">
            {specs
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <div key={k} className="grid grid-cols-[7rem_1fr] border-b border-line py-2.5">
                  <dt className="text-muted">{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
          </dl>
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-[15px]">
            <button onClick={() => setReload((r) => r + 1)} className="link">
              Restart
            </button>
            <button onClick={() => setLandscape((l) => !l)} className="link">
              {landscape ? 'Portrait' : 'Landscape'}
            </button>
          </div>
          <div className="mt-12 flex justify-between gap-6 border-t border-line pt-4 text-[15px]">
            <button onClick={() => onNavigate(prev.slug)} className="truncate text-muted hover:text-fg">
              ← {prev.title}
            </button>
            <button onClick={() => onNavigate(next.slug)} className="truncate text-right text-muted hover:text-fg">
              {next.title} →
            </button>
          </div>
        </motion.div>

        {/* Máy: cao gần trọn màn hình (~0.51 = rộng/cao của khung 9:18 kèm viền) */}
        <div className={cn('order-1 flex justify-center', !landscape && 'lg:order-2')}>
          <PhoneFrame
            landscape={landscape}
            screenClassName={landscape ? undefined : 'aspect-[9/18]'}
            className={
              landscape
                ? 'w-[min(calc(100vw-2rem),calc((100svh-4.5rem)*1.7),1100px)] lg:w-[min(calc(100vw-6rem),calc((100svh-5rem)*1.7),1200px)]'
                : 'w-[min(calc(100vw-2rem),calc((100svh-4.5rem)*0.51),480px)] lg:w-[min(calc((100svh-2rem)*0.51),500px)]'
            }
          >
            {url && html && (
              <iframe
                ref={frame}
                key={`${slug}-${reload}-${landscape}`}
                srcDoc={html}
                title={`${p.title} playable ad`}
                sandbox="allow-scripts allow-same-origin allow-pointer-lock"
                allow="autoplay; fullscreen; accelerometer; gyroscope"
                onLoad={() => setLoaded(true)}
                className="absolute inset-0 h-full w-full border-0"
              />
            )}
            {!url && p.thumbnail && <img src={asset(p.thumbnail)} alt="" className="absolute inset-0 h-full w-full object-cover" />}
            {url && !loaded && (
              <div className="absolute inset-0 grid place-items-center bg-black">
                {p.thumbnail && <img src={asset(p.thumbnail)} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" />}
                <span className="relative text-sm text-white/80">{failed ? 'Could not load this playable.' : 'Loading…'}</span>
              </div>
            )}

            {/* Thông báo CTA: thay cho việc bị đẩy ra store */}
            <AnimatePresence>
              {cta && (
                <motion.div
                  key="cta"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="absolute inset-0 z-30 flex items-end bg-black/55 p-[6%] backdrop-blur-[2px]"
                  role="status"
                  aria-live="polite"
                >
                  <motion.div
                    initial={{ y: 24, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 16, opacity: 0 }}
                    transition={{ duration: 0.4, ease: EASE }}
                    className="w-full rounded-2xl bg-white p-5 text-[#111] shadow-[0_20px_50px_-20px_rgb(0_0_0/0.6)]"
                  >
                    <div className="flex items-center gap-2 text-[13px] text-[#666]">
                      <span className="grid h-5 w-5 place-items-center rounded-full bg-[#111] text-[11px] text-white">↗</span>
                      Install tapped
                    </div>
                    <p className="mt-3 text-[clamp(1rem,2.2vh,1.2rem)] font-medium leading-snug tracking-tight">In a live ad, this opens {storeName(cta.url)}.</p>
                    <p className="mt-1.5 text-[13px] leading-snug text-[#666]">That tap is the conversion. Here, you stay on the page.</p>
                    <div className="mt-4 flex gap-2 text-[14px]">
                      <button
                        onClick={() => {
                          if (!cta.nav) setReload((r) => r + 1);
                          setCta(null);
                        }}
                        className="flex-1 rounded-full bg-[#111] px-4 py-2.5 font-medium text-white"
                      >
                        Play again
                      </button>
                      {!cta.nav && (
                        <button onClick={() => setCta(null)} className="flex-1 rounded-full border border-[#ddd] px-4 py-2.5">
                          Keep playing
                        </button>
                      )}
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </PhoneFrame>
        </div>
      </div>
    </motion.div>
  );
}
