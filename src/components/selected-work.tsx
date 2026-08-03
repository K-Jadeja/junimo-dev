import { TextIndex } from "@/components/text-index";
import { projects } from "@/data/portfolio";

export function SelectedWork() {
  return (
    <TextIndex
      ariaLabel="Projects"
      inline
      items={projects.map((project) => ({
        title: project.name,
        description: project.homeDescription,
        href: `/work/${project.slug}`,
      }))}
    />
  );
}
