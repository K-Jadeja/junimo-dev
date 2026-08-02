import Link from "next/link";
import { SelectedWork } from "@/components/selected-work";
import { experience, now, openSource } from "@/data/portfolio";

const nowFields = [
  ["building", "Building"],
  ["exploring", "Exploring"],
  ["playing", "Playing"],
  ["listening", "Listening"],
  ["reading", "Reading"],
] as const;

export default function HomePage() {
  return (
    <main className="home-page">
      <div className="home-shell">
        <section className="home-intro" aria-labelledby="intro-heading">
          <h1 id="intro-heading">Krishnasinh Jadeja</h1>
          <p>Founding engineer working across AI products, real-time systems and media infrastructure.</p>
          <p>Currently building Remalt and GreenPost from India.</p>
          <nav className="home-links" aria-label="Contact links">
            <a href="mailto:jadejakrishna42@gmail.com">Email</a>
            <a href="https://github.com/K-Jadeja" target="_blank" rel="noreferrer">GitHub</a>
            <a href="https://www.linkedin.com/in/krishnasinh-jadeja-425a8b252/" target="_blank" rel="noreferrer">LinkedIn</a>
          </nav>
        </section>

        <SelectedWork />

        <section className="home-section home-now" aria-labelledby="now-heading">
          <div className="home-section__heading">
            <h2 id="now-heading">Now</h2>
            <span>Updated {now.updatedAt}</span>
          </div>
          <dl>
            {nowFields.map(([key, label]) => now[key] ? (
              <div key={key}>
                <dt>{label}</dt>
                <dd>{now[key]}</dd>
              </div>
            ) : null)}
          </dl>
        </section>

        <section className="home-section home-experience" id="experience" aria-labelledby="experience-heading">
          <h2 id="experience-heading">Experience</h2>
          <div className="home-experience__list">
            {experience.map((item) => (
              <article key={item.company}>
                <div className="home-experience__topline">
                  <strong>{item.company}</strong>
                  <time>{item.shortDates}</time>
                </div>
                <p className="home-experience__role">{item.role}</p>
                <p className="home-experience__description">{item.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="home-section home-elsewhere" aria-labelledby="elsewhere-heading">
          <h2 id="elsewhere-heading">Elsewhere</h2>
          <div>
            <Link href={openSource.url} target="_blank" rel="noreferrer">{openSource.name}</Link>
            <p>An early open-source experiment connecting natural-language instructions to actions through Zapier NLA.</p>
            <nav aria-label="Elsewhere links">
              <a href="https://github.com/K-Jadeja/Zapier-Langchain-AI-agent" target="_blank" rel="noreferrer">GitHub</a>
              <a href="https://x.com/krsnalyst" target="_blank" rel="noreferrer">X</a>
            </nav>
          </div>
        </section>

        <footer className="home-footer" id="contact">
          <p>Built from India.</p>
          <p>Last updated August 2026.</p>
          <nav aria-label="Footer links">
            <a href="mailto:jadejakrishna42@gmail.com">Email</a>
            <a href="https://github.com/K-Jadeja" target="_blank" rel="noreferrer">GitHub</a>
            <a href="https://www.linkedin.com/in/krishnasinh-jadeja-425a8b252/" target="_blank" rel="noreferrer">LinkedIn</a>
            <a href="https://x.com/krsnalyst" target="_blank" rel="noreferrer">X</a>
          </nav>
        </footer>
      </div>
    </main>
  );
}
