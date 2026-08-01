"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight } from "@/components/icons";
import { ProjectMedia } from "@/components/project-media";
import { experience, projects, type Project } from "@/data/portfolio";

export type LabVariant = "a" | "b" | "c";

const variantNames: Record<LabVariant, string> = {
  a: "Quiet index",
  b: "Product editorial",
  c: "Interactive directory",
};

function LabHeader({ variant }: { variant: LabVariant }) {
  return (
    <header className={`lab-header lab-header--${variant}`}>
      <div className="lab-header__inner">
        <Link className="lab-header__name" href="/" aria-label="Krishnasinh Jadeja home">
          Krishnasinh Jadeja
        </Link>
        <nav className="lab-header__nav" aria-label="Prototype navigation">
          <a href="#work">Work</a>
          <a href="#experience">Experience</a>
          <a href="#contact">Contact</a>
          <span className="lab-header__divider" aria-hidden="true" />
          <span className="lab-header__variants" aria-label="Switch prototype">
            {(Object.keys(variantNames) as LabVariant[]).map((item) => (
              <Link
                key={item}
                href={`/design-lab?variant=${item}`}
                aria-current={item === variant ? "page" : undefined}
              >
                {item.toUpperCase()}
              </Link>
            ))}
          </span>
        </nav>
      </div>
    </header>
  );
}

function LabMedia({ project, priority = false, aspectRatio }: { project: Project; priority?: boolean; aspectRatio?: string }) {
  return (
    <ProjectMedia
      media={aspectRatio ? { ...project.media, aspectRatio } : project.media}
      projectName={project.name}
      priority={priority}
      quiet
    />
  );
}

function LabSectionHeading({ title, description }: { title: string; description?: string }) {
  return (
    <div className="lab-section-heading">
      <h2>{title}</h2>
      {description ? <p>{description}</p> : null}
    </div>
  );
}

function LabExperience({ variant }: { variant: LabVariant }) {
  return (
    <section id="experience" className={`lab-experience lab-experience--${variant}`}>
      <LabSectionHeading title="Experience" description="A short record of building and shipping." />
      <div className="lab-experience__list">
        {experience.map((item) => (
          <div className="lab-experience__row" key={item.company}>
            <strong>{item.company}</strong>
            <span>{item.role}</span>
            <time>{item.dates}</time>
          </div>
        ))}
      </div>
    </section>
  );
}

function LabContact({ variant }: { variant: LabVariant }) {
  return (
    <footer id="contact" className={`lab-contact lab-contact--${variant}`}>
      <div>
        <h2>Have an ambitious product in mind?</h2>
        <p>
          I like difficult problems where the interface and the machinery behind it have to make sense together.
        </p>
      </div>
      <div className="lab-contact__links">
        <a href="mailto:jadejakrishna42@gmail.com">jadejakrishna42@gmail.com <ArrowUpRight /></a>
        <a href="https://github.com/K-Jadeja" target="_blank" rel="noreferrer">GitHub <ArrowUpRight /></a>
        <a href="https://www.linkedin.com/in/krishnasinh-jadeja-425a8b252/" target="_blank" rel="noreferrer">LinkedIn <ArrowUpRight /></a>
        <a href="https://x.com/krsnalyst" target="_blank" rel="noreferrer">X <ArrowUpRight /></a>
      </div>
      <small>© 2026 Krishnasinh Jadeja</small>
    </footer>
  );
}

function ListProject({ project, active, onActivate }: { project: Project; active: boolean; onActivate: () => void }) {
  return (
    <li className={`lab-list-project ${active ? "is-active" : ""}`}>
      <button type="button" aria-pressed={active} onMouseEnter={onActivate} onFocus={onActivate} onClick={onActivate}>
        <span className="lab-list-project__name">{project.name}</span>
        <span className="lab-list-project__role">{project.role}</span>
        <span className="lab-list-project__description">{project.description}</span>
      </button>
    </li>
  );
}

function SharedPreview({ project, variant }: { project: Project; variant: "a" | "c" }) {
  return (
    <aside className={`lab-preview lab-preview--${variant}`} aria-live="polite">
      <div className="lab-preview__media">
        <LabMedia project={project} priority={project.slug === "remalt"} aspectRatio={variant === "c" ? "4 / 3" : "16 / 10"} />
      </div>
      <div className="lab-preview__copy">
        <strong>{project.name}</strong>
        <p>{project.ownership}</p>
        <Link href={`/work/${project.slug}`}>Read the case study <ArrowUpRight /></Link>
      </div>
    </aside>
  );
}

