import { useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowUpRight, Check, Copy } from 'lucide-react';
import { content } from '../../data';
import { cn } from '../../lib/utils';
import { play } from '../../lib/sound';
import SectionHeading from '../fx/SectionHeading';

const EASE = [0.22, 1, 0.36, 1] as const;

/** Ô nhập: mỗi lần gõ phím, viền dưới loé đỏ + (nếu bật âm) tiếng gõ. */
function RitualField({
  label,
  name,
  value,
  onChange,
  type = 'text',
  multiline,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  multiline?: boolean;
}) {
  const [pulse, setPulse] = useState(0);
  const common = {
    id: name,
    name,
    value,
    required: true,
    onChange: (e: { target: { value: string } }) => {
      onChange(e.target.value);
      setPulse((p) => p + 1);
      play('key');
    },
    className:
      'peer w-full resize-none border-0 border-b border-ash bg-transparent px-0 pb-3 pt-7 text-lg text-bone outline-none transition-colors placeholder:text-transparent focus:border-blood-600',
    placeholder: label,
  };
  return (
    <div className="relative">
      {multiline ? <textarea rows={4} {...common} /> : <input type={type} {...common} />}
      <label
        htmlFor={name}
        className="pointer-events-none absolute left-0 top-7 font-mono text-xs uppercase tracking-[0.3em] text-fog transition-all peer-focus:top-0 peer-focus:text-[10px] peer-focus:text-blood-400 peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:text-[10px]"
      >
        {label}
      </label>
      {/* tia sáng chạy dọc viền mỗi lần gõ */}
      <AnimatePresence>
        {pulse > 0 && (
          <motion.span
            key={pulse}
            initial={{ scaleX: 0, opacity: 1 }}
            animate={{ scaleX: 1, opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="absolute bottom-0 left-0 h-px w-full origin-left bg-blood-400 shadow-blood"
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Summon() {
  const { profile, socials } = content;
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sent, setSent] = useState(false);
  const [copied, setCopied] = useState(false);

  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  // Site tĩnh không có backend → mở ứng dụng mail với nội dung soạn sẵn
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const subject = `Summoning from your portfolio — ${form.name}`;
    const body = `${form.message}\n\n— ${form.name} (${form.email})`;
    window.location.href = `mailto:${profile.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    play('thud');
    setSent(true);
  };

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(profile.email);
      setCopied(true);
      play('chime');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard bị chặn — bỏ qua */
    }
  };

  const links = socials.filter((s) => s.url);

  return (
    <section id="contact" className="relative overflow-hidden px-5 py-28 md:px-8 md:py-40">
      <div aria-hidden className="pointer-events-none absolute -right-40 top-20 h-[36rem] w-[36rem] rounded-full bg-blood-600/10 blur-[140px]" />
      <div className="relative mx-auto max-w-7xl">
        <SectionHeading
          chapter={content.awards.length ? 'V' : 'IV'}
          kicker="Hire me"
          title="Summon Me"
          intro="Got a game that needs teeth, or a playable that has to convert? Write the incantation below — I answer every summons."
        />

        <div className="grid gap-16 lg:grid-cols-[1.2fr_0.8fr]">
          {/* Form */}
          <form onSubmit={submit} className="space-y-8">
            <div className="grid gap-8 md:grid-cols-2">
              <RitualField label="Your name" name="name" value={form.name} onChange={set('name')} />
              <RitualField label="Your email" name="email" type="email" value={form.email} onChange={set('email')} />
            </div>
            <RitualField label="Your message" name="message" value={form.message} onChange={set('message')} multiline />
            <div className="flex flex-wrap items-center gap-6">
              <button
                type="submit"
                className="group flex items-center gap-3 border border-blood-500 bg-blood-500 px-8 py-4 font-mono text-xs uppercase tracking-[0.3em] text-void transition-colors hover:bg-transparent hover:text-blood-400"
              >
                Complete the ritual
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </button>
              <AnimatePresence>
                {sent && (
                  <motion.p initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="font-serif text-lg italic text-bone/80">
                    Your mail app should open with the message ready.
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </form>

          {/* Kênh liên hệ */}
          <div>
            <button
              onClick={copyEmail}
              className="group mb-10 flex w-full items-center justify-between border border-ash p-6 text-left transition-colors hover:border-blood-600"
            >
              <span>
                <span className="block font-mono text-[10px] uppercase tracking-[0.3em] text-fog">Direct line</span>
                <span className="mt-1 block break-all font-display text-xl text-bone md:text-2xl">{profile.email}</span>
              </span>
              {copied ? <Check className="h-5 w-5 text-blood-400" /> : <Copy className="h-5 w-5 text-fog group-hover:text-blood-400" />}
            </button>

            <ul className="divide-y divide-ash border-y border-ash">
              {links.map((s, i) => (
                <motion.li
                  key={s.label}
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.7, ease: EASE, delay: i * 0.08 }}
                >
                  <a
                    href={s.url}
                    target={s.url.startsWith('mailto:') ? undefined : '_blank'}
                    rel="noopener noreferrer"
                    className="group relative flex items-center justify-between overflow-hidden py-5"
                  >
                    <span className="absolute inset-0 origin-left scale-x-0 bg-blood-600 transition-transform duration-500 ease-out group-hover:scale-x-100" />
                    <span className="relative flex items-baseline gap-4 transition-transform duration-500 group-hover:translate-x-4">
                      <span className="font-display text-2xl font-bold text-bone">{s.label}</span>
                      {s.handle && <span className="font-mono text-xs text-fog transition-colors group-hover:text-void">{s.handle}</span>}
                    </span>
                    <ArrowUpRight className="relative mr-2 h-5 w-5 text-fog transition-all group-hover:-translate-x-2 group-hover:text-void" />
                  </a>
                </motion.li>
              ))}
            </ul>

            {profile.phone && (
              <p className={cn('mt-8 font-mono text-xs uppercase tracking-[0.25em] text-fog')}>
                Or call · <a href={`tel:${profile.phone.replace(/\s/g, '')}`} className="text-bone hover:text-blood-400">{profile.phone}</a>
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
