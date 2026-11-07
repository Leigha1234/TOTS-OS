import type {
  MetadataRoute,
} from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name:
      "ORBI.",

    short_name:
      "ORBI.",

    description:
      "All in one productivity suite for the modern business.",

    start_url:
      "/dashboard",

    scope:
      "/",

    display:
      "standalone",

    background_color:
      "#fcfaf7",

    theme_color:
      "#0F3D32",

    orientation:
      "portrait",

    icons: [
      {
        src:
          "/icons/icon-192.png",

        sizes:
          "192x192",

        type:
          "image/png",
      },

      {
        src:
          "/icons/icon-512.png",

        sizes:
          "512x512",

        type:
          "image/png",
      },

      {
        src:
          "/icons/icon-512-maskable.png",

        sizes:
          "512x512",

        type:
          "image/png",

        purpose:
          "maskable",
      },
    ],
  };
}