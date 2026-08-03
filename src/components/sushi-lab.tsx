type SushiExperiment = {
  name: string;
  route: string;
  description: string;
  mode: string;
};

const sushiLabOrigin =
  process.env.NEXT_PUBLIC_SUSHI_LAB_ORIGIN ??
  (process.env.NODE_ENV === "development" ? "/sushi" : "https://sushi.junimo.dev");

const sushiLabRoute = (slug: string) =>
  `${sushiLabOrigin.replace(/\/$/, "")}/${slug}${sushiLabOrigin === "/sushi" ? "/" : ""}`;

const experiments: SushiExperiment[] = [
  {
    name: "LLM",
    route: sushiLabRoute("llm"),
    description: "Choose a local model and chat through WebGPU or the mobile WASM path.",
    mode: "language",
  },
  {
    name: "TTS",
    route: sushiLabRoute("tts"),
    description: "Load Pocket-TTS, choose a voice, and synthesize speech in the browser.",
    mode: "voice",
  },
  {
    name: "LLM + TTS",
    route: sushiLabRoute("llm-tts"),
    description: "Connect local generation to streaming speech and a responsive avatar stage.",
    mode: "voice loop",
  },
  {
    name: "STT",
    route: sushiLabRoute("stt"),
    description: "Record speech and transcribe it with the local streaming or mobile path.",
    mode: "hearing",
  },
  {
    name: "STT + LLM + TTS",
    route: sushiLabRoute("stt-llm-tts"),
    description: "Run the complete speak → think → listen pipeline without an API key.",
    mode: "pipeline",
  },
  {
    name: "Astres",
    route: sushiLabRoute("astres"),
    description: "Explore elevation-driven worlds rendered with WebGPU and Rust WASM.",
    mode: "rendering",
  },
  {
    name: "Classifier",
    route: sushiLabRoute("classifier"),
    description: "Classify messages with a small browser-loaded swarm model.",
    mode: "swarm",
  },
  {
    name: "Swarm",
    route: sushiLabRoute("swarm"),
    description: "Read the distributed browser-inference experiment behind the classifier.",
    mode: "systems",
  },
];

export function SushiLab() {
  return (
    <section className="sushi-lab" aria-labelledby="sushi-lab-title">
      <div className="sushi-lab__heading">
        <div>
          <p className="case-label">Browser lab</p>
          <h2 id="sushi-lab-title">Run the experiments</h2>
        </div>
        <p className="sushi-lab__note">Local-first demos. Models download only when you choose to load them.</p>
      </div>

      <ul className="sushi-lab__grid">
        {experiments.map((experiment) => (
          <li key={experiment.route}>
            <a className="sushi-lab__link" href={experiment.route}>
              <span className="sushi-lab__topline">
                <span className="sushi-lab__name">{experiment.name}</span>
                <span className="sushi-lab__mode">{experiment.mode}</span>
              </span>
              <span className="sushi-lab__description">{experiment.description}</span>
              <span className="sushi-lab__open">Open experiment <span aria-hidden="true">↗</span></span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
