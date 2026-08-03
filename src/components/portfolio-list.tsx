import Link from "next/link";

export type PortfolioListItem = {
  title: string;
  description?: string;
  href: string;
  external?: boolean;
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
            <span className="portfolio-list__title">{item.title}</span>
            {item.description ? (
              <span className="portfolio-list__description">{item.description}</span>
            ) : null}
          </>
        );

        return (
          <li className="portfolio-list__item" key={`${item.title}-${item.href}`}>
            {item.external ? (
              <a className="portfolio-list__link" href={item.href} target="_blank" rel="noreferrer">
                {content}
              </a>
            ) : (
              <Link className="portfolio-list__link" href={item.href}>
                {content}
              </Link>
            )}
          </li>
        );
      })}
    </ul>
  );
}
