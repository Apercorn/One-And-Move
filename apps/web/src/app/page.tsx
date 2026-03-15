"use client";

import { ArrowRight, Bus, Car, Clock, Map as MapIcon } from "lucide-react";
import Link from "next/link";
import Navigation from "@/components/navigation";

export default function Home() {
	return (
		<div className="flex-1 bg-white pb-20 font-sans text-blue-600 selection:bg-blue-600 selection:text-white">
			{/* Navigation */}
			<Navigation />

			{/* Hero Section */}
			<main className="mx-auto max-w-7xl items-center px-8 pt-16 lg:grid lg:grid-cols-2 lg:gap-16">
				<div>
					<h1 className="mb-6 font-bold text-5xl text-blue-900 leading-tight tracking-tight md:text-6xl">
						Master your commute with precise tracking.
					</h1>
					<p className="mb-10 max-w-lg text-blue-800/80 text-lg leading-relaxed">
						One & Move uses real-time location tracking to detect form exactly
						where JUTC buses and robot taxis are, so you can commute securely
						and safely.
					</p>

					<div className="mb-16 flex flex-wrap items-center gap-4">
						<Link
							className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-bold text-white shadow-lg transition-colors hover:bg-blue-700"
							href="/map"
						>
							<MapIcon size={20} />
							Open Map
						</Link>
						<Link
							className="flex items-center gap-2 rounded-lg px-6 py-3 font-bold text-blue-600 transition-colors hover:bg-blue-50"
							href="#how-it-works"
						>
							How it works
							<ArrowRight size={20} />
						</Link>
					</div>

					<div className="grid max-w-lg grid-cols-3 gap-8 border-blue-600/30 border-t pt-8">
						<div>
							<div className="mb-1 text-blue-800/80 text-sm">
								Route Accuracy
							</div>
							<div className="font-bold text-3xl text-blue-900">95%</div>
						</div>
						<div>
							<div className="mb-1 text-blue-800/80 text-sm">
								Active Vehicles
							</div>
							<div className="font-bold text-3xl text-blue-900">120+</div>
						</div>
						<div>
							<div className="mb-1 text-blue-800/80 text-sm">Avg Refresh</div>
							<div className="font-bold text-3xl text-blue-900">1.5s</div>
						</div>
					</div>
				</div>

				{/* Right side Visual (Abstract Map/Nodes) */}
				<div className="hidden h-full items-center justify-center lg:flex">
					<div className="relative flex aspect-square w-full max-w-md items-center justify-center rounded-2xl border border-blue-200 bg-blue-50/50">
						{/* Abstract grid lines */}
						<div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-blue-200" />
						<div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-blue-200" />

						{/* Glowing nodes matching the reference image's visual structure */}
						<div className="absolute top-[20%] left-[30%] h-4 w-4 rounded-full bg-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.6)]" />
						<div className="absolute top-[70%] left-[50%] h-4 w-4 rounded-full bg-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.6)]" />
						<div className="absolute top-[40%] right-[25%] h-4 w-4 rounded-full bg-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.6)]" />

						{/* Connections */}
						<svg
							className="pointer-events-none absolute h-full w-full opacity-40"
							preserveAspectRatio="none"
							viewBox="0 0 100 100"
						>
							<path
								d="M 30 20 L 50 70 L 75 40"
								fill="none"
								stroke="#2563eb"
								strokeDasharray="4 4"
								strokeWidth="2"
							/>
						</svg>

						{/* Icons in center representing vehicles tracked */}
						<div className="z-10 flex flex-col items-center gap-6 text-blue-600">
							<Car className="opacity-90" size={56} />
							<Bus className="opacity-90" size={56} />
						</div>
					</div>
				</div>
			</main>

			{/* Features Section */}
			<section className="mx-auto max-w-7xl px-8 pt-32" id="features">
				<h2 className="mb-4 font-bold text-3xl text-blue-900">Features</h2>
				<p className="mb-12 max-w-3xl border-blue-200 border-b pb-12 text-blue-800/80 text-lg">
					Everything you need to bring an intelligent transit map into your
					hands — without guesswork.
				</p>

				<div className="grid gap-12 md:grid-cols-3">
					<div>
						<div className="mb-4 text-blue-600">
							<MapIcon className="opacity-90" size={24} />
						</div>
						<h3 className="mb-2 font-bold text-blue-900 text-lg">
							Live Map Tracking
						</h3>
						<p className="text-blue-800/80 text-sm leading-relaxed">
							Watch JUTC buses and robot taxis move on a live map, checking
							their availability and proximity in real-time.
						</p>
					</div>
					<div>
						<div className="mb-4 text-blue-600">
							<Clock className="opacity-90" size={24} />
						</div>
						<h3 className="mb-2 font-bold text-blue-900 text-lg">
							Wait Time Estimates
						</h3>
						<p className="text-blue-800/80 text-sm leading-relaxed">
							Eliminate uncertainty with arrival predictions based on actual
							road conditions, speeds, and live geolocation.
						</p>
					</div>
					<div>
						<div className="mb-4 text-blue-600">
							<Car className="opacity-90" size={24} />
						</div>
						<h3 className="mb-2 font-bold text-blue-900 text-lg">
							Vehicle Specifics
						</h3>
						<p className="text-blue-800/80 text-sm leading-relaxed">
							Filter tracking based on your needs—know instantly if your next
							ride is a public bus or an autonomous taxi.
						</p>
					</div>
				</div>
			</section>

			{/* Footer / Explanation Section */}
			<section className="mx-auto max-w-7xl px-8 pt-32" id="how-it-works">
				<div className="rounded-3xl border border-blue-200 bg-blue-50/50 p-8 text-blue-900 shadow-xl md:p-12">
					<h2 className="mb-6 font-black text-3xl text-blue-900 uppercase tracking-tight md:text-5xl">
						HOW One and move helps you find taxies and jutc
					</h2>
					<div className="max-w-4xl space-y-4 border-blue-600 border-l-4 pl-6">
						<p className="font-medium text-blue-800/80 text-lg leading-relaxed md:text-xl">
							One & Move connects directly with JUTC transit networks and robot
							taxi locators to continuously map vehicle fleets onto an
							interactive view.
						</p>
						<p className="font-medium text-blue-800/80 text-lg leading-relaxed md:text-xl">
							With our system, you aren't guessing when your ride will show up.
							You simply open the app, look at your targeted route, and track
							exactly how far away your bus or taxi is. We provide the control
							and transparency you need to master your daily commute.
						</p>
					</div>
				</div>
			</section>
		</div>
	);
}
