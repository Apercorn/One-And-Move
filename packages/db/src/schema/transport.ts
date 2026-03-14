import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, integer, real, varchar, boolean } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const preferredTransport = pgTable("preferred_transport", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  mode: varchar("mode", { length: 50 }).notNull(), // 'bus', 'robot_taxi', etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const route = pgTable("route", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  polyline: text("polyline").notNull(), // GeoJSON or Polyline string
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const vehicle = pgTable("vehicle", {
  id: text("id").primaryKey(),
  type: varchar("type", { length: 50 }).notNull(), // 'jutc', 'robot_taxi'
  officialNumber: varchar("official_number", { length: 50 }), // null for robot_taxis maybe
  currentRouteId: text("current_route_id").references(() => route.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const vehicleReport = pgTable("vehicle_report", {
  id: text("id").primaryKey(),
  vehicleId: text("vehicle_id").notNull().references(() => vehicle.id, { onDelete: "cascade" }),
  reporterId: text("reporter_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  lat: real("lat").notNull(),
  lng: real("lng").notNull(),
  fullness: integer("fullness"), // 0-100%
  speed: real("speed"),
  reportedAt: timestamp("reported_at").defaultNow().notNull(),
});

export const transportRelations = relations(user, ({ many }) => ({
  preferredTransports: many(preferredTransport),
  reports: many(vehicleReport),
}));

export const routeRelations = relations(route, ({ many }) => ({
  vehicles: many(vehicle),
}));

export const vehicleRelations = relations(vehicle, ({ one, many }) => ({
  route: one(route, {
    fields: [vehicle.currentRouteId],
    references: [route.id],
  }),
  reports: many(vehicleReport),
}));

export const reportRelations = relations(vehicleReport, ({ one }) => ({
  vehicle: one(vehicle, {
    fields: [vehicleReport.vehicleId],
    references: [vehicle.id],
  }),
  reporter: one(user, {
    fields: [vehicleReport.reporterId],
    references: [user.id],
  }),
}));
