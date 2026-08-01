import { DesignLab, type LabVariant } from "@/components/design-lab";

type DesignLabPageProps = {
  searchParams: Promise<{ variant?: string | string[] }>;
};

function parseVariant(value: string | string[] | undefined): LabVariant {
  const candidate = Array.isArray(value) ? value[0] : value;
  return candidate === "b" || candidate === "c" ? candidate : "a";
}

export default async function DesignLabPage({ searchParams }: DesignLabPageProps) {
  const params = await searchParams;
  return <DesignLab initialVariant={parseVariant(params.variant)} />;
}
