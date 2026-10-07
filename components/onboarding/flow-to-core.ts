/**
 * Information travelling to the Core: a point of its light leaves an element (a tool that just
 * connected, a company just identified) and arcs into whichever Core is on screen
 * (`[data-core-target]`). Resolves when it arrives, so the Core can react and the memory update
 * in that order. Instant with reduced motion.
 */
export function flowToCore(from: Element | null): Promise<void> {
  const target = document.querySelector("[data-core-target]");
  if (!from || !target || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return Promise.resolve();
  const a = from.getBoundingClientRect();
  const b = target.getBoundingClientRect();
  if (!b.width) return Promise.resolve();
  const x0 = a.left + a.width / 2;
  const y0 = a.top + a.height / 2;
  const x1 = b.left + b.width / 2;
  const y1 = b.top + b.height / 2;
  // a soft arc: it bows away from the straight line, never a mechanical slide
  const cx = (x0 + x1) / 2 + (y1 - y0) * 0.22;
  const cy = (y0 + y1) / 2 - Math.abs(x1 - x0) * 0.18;
  const dot = document.createElement("span");
  dot.className = "onb-flow-dot";
  document.body.appendChild(dot);
  const frames = Array.from({ length: 18 }, (_, i) => {
    const t = i / 17;
    const x = (1 - t) ** 2 * x0 + 2 * (1 - t) * t * cx + t * t * x1;
    const y = (1 - t) ** 2 * y0 + 2 * (1 - t) * t * cy + t * t * y1;
    return { transform: `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${(1 - t * 0.45).toFixed(2)})`, opacity: t < 0.12 ? t / 0.12 : t > 0.92 ? (1 - t) / 0.08 : 1 };
  });
  const run = dot.animate(frames, { duration: 900, easing: "cubic-bezier(0.55, 0, 0.25, 1)" });
  return run.finished.then(
    () => dot.remove(),
    () => dot.remove(),
  );
}
