import { FlexiblePixelBulb } from "@/components/flexible-pixel-bulb";
import { PortfolioList } from "@/components/portfolio-list";
import { SelectedWork } from "@/components/selected-work";
import { TextIndex } from "@/components/text-index";
import { now, openSourceProjects, writing } from "@/data/portfolio";

const writingItems = writing.map((item) => ({
  title: item.displayTitle,
  description: item.description,
  href: item.url,
  external: true,
  ariaLabel: item.title,
}));

const openSourceItems = openSourceProjects.map((item) => ({
  title: item.name,
  description: item.description,
  href: item.url,
  external: true,
}));

const connectItems = [
  {
    title: "Email",
    description: "jadejakrishna42@gmail.com",
    href: "mailto:jadejakrishna42@gmail.com",
    external: true,
    ariaLabel: "Email Krishnasinh Jadeja",
  },
  {
    title: "GitHub",
    description: "Projects, experiments and code",
    href: "https://github.com/K-Jadeja",
    external: true,
  },
  {
    title: "LinkedIn",
    description: "Work history and collaborations",
    href: "https://www.linkedin.com/in/krishnasinh-jadeja-425a8b252/",
    external: true,
  },
  {
    title: "X",
    description: "Notes and work in progress",
    href: "https://x.com/krsnalyst",
    external: true,
  },
];

export default function HomePage() {
  return (
    <main className="home-page" id="top">
      <div className="home-shell">
        <header className="home-header">
          <h1>Krishnasinh Jadeja</h1>
        </header>

        <section className="home-intro" aria-labelledby="intro-heading">
          <FlexiblePixelBulb />
          <div className="home-intro__copy">
            <h2 id="intro-heading">I build AI products and the systems underneath them.</h2>
            <p>Founding Engineer / Technical Lead at Remalt. Building GreenPost and Sushi on the side.</p>
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
          <PortfolioList ariaLabel="Writing" items={writingItems} />
        </section>

        <section className="home-section home-open-source" id="open-source" aria-labelledby="open-source-heading">
          <h2 id="open-source-heading">Open source</h2>
          <TextIndex ariaLabel="Open source projects" items={openSourceItems} />
        </section>

        <div className="home-lower">
          <section className="home-section home-now" aria-labelledby="now-heading">
            <div className="home-section__heading">
              <h2 id="now-heading">Now</h2>
              <span className="home-now__updated">Updated {now.updatedAt}</span>
            </div>
            <dl className="home-now__list">
              <div className="home-now__item">
                <dt>Building</dt>
                <dd>{now.building}</dd>
              </div>
              <div className="home-now__item">
                <dt>Exploring</dt>
                <dd>{now.exploring}</dd>
              </div>
            </dl>
          </section>

          <section className="home-section home-connect" aria-labelledby="connect-heading">
            <div className="home-section__heading">
              <h2 id="connect-heading">Connect</h2>
            </div>
            <PortfolioList ariaLabel="Connect with Krishnasinh Jadeja" items={connectItems} />
          </section>
        </div>

        <footer className="home-footer">
          <p>© 2026 Krishnasinh Jadeja</p>
          <a className="home-footer__back" href="#top">Back to top</a>
        </footer>
      </div>
    </main>
  );
}
