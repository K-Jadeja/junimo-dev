import { FlexiblePixelBulb } from "@/components/flexible-pixel-bulb";
import { SelectedWork } from "@/components/selected-work";
import { TextIndex } from "@/components/text-index";
import { now, openSourceProjects, writing } from "@/data/portfolio";

const writingItems = writing.map((item) => ({
  title: item.title,
  description: item.description,
  href: item.url,
  external: true,
}));

const openSourceItems = openSourceProjects.map((item) => ({
  title: item.name,
  description: item.description,
  href: item.url,
  external: true,
}));

const moreItems = [
  {
    title: "GitHub",
    description: "More projects, experiments and code.",
    href: "https://github.com/K-Jadeja",
    external: true,
  },
];

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
            <h2 id="intro-heading">I build AI products and the systems underneath them.</h2>
            <p>Founding Engineer / Technical Lead at Remalt. Building GreenPost on the side.</p>
            <nav className="home-links" aria-label="Contact links">
              <a href="mailto:jadejakrishna42@gmail.com">Email</a>
              <a href="https://github.com/K-Jadeja" target="_blank" rel="noreferrer">GitHub</a>
              <a href="https://www.linkedin.com/in/krishnasinh-jadeja-425a8b252/" target="_blank" rel="noreferrer">LinkedIn</a>
              <a href="https://x.com/krsnalyst" target="_blank" rel="noreferrer">X</a>
            </nav>
          </div>
        </section>

        <section className="home-section home-work" id="work" aria-labelledby="work-heading">
          <h2 id="work-heading">Projects</h2>
          <SelectedWork />
        </section>

        <section className="home-section home-writing" id="writing" aria-labelledby="writing-heading">
          <h2 id="writing-heading">Writing</h2>
          <TextIndex ariaLabel="Writing" items={writingItems} />
        </section>

        <section className="home-section home-open-source" id="open-source" aria-labelledby="open-source-heading">
          <h2 id="open-source-heading">Open source</h2>
          <TextIndex ariaLabel="Open source projects" items={openSourceItems} />
        </section>

        <section className="home-section home-now" aria-labelledby="now-heading">
          <h2 id="now-heading">Now</h2>
          <div className="home-now__copy">
            <p>Building {now.building}.</p>
            <p>Exploring {now.exploring}.</p>
          </div>
        </section>

        <section className="home-section home-more" aria-labelledby="more-heading">
          <h2 id="more-heading">More</h2>
          <TextIndex ariaLabel="More projects and links" items={moreItems} />
        </section>

        <footer className="home-footer">
          <p>© 2026 Krishnasinh Jadeja</p>
        </footer>
      </div>
    </main>
  );
}
