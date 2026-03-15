"use client";

import { useEffect, useRef, useState } from "react";

/* ─── Wire types (must match api/simulation/route.ts) ── */

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

/* ─── Interpolated vehicle (what the map renders) ── */

export interface InterpolatedVehicle {
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

export interface InterpolatedUser {
  enabled: boolean;
  lat: number;
  lng: number;
}

/* ─── Lerp helpers ──────────────────────────────── */

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Shortest-arc lerp for headings (0-360) */
function lerpAngle(a: number, b: number, t: number): number {
  let diff = ((b - a + 540) % 360) - 180;
  return (a + diff * t + 360) % 360;
}

/* ─── Hook ──────────────────────────────────────── */

/**
 * Connects to the SSE simulation endpoint and returns smoothly
 * interpolated vehicle positions (60 fps via requestAnimationFrame).
 *
 * Server sends snapshots every ~1 s. Between snapshots the hook
 * linearly interpolates each vehicle's lat, lng, and heading from
 * the previous snapshot → the latest snapshot, giving buttery movement.
 */
export function useVehicleStream(): {
  vehicles: InterpolatedVehicle[];
  simUser: InterpolatedUser;
  connected: boolean;
} {
  // Latest two server frames (for interpolation)
  const prevFrameRef = useRef<SimFrame | null>(null);
  const currFrameRef = useRef<SimFrame | null>(null);
  const frameReceivedAtRef = useRef<number>(0);

  // Output state — updated at 60 fps
  const [vehicles, setVehicles] = useState<InterpolatedVehicle[]>([]);
  const [simUser, setSimUser] = useState<InterpolatedUser>({
    lat: 0,
    lng: 0,
    enabled: false,
  });
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let rafId: number | null = null;
    let eventSource: EventSource | null = null;

    function connect(): void {
      eventSource = new EventSource("/api/simulation");

      eventSource.onopen = () => {
        if (!cancelled) setConnected(true);
      };

      eventSource.onmessage = (event) => {
        if (cancelled) return;
        try {
          const frame: SimFrame = JSON.parse(event.data);
          // Shift current → previous, set new current
          prevFrameRef.current = currFrameRef.current;
          currFrameRef.current = frame;
          frameReceivedAtRef.current = performance.now();
        } catch {
          // ignore malformed frames
        }
      };

      eventSource.onerror = () => {
        if (cancelled) return;
        setConnected(false);
        // Auto-reconnect is built into EventSource, but we reset state
        eventSource?.close();
        // Retry after 3 s
        setTimeout(() => {
          if (!cancelled) connect();
        }, 3000);
      };
    }

    connect();

    // ── 60 fps interpolation loop ─────────────────
    const SERVER_INTERVAL = 1000; // server sends every 1 s

    function animate(): void {
      if (cancelled) return;

      const prev = prevFrameRef.current;
      const curr = currFrameRef.current;

      if (curr) {
        const elapsed = performance.now() - frameReceivedAtRef.current;
        // t goes from 0 → 1 over SERVER_INTERVAL, clamped
        const t = Math.min(elapsed / SERVER_INTERVAL, 1);

        if (prev && prev.vehicles.length === curr.vehicles.length) {
          // Interpolate between prev and curr frames
          const interpolated: InterpolatedVehicle[] = curr.vehicles.map(
            (cv, i) => {
              const pv = prev.vehicles[i];
              return {
                id: cv.id,
                type: cv.type,
                lat: lerp(pv.lat, cv.lat, t),
                lng: lerp(pv.lng, cv.lng, t),
                heading: lerpAngle(pv.heading, cv.heading, t),
                name: cv.name,
                route: cv.route,
                capacity: cv.capacity,
                avgCost: cv.avgCost,
              };
            }
          );
          setVehicles(interpolated);

          setSimUser({
            lat: lerp(prev.user.lat, curr.user.lat, t),
            lng: lerp(prev.user.lng, curr.user.lng, t),
            enabled: curr.user.enabled,
          });
        } else {
          // No prev frame yet or vehicle count changed — snap to curr
          setVehicles(
            curr.vehicles.map((v) => ({
              id: v.id,
              type: v.type,
              lat: v.lat,
              lng: v.lng,
              heading: v.heading,
              name: v.name,
              route: v.route,
              capacity: v.capacity,
              avgCost: v.avgCost,
            }))
          );
          setSimUser({
            lat: curr.user.lat,
            lng: curr.user.lng,
            enabled: curr.user.enabled,
          });
        }
      }

      rafId = requestAnimationFrame(animate);
    }

    rafId = requestAnimationFrame(animate);

    return () => {
      cancelled = true;
      eventSource?.close();
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, []);

  return { vehicles, simUser, connected };
}
