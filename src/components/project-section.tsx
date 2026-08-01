import Link from "next/link";
import type { Project } from "@/data/portfolio";
import { ArrowRight, ArrowUpRight } from "@/components/icons";
import { ProjectMedia } from "@/components/project-media";
import { Reveal } from "@/components/reveal";

type ProjectSectionProps = {
  project: Project;
  priority?: boolean;
};

export function ProjectSection({ project, priority = false }: ProjectSectionProps) {
  return (
    <article id={project.slug} className={`project-section project-section--${project.accent}`}>
      <div className="site-grid project-section__header">
        <Reveal className="project-index">
          <span className="mono-label">{project.index}</span>
          <span className="project-index__rule" />
        </Reveal>

        <Reveal className="project-heading" delay={0.04}>
          <p className="mono-label">{project.eyebrow}</p>
          <h3>{project.name}</h3>
        </Reveal>

        <Reveal className="project-intro" delay={0.08}>
          <p>{project.description}</p>
          <Link className="text-link" href={`/work/${project.slug}`}>
            Read case study <ArrowRight />
          </Link>
        </Reveal>
      </div>

      <Reveal className="project-stage" delay={0.1}>
        <ProjectMedia media={project.media} projectName={project.name} priority={priority} />
      </Reveal>

      <div className="site-grid project-section__details">
        <Reveal className="project-role">
          <p className="mono-label">Role / status</p>
          <p className="project-role__value">{project.role}</p>
          <p className="muted-copy">{project.status} · {project.year}</p>
        </Reveal>

        <Reveal className="project-ownership" delay={0.06}>
          <p className="mono-label">What I owned</p>
          <p>{project.ownership}</p>
        </Reveal>

        <Reveal className="project-highlight-list" delay={0.1}>
          {project.highlights.map((highlight) => (
            <div className="project-highlight" key={highlight.label}>
              <span className="mono-label">{highlight.label}</span>
              <span>{highlight.value}</span>
            </div>
          ))}
          <a className="external-link" href={project.url} target="_blank" rel="noreferrer">
            Visit {project.name} <ArrowUpRight />
          </a>
        </Reveal>
      </div>
    </article>
  );
}
