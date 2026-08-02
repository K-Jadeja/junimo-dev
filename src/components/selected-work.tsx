"use client";

import Link from "next/link";
import { useState } from "react";
import { ProjectMedia } from "@/components/project-media";
import { projects, type Project } from "@/data/portfolio";

function ProjectPreview({ project }: { project: Project }) {
  return (
    <div className="home-work__preview-content" key={project.slug}>
      <ProjectMedia
        media={{ ...project.media, aspectRatio: "16 / 10" }}
        projectName={project.name}
        priority={project.slug === "remalt"}
        quiet
      />
      <p className="home-work__preview-caption">Public surface for {project.name}</p>
    </div>
  );
}

function ProjectRow({ project, active, onActivate }: { project: Project; active: boolean; onActivate: () => void }) {
  return (
    <li className={`home-work__row ${active ? "is-active" : ""}`} onMouseEnter={onActivate}>
      <Link href={`/work/${project.slug}`} onFocus={onActivate}>
        <span className="home-work__name">{project.name}</span>
        <span className="home-work__description">{project.homeDescription}</span>
        <span className="home-work__role">{project.homeRole}</span>
      </Link>
      <button type="button" className="home-work__preview-toggle" aria-pressed={active} onFocus={onActivate} onClick={onActivate}>
        {active ? "Preview shown" : "Preview"}
      </button>
      {active ? (
        <div className="home-work__mobile-preview">
          <ProjectPreview project={project} />
        </div>
      ) : null}
    </li>
  );
}

export function SelectedWork() {
  const [activeSlug, setActiveSlug] = useState(projects[0].slug);
  const activeProject = projects.find((project) => project.slug === activeSlug) ?? projects[0];

  return (
    <div className="home-work__layout">
      <ul className="home-work__list">
        {projects.map((project) => (
          <ProjectRow key={project.slug} project={project} active={project.slug === activeSlug} onActivate={() => setActiveSlug(project.slug)} />
        ))}
      </ul>
      <aside className="home-work__desktop-preview" aria-live="polite" aria-label="Selected project preview">
        <ProjectPreview project={activeProject} />
      </aside>
    </div>
  );
}
