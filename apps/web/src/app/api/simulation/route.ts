import type { SimulatedUser, SimulatedVehicle } from "@/lib/simulation";
import {
  createSimulatedUser,
  createSimulatedVehicles,
  DEFAULT_CONFIG,
  resolveRoadPaths,
  tickUser,
  tickVehicles,
} from "@/lib/simulation";

/* ─── Singleton simulation state ────────────────── */

let vehicles: SimulatedVehicle[] | null = null;
let simUser: SimulatedUser | null = null;
let lastTick = Date.now();
let roadsResolved = false;

function ensureInitialised(): void {
  if (vehicles === null) {
    vehicles = createSimulatedVehicles();
    simUser = createSimulatedUser();
    lastTick = Date.now();
  }
}

function tick(): void {
  if (!vehicles || !simUser) return;
  const now = Date.now();
  const delta = (now - lastTick) / 1000;
  lastTick = now;
  vehicles = tickVehicles(vehicles, DEFAULT_CONFIG, delta);
  simUser = tickUser(simUser, DEFAULT_CONFIG, delta);
}

/** One-time road-snapping (fire-and-forget) */
async function resolveOnce(): Promise<void> {
  if (roadsResolved || !vehicles) return;
  roadsResolved = true;
  try {
    vehicles = await resolveRoadPaths(vehicles);
  } catch {
    // fall back to straight lines silently
  }
}

/* ─── Wire format (compact) ─────────────────────── */

interface VehicleSnapshot {
  avgCost: string;
  capacity: number;
  heading: number;
  id: string;
  lat: number;
  lng: number;
  name: string;
  route: string;
  type: "jutc" | "robot_taxi";
}

interface UserSnapshot {
  enabled: boolean;
  lat: number;
  lng: number;
}

interface SimFrame {
  ts: number;
  user: UserSnapshot;
  vehicles: VehicleSnapshot[];
}

function buildFrame(): SimFrame {
  return {
    ts: Date.now(),
    vehicles: (vehicles ?? []).map((v) => ({
      id: v.id,
      type: v.type,
      lat: v.lat,
      lng: v.lng,
      heading: v.heading,
      name: v.name,
      route: v.route,
      capacity: v.capacity,
      avgCost: v.avgCost,
    })),
    user: {
      lat: simUser?.lat ?? 0,
      lng: simUser?.lng ?? 0,
      enabled: simUser?.enabled ?? false,
    },
  };
}

/* ─── SSE endpoint ──────────────────────────────── */

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  ensureInitialised();
  // Kick off road-snapping in background
  resolveOnce();

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Tick + push every second
      const id = setInterval(() => {
        try {
          tick();
          const frame = buildFrame();
          const data = `data: ${JSON.stringify(frame)}\n\n`;
          controller.enqueue(encoder.encode(data));
        } catch {
          clearInterval(id);
          controller.close();
        }
      }, 1000);

      // Send first frame immediately
      tick();
      const first = `data: ${JSON.stringify(buildFrame())}\n\n`;
      controller.enqueue(encoder.encode(first));

      // Clean up when the client disconnects
      // The stream's cancel() is called automatically when the reader drops
    },
    cancel() {
      // Client disconnected — nothing to clean up since the interval
      // will error on the next enqueue and clear itself
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
