"use client";

import { useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import WebMap from "@/components/Map";
import { MapNavBar } from "@/components/map-nav-bar";
import type {
	LatLng,
	LocationSuggestion,
	TripLeg,
	TripRoute,
} from "@/components/TripDrawer";
import TripDrawer from "@/components/TripDrawer";
import WalkthroughModal from "@/components/walkthrough-modal";

/* ── Haversine helper ──────────────────────────── */

const DEG_TO_RAD = Math.PI / 180;

function haversineKm(a: LatLng, b: LatLng): number {
	const dLat = (b.lat - a.lat) * DEG_TO_RAD;
	const dLng = (b.lng - a.lng) * DEG_TO_RAD;
	const sinHalfLat = Math.sin(dLat / 2);
	const sinHalfLng = Math.sin(dLng / 2);
	const h =
		sinHalfLat * sinHalfLat +
		Math.cos(a.lat * DEG_TO_RAD) *
			Math.cos(b.lat * DEG_TO_RAD) *
			sinHalfLng *
			sinHalfLng;
	return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export default function TransitMap() {
	const { resolvedTheme } = useTheme();
	const isDark = resolvedTheme === "dark";
	const searchParams = useSearchParams();

	// Pre-populate from hero search params
	const initialFrom = useMemo<LocationSuggestion | null>(() => {
		const name = searchParams.get("fromName");
		const lat = searchParams.get("fromLat");
		const lng = searchParams.get("fromLng");
		if (!name || !lat || !lng) return null;
		return {
			id: "hero-from",
			name,
			address: name,
			coords: { lat: Number(lat), lng: Number(lng) },
		};
	}, [searchParams]);

	const initialTo = useMemo<LocationSuggestion | null>(() => {
		const name = searchParams.get("toName");
		const lat = searchParams.get("toLat");
		const lng = searchParams.get("toLng");
		if (!name || !lat || !lng) return null;
		return {
			id: "hero-to",
			name,
			address: name,
			coords: { lat: Number(lat), lng: Number(lng) },
		};
	}, [searchParams]);

	const [fromMarker, setFromMarker] = useState<LatLng | null>(
		initialFrom?.coords ?? null
	);
	const [toMarker, setToMarker] = useState<LatLng | null>(
		initialTo?.coords ?? null
	);
	const [routePoints, setRoutePoints] = useState<LatLng[]>([]);
	const [routeLegs, setRouteLegs] = useState<TripLeg[]>([]);
	const [flyTo, setFlyTo] = useState<LatLng | null>(
		initialFrom?.coords ?? initialTo?.coords ?? null
	);

	// ── Real GPS user location ─────────────────────
	const [userLocation, setUserLocation] = useState<LatLng | null>(null);
	const gpsWatchRef = useRef<number | null>(null);

	useEffect(() => {
		if (!("geolocation" in navigator)) return;

		const watchId = navigator.geolocation.watchPosition(
			(pos) => {
				setUserLocation({
					lat: pos.coords.latitude,
					lng: pos.coords.longitude,
				});
			},
			() => {
				// Permission denied or error — leave userLocation as null
			},
			{ enableHighAccuracy: true, maximumAge: 10_000, timeout: 15_000 }
		);
		gpsWatchRef.current = watchId;

		return () => {
			navigator.geolocation.clearWatch(watchId);
		};
	}, []);

	// ── Active trip navigation state ───────────────
	const [activeTrip, setActiveTrip] = useState<{
		legs: TripLeg[];
		currentLegIndex: number;
	} | null>(null);

	// Auto-advance leg when user is within 100m of leg endpoint
	useEffect(() => {
		if (!activeTrip || !userLocation) return;
		const leg = activeTrip.legs[activeTrip.currentLegIndex];
		if (!leg?.geometry || leg.geometry.length === 0) return;

		const endPoint = leg.geometry[leg.geometry.length - 1];
		if (!endPoint) return;

		const distKm = haversineKm(userLocation, endPoint);
		const isLastLeg = activeTrip.currentLegIndex >= activeTrip.legs.length - 1;

		if (distKm < 0.1) {
			if (isLastLeg) {
				setActiveTrip(null);
			} else {
				setActiveTrip((prev) =>
					prev ? { ...prev, currentLegIndex: prev.currentLegIndex + 1 } : null
				);
			}
		}
	}, [activeTrip, userLocation]);

	const handleFromSelect = useCallback((loc: LocationSuggestion | null) => {
		setFromMarker(loc ? loc.coords : null);
		if (loc) setFlyTo(loc.coords);
	}, []);

	const handleToSelect = useCallback((loc: LocationSuggestion | null) => {
		setToMarker(loc ? loc.coords : null);
		if (loc) setFlyTo(loc.coords);
	}, []);

	const handleRouteFound = useCallback(
		(route: TripRoute | null) => {
			if (!route) {
				setRoutePoints([]);
				setRouteLegs([]);
				setActiveTrip(null);
				return;
			}

			setRouteLegs(route.legs);

			const allPoints: LatLng[] = [];
			for (const leg of route.legs) {
				if (leg.geometry && leg.geometry.length > 0) {
					const start = allPoints.length > 0 ? 1 : 0;
					for (let i = start; i < leg.geometry.length; i++) {
						const pt = leg.geometry[i];
						if (pt) allPoints.push(pt);
					}
				}
			}

			if (allPoints.length >= 2) {
				setRoutePoints(allPoints);
			} else if (fromMarker && toMarker) {
				setRoutePoints([fromMarker, toMarker]);
			}
		},
		[fromMarker, toMarker]
	);

	const handleStartTrip = useCallback(
		(route: TripRoute) => {
			setActiveTrip({ legs: route.legs, currentLegIndex: 0 });
			if (userLocation) {
				setFlyTo(userLocation);
			} else if (route.legs[0]?.geometry[0]) {
				setFlyTo(route.legs[0].geometry[0]);
			}
		},
		[userLocation]
	);

	const handleCancelTrip = useCallback(() => {
		setActiveTrip(null);
	}, []);

	return (
		<div className="relative h-full w-full overflow-hidden">
			<MapNavBar />
			<WebMap
				activeTrip={activeTrip}
				darkMode={isDark}
				flyTo={flyTo}
				fromMarker={fromMarker}
				routeLegs={routeLegs}
				routePoints={routePoints}
				toMarker={toMarker}
				userLocation={userLocation}
			/>
			<TripDrawer
				activeTrip={activeTrip}
				initialFrom={initialFrom}
				initialTo={initialTo}
				onCancelTrip={handleCancelTrip}
				onFromSelect={handleFromSelect}
				onRouteFound={handleRouteFound}
				onStartTrip={handleStartTrip}
				onToSelect={handleToSelect}
			/>
			<WalkthroughModal />
		</div>
	);
}
