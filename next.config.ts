import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Signing up and signing in both happen inside the onboarding (one continuous environment);
  // the old addresses keep working, and their query (?plan=…) is passed through.
  redirects() {
    return [
      { source: "/signup", destination: "/onboarding", permanent: false },
      { source: "/login", destination: "/onboarding?mode=signin", permanent: false },
    ];
  },
};

export default nextConfig;
