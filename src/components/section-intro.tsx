import { Reveal } from "@/components/reveal";

type SectionIntroProps = {
  number: string;
  eyebrow: string;
  title: string;
  description?: string;
};

export function SectionIntro({ number, eyebrow, title, description }: SectionIntroProps) {
  return (
    <div className="site-grid section-intro">
      <Reveal className="section-intro__number">
        <span className="mono-label">{number}</span>
      </Reveal>
      <Reveal className="section-intro__copy" delay={0.04}>
        <p className="mono-label">{eyebrow}</p>
        <h2>{title}</h2>
        {description ? <p className="section-intro__description">{description}</p> : null}
      </Reveal>
    </div>
  );
}
