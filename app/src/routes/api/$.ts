import { createFileRoute } from "@tanstack/react-router";

import { handleApi } from "../../lib/api.server";

/**
 * App-local JSON endpoints. The browser only ever calls /api/*, and the action
 * is the path segment after /api/, so one route serves the whole surface.
 */
export const Route = createFileRoute("/api/$")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const url = new URL(request.url);
        return handleApi(url.pathname.replace(/^\/api\//, ""), request);
      },
      GET: async ({ request }) => {
        const url = new URL(request.url);
        return handleApi(url.pathname.replace(/^\/api\//, ""), request);
      },
    },
  },
});
