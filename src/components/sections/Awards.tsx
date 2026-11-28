import { asset, content } from '../../data';
import type { Award, WebGame } from '../../types/content';
import { cn } from '../../lib/utils';
import { MaskLine, Reveal, Section } from '../ui/Reveal';

/**
 * Games & recognition:
 *  1. Giải thưởng dạng thẻ ảnh (ảnh chụp thật cắt vừa khung; banner có chữ giữ nguyên trên nền mờ của chính nó)
 *  2. Web game đang chạy trên portal (CrazyGames, Playgama)
 *  3. Game jam / indie của studio
 */
export default function Awards() {
  const { awards, games, studio, webGames } = content;

  return (
    <Section
      id="awards"
      index="07"
      label="Games & recognition"
      note={studio.name}
      title={
        <>
          <MaskLine inView>Games that</MaskLine>
          <MaskLine inView delay={0.08}>
            won <span className="em">something.</span>
          </MaskLine>
        </>
      }
    >
      {/* ---------- Giải thưởng ---------- */}
      <div className="grid gap-x-8 gap-y-14 md:grid-cols-2">
        {awards.map((a, i) => (
          <Reveal key={a.title + a.year} delay={(i % 2) * 0.08}>
            <AwardCard a={a} gameTitle={a.entry ?? games.find((g) => g.slug === a.project)?.title} />
          </Reveal>
        ))}
      </div>

      {/* ---------- Web games ---------- */}
      {webGames?.length > 0 && (
        <>
          <div className="mt-28 border-t border-line pt-6 md:flex md:items-baseline md:justify-between md:gap-10">
            <Reveal>
              <h3 className="text-[clamp(1.6rem,2.8vw,2.4rem)] font-medium leading-tight tracking-[-0.03em]">
                Now shipping <span className="em">on the web.</span>
              </h3>
            </Reveal>
            <Reveal delay={0.05}>
              <p className="mt-3 max-w-md text-[15px] leading-relaxed text-muted md:mt-0 md:text-right">
                Full Unity WebGL games built with {studio.name}, published on CrazyGames and Playgama.
              </p>
            </Reveal>
          </div>
          <div className="mt-10 grid gap-x-8 gap-y-14 md:grid-cols-2">
            {webGames.map((g, i) => (
              <Reveal key={g.slug} delay={i * 0.08}>
                <WebGameCard g={g} />
              </Reveal>
            ))}
          </div>
        </>
      )}

      {/* ---------- Game jam / indie ---------- */}
      <div className="mt-28 flex items-baseline justify-between gap-6 border-t border-line pt-6">
        <Reveal>
          <h3 className="text-xl font-medium tracking-tight">Jam & indie games</h3>
        </Reveal>
        <a href={studio.link} target="_blank" rel="noopener noreferrer" className="link shrink-0 text-[15px]">
          itch.io ↗
        </a>
      </div>
      <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4 lg:gap-x-8">
        {games.map((g, i) => {
          const award = awards.find((a) => a.project === g.slug);
          return (
            <Reveal key={g.slug} delay={i * 0.06}>
              <a href={g.link} target="_blank" rel="noopener noreferrer" className="group block" data-cursor="Play">
                <div className="relative aspect-[4/3] overflow-hidden bg-[#0d0d0d]">
                  {/* Ảnh bìa đủ mọi tỉ lệ: nền mờ từ chính ảnh + ảnh gốc contain, không cắt mất nhân vật/tên game */}
                  <img src={asset(g.cover)} alt="" aria-hidden loading="lazy" className="absolute inset-0 h-full w-full scale-125 object-cover opacity-60 blur-2xl" />
                  <img
                    src={asset(g.cover)}
                    alt={g.title}
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-contain transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-[1.04]"
                  />
                  {award && (
                    <span className="absolute left-3 top-3 max-w-[calc(100%-1.5rem)] bg-bg px-2 py-1 text-xs font-medium">
                      {award.result.split(' · ')[0]} — {award.title}
                    </span>
                  )}
                </div>
                <div className="mt-4 flex items-baseline justify-between gap-3">
                  <h4 className="font-medium">{g.title}</h4>
                  <span className="text-sm tabular-nums text-muted">{g.year}</span>
                </div>
                <p className="mt-0.5 text-sm text-muted">
                  {g.genre}
                  {g.status && ` · ${g.status}`}
                </p>
              </a>
            </Reveal>
          );
        })}
      </div>
    </Section>
  );
}

