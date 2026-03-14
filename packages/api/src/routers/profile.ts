import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, schema } from "@One-and-Move/db";
import { protectedProcedure } from "../index";

// Helper for generating UUIDs
function uuidv4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export const profileRouter = {
  getPreferredTransports: protectedProcedure.handler(async ({ context }) => {
    const userId = context.session?.user?.id;
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const transports = await db
      .select()
      .from(schema.preferredTransport)
      .where(eq(schema.preferredTransport.userId, userId));

    return transports.map((t) => t.mode);
  }),

  setPreferredTransports: protectedProcedure
    .input(z.object({ modes: z.array(z.string()) }))
    .handler(async ({ input, context }) => {
      const userId = context.session?.user?.id;
      if (!userId) {
        throw new Error("Unauthorized");
      }

      // Start transaction or just delete and re-insert
      await db.delete(schema.preferredTransport).where(eq(schema.preferredTransport.userId, userId));

      if (input.modes.length > 0) {
        const insertData = input.modes.map((mode) => ({
          id: uuidv4(),
          userId,
          mode,
        }));
        await db.insert(schema.preferredTransport).values(insertData);
      }

      return { success: true };
    }),
};
