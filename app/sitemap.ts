import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://insurance-insight.vercel.app",
      lastModified: new Date(),
      priority: 1,
    },

    {
      url: "https://insurance-insight.vercel.app/insurance-system",
      lastModified: new Date(),
      priority: 0.9,
    },

    {
      url: "https://insurance-insight.vercel.app/customer-center",
      lastModified: new Date(),
      priority: 0.9,
    },

    {
      url: "https://insurance-insight.vercel.app/product-public",
      lastModified: new Date(),
      priority: 0.9,
    },

    {
      url: "https://insurance-insight.vercel.app/calculator",
      lastModified: new Date(),
      priority: 0.9,
    },

    {
      url: "https://insurance-insight.vercel.app/money-value",
      lastModified: new Date(),
      priority: 0.8,
    },

    {
      url: "https://insurance-insight.vercel.app/saving-calculator",
      lastModified: new Date(),
      priority: 0.8,
    },

    {
      url: "https://insurance-insight.vercel.app/pension-calculator",
      lastModified: new Date(),
      priority: 0.8,
    },
  ];
}