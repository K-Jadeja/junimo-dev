import Link from "next/link";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "@/components/icons";
import { ProjectMedia } from "@/components/project-media";
import { SushiLab } from "@/components/sushi-lab";
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
          <p className="case-hero__eyebrow">{project.eyebrow}</p>
          <h1>{project.name}</h1>
          <p className="case-hero__description">{project.description}</p>
          <p className="case-hero__context">{project.role} · {project.status} · {project.year}</p>
          <a className="external-link" href={project.url} target="_blank" rel="noreferrer">
            {project.linkLabel ?? "Open project"} <ArrowUpRight />
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
          {project.slug === "sushi" ? <SushiLab /> : null}
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
