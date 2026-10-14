import { useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, Copy } from 'lucide-react';
import { content } from '../../data';
import { cn } from '../../lib/utils';
import { play } from '../../lib/sound';
import { LayerHeading, LayerSection } from '../fx/Layer';
import { Sparkle, Sprite } from '../pixel/Sprite';
import type { SpriteName } from '../pixel/sprites';

const SOCIAL_ICON: Record<string, SpriteName> = {
  github: 'book',
  email: 'scroll',
  'itch.io': 'sword',
  linkedin: 'star',
  facebook: 'heart',
};

/** Ô nhập kiểu "ô nguyên liệu": mỗi lần gõ phím loé sáng nhẹ. */
function Ingredient({
  label,
  icon,
  name,
  value,
  onChange,
  type = 'text',
  multiline,
}: {
  label: string;
  icon: SpriteName;
  name: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  multiline?: boolean;
}) {
  const [flash, setFlash] = useState(0);
  const props = {
    id: name,
    name,
    value,
    required: true,
    placeholder: label,
    onChange: (e: { target: { value: string } }) => {
      onChange(e.target.value);
      setFlash((f) => f + 1);
      play('key');
    },
    className: 'w-full resize-none bg-transparent text-lg text-parchment outline-none placeholder:text-mist/60',
  };
  return (
    <label htmlFor={name} className={cn('px-slot relative flex gap-3 p-3 focus-within:shadow-torch', value && 'bg-torch/5')}>
      <Sprite name={icon} size={28} className={cn('mt-0.5 transition', value ? 'opacity-100' : 'opacity-40 grayscale')} />
      {multiline ? <textarea rows={4} {...props} /> : <input type={type} {...props} />}
      <AnimatePresence>
        {flash > 0 && (
          <motion.span
            key={flash}
            aria-hidden
            initial={{ opacity: 0.6 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="pointer-events-none absolute inset-0 bg-torch/10"
          />
        )}
      </AnimatePresence>
    </label>
  );
}

export default function Craft() {
  const { profile, socials } = content;
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [crafted, setCrafted] = useState(false);
  const [copied, setCopied] = useState(false);
  const ready = !!(form.name && form.email && form.message);
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  // Site tĩnh → mở ứng dụng mail với thư soạn sẵn
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const subject = `Portfolio message from ${form.name}`;
    const body = `${form.message}\n\n— ${form.name} (${form.email})`;
    play('chime');
    setCrafted(true);
    window.location.href = `mailto:${profile.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(profile.email);
      setCopied(true);
      play('pickup');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard bị chặn */
    }
  };

  return (
    <LayerSection id="contact" tile="moss">
      <LayerHeading
        id="contact"
        title="Crafting Table"
        icon="scroll"
        intro="Got a game that needs digging, or a playable that has to convert? Combine the ingredients below to craft a message."
      />

      <div className="grid gap-12 lg:grid-cols-[1.25fr_0.75fr]">
        {/* Bàn chế tạo */}
        <form onSubmit={submit} className="px-panel p-5 md:p-7">
          <p className="mb-5 font-label text-[10px] uppercase text-moss">Recipe · Message</p>
          <div className="grid items-center gap-6 md:grid-cols-[1fr_auto_auto]">
            <div className="space-y-4">
              <Ingredient label="Your name" icon="heart" name="name" value={form.name} onChange={set('name')} />
              <Ingredient label="Your email" icon="coin" name="email" type="email" value={form.email} onChange={set('email')} />
              <Ingredient label="Your message" icon="book" name="message" value={form.message} onChange={set('message')} multiline />
            </div>
            <span aria-hidden className="hidden text-center font-label text-2xl text-mist md:block">▶</span>
            {/* Ô kết quả */}
            <div className="flex flex-col items-center gap-3">
              <div
                className={cn('px-slot relative flex h-24 w-24 items-center justify-center transition-shadow', ready && 'shadow-torch')}
                style={ready ? { borderColor: 'var(--color-gold)', boxShadow: 'inset 0 2px 0 rgb(0 0 0 / 0.45), 0 0 24px rgb(242 193 78 / 0.4)' } : undefined}
              >
                <Sprite name="scroll" size={56} className={cn('transition', ready ? 'animate-bob' : 'opacity-25 grayscale')} />
                {ready && (
                  <>
                    <Sparkle className="absolute left-2 top-2" />
                    <Sparkle className="absolute bottom-3 right-2" delay={0.5} color="var(--color-crystal)" />
                  </>
                )}
              </div>
              <span className="font-label text-[10px] uppercase text-mist">{ready ? 'Ready to craft' : 'Missing ingredients'}</span>
            </div>
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-5">
            <button type="submit" disabled={!ready} className={cn('px-btn', !ready && 'cursor-not-allowed opacity-50')}>
              <Sprite name="pickaxe" size={20} /> Craft &amp; send
            </button>
            <AnimatePresence>
              {crafted && (
                <motion.p initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-mist">
                  Crafted! Your mail app should open with the message.
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </form>

        {/* Kênh liên lạc */}
        <div className="space-y-5">
          <button onClick={copyEmail} className="px-panel flex w-full items-center justify-between gap-4 p-5 text-left">
            <span className="flex items-center gap-4">
              <Sprite name="scroll" size={36} />
              <span>
                <span className="block font-label text-[10px] uppercase text-mist">Direct line</span>
                <span className="block break-all text-lg text-parchment">{profile.email}</span>
              </span>
            </span>
            {copied ? <Check className="h-5 w-5 text-uncommon" /> : <Copy className="h-5 w-5 text-mist" />}
          </button>

          <ul className="space-y-4">
            {socials
              .filter((s) => s.url)
              .map((s, i) => (
                <motion.li key={s.label} initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}>
                  <a
                    href={s.url}
                    target={s.url.startsWith('mailto:') ? undefined : '_blank'}
                    rel="noopener noreferrer"
                    className="px-panel group flex items-center gap-4 p-4 transition-transform hover:-translate-y-1"
                  >
                    <span className="px-slot flex h-12 w-12 items-center justify-center">
                      <Sprite name={SOCIAL_ICON[s.label.toLowerCase()] ?? 'gem'} size={30} className="transition-transform group-hover:rotate-6" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-xl font-bold text-parchment group-hover:text-torch">{s.label}</span>
                      {s.handle && <span className="block truncate font-label text-[10px] text-mist">{s.handle}</span>}
                    </span>
                    <span className="font-label text-torch transition-transform group-hover:translate-x-1">▶</span>
                  </a>
                </motion.li>
              ))}
          </ul>

          {profile.phone && (
            <p className="font-label text-[11px] uppercase text-mist">
              Or call ·{' '}
              <a href={`tel:${profile.phone.replace(/\s/g, '')}`} className="text-parchment hover:text-torch">
                {profile.phone}
              </a>
            </p>
          )}
        </div>
      </div>
    </LayerSection>
  );
}
