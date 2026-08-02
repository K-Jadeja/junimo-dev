export type MediaAsset = {
  type: "image" | "video";
  src: string;
  poster?: string;
  alt: string;
  aspectRatio?: string;
};

export type ProjectHighlight = {
  label: string;
  value: string;
};

export type Project = {
  slug: string;
  index: string;
  name: string;
  eyebrow: string;
  role: string;
  homeRole: string;
  status: string;
  year: string;
  homeDescription: string;
  url: string;
  description: string;
  ownership: string;
  overview: string;
  ownedDetail: string;
  challenges: string[];
  outcomes: string[];
  highlights: ProjectHighlight[];
  technologies: string[];
  media: MediaAsset;
};

export type Experience = {
  company: string;
  role: string;
  dates: string;
  shortDates: string;
  description: string;
};

export const projects: Project[] = [
  {
    slug: "remalt",
    index: "01",
    name: "Remalt",
    eyebrow: "Collaborative AI workspace",
    role: "Founding Engineer / Technical Lead",
    homeRole: "Founding Engineer / Technical Lead",
    status: "Current",
    year: "2026-Present",
    homeDescription: "Collaborative visual AI workspace",
    url: "https://remalt.com",
    description: "A collaborative visual AI workspace for turning ideas, research and content into connected, reusable workflows.",
    ownership: "Built the production SaaS from zero across the product interface, backend systems, AI integrations, authentication, billing, multiplayer collaboration and deployment infrastructure.",
    overview: "Remalt brings the messy beginning of a creative project into one visual surface: research, notes, media, AI agents and the workflows that connect them.",
    ownedDetail: "The work spans the interface and the systems supporting it: product surfaces, backend systems, identity, payments, collaboration, integrations and production operations.",
    challenges: [
      "Making a visual workspace feel immediate while it carries research, media, agent workflows and shared state.",
      "Connecting authentication, billing, integrations and collaboration without making the product feel assembled from separate services.",
      "Taking a living SaaS from a new codebase to a repeatable, production-deployed product.",
    ],
    outcomes: [
      "A public product taken from a new codebase to a working production workspace.",
      "One surface for content research, creation and connected AI workflows.",
      "End-to-end ownership across interface, systems and operational infrastructure.",
    ],
    highlights: [
      { label: "Product", value: "Ideas, research, media and AI workflows in one visual workspace." },
      { label: "Ownership", value: "Product, backend, collaboration, payments and deployment." },
    ],
    technologies: ["Next.js", "TypeScript", "PostgreSQL", "Supabase", "WebSockets", "Docker", "Hetzner"],
    media: {
      type: "image",
      src: "/projects/remalt/remalt-public.webp",
      alt: "Authentic public Remalt landing page showing its AI content workspace and creator workflow.",
      aspectRatio: "16 / 10",
    },
  },
  {
    slug: "greenpost",
    index: "02",
    name: "GreenPost",
    eyebrow: "AI video repurposing",
    role: "Full-Stack AI Engineer / Creator",
    homeRole: "Creator / Full-Stack AI Engineer",
    status: "Built",
    year: "2025-2026",
    homeDescription: "Long-form video into editable social clips",
    url: "https://greenpost.46.62.255.217.sslip.io/en",
    description: "An AI video repurposing platform that turns long-form recordings into editable, social-ready clips.",
    ownership: "Designed and built the workflow from video ingestion and transcription to AI moment selection, active-speaker tracking, reframing, caption rendering and production delivery.",
    overview: "GreenPost is a media pipeline with a product surface on top: long recordings become a set of editable, social-native clips without losing control over the final frame.",
    ownedDetail: "I owned the path from upload to delivery, including the AI decisions, active-speaker framing, browser-based rendering and the correctness checks that make a fast output trustworthy.",
    challenges: [
      "Selecting useful moments from long-form recordings while keeping the editing model understandable.",
      "Keeping active-speaker framing, aspect ratios, captions and social overlays coherent across generated clips.",
      "Reducing rendering time and cost without relaxing visual, audio, timing, font or final-frame correctness.",
    ],
    outcomes: [
      "The tested nine-clip workload moved from 8:01 to 3:43.",
      "Outputs were validated for visual, audio, timing, font and final-frame correctness.",
      "The tested setup rendered an approximately $0.04 nine-clip batch.",
    ],
    highlights: [
      { label: "Measured", value: "9 clips - 8:01 to 3:43 in the tested setup." },
      { label: "Correctness", value: "Visual, audio, timing, font and final-frame validation." },
    ],
    technologies: ["Next.js", "FastAPI", "WebCodecs", "Canvas", "FFmpeg", "MediaPipe", "Modal"],
    media: {
      type: "image",
      src: "/projects/greenpost/greenpost-public.webp",
      alt: "Authentic public GreenPost landing page showing its short-form content product.",
      aspectRatio: "16 / 10",
    },
  },
  {
    slug: "project-doru",
    index: "03",
    name: "Project Doru",
    eyebrow: "Local-first real-time avatar",
    role: "Full-Stack AI Engineer / Creator",
    homeRole: "Creator / Full-Stack AI Engineer",
    status: "Built",
    year: "2024-2025",
    homeDescription: "Local-first conversational Live2D avatar",
    url: "https://projectdoru.46.62.255.217.sslip.io/",
    description: "A local-first real-time AI avatar combining streaming speech, natural voice synthesis and an expressive Live2D interface.",
    ownership: "Built the complete low-latency conversation loop and visual experience, from local speech models to the WebSocket-driven animated frontend and deployment pipeline.",
    overview: "Doru is an interactive systems project: speech arrives, language is generated, voice returns and the avatar responds through a deliberately expressive interface.",
    ownedDetail: "The project joined local inference with a real-time browser experience, keeping the conversation loop responsive while giving the avatar a visual presence instead of treating it as a text-only chatbot.",
    challenges: [
      "Keeping streaming speech recognition, model response and voice synthesis inside one low-latency loop.",
      "Synchronizing WebSocket events with an expressive Live2D frontend without making the interface feel mechanical.",
      "Shipping local CPU inference and the supporting deployment pipeline as a usable product experiment.",
    ],
    outcomes: [
      "A complete speech-to-avatar interaction loop running with local inference.",
      "A visual frontend that responds through Live2D motion, not only chat bubbles.",
      "A repeatable Docker and CI deployment path for the interactive system.",
    ],
    highlights: [
      { label: "Loop", value: "Streaming speech to response to natural voice to expression." },
      { label: "Runtime", value: "Local CPU inference with a WebSocket-driven frontend." },
    ],
    technologies: ["Sherpa-ONNX", "Kokoro", "PixiJS", "Live2D", "WebSockets", "Docker", "Azure"],
    media: {
      type: "image",
      src: "/projects/project-doru/project-doru-public.webp",
      alt: "Authentic public Project Doru surface showing its dark real-time avatar environment.",
      aspectRatio: "16 / 10",
    },
  },
];

