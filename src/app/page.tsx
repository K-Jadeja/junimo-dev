import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "@/components/icons";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ProjectSection } from "@/components/project-section";
import { SectionIntro } from "@/components/section-intro";
import { Reveal } from "@/components/reveal";
import { experience, openSource, projects } from "@/data/portfolio";

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="site-shell hero" aria-labelledby="hero-heading">
          <Reveal className="hero__topline">
            <span className="mono-label">01 / Profile</span>
            <span className="hero__location">India / UTC +05:30</span>
          </Reveal>

          <div className="site-grid hero__main">
            <Reveal className="hero__aside">
              <span className="status-dot" aria-hidden="true" />
              <span>Founding Engineer / Technical Lead at Remalt</span>
            </Reveal>
            <Reveal className="hero__heading" delay={0.05}>
              <h1 id="hero-heading">Founding Engineer building <em>ambitious AI products</em> from interface to infrastructure.</h1>
            </Reveal>
          </div>

          <div className="site-grid hero__bottom">
            <Reveal className="hero__support" delay={0.1}>
              <p>I work across product interfaces, AI systems, real-time collaboration, media infrastructure and production deployment—taking products from an empty repository to real users.</p>
            </Reveal>
            <Reveal className="hero__actions" delay={0.14}>
              <Link className="text-link text-link--accent" href="#work">View selected work <ArrowRight /></Link>
              <a className="text-link" href="https://github.com/K-Jadeja" target="_blank" rel="noreferrer">GitHub <ArrowUpRight /></a>
              <span className="muted-copy">Based in India</span>
            </Reveal>
          </div>
        </section>

        <section id="work" className="site-shell portfolio-section" aria-labelledby="work-heading">
          <SectionIntro number="02" eyebrow="Selected work" title="Systems with a surface." description="A small selection of products where the interface, the AI or media pipeline, and the infrastructure had to be designed together." />
          <h2 id="work-heading" className="sr-only">Selected work</h2>
          <div className="project-list">
            {projects.map((project, index) => <ProjectSection key={project.slug} project={project} priority={index === 0} />)}
          </div>
        </section>

        <section id="experience" className="site-shell portfolio-section experience-section" aria-labelledby="experience-heading">
          <SectionIntro number="03" eyebrow="Selected experience" title="A short record of shipping." />
          <h2 id="experience-heading" className="sr-only">Selected experience</h2>
          <div className="experience-list">
            {experience.map((item, index) => (
              <Reveal key={item.company} className="experience-row" delay={index * 0.04}>
                <div className="experience-row__company"><span className="mono-label">0{index + 1}</span><strong>{item.company}</strong></div>
                <div className="experience-row__role"><span>{item.role}</span><p>{item.description}</p></div>
                <span className="experience-row__dates">{item.dates}</span>
              </Reveal>
            ))}
          </div>
        </section>

        <section id="about" className="site-shell about-section portfolio-section" aria-labelledby="about-heading">
          <div className="site-grid about-block">
            <Reveal className="about-block__label"><span className="mono-label">04 / Working style</span></Reveal>
            <Reveal className="about-block__heading" delay={0.04}><h2 id="about-heading">Designing the interface and the machinery behind it.</h2></Reveal>
            <Reveal className="about-block__copy" delay={0.08}>
              <p>I like products where interaction design and systems engineering cannot be separated. My work tends to span the visible interface, the AI or media pipeline behind it, and the infrastructure required to keep the whole thing reliable in production.</p>
              <p className="muted-copy">Based in India. Usually building products, studying interfaces or arguing with FFmpeg.</p>
            </Reveal>
          </div>
        </section>

        <section className="site-shell open-source-section" aria-labelledby="open-source-heading">
          <div className="site-grid open-source-row">
            <div><span className="mono-label">05 / Open source & experiments</span><h2 id="open-source-heading">One early experiment, still useful.</h2></div>
            <p>{openSource.description}</p>
            <a className="external-link" href={openSource.url} target="_blank" rel="noreferrer">View on GitHub <ArrowUpRight /></a>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
