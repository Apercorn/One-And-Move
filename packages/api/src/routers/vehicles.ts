import { z } from "zod";
import { db, schema } from "@One-and-Move/db";
import { eq } from "drizzle-orm";
import { publicProcedure, protectedProcedure } from "../index";

// Helper for generating UUIDs
function uuidv4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export const vehiclesRouter = {
  reportStatus: protectedProcedure
    .input(z.object({
      officialNumber: z.string(),
      lat: z.number(),
      lng: z.number(),
      fullness: z.number().min(0).max(100),
      speed: z.number().optional(),
    }))
    .handler(async ({ input, context }) => {
      const reporterId = context.session?.user?.id;
      if (!reporterId) throw new Error("Unauthorized");

      // Validate official number against DB
      const vehicleRecord = await db.query.vehicle.findFirst({
        where: eq(schema.vehicle.officialNumber, input.officialNumber),
      });

      if (!vehicleRecord) {
        throw new Error("Vehicle not found");
      }

      await db.insert(schema.vehicleReport).values({
        id: uuidv4(),
        vehicleId: vehicleRecord.id,
        reporterId,
        lat: input.lat,
        lng: input.lng,
        fullness: input.fullness,
        speed: input.speed,
      });

      return { success: true };
    }),

  getNearby: publicProcedure
    .input(z.object({
      lat: z.number(),
      lng: z.number(),
      radiusKm: z.number().default(5),
    }))
    .handler(async ({ input: _input }) => {
      // In a real app we'd use PostGIS or Haversine formula
      // Note: drizzlee-orm with Neon can do basic filtering
      
      const latestReports = await db.query.vehicleReport.findMany({
        orderBy: (reports, { desc }) => [desc(reports.reportedAt)],
        limit: 100, // naive approach for getting recent reports
        with: {
          vehicle: true,
        }
      });
      
      return latestReports;
    }),
};
