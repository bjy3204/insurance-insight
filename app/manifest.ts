import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "보험인사이트",
    short_name: "보험인사이트",
    description: "보험설계사 업무 통합 플랫폼",

    start_url: "/",

    display: "standalone",

    background_color: "#ffffff",

    theme_color: "#ffffff",

    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}