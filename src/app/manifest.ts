import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Yojana Sahayak — योजना सहायक",
    short_name: "योजना सहायक",
    description: "Find and understand government schemes in Hindi or English",
    start_url: "/",
    display: "standalone",
    background_color: "#f3eee3",
    theme_color: "#c63a1d",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "पूछें · Ask", url: "/hi/chat" },
      { name: "मेरी योजनाएँ · My Schemes", url: "/hi/find" },
    ],
  };
}