export const experience: Experience[] = [
  {
    company: "Remalt",
    role: "Founding Engineer / Technical Lead",
    dates: "2026-Present",
    shortDates: "2026-Present",
    description: "Own product and technical execution across the interface, backend, AI systems, collaboration, payments and infrastructure.",
  },
  {
    company: "Conyx AI Solutions",
    role: "Co-Founder & AI Engineer",
    dates: "May 2024-September 2024",
    shortDates: "2024",
    description: "Delivered custom RAG systems and autonomous agents for clients from requirements through Azure deployment.",
  },
  {
    company: "Neohumans.ai",
    role: "AI Engineer",
    dates: "May 2023-November 2023",
    shortDates: "2023",
    description: "Helped build an emotional AI companion and moved core inference to commercially viable self-hosted open-source models.",
  },
  {
    company: "Rechat",
    role: "Junior AI Engineer",
    dates: "August 2023",
    shortDates: "2023",
    description: "Improved RAG-driven suggestions and tool use for an AI-assisted real-estate forms product.",
  },
];

export type Now = {
  building: string;
  exploring: string;
  playing?: string;
  listening?: string;
  reading?: string;
  updatedAt: string;
};

export const now: Now = {
  building: "Remalt and GreenPost",
  exploring: "Browser rendering, WebCodecs, FFmpeg and multiplayer interfaces",
  playing: "",
  listening: "",
  reading: "",
  updatedAt: "August 2026",
};

export const openSource = {
  name: "Zapier-LangChain Agent",
  description: "An early open-source agent project connecting natural-language instructions to real actions through Zapier NLA and OpenAI.",
  url: "https://github.com/K-Jadeja/Zapier-Langchain-AI-agent",
};

export function getProject(slug: string) {
  return projects.find((project) => project.slug === slug);
}

export function getAdjacentProjects(slug: string) {
  const index = projects.findIndex((project) => project.slug === slug);
  if (index === -1) return { previous: undefined, next: undefined };

  return {
    previous: projects[(index - 1 + projects.length) % projects.length],
    next: projects[(index + 1) % projects.length],
  };
}