function AwardCard({ a, gameTitle }: { a: Award; gameTitle?: string }) {
  const src = asset(a.image);
  const contain = a.fit === 'contain';
  const body = (
    <>
      <div className="relative aspect-[4/3] overflow-hidden bg-[#0d0d0d]">
        {src && (
          <>
            {/* banner: nền là chính ảnh, phóng to + làm mờ, để ảnh gốc không bị cắt chữ */}
            {contain && <img src={src} alt="" aria-hidden loading="lazy" className="absolute inset-0 h-full w-full scale-125 object-cover opacity-70 blur-2xl" />}
            <img
              src={src}
              alt={a.caption ?? a.title}
              loading="lazy"
              className={cn(
                'absolute inset-0 h-full w-full transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-[1.03]',
                contain ? 'object-contain drop-shadow-[0_20px_40px_rgb(0_0_0/0.45)]' : 'object-cover',
              )}
            />
          </>
        )}
        <span className="absolute left-4 top-4 bg-bg px-2.5 py-1 text-[13px] font-medium">{a.result}</span>
      </div>
      <div className="mt-5 grid grid-cols-[3.5rem_1fr] gap-x-4">
        <span className="pt-1.5 text-sm tabular-nums text-muted">{a.year}</span>
        <div>
          <h3 className="text-[clamp(1.4rem,2.2vw,2rem)] font-medium leading-tight tracking-[-0.03em]">
            {a.title}
            {a.link && <span className="ml-2 inline-block text-[0.6em] text-muted transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5">↗</span>}
          </h3>
          <p className="mt-1.5 text-[15px] text-muted">
            {a.caption}
            {gameTitle && a.caption && !a.caption.includes(gameTitle) && <> · {gameTitle}</>}
            {gameTitle && !a.caption && gameTitle}
          </p>
        </div>
      </div>
    </>
  );
  return a.link ? (
    <a href={a.link} target="_blank" rel="noopener noreferrer" className="group block" data-cursor="View">
      {body}
    </a>
  ) : (
    <div className="group">{body}</div>
  );
}

function WebGameCard({ g }: { g: WebGame }) {
  const live = g.portals.some((p) => p.status.toLowerCase() === 'live');
  const media = (
    <div className="relative aspect-video overflow-hidden bg-soft">
      <img
        src={asset(g.cover)}
        alt={g.title}
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-[1.03]"
      />
      <span className="absolute left-4 top-4 flex items-center gap-2 bg-bg px-2.5 py-1 text-[13px] font-medium">
        <span className={cn('h-1.5 w-1.5 rounded-full', live ? 'bg-fg' : 'border border-fg')} />
        {live ? 'Playable now' : 'Coming soon'}
      </span>
    </div>
  );

  return (
    <div className="group">
      {g.link ? (
        <a href={g.link} target="_blank" rel="noopener noreferrer" className="block" data-cursor="Play">
          {media}
        </a>
      ) : (
        media
      )}
      <div className="mt-5 flex items-baseline justify-between gap-4">
        <h4 className="text-[clamp(1.3rem,2vw,1.75rem)] font-medium leading-tight tracking-[-0.025em]">{g.title}</h4>
        <span className="text-sm tabular-nums text-muted">{g.year}</span>
      </div>
      <p className="mt-1 text-[15px] text-muted">
        {g.genre}
        {g.engine && ` · ${g.engine}`}
      </p>
      <p className="mt-4 max-w-xl leading-relaxed text-fg/75">{g.blurb}</p>
      <ul className="mt-5 border-t border-line text-[15px]">
        {g.portals.map((p) => (
          <li key={p.name} className="flex justify-between border-b border-line py-2.5">
            <span>{p.name}</span>
            <span className="text-muted">{p.status}</span>
          </li>
        ))}
      </ul>
      <div className="mt-5 text-[15px]">
        {g.link ? (
          <a href={g.link} target="_blank" rel="noopener noreferrer" className="link font-medium">
            Play in your browser ↗
          </a>
        ) : (
          <span className="text-muted">Public link once it leaves testing</span>
        )}
      </div>
    </div>
  );
}
