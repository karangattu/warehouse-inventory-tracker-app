import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Warehouse Inventory Tracker",
    short_name: "Inventory",
    description: "Real-time inventory management for warehouse operations",
    start_url: "/",
    display: "standalone",
    background_color: "#F9FAFB",
    theme_color: "#2563EB",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
