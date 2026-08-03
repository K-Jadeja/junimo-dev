import Link from "next/link";
import { projects } from "@/data/portfolio";

export function ProjectList() {
  return (
    <ul className="project-list" aria-label="Projects">
      {projects.map((project) => (
        <li className="project-list__item" key={project.slug}>
          <Link className="project-list__link" href={`/work/${project.slug}`}>
            <span className="project-list__name">{project.name}</span>
            <span className="project-list__description">{project.homeDescription}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
