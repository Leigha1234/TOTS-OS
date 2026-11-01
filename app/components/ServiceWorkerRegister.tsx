"use client";

import {
  useEffect,
} from "react";

export default function ServiceWorkerRegister() {
  useEffect(
    () => {
      if (
        !(
          "serviceWorker" in
          navigator
        )
      ) {
        return;
      }

      const register =
        async () => {
          try {
            const registration =
              await navigator
                .serviceWorker
                .register(
                  "/sw.js"
                );

            console.log(
              "[ORBI. PWA] Service worker registered:",
              registration.scope
            );
          } catch (
            error
          ) {
            console.error(
              "[ORBI. PWA] Service worker registration failed:",
              error
            );
          }
        };

      void register();
    },
    []
  );

  return null;
}