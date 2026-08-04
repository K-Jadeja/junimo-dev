export type MediaAsset = {
  type: "image" | "video";
  src: string;
  poster?: string;
  alt: string;
  aspectRatio?: string;
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
  linkLabel?: string;
  description: string;
  overview: string;
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
    year: "2026–Present",
    homeDescription: "Collaborative visual AI workspace",
    url: "https://remalt.com",
    description: "A collaborative visual AI workspace for turning ideas, research and content into connected, reusable workflows.",
    overview: "Remalt brings the messy beginning of a creative project into one visual surface: research, notes, media, AI agents and the workflows that connect them.",
    media: {
      type: "image",
      src: "/projects/remalt/remalt-public.webp",
      alt: "Authentic public Remalt landing page showing its AI content workspace and creator workflow.",
      aspectRatio: "16 / 10",
    },
  },
  {
    slug: "sushi",
    index: "02",
    name: "Sushi",
    eyebrow: "Browser-native AI experiments",
    role: "Independent AI Engineer / Creator",
    homeRole: "Independent AI Engineer / Creator",
    status: "In progress",
    year: "2026–Present",
    homeDescription: "Local AI, speech and real-time experiments in the browser",
    url: "https://github.com/K-Jadeja/sushi",
    linkLabel: "View on GitHub",
    description: "A client-side AI demo garden where language, speech and visual experiments run directly in the browser.",
    overview: "Sushi is a growing collection of browser-native experiments: local model selection, WebGPU and WebAssembly inference, speech-to-text, text-to-speech and real-time systems that keep the work on the user's device.",
    media: {
      type: "image",
      src: "/projects/sushi/sushi-swarm-public.png",
      alt: "Sushi's Swarm browser experiment showing local agents answering a prompt.",
      aspectRatio: "1440 / 1024",
    },
  },
  {
    slug: "greenpost",
    index: "03",
    name: "GreenPost",
    eyebrow: "AI video repurposing",
    role: "Full-Stack AI Engineer / Creator",
    homeRole: "Creator / Full-Stack AI Engineer",
    status: "Built",
    year: "2025–2026",
    homeDescription: "Long-form video into editable social clips",
    url: "https://greenpost.46.62.255.217.sslip.io/en",
    description: "An AI video repurposing platform that turns long-form recordings into editable, social-ready clips.",
    overview: "GreenPost is a media pipeline with a product surface on top: long recordings become a set of editable, social-native clips without losing control over the final frame.",
    media: {
      type: "image",
      src: "/projects/greenpost/greenpost-public.webp",
      alt: "Authentic public GreenPost landing page showing its short-form content product.",
      aspectRatio: "16 / 10",
    },
  },
  {
    slug: "project-doru",
    index: "04",
    name: "Project Doru",
    eyebrow: "Local-first real-time avatar",
    role: "Full-Stack AI Engineer / Creator",
    homeRole: "Creator / Full-Stack AI Engineer",
    status: "Built",
    year: "2024–2025",
    homeDescription: "Local-first conversational Live2D avatar",
    url: "https://avatar.junimo.dev/",
    description: "A local-first real-time AI avatar combining streaming speech, natural voice synthesis and an expressive Live2D interface.",
    overview: "Doru is an interactive systems project: speech arrives, language is generated, voice returns and the avatar responds through a deliberately expressive interface.",
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
    dates: "2026–Present",
    shortDates: "2026–Present",
    description: "Own product and technical execution across the interface, backend, AI systems, collaboration, payments and infrastructure.",
  },
  {
    company: "Conyx AI Solutions",
    role: "Co-Founder & AI Engineer",
    dates: "May 2024–September 2024",
    shortDates: "2024",
    description: "Delivered custom RAG systems and autonomous agents for clients from requirements through Azure deployment.",
  },
  {
    company: "Neohumans.ai",
    role: "AI Engineer",
    dates: "May 2023–November 2023",
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
  copy: string;
  playing?: string;
  listening?: string;
  reading?: string;
  outsideWork?: string;
  updatedAt: string;
};

export const now: Now = {
  building: "Remalt, Sushi and GreenPost",
  copy: "Leading Remalt, productionizing GreenPost’s distributed rendering pipeline, and experimenting with browser-native speech and LLMs in Sushi.",
  playing: "",
  listening: "",
  reading: "",
  outsideWork: "",
  updatedAt: "August 2026",
};

export type OpenSourceItem = {
  name: string;
  description: string;
  url: string;
};

export const openSourceProjects: OpenSourceItem[] = [
  {
    name: "Featurebase MCP",
    description: "Open-source MCP server for searching and reading public Featurebase feedback boards.",
    url: "https://github.com/K-Jadeja/open-featurebase-mcp",
  },
  {
    name: "Gatito Trans",
    description: "Real-time transcription extension built for translating Twitch streams.",
    url: "https://github.com/K-Jadeja/gatito-trans",
  },
  {
    name: "Subscription Tracker Agent",
    description: "Agent that finds subscription receipts in Gmail and tracks recurring costs through Supabase.",
    url: "https://github.com/K-Jadeja/subscription-tracker-agent",
  },
  {
    name: "Autonomous Research Agent",
    description: "An agent swarm for turning research ideas into executable Kaggle projects.",
    url: "https://github.com/K-Jadeja/autonomous-research-agent",
  },
  {
    name: "Zapier–LangChain Agent",
    description: "An early open-source agent connecting natural-language instructions to actions through Zapier.",
    url: "https://github.com/K-Jadeja/Zapier-Langchain-AI-agent",
  },
];

export type WritingItem = {
  title: string;
  displayTitle: string;
  description: string;
  url: string;
};

export const writing: WritingItem[] = [
  {
    title: "How to Turn Natural Language into Actions Across 5,000+ Apps with Zapier",
    displayTitle: "Natural language actions",
    description: "Across 5,000+ apps with Zapier",
    url: "https://x.com/krsnalyst/status/1666524859713703951",
  },
  {
    title: "Building an MCP Agent That Commands Gmail and Supabase with Mastra",
    displayTitle: "MCP agent for Gmail and Supabase",
    description: "Built with Mastra",
    url: "https://x.com/krsnalyst/status/1911818111780827617",
  },
  {
    title: "Building an Open-Source Telegram Symptom Tracker with Daily Check-Ins and Doctor-Ready Reports",
    displayTitle: "Telegram symptom tracker",
    description: "Daily check-ins and doctor-ready reports",
    url: "https://x.com/krsnalyst/status/1912929890766372929",
  },
  {
    title: "How to Prevent LLM Hallucinations in LangChain Applications",
    displayTitle: "LLM hallucinations in LangChain",
    description: "How to prevent them",
    url: "https://x.com/krsnalyst/status/1669429399349874719",
  },
  {
    title: "GPT-3.5 vs text-davinci-003: Which OpenAI Model Is Better for Chatbots?",
    displayTitle: "GPT-3.5 vs. text-davinci-003",
    description: "Which model is better for chatbots?",
    url: "https://x.com/krsnalyst/status/1662896791057047560",
  },
  {
    title: "4-bit vs 8-bit LLM Quantization: The Trade-offs for Hardware and Deployment",
    displayTitle: "4-bit vs. 8-bit LLM quantization",
    description: "Hardware and deployment trade-offs",
    url: "https://x.com/krsnalyst/status/1690530680252641280",
  },
  {
    title: "How to Teach an LLM Your Writing Style Without Fine-Tuning",
    displayTitle: "Teaching an LLM your writing style",
    description: "Without fine-tuning",
    url: "https://x.com/krsnalyst/status/1663826134063017985",
  },
];

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
