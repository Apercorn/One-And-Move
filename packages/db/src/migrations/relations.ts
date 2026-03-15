import { relations } from "drizzle-orm/relations";
import { route, vehicle, vehicleReport, user, account, session, preferredTransport, liveVehicle, routeBusStop, busStop } from "./schema";

export const vehicleRelations = relations(vehicle, ({one, many}) => ({
	route: one(route, {
		fields: [vehicle.currentRouteId],
		references: [route.id]
	}),
	vehicleReports: many(vehicleReport),
}));

export const routeRelations = relations(route, ({many}) => ({
	vehicles: many(vehicle),
	routeBusStops: many(routeBusStop),
}));

export const vehicleReportRelations = relations(vehicleReport, ({one}) => ({
	vehicle: one(vehicle, {
		fields: [vehicleReport.vehicleId],
		references: [vehicle.id]
	}),
	user: one(user, {
		fields: [vehicleReport.reporterId],
		references: [user.id]
	}),
}));

export const userRelations = relations(user, ({many}) => ({
	vehicleReports: many(vehicleReport),
	accounts: many(account),
	sessions: many(session),
	preferredTransports: many(preferredTransport),
	liveVehicles: many(liveVehicle),
}));

export const accountRelations = relations(account, ({one}) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id]
	}),
}));

export const sessionRelations = relations(session, ({one}) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id]
	}),
}));

export const preferredTransportRelations = relations(preferredTransport, ({one}) => ({
	user: one(user, {
		fields: [preferredTransport.userId],
		references: [user.id]
	}),
}));

export const liveVehicleRelations = relations(liveVehicle, ({one}) => ({
	user: one(user, {
		fields: [liveVehicle.reportedById],
		references: [user.id]
	}),
}));

export const routeBusStopRelations = relations(routeBusStop, ({one}) => ({
	route: one(route, {
		fields: [routeBusStop.routeId],
		references: [route.id]
	}),
	busStop: one(busStop, {
		fields: [routeBusStop.busStopId],
		references: [busStop.id]
	}),
}));

export const busStopRelations = relations(busStop, ({many}) => ({
	routeBusStops: many(routeBusStop),
}));