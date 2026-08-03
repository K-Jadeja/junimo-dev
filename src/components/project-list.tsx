import { projects } from "@/data/portfolio";
import { PortfolioList } from "@/components/portfolio-list";

export function ProjectList() {
  return (
    <PortfolioList
      ariaLabel="Projects"
      items={projects.map((project) => ({
        title: project.name,
        description: project.homeDescription,
        href: project.slug === "sushi" ? "https://sushi.junimo.dev" : `/${project.slug}`,
      }))}
    />
  );
}
