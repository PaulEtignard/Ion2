import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Les icônes sont servies en statique depuis /public/game : pas besoin d'optimisation distante.
  images: { unoptimized: true },
  serverExternalPackages: ["pg"],
};

export default nextConfig;
