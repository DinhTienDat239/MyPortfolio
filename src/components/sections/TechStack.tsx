import { content } from '../../data';
import { MaskLine, Reveal, Section } from '../ui/Reveal';

/** Bộ công cụ, nói thật: cái nào tự tay làm hằng ngày, cái nào làm cùng AI. */
export default function TechStack() {
  return (
    <Section
      id="stack"
      index="08"
      label="Toolbox"
      note="Honest version"
      title={
        <>
          <MaskLine inView>What I build with —</MaskLine>
          <MaskLine inView delay={0.08}>
            <span className="em">honestly.</span>
          </MaskLine>
        </>
      }
    >
      <div className="grid gap-12 md:grid-cols-2 md:gap-8">
        {content.stack.map((g, i) => (
          <Reveal key={g.name} delay={i * 0.06}>
            <h3 className="text-lg font-medium tracking-tight">{g.name}</h3>
            <p className="mt-1 text-sm text-muted">{g.note}</p>
            <ul className="mt-6 border-t border-line">
              {g.items.map((it) => (
                <li key={it.name} className="border-b border-line py-3">
                  <p className="text-[15px] font-medium">{it.name}</p>
                  {it.detail && <p className="mt-0.5 text-sm text-muted">{it.detail}</p>}
                </li>
              ))}
            </ul>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
