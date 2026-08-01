import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "@/components/icons";
import { ProjectMedia } from "@/components/project-media";
import { Reveal } from "@/components/reveal";
import type { Project } from "@/data/portfolio";

type CaseStudyProps = {
  project: Project;
  previous?: Project;
  next?: Project;
};

export function CaseStudy({ project, previous, next }: CaseStudyProps) {
  return (
    <main className={`case-study case-study--${project.accent}`}>
      <section className="site-shell case-hero">
        <Reveal className="case-hero__crumbs">
          <Link href="/#work">Selected work</Link>
          <span aria-hidden="true">/</span>
          <span>{project.index} {project.name}</span>
        </Reveal>

        <div className="site-grid case-hero__grid">
          <Reveal className="case-hero__index">
            <span className="mono-label">{project.index}</span>
            <span className="project-index__rule" />
          </Reveal>
          <Reveal className="case-hero__heading" delay={0.05}>
            <p className="mono-label">{project.eyebrow}</p>
            <h1>{project.name}</h1>
            <p>{project.description}</p>
          </Reveal>
          <Reveal className="case-hero__meta" delay={0.1}>
            <div><span className="mono-label">Role</span><strong>{project.role}</strong></div>
            <div><span className="mono-label">Status</span><strong>{project.status} · {project.year}</strong></div>
            <a className="external-link" href={project.url} target="_blank" rel="noreferrer">Open project <ArrowUpRight /></a>
          </Reveal>
        </div>

        <Reveal className="case-hero__media" delay={0.12}>
          <ProjectMedia media={project.media} projectName={project.name} priority />
        </Reveal>
      </section>

      <div className="site-shell case-content">
        <Reveal className="case-lede">
          <p className="mono-label">Overview</p>
          <p>{project.overview}</p>
        </Reveal>

        <div className="site-grid case-content__grid">
          <Reveal className="case-content__label"><span className="mono-label">Ownership</span></Reveal>
          <Reveal className="case-content__body" delay={0.04}><p>{project.ownedDetail}</p></Reveal>
        </div>

        <div className="site-grid case-content__grid case-content__grid--split">
          <Reveal className="case-content__label"><span className="mono-label">Engineering challenges</span></Reveal>
          <div className="case-list">
            {project.challenges.map((challenge, index) => (
              <Reveal className="case-list__item" delay={index * 0.04} key={challenge}>
                <span className="mono-label">0{index + 1}</span>
                <p>{challenge}</p>
              </Reveal>
            ))}
          </div>
        </div>

        <div className="site-grid case-content__grid case-content__grid--split">
          <Reveal className="case-content__label"><span className="mono-label">Selected outcomes</span></Reveal>
          <div className="case-list">
            {project.outcomes.map((outcome, index) => (
              <Reveal className="case-list__item" delay={index * 0.04} key={outcome}>
                <span className="mono-label">0{index + 1}</span>
                <p>{outcome}</p>
              </Reveal>
            ))}
          </div>
        </div>

        <div className="site-grid case-tech-row">
          <span className="mono-label">Built with</span>
          <div className="tech-list">{project.technologies.map((technology) => <span key={technology}>{technology}</span>)}</div>
        </div>

        <nav className="case-nav" aria-label="Project navigation">
          <div>
            <span className="mono-label">Previous</span>
            <Link href={`/work/${previous?.slug ?? project.slug}`}>
              <ArrowRight /> {previous?.name ?? project.name}
            </Link>
          </div>
          <div className="case-nav__next">
            <span className="mono-label">Next</span>
            <Link href={`/work/${next?.slug ?? project.slug}`}>
              {next?.name ?? project.name} <ArrowRight />
            </Link>
          </div>
        </nav>
      </div>
    </main>
  );
}
