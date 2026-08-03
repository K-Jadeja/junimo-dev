import Link from "next/link";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "@/components/icons";
import { ProjectMedia } from "@/components/project-media";
import type { Project } from "@/data/portfolio";

type CaseStudyProps = {
  project: Project;
  previous?: Project;
  next?: Project;
};

export function CaseStudy({ project, previous, next }: CaseStudyProps) {
  const previousProject = previous ?? project;
  const nextProject = next ?? project;

  return (
    <main className="case-study">
      <header className="case-header">
        <Link className="case-wordmark" href="/">Krishnasinh Jadeja</Link>
        <Link className="case-home-link" href="/">Home</Link>
      </header>

      <article>
        <header className="case-hero">
          <h1>{project.name}</h1>
          <p className="case-hero__description">{project.description}</p>
          <p className="case-hero__context">{project.role} · {project.status} · {project.year}</p>
          <a className="external-link" href={project.url} target="_blank" rel="noreferrer">
            Open project <ArrowUpRight />
          </a>
        </header>

        <div className="case-hero__media">
          <ProjectMedia media={project.media} projectName={project.name} priority />
        </div>

        <div className="case-content">
          <section className="case-section case-section--lede">
            <h2 className="case-label">Overview</h2>
            <p>{project.overview}</p>
          </section>

          <section className="case-section">
            <h2 className="case-label">What I owned</h2>
            <p>{project.ownedDetail}</p>
          </section>

          <section className="case-section">
            <h2 className="case-label">Engineering challenges</h2>
            <ul className="case-list">
              {project.challenges.map((challenge) => <li key={challenge}>{challenge}</li>)}
            </ul>
          </section>

          <section className="case-section">
            <h2 className="case-label">Selected outcomes</h2>
            <ul className="case-list">
              {project.outcomes.map((outcome) => <li key={outcome}>{outcome}</li>)}
            </ul>
          </section>

          <section className="case-section">
            <h2 className="case-label">Built with</h2>
            <p className="case-tech-list">{project.technologies.join(" · ")}</p>
          </section>
        </div>
      </article>

      <nav className="case-nav" aria-label="Project navigation">
        <Link href={`/${previousProject.slug}`}>
          <span className="case-label">Previous</span>
          <span className="case-nav__title"><ArrowLeft /> {previousProject.name}</span>
        </Link>
        <Link className="case-nav__next" href={`/${nextProject.slug}`}>
          <span className="case-label">Next</span>
          <span className="case-nav__title">{nextProject.name} <ArrowRight /></span>
        </Link>
      </nav>
    </main>
  );
}
