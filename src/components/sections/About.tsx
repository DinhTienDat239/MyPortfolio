import { asset, content } from '../../data';
import { Reveal, ScrollText, Section } from '../ui/Reveal';

export default function About() {
  const { about, profile } = content;
  return (
    <Section id="about" index="02" label="About" note={profile.location}>
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-8">
          <ScrollText className="text-[clamp(1.75rem,3.2vw,3rem)] font-medium leading-[1.14] tracking-[-0.025em]" text={about.statement} />
        </div>
        <Reveal className="lg:col-span-3 lg:col-start-10">
          {profile.profilePic && (
            <img src={asset(profile.profilePic)} alt={profile.fullName} loading="lazy" className="aspect-[4/5] w-full max-w-[18rem] object-cover grayscale transition-[filter] duration-700 hover:grayscale-0" />
          )}
          <dl className="mt-6 border-t border-line text-[15px]">
            {about.facts.map((f) => (
              <div key={f.k} className="flex justify-between gap-4 border-b border-line py-2.5">
                <dt className="text-muted">{f.k}</dt>
                <dd className="text-right">{f.v}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>
    </Section>
  );
}