function QuietIndex() {
  const [activeSlug, setActiveSlug] = useState(projects[0].slug);
  const activeProject = projects.find((project) => project.slug === activeSlug) ?? projects[0];

  return (
    <div className="lab-page lab-page--a">
      <LabHeader variant="a" />
      <main className="lab-a lab-container">
        <section className="lab-a__intro">
          <p className="lab-a__name">Krishnasinh Jadeja · Founding Engineer / Technical Lead at Remalt</p>
          <h1>Building ambitious AI products from interface to infrastructure.</h1>
          <p className="lab-a__lede">
            I work across product interfaces, AI systems, real-time collaboration, media infrastructure and production deployment, taking products from an empty repository to real users.
          </p>
          <p className="lab-a__context">Based in India. <a href="https://remalt.com" target="_blank" rel="noreferrer">Currently building Remalt</a>.</p>
        </section>

        <section id="work" className="lab-a__work">
          <LabSectionHeading title="Projects" description="A few systems I have taken from a blank page to a working product." />
          <div className="lab-a__project-layout">
            <ul className="lab-list" aria-label="Projects">
              {projects.map((project) => (
                <ListProject key={project.slug} project={project} active={project.slug === activeSlug} onActivate={() => setActiveSlug(project.slug)} />
              ))}
            </ul>
            <SharedPreview project={activeProject} variant="a" />
          </div>
        </section>

        <LabExperience variant="a" />

      </main>
      <LabContact variant="a" />
    </div>
  );
}

function EditorialProject({ project, layout }: { project: Project; layout: "remalt" | "greenpost" | "doru" }) {
  return (
    <article className={`lab-editorial-project lab-editorial-project--${layout}`}>
      <div className="lab-editorial-project__copy">
        <h2>{project.name}</h2>
        <p>{project.description}</p>
        <div className="lab-editorial-project__meta">
          <span>{project.role}</span>
          <span>{project.status} · {project.year}</span>
        </div>
        <a href={project.url} target="_blank" rel="noreferrer">Visit project <ArrowUpRight /></a>
      </div>
      <div className="lab-editorial-project__media">
        <LabMedia
          project={project}
          priority={layout === "remalt"}
          aspectRatio={layout === "doru" ? "4 / 5" : layout === "greenpost" ? "16 / 9" : "16 / 10"}
        />
      </div>
    </article>
  );
}

function ProductEditorial() {
  return (
    <div className="lab-page lab-page--b">
      <LabHeader variant="b" />
      <main className="lab-b lab-container">
        <section className="lab-b__intro">
          <div>
            <p className="lab-b__name">Krishnasinh Jadeja</p>
            <p>Founding Engineer / Technical Lead</p>
            <p>India · building with Remalt</p>
          </div>
          <div>
            <h1>Products that keep the interface and the machinery in the same conversation.</h1>
            <p className="lab-b__lede">Full-stack execution across AI systems, real-time products, media pipelines and the infrastructure that makes ambitious work usable.</p>
          </div>
        </section>

        <section id="work" className="lab-b__work">
          <EditorialProject project={projects[0]} layout="remalt" />
          <EditorialProject project={projects[1]} layout="greenpost" />
          <EditorialProject project={projects[2]} layout="doru" />
        </section>

        <LabExperience variant="b" />
      </main>
      <LabContact variant="b" />
    </div>
  );
}

function DirectoryRow({ project, active, onActivate }: { project: Project; active: boolean; onActivate: () => void }) {
  return (
    <li className={`lab-directory__row ${active ? "is-active" : ""}`}>
      <button type="button" aria-pressed={active} onMouseEnter={onActivate} onFocus={onActivate} onClick={onActivate}>
        <span>{project.name}</span>
        <span>{project.role}</span>
        <span>{project.status}</span>
      </button>
    </li>
  );
}

function InteractiveDirectory() {
  const [activeSlug, setActiveSlug] = useState(projects[0].slug);
  const activeProject = projects.find((project) => project.slug === activeSlug) ?? projects[0];

  return (
    <div className="lab-page lab-page--c">
      <LabHeader variant="c" />
      <main className="lab-c lab-container">
        <section className="lab-c__intro">
          <p>Krishnasinh Jadeja / Founding Engineer</p>
          <h1>A small directory of things built from the inside out.</h1>
          <p>I move between the interface, the model or media pipeline, and the deployment path that keeps the whole thing alive.</p>
        </section>

        <section id="work" className="lab-c__directory">
          <div className="lab-directory__list">
            <LabSectionHeading title="Projects" description="Select a project to inspect its surface." />
            <ul>
              {projects.map((project) => (
                <DirectoryRow key={project.slug} project={project} active={project.slug === activeSlug} onActivate={() => setActiveSlug(project.slug)} />
              ))}
            </ul>
          </div>
          <SharedPreview project={activeProject} variant="c" />
        </section>

        <LabExperience variant="c" />
      </main>
      <LabContact variant="c" />
    </div>
  );
}

export function DesignLab({ initialVariant }: { initialVariant: LabVariant }) {
  if (initialVariant === "b") return <ProductEditorial />;
  if (initialVariant === "c") return <InteractiveDirectory />;
  return <QuietIndex />;
}

export function DesignLabIndex() {
  return (
    <main className="lab-landing">
      <div className="lab-landing__inner">
        <p>Krishnasinh Jadeja / Design lab</p>
        <h1>Three possible structures for a personal site.</h1>
        <p>Each prototype keeps the same facts and projects, but changes how the work is found and felt.</p>
        <nav aria-label="Design lab variants">
          {(Object.keys(variantNames) as LabVariant[]).map((variant) => (
            <Link key={variant} href={`/design-lab?variant=${variant}`}>
              <span>{variant.toUpperCase()}</span>
              {variantNames[variant]}
              <ArrowUpRight />
            </Link>
          ))}
        </nav>
      </div>
    </main>
  );
}
