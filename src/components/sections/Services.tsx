import { content } from '../../data';
import { cn } from '../../lib/utils';
import { MaskLine, Reveal, Section } from '../ui/Reveal';

/**
 * Gói dịch vụ: khách thấy ngay mua gì, giá bao nhiêu, bao lâu nhận, sửa mấy lần.
 * Nội dung trong content.json → services (khớp Project Catalog trên Upwork).
 */
export default function Services() {
  const { services } = content;
  return (
    <Section
      id="services"
      index="02"
      label="Services & pricing"
      note="Fixed price · clear delivery dates"
      title={
        <>
          <MaskLine inView>Assets in,</MaskLine>
          <MaskLine inView delay={0.08}>
            playable out in <span className="em">48 hours.</span>
          </MaskLine>
        </>
      }
    >
      <Reveal>
        <p className="max-w-2xl text-lg leading-relaxed text-fg/70">{services.intro}</p>
      </Reveal>

      <div className="mt-14 grid gap-5 md:grid-cols-3">
        {services.items.map((s, i) => (
          <Reveal key={s.id} delay={i * 0.08}>
            <article className={cn('flex h-full flex-col border p-7', s.featured ? 'border-fg bg-fg text-bg' : 'border-line')}>
              <h3 className="text-xl font-medium tracking-tight">{s.name}</h3>
              <p className={cn('mt-3 min-h-[4.5rem] text-[15px] leading-relaxed', s.featured ? 'text-bg/70' : 'text-muted')}>{s.body}</p>
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 pt-8">
                <span className="whitespace-nowrap text-3xl font-medium tracking-[-0.03em]">{s.price}</span>
                <span className={cn('text-sm', s.featured ? 'text-bg/70' : 'text-muted')}>{s.delivery}</span>
              </div>
              <ul className={cn('mt-6 border-t text-[15px]', s.featured ? 'border-bg/20' : 'border-line')}>
                {s.includes.map((x) => (
                  <li key={x} className={cn('border-b py-2.5', s.featured ? 'border-bg/20' : 'border-line')}>
                    {x}
                  </li>
                ))}
              </ul>
            </article>
          </Reveal>
        ))}
      </div>

      <dl className="mt-14 grid gap-x-8 border-t border-line sm:grid-cols-2 lg:grid-cols-4">
        {services.terms.map((t) => (
          <Reveal key={t.k}>
            <div className="border-b border-line py-5">
              <dt className="text-sm text-muted">{t.k}</dt>
              <dd className="mt-1 text-[15px] leading-relaxed">{t.v}</dd>
            </div>
          </Reveal>
        ))}
      </dl>

      {services.ctaUrl && (
        <Reveal>
          <a
            href={services.ctaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-10 inline-block bg-fg px-6 py-3 text-[15px] font-medium text-bg transition-opacity hover:opacity-80"
          >
            {services.ctaLabel ?? 'Hire me'} ↗
          </a>
        </Reveal>
      )}
    </Section>
  );
}
