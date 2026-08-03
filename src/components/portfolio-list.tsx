import Link from "next/link";
import { ArrowUpRight } from "@/components/icons";

export type PortfolioListItem = {
  title: string;
  description?: string;
  href: string;
  external?: boolean;
  ariaLabel?: string;
};

export function PortfolioList({
  items,
  ariaLabel,
}: {
  items: PortfolioListItem[];
  ariaLabel: string;
}) {
  return (
    <ul className="portfolio-list" aria-label={ariaLabel}>
      {items.map((item) => {
        const content = (
          <>
            <span className="portfolio-list__title">
              {item.title}
              {item.external ? (
                <span className="portfolio-list__external" aria-hidden="true">
                  <ArrowUpRight size={14} />
                </span>
              ) : null}
            </span>
            {item.description ? (
              <span className="portfolio-list__description">{item.description}</span>
            ) : null}
          </>
        );

        return (
          <li className="portfolio-list__item" key={`${item.title}-${item.href}`}>
            {item.external ? (
              <a className="portfolio-list__link" href={item.href} target="_blank" rel="noreferrer" aria-label={item.ariaLabel}>
                {content}
              </a>
            ) : (
              <Link className="portfolio-list__link" href={item.href} aria-label={item.ariaLabel}>
                {content}
              </Link>
            )}
          </li>
        );
      })}
    </ul>
  );
}
