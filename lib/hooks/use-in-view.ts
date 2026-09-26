"use client";

import { useEffect, useRef, useState } from "react";

/**
 * IntersectionObserver hook — the only scroll primitive we use for reveals.
 * `once` stops observing after the first intersection.
 */
export function useInView<T extends Element>({
  rootMargin = "0px 0px -12% 0px",
  threshold = 0,
  once = true,
}: { rootMargin?: string; threshold?: number | number[]; once?: boolean } = {}) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (once) io.disconnect();
        } else if (!once) {
          setInView(false);
        }
      },
      { rootMargin, threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin, threshold, once]);

  return { ref, inView };
}
