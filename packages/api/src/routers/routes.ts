import { z } from "zod";
import { publicProcedure } from "../index";

export const routesRouter = {
  getBestRoute: publicProcedure
    .input(z.object({
      originLat: z.number(),
      originLng: z.number(),
      destinationLat: z.number(),
      destinationLng: z.number(),
    }))
    .handler(async ({ input }) => {
      // Mock logic for calculating routes using formula (time * 0.5) + (crowding inverse * 0.3) + (cost * 0.2)
      
      const mockRoutes = [
        {
          id: "route-1",
          type: "robot_taxi",
          etaMinutes: 12,
          crowdingScore: 10, // 0-100 (inverse of fullness)
          costScore: 20, 
          markers: [
            { lat: input.originLat + 0.001, lng: input.originLng + 0.001, type: "robot_taxi" }
          ],
          polyline: "mock-polyline-1"
        },
        {
          id: "route-2",
          type: "jutc",
          etaMinutes: 25,
          crowdingScore: 80, // high crowding
          costScore: 5, // low cost
          markers: [
            { lat: input.originLat + 0.005, lng: input.originLng + 0.005, type: "jutc" }
          ],
          polyline: "mock-polyline-2"
        }
      ];

      // Calculate score for each: lower is better
      const scoredRoutes = mockRoutes.map(route => {
        const timeScore = route.etaMinutes * 0.5;
        // crowding inverse: 100 - crowdingScore
        const crowdInverse = (100 - route.crowdingScore) * 0.3;
        const cScore = route.costScore * 0.2;
        const totalScore = timeScore + crowdInverse + cScore;
        return { ...route, totalScore };
      }).sort((a, b) => a.totalScore - b.totalScore);
      
      return scoredRoutes;
    }),
};
