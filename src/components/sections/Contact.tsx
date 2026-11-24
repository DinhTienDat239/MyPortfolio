import { motion, useMotionValue, useSpring } from 'motion/react';
import { useRef, useState } from 'react';
import { content } from '../../data';
import { explode } from '../../lib/particles';
import { MaskLine, Reveal } from '../ui/Reveal';

/**
 * Site tĩnh (GitHub Pages) → mặc định form mở app email với nội dung soạn sẵn.
 * Đặt VITE_FORM_ENDPOINT (Formspree / Getform…) để POST thẳng vào hộp thư.
 */
const ENDPOINT = import.meta.env.VITE_FORM_ENDPOINT as string | undefined;

export default function Contact() {
  const { profile, socials } = content;
  const form = useRef<HTMLFormElement>(null);
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get('name') ?? '').trim();
    const email = String(fd.get('email') ?? '').trim();
    const message = String(fd.get('message') ?? '').trim();
    setState('sending');
    try {
      if (ENDPOINT) {
        const res = await fetch(ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ name, email, message }),
        });
        if (!res.ok) throw new Error(String(res.status));
      } else {
        const body = `${message}\n\n— ${name}${email ? ` <${email}>` : ''}`;
        window.location.href = `mailto:${profile.email}?subject=${encodeURIComponent(`Hello from ${name}`)}&body=${encodeURIComponent(body)}`;
      }
      if (form.current) explode(form.current.getBoundingClientRect(), 140);
      setState('sent');
      form.current?.reset();
    } catch {
      setState('error');
    }
  };

  return (
    <section id="contact" className="bg-fg text-bg">
      <div className="mx-auto max-w-[1400px] px-5 pb-16 pt-24 sm:px-8 md:pt-32">
        <Reveal>
          <div className="flex items-baseline justify-between gap-6 border-t border-bg/15 pt-4 text-sm text-bg/50">
            <span>
              <span className="tabular-nums">(08)</span>
              <span className="ml-4">Contact</span>
            </span>
            <span className="hidden sm:block">Usually replies within a day</span>
          </div>
        </Reveal>

        <a href={`mailto:${profile.email}`} className="group mt-10 block" data-cursor="Email">
          <span className="block text-[clamp(4rem,15vw,15rem)] font-medium leading-[0.85] tracking-[-0.06em]">
            <MaskLine inView>Let&apos;s</MaskLine>
            <MaskLine inView delay={0.08}>
              <span className="em pr-[0.05em]">talk</span>
              <span className="inline-block transition-transform duration-500 group-hover:translate-x-4 group-hover:-translate-y-4">↗</span>
            </MaskLine>
          </span>
        </a>

        <div className="mt-20 grid gap-16 border-t border-bg/15 pt-12 lg:grid-cols-12 lg:gap-8">
          <Reveal className="lg:col-span-4">
            <dl className="space-y-6 text-[15px]">
              <div>
                <dt className="text-bg/50">Email</dt>
                <dd>
                  <a href={`mailto:${profile.email}`} className="link">
                    {profile.email}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-bg/50">Based in</dt>
                <dd>{profile.location} · GMT+7</dd>
              </div>
              <div>
                <dt className="text-bg/50">Elsewhere</dt>
                <dd className="flex flex-col">
                  {socials
                    .filter((s) => s.url && s.label !== 'Email')
                    .map((s) => (
                      <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer" className="link w-fit">
                        {s.label} ↗
                      </a>
                    ))}
                </dd>
              </div>
            </dl>
          </Reveal>

          <Reveal className="lg:col-span-7 lg:col-start-6" delay={0.1}>
            <form ref={form} onSubmit={submit} className="space-y-8 [&_.field]:border-bg/20 [&_.field]:text-bg [&_.field:focus]:border-bg">
              <div className="grid gap-8 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm text-bg/50">Name</span>
                  <input name="name" required autoComplete="name" className="field" />
                </label>
                <label className="block">
                  <span className="text-sm text-bg/50">Email</span>
                  <input name="email" type="email" required autoComplete="email" className="field" />
                </label>
              </div>
              <label className="block">
                <span className="text-sm text-bg/50">Tell me about your game</span>
                <textarea name="message" required rows={3} className="field resize-none" />
              </label>
              <div className="flex flex-wrap items-center gap-8">
                <Magnetic>
                  <button
                    type="submit"
                    disabled={state === 'sending'}
                    className="grid h-32 w-32 place-items-center rounded-full bg-bg text-[15px] font-medium text-fg transition-transform duration-300 hover:scale-105 disabled:opacity-50"
                  >
                    {state === 'sending' ? 'Sending…' : 'Send'}
                  </button>
                </Magnetic>
                {state === 'sent' && <p className="text-[15px] text-bg/70">{ENDPOINT ? 'Thanks — I’ll reply within a day.' : 'Your email app should now be open.'}</p>}
                {state === 'error' && <p className="text-[15px] text-bg/70">Couldn’t send. Please email me directly.</p>}
              </div>
            </form>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/** Phần tử bị hút nhẹ theo con trỏ. */
function Magnetic({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useSpring(useMotionValue(0), { stiffness: 200, damping: 15 });
  const y = useSpring(useMotionValue(0), { stiffness: 200, damping: 15 });
  return (
    <motion.div
      ref={ref}
      style={{ x, y }}
      onPointerMove={(e) => {
        if (e.pointerType !== 'mouse' || !ref.current) return;
        const r = ref.current.getBoundingClientRect();
        x.set((e.clientX - r.left - r.width / 2) * 0.35);
        y.set((e.clientY - r.top - r.height / 2) * 0.35);
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.div>
  );
}
