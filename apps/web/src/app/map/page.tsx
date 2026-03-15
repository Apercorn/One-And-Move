import { auth } from "@One-and-Move/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import TransitMap from "./map";

export default async function MapPage() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user) {
		redirect("/login");
	}

	return (
		<div className="relative h-[100svh] w-full bg-zinc-100">
			<TransitMap />
		</div>
	);
}
