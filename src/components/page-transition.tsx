"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";

type NativeViewTransition = {
  finished: Promise<unknown>;
  skipTransition: () => void;
};

type TransitionDocument = Document & {
  startViewTransition?: (
    updateCallback: () => void | Promise<void>,
  ) => NativeViewTransition;
};

type PendingNavigation = {
  destination: string;
  settle: () => void;
  timeoutId: number;
};

function isModifiedClick(event: MouseEvent) {
  return event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
}

function routeKey(url: URL) {
  return `${url.pathname}${url.search}`;
}

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const pendingNavigation = useRef<PendingNavigation | null>(null);
  const activeTransition = useRef<NativeViewTransition | null>(null);

  useEffect(() => {
    const pending = pendingNavigation.current;
    if (!pending) return;

    const currentUrl = new URL(window.location.href);
    if (pending.destination !== routeKey(currentUrl)) return;

    pending.settle();
  }, [pathname]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (isModifiedClick(event)) return;

      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) return;

      let destination: URL;
      try {
        destination = new URL(href, window.location.href);
      } catch {
        return;
      }

      if (destination.origin !== window.location.origin || destination.protocol !== window.location.protocol) return;

      const currentUrl = new URL(window.location.href);
      if (routeKey(destination) === routeKey(currentUrl)) return;

      event.preventDefault();

      const navigate = () => {
        router.push(`${destination.pathname}${destination.search}${destination.hash}`);
      };
      const transitionDocument = document as TransitionDocument;
      const startViewTransition = transitionDocument.startViewTransition?.bind(transitionDocument);

      if (!startViewTransition) {
        navigate();
        return;
      }

      pendingNavigation.current?.settle();
      activeTransition.current?.skipTransition();

      let settleUpdate = () => {};
      const update = new Promise<void>((resolve) => {
        settleUpdate = resolve;
      });
      const destinationKey = routeKey(destination);
      let timeoutId = 0;
      const settle = () => {
        window.clearTimeout(timeoutId);
        if (pendingNavigation.current?.settle === settle) pendingNavigation.current = null;
        settleUpdate();
      };
      timeoutId = window.setTimeout(settle, 1600);

      pendingNavigation.current = { destination: destinationKey, settle, timeoutId };

      try {
        const transition = startViewTransition(() => {
          navigate();
          return update;
        });
        activeTransition.current = transition;
        void transition.finished.then(
          () => {
            if (activeTransition.current === transition) activeTransition.current = null;
          },
          () => {
            if (activeTransition.current === transition) activeTransition.current = null;
          },
        );
      } catch {
        settle();
        navigate();
      }
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [router]);

  useEffect(() => () => {
    pendingNavigation.current?.settle();
    activeTransition.current?.skipTransition();
  }, []);

  return children;
}
