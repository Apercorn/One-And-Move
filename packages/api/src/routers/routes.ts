import { z } from "zod";
import { publicProcedure } from "../index";
import { planRoutes } from "../lib/route-planner";

export const routesRouter = {
  getBestRoute: publicProcedure
    .input(
      z.object({
        originLat: z.number(),
        originLng: z.number(),
        destinationLat: z.number(),
        destinationLng: z.number(),
      })
    )
    .handler(async ({ input }) => {
      const routes = await planRoutes(
        { lat: input.originLat, lng: input.originLng },
        { lat: input.destinationLat, lng: input.destinationLng }
      );

      return routes;
    }),
};
