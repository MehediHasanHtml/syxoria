import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site-config";

export const alt = `${siteConfig.name} — ${siteConfig.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Generated social card — no binary assets to maintain. */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          background: "radial-gradient(ellipse at 78% 40%, rgba(214,168,113,0.22), #08090a 60%)",
          color: "#f5f5f2",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 28, letterSpacing: 12 }}>
          <svg width="44" height="44" viewBox="0 0 32 32" fill="none">
            <path d="M16 5 27.5 26H4.5L16 5Z" stroke="#f5f5f2" strokeWidth="1.4" strokeLinejoin="round" />
            <path d="M16 26V17.4M16 17.4 11.2 12.2M16 17.4 20.8 12.2" stroke="#f5f5f2" strokeWidth="1.4" strokeLinecap="round" />
            <circle cx="16" cy="17.4" r="1.8" fill="#d6a871" />
          </svg>
          SYXORIA
        </div>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 76, lineHeight: 1.05, letterSpacing: -2 }}>
          <span>Your company grows into</span>
          <span style={{ color: "#ecc896" }}>a new dimension.</span>
        </div>
        <div style={{ display: "flex", fontSize: 26, color: "#a5a8aa" }}>{siteConfig.tagline}</div>
      </div>
    ),
    size,
  );
}
