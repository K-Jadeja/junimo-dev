import Link from "next/link";

export type TextIndexItem = {
  title: string;
  description: string;
  href: string;
  external?: boolean;
};

export function TextIndex({ items, ariaLabel }: { items: TextIndexItem[]; ariaLabel: string }) {
  return (
    <ul className="home-index" aria-label={ariaLabel}>
      {items.map((item) => {
        const content = (
          <>
            <span className="home-index__title">{item.title}</span>
            <span className="home-index__description">{item.description}</span>
          </>
        );

        return (
          <li className="home-index__item" key={`${item.title}-${item.href}`}>
            {item.external ? (
              <a href={item.href} target="_blank" rel="noreferrer">
                {content}
              </a>
            ) : (
              <Link href={item.href}>{content}</Link>
            )}
          </li>
        );
      })}
    </ul>
  );
}
