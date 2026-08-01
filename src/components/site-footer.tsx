import { ArrowUpRight } from "@/components/icons";
import { CopyEmail } from "@/components/copy-email";

const email = "jadejakrishna42@gmail.com";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__top">
        <div className="footer-cta">
          <h2>Have an ambitious product or difficult engineering problem?</h2>
          <div className="footer-email-row">
            <a className="footer-email" href={`mailto:${email}`}>{email}</a>
            <CopyEmail />
          </div>
        </div>
      </div>
      <div className="site-footer__bottom">
        <p className="footer-signoff">Krishnasinh Jadeja<br /><span>Founding Engineer / Technical Lead</span></p>
        <div className="footer-links">
          <a href="https://github.com/K-Jadeja" target="_blank" rel="noreferrer">GitHub <ArrowUpRight /></a>
          <a href="https://www.linkedin.com/in/krishnasinh-jadeja-425a8b252/" target="_blank" rel="noreferrer">LinkedIn <ArrowUpRight /></a>
          <a href="https://x.com/krsnalyst" target="_blank" rel="noreferrer">X <ArrowUpRight /></a>
        </div>
        <p className="footer-copyright">© 2026 Krishnasinh Jadeja</p>
      </div>
    </footer>
  );
}
