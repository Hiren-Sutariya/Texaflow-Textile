import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TexaFlow Textile ERP",
    short_name: "TexaFlow",
    description: "Cloud Operating System for Textile, Saree & Embroidery Manufacturing",
    start_url: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#2563eb",
    orientation: "any",
    scope: "/",
    id: "/?source=pwa",
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/icons/icon-maskable-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable"
      },
      {
        src: "/icons/icon-maskable-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable"
      }
    ],
    shortcuts: [
      {
        name: "New Sales Challan",
        short_name: "New Challan",
        description: "Create a new sales dispatch challan",
        url: "/sales/new",
        icons: [{ src: "/icons/icon-192x192.png", sizes: "192x192" }]
      },
      {
        name: "General Ledger",
        short_name: "Ledger",
        description: "View party ledger accounts and statements",
        url: "/ledger",
        icons: [{ src: "/icons/icon-192x192.png", sizes: "192x192" }]
      },
      {
        name: "Day Book",
        short_name: "Day Book",
        description: "Daily receipts and payment transactions",
        url: "/daybook",
        icons: [{ src: "/icons/icon-192x192.png", sizes: "192x192" }]
      }
    ]
  };
}
