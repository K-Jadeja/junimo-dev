import { notFound, permanentRedirect } from "next/navigation";
import { getProject, projects } from "@/data/portfolio";

type CaseStudyPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

export default async function LegacyCaseStudyPage({ params }: CaseStudyPageProps) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  permanentRedirect(`/${project.slug}`);
}
