import { pgTable, text, timestamp, foreignKey, varchar, real, integer, index, unique, boolean, primaryKey } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const route = pgTable("route", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	polyline: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});

export const vehicle = pgTable("vehicle", {
	id: text().primaryKey().notNull(),
	type: varchar({ length: 50 }).notNull(),
	officialNumber: varchar("official_number", { length: 50 }),
	currentRouteId: text("current_route_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.currentRouteId],
			foreignColumns: [route.id],
			name: "vehicle_current_route_id_route_id_fk"
		}).onDelete("set null"),
]);

export const vehicleReport = pgTable("vehicle_report", {
	id: text().primaryKey().notNull(),
	vehicleId: text("vehicle_id").notNull(),
	reporterId: text("reporter_id").notNull(),
	lat: real().notNull(),
	lng: real().notNull(),
	fullness: integer(),
	speed: real(),
	reportedAt: timestamp("reported_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.vehicleId],
			foreignColumns: [vehicle.id],
			name: "vehicle_report_vehicle_id_vehicle_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.reporterId],
			foreignColumns: [user.id],
			name: "vehicle_report_reporter_id_user_id_fk"
		}).onDelete("cascade"),
]);

export const verification = pgTable("verification", {
	id: text().primaryKey().notNull(),
	identifier: text().notNull(),
	value: text().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("verification_identifier_idx").using("btree", table.identifier.asc().nullsLast().op("text_ops")),
]);

export const user = pgTable("user", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	email: text().notNull(),
	emailVerified: boolean("email_verified").default(false).notNull(),
	image: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("user_email_unique").on(table.email),
]);

export const account = pgTable("account", {
	id: text().primaryKey().notNull(),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	userId: text("user_id").notNull(),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	accessTokenExpiresAt: timestamp("access_token_expires_at", { mode: 'string' }),
	refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { mode: 'string' }),
	scope: text(),
	password: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
}, (table) => [
	index("account_userId_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "account_user_id_user_id_fk"
		}).onDelete("cascade"),
]);

export const session = pgTable("session", {
	id: text().primaryKey().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	token: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	userId: text("user_id").notNull(),
}, (table) => [
	index("session_userId_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "session_user_id_user_id_fk"
		}).onDelete("cascade"),
	unique("session_token_unique").on(table.token),
]);

export const preferredTransport = pgTable("preferred_transport", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	mode: varchar({ length: 50 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "preferred_transport_user_id_user_id_fk"
		}).onDelete("cascade"),
]);

export const busStop = pgTable("bus_stop", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	lat: real().notNull(),
	lng: real().notNull(),
	address: text(),
});

export const taxiStand = pgTable("taxi_stand", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	lat: real().notNull(),
	lng: real().notNull(),
	address: text(),
});

export const liveVehicle = pgTable("live_vehicle", {
	id: text().primaryKey().notNull(),
	vehicleType: varchar("vehicle_type", { length: 20 }).notNull(),
	licensePlate: varchar("license_plate", { length: 20 }).notNull(),
	routeNumber: varchar("route_number", { length: 20 }),
	lat: real().notNull(),
	lng: real().notNull(),
	heading: real(),
	speed: real(),
	reportedById: text("reported_by_id").notNull(),
	lastSeenAt: timestamp("last_seen_at", { mode: 'string' }).defaultNow().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	isActive: boolean("is_active").default(true).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.reportedById],
			foreignColumns: [user.id],
			name: "live_vehicle_reported_by_id_user_id_fk"
		}).onDelete("cascade"),
	unique("live_vehicle_license_plate_unique").on(table.licensePlate),
]);

export const routeBusStop = pgTable("route_bus_stop", {
	routeId: text("route_id").notNull(),
	busStopId: text("bus_stop_id").notNull(),
	stopOrder: integer("stop_order").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.routeId],
			foreignColumns: [route.id],
			name: "route_bus_stop_route_id_route_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.busStopId],
			foreignColumns: [busStop.id],
			name: "route_bus_stop_bus_stop_id_bus_stop_id_fk"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.routeId, table.busStopId], name: "route_bus_stop_route_id_bus_stop_id_pk"}),
]);
