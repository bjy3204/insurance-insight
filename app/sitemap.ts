import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://insurance-insight.vercel.app",
      lastModified: new Date(),
      priority: 1,
    },
    {
      url: "https://insurance-insight.vercel.app/calculator",
      lastModified: new Date(),
      priority: 0.8,
    },
    {
      url: "https://insurance-insight.vercel.app/customer",
      lastModified: new Date(),
      priority: 0.8,
    },
  ];
}