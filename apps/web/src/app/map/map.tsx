"use client";

import WebMap from "@/components/Map";
import TripDrawer from "@/components/TripDrawer";

export default function TransitMap() {
	return (
		<div className="absolute inset-0 overflow-hidden">
			<WebMap />
			<TripDrawer />
		</div>
	);
}
