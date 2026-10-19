import type { Metadata } from "next";
import "./overview.css";

export const metadata: Metadata = {
  title: { default: "Executive Overview concepts", template: "%s · Syxoria" },
  robots: { index: false, follow: false },
};

/**
 * Two explorations of the Executive Overview and its navigation, for the client's review before
 * the whole workspace moves to one of them. Both read the workspace's own services; neither
 * changes /app. Styles: ./overview.css (`.cx` shared, `.ca` concept A, `.cb` concept B).
 */
export default function OverviewConceptsLayout({ children }: LayoutProps<"/concept/overview">) {
  return <div className="cx">{children}</div>;
}
