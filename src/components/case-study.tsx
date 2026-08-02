import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "@/components/icons";
import { ProjectMedia } from "@/components/project-media";
import type { Project } from "@/data/portfolio";

type CaseStudyProps = {
  project: Project;
  previous?: Project;
  next?: Project;
};

export function CaseStudy({ project, previous, next }: CaseStudyProps) {
  return (
    <main className="case-study">
      <Link className="case-back" href="/">Krishnasinh Jadeja</Link>
      <section className="case-hero">
        <div className="case-hero__crumbs">
          <Link href="/#work">Work</Link>
          <span aria-hidden="true">/</span>
          <span>{project.name}</span>
        </div>

        <div className="case-hero__heading">
          <p className="case-label">{project.eyebrow}</p>
          <h1>{project.name}</h1>
          <p>{project.description}</p>
        </div>
        <div className="case-hero__meta">
          <div><span className="case-label">Role</span><strong>{project.role}</strong></div>
          <div><span className="case-label">Status</span><strong>{project.status} - {project.year}</strong></div>
          <a className="external-link" href={project.url} target="_blank" rel="noreferrer">Open project <ArrowUpRight /></a>
        </div>

        <div className="case-hero__media">
          <ProjectMedia media={project.media} projectName={project.name} priority quiet />
        </div>
      </section>

      <div className="case-content">
        <div className="case-lede">
          <p className="case-label">Overview</p>
          <p>{project.overview}</p>
        </div>

        <div className="case-content__grid">
          <span className="case-label">What I owned</span>
          <div className="case-content__body"><p>{project.ownedDetail}</p></div>
        </div>

        <div className="case-content__grid">
          <span className="case-label">Engineering challenges</span>
          <div className="case-list">
            {project.challenges.map((challenge) => <div className="case-list__item" key={challenge}><span aria-hidden="true">•</span><p>{challenge}</p></div>)}
          </div>
        </div>

        <div className="case-content__grid">
          <span className="case-label">Selected outcomes</span>
          <div className="case-list">
            {project.outcomes.map((outcome) => <div className="case-list__item" key={outcome}><span aria-hidden="true">•</span><p>{outcome}</p></div>)}
          </div>
        </div>

        <div className="case-tech-row">
          <span className="case-label">Built with</span>
          <div className="tech-list">{project.technologies.map((technology) => <span key={technology}>{technology}</span>)}</div>
        </div>

        <nav className="case-nav" aria-label="Project navigation">
          <div>
            <span className="case-label">Previous</span>
            <Link href={`/work/${previous?.slug ?? project.slug}`}><ArrowRight /> {previous?.name ?? project.name}</Link>
          </div>
          <div className="case-nav__next">
            <span className="case-label">Next</span>
            <Link href={`/work/${next?.slug ?? project.slug}`}>{next?.name ?? project.name} <ArrowRight /></Link>
          </div>
        </nav>
      </div>
    </main>
  );
}
