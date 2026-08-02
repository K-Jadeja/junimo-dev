import Link from "next/link";
import { FlexiblePixelBulb } from "@/components/flexible-pixel-bulb";
import { SelectedWork } from "@/components/selected-work";
import { experience, now, openSource } from "@/data/portfolio";

const nowFields = [
  ["building", "Building"],
  ["exploring", "Exploring"],
  ["playing", "Playing"],
  ["listening", "Listening"],
  ["reading", "Reading"],
  ["outsideWork", "Outside work"],
] as const;

export default function HomePage() {
  return (
    <main className="home-page">
      <div className="home-shell">
        <header className="home-header">
          <h1>Krishnasinh Jadeja</h1>
        </header>

        <section className="home-intro" aria-labelledby="intro-heading">
          <FlexiblePixelBulb />
          <div className="home-intro__copy">
            <p className="home-intro__eyebrow">Founding engineer / technical lead</p>
            <h2 id="intro-heading">I build AI products — and the systems underneath them.</h2>
            <p className="home-intro__summary">Currently building Remalt. On the side: GreenPost.</p>
            <p className="home-intro__note">Based in India, exploring browser rendering and real-time interfaces.</p>
            <nav className="home-links" aria-label="Contact links">
              <a href="mailto:jadejakrishna42@gmail.com">Email</a>
              <a href="https://github.com/K-Jadeja" target="_blank" rel="noreferrer">GitHub</a>
              <a href="https://www.linkedin.com/in/krishnasinh-jadeja-425a8b252/" target="_blank" rel="noreferrer">LinkedIn</a>
              <a href="https://x.com/krsnalyst" target="_blank" rel="noreferrer">X</a>
            </nav>
            <a className="home-intro__work-link" href="#work">
              <span>Selected work</span>
              <span aria-hidden="true">↓</span>
            </a>
          </div>
        </section>

        <section className="home-section home-work" id="work" aria-labelledby="work-heading">
          <h2 id="work-heading">Selected work</h2>
          <SelectedWork />
        </section>

        <section className="home-section home-now" aria-labelledby="now-heading">
          <h2 id="now-heading">Now</h2>
          <div className="home-section__content">
            <dl>
              {nowFields.map(([key, label]) => now[key] ? (
                <div key={key}>
                  <dt>{label}</dt>
                  <dd>{now[key]}</dd>
                </div>
              ) : null)}
            </dl>
            <p className="home-section__updated">Updated {now.updatedAt}</p>
          </div>
        </section>

        <section className="home-section home-experience" id="experience" aria-labelledby="experience-heading">
          <h2 id="experience-heading">Experience</h2>
          <div className="home-section__content">
            <div className="home-experience__list">
              {experience.map((item) => (
                <article key={item.company}>
                  <div className="home-experience__topline">
                    <div>
                      <strong>{item.company}</strong>
                      <p className="home-experience__role">{item.role}</p>
                    </div>
                    <time>{item.shortDates}</time>
                  </div>
                  <p className="home-experience__description">{item.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="home-section home-elsewhere" aria-labelledby="elsewhere-heading">
          <h2 id="elsewhere-heading">Elsewhere</h2>
          <div className="home-section__content">
            <Link href={openSource.url} target="_blank" rel="noreferrer">{openSource.name}</Link>
            <p>{openSource.description}</p>
            <nav aria-label="Elsewhere links">
              <a href="https://github.com/K-Jadeja/Zapier-Langchain-AI-agent" target="_blank" rel="noreferrer">GitHub</a>
              <a href="https://x.com/krsnalyst" target="_blank" rel="noreferrer">X</a>
            </nav>
          </div>
        </section>

        <footer className="home-footer" id="contact">
          <div>
            <p>Based in India.</p>
            <p>Last updated August 2026.</p>
          </div>
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
