import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://bohuminsight.com",
      lastModified: new Date(),
      priority: 1,
    },

    {
      url: "https://bohuminsight.com/insurance-system",
      lastModified: new Date(),
      priority: 0.9,
    },

    {
      url: "https://bohuminsight.com/customer-center",
      lastModified: new Date(),
      priority: 0.9,
    },

    {
      url: "https://bohuminsight.com/product-public",
      lastModified: new Date(),
      priority: 0.9,
    },

    {
      url: "https://bohuminsight.com/calculator",
      lastModified: new Date(),
      priority: 0.9,
    },

    {
      url: "https://bohuminsight.com/money-value",
      lastModified: new Date(),
      priority: 0.8,
    },

    {
      url: "https://bohuminsight.com/saving-calculator",
      lastModified: new Date(),
      priority: 0.8,
    },

    {
      url: "https://bohuminsight.com/pension-calculator",
      lastModified: new Date(),
      priority: 0.8,
    },
  ];
}