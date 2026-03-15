/**
 * Multi-modal route planner for Jamaica's public transit network.
 *
 * Uses Dijkstra's algorithm over the transit graph to find optimal
 * routes from origin to destination, incorporating walking legs to/from
 * stops and OSRM road geometry for transit legs.
 */

import {
  estimateWalk,
  fetchDrivingRoute,
  haversineKm,
  type LatLng,
  type RouteGeometryResult,
} from "./osrm";
import {
  findNearbyNodes,
  type GraphEdge,
  getTransitGraph,
  type TransitMode,
} from "./transit-graph";

/* ── Public types ───────────────────────────────── */

export interface RouteLeg {
  cost: number;
  duration: number; // minutes
  from: string;
  geometry: LatLng[];
  legNumber: number;
  mode: TransitMode;
  to: string;
  vehicleName: string;
}

export interface PlannedRoute {
  destination: string;
  id: string;
  legs: RouteLeg[];
  /** Lower is better */
  score: number;
  tag: string; // "Fastest" | "Cheapest" | "Fewest Transfers"
  totalCost: number;
  totalDuration: number; // minutes
}

/* ── Dijkstra ───────────────────────────────────── */

interface DijkstraState {
  cost: number;
  edge: GraphEdge | null;
  nodeId: string;
  prev: string | null;
  time: number;
}

/**
 * Run Dijkstra from multiple origin nodes (walk-reachable from the user)
 * to find shortest paths to all reachable nodes, then extract paths to
 * nodes near the destination.
 */
function dijkstra(
  originNodeIds: Array<{
    nodeId: string;
    walkMinutes: number;
    walkDistKm: number;
  }>,
  optimise: "time" | "cost"
): Map<string, DijkstraState> {
  const graph = getTransitGraph();
  const best = new Map<string, DijkstraState>();

  // Priority queue (simple array, sorted by weight — sufficient for ~100 nodes)
  const queue: DijkstraState[] = [];

  // Seed with all origin nodes (initial walk from user location)
  for (const { nodeId, walkMinutes } of originNodeIds) {
    const state: DijkstraState = {
      nodeId,
      cost: 0,
      time: walkMinutes,
      prev: null,
      edge: null,
    };
    best.set(nodeId, state);
    queue.push(state);
  }

  queue.sort((a, b) => weight(a, optimise) - weight(b, optimise));

  while (queue.length > 0) {
    const current = queue.shift() as DijkstraState;
    const currentBest = best.get(current.nodeId);

    // Skip if we've already found a better path
    if (
      currentBest &&
      weight(currentBest, optimise) < weight(current, optimise)
    ) {
      continue;
    }

    const neighbours = graph.edges.get(current.nodeId) ?? [];
    for (const edge of neighbours) {
      const newTime = current.time + edge.durationMinutes;
      const newCost = current.cost + edge.costJmd;
      const newState: DijkstraState = {
        nodeId: edge.to,
        cost: newCost,
        time: newTime,
        prev: current.nodeId,
        edge,
      };

      const existing = best.get(edge.to);
      if (
        !existing ||
        weight(newState, optimise) < weight(existing, optimise)
      ) {
        best.set(edge.to, newState);
        queue.push(newState);
        // Re-sort (good enough for small graph)
        queue.sort((a, b) => weight(a, optimise) - weight(b, optimise));
      }
    }
  }

  return best;
}

function weight(s: DijkstraState, optimise: "time" | "cost"): number {
  return optimise === "time" ? s.time : s.cost + s.time * 0.5;
}

/* ── Path reconstruction ────────────────────────── */

function reconstructPath(
  best: Map<string, DijkstraState>,
  targetNodeId: string
): GraphEdge[] {
  const path: GraphEdge[] = [];
  let current = targetNodeId;

  while (true) {
    const state = best.get(current);
    if (!state || !state.prev || !state.edge) break;
    path.unshift(state.edge);
    current = state.prev;
  }

  return path;
}

/**
 * Merge consecutive edges of the same mode into single legs.
 * e.g. two consecutive JUTC edges on the same route become one leg.
 */
function mergeEdgesIntoLegs(edges: GraphEdge[]): Array<{
  from: string;
  to: string;
  mode: TransitMode;
  label: string;
  costJmd: number;
  durationMinutes: number;
  waypoints: LatLng[];
}> {
  if (edges.length === 0) return [];

  const graph = getTransitGraph();
  const merged: Array<{
    from: string;
    to: string;
    mode: TransitMode;
    label: string;
    costJmd: number;
    durationMinutes: number;
    waypoints: LatLng[];
  }> = [];

  let currentLeg = {
    from: edges[0]!.from,
    to: edges[0]!.to,
    mode: edges[0]!.mode,
    label: edges[0]!.label,
    costJmd: edges[0]!.costJmd,
    durationMinutes: edges[0]!.durationMinutes,
    waypoints: [] as LatLng[],
  };

  // Collect waypoints for the first edge
  const fromNode = graph.nodes.get(edges[0]!.from);
  const toNode = graph.nodes.get(edges[0]!.to);
  if (fromNode)
    currentLeg.waypoints.push({ lat: fromNode.lat, lng: fromNode.lng });
  if (toNode) currentLeg.waypoints.push({ lat: toNode.lat, lng: toNode.lng });

  for (let i = 1; i < edges.length; i++) {
    const edge = edges[i] as GraphEdge;
    const sameMode = edge.mode === currentLeg.mode;
    const sameLabel = edge.label === currentLeg.label;

    if (sameMode && sameLabel && edge.mode !== "walk") {
      // Extend current leg
      currentLeg.to = edge.to;
      currentLeg.durationMinutes += edge.durationMinutes;
      // Only count fare once per transit leg (flat fare for JUTC)
      if (edge.mode === "taxi") {
        currentLeg.costJmd += edge.costJmd;
      }
      const nextNode = graph.nodes.get(edge.to);
      if (nextNode)
        currentLeg.waypoints.push({ lat: nextNode.lat, lng: nextNode.lng });
    } else {
      // Push current leg and start new one
      merged.push(currentLeg);
      currentLeg = {
        from: edge.from,
        to: edge.to,
        mode: edge.mode,
        label: edge.label,
        costJmd: edge.costJmd,
        durationMinutes: edge.durationMinutes,
        waypoints: [],
      };
      const fNode = graph.nodes.get(edge.from);
      const tNode = graph.nodes.get(edge.to);
      if (fNode) currentLeg.waypoints.push({ lat: fNode.lat, lng: fNode.lng });
      if (tNode) currentLeg.waypoints.push({ lat: tNode.lat, lng: tNode.lng });
    }
  }

  merged.push(currentLeg);
  return merged;
}

/* ── OSRM geometry resolution ───────────────────── */

async function resolveGeometry(
  waypoints: LatLng[],
  mode: TransitMode
): Promise<RouteGeometryResult> {
  if (mode === "walk") {
    // Road-snapped walk via OSRM driving profile with walking speed
    if (waypoints.length >= 2) {
      return estimateWalk(
        waypoints[0] as LatLng,
        waypoints[waypoints.length - 1] as LatLng
      );
    }
    return { geometry: waypoints, distanceMetres: 0, durationSeconds: 0 };
  }

  // For bus/taxi legs, use OSRM driving
  return fetchDrivingRoute(waypoints);
}

/* ── Main planner entry point ───────────────────── */

const WALK_SPEED_KMH = 5;
const MAX_NEARBY_NODES = 15;
const MAX_WALK_TO_STOP_KM = 3;

export async function planRoutes(
  origin: LatLng,
  destination: LatLng
): Promise<PlannedRoute[]> {
  const graph = getTransitGraph();

  // 1. Find stops/stands near origin and destination
  const nearOrigin = findNearbyNodes(origin, MAX_WALK_TO_STOP_KM).slice(
    0,
    MAX_NEARBY_NODES
  );
  const nearDest = findNearbyNodes(destination, MAX_WALK_TO_STOP_KM).slice(
    0,
    MAX_NEARBY_NODES
  );

  if (nearOrigin.length === 0 || nearDest.length === 0) {
    // No transit available — return a walk-only route
    const walk = await estimateWalk(origin, destination);
    return [
      {
        id: "walk-only",
        destination: "Destination",
        legs: [
          {
            legNumber: 1,
            from: "Your location",
            to: "Destination",
            mode: "walk",
            vehicleName: "Walking",
            cost: 0,
            duration: Math.round(walk.durationSeconds / 60),
            geometry: walk.geometry,
          },
        ],
        totalCost: 0,
        totalDuration: Math.round(walk.durationSeconds / 60),
        score: walk.durationSeconds / 60,
        tag: "Walk Only",
      },
    ];
  }

  // 2. Prepare origin seeds with walk time (road-factor 1.4× haversine)
  const originSeeds = nearOrigin.map(({ nodeId, distKm }) => {
    const roadDistKm = distKm * 1.4;
    const walkMinutes = Math.max(
      1,
      Math.round((roadDistKm / WALK_SPEED_KMH) * 60)
    );
    return { nodeId, walkMinutes, walkDistKm: roadDistKm };
  });

  // Also prepare destination seeds for the reverse-scoring below
  const destSeeds = nearDest.map(({ nodeId, distKm }) => {
    const roadDistKm = distKm * 1.4;
    const walkMinutes = Math.max(
      1,
      Math.round((roadDistKm / WALK_SPEED_KMH) * 60)
    );
    return { nodeId, walkMinutes };
  });
  const destWalkMap = new Map(destSeeds.map((s) => [s.nodeId, s.walkMinutes]));

  // 3. Run Dijkstra with two strategies
  const destNodeIds = new Set(nearDest.map((n) => n.nodeId));
  const strategies: Array<{ key: "time" | "cost"; tag: string }> = [
    { key: "time", tag: "Fastest" },
    { key: "cost", tag: "Cheapest" },
  ];

  const candidates: PlannedRoute[] = [];

  for (const strategy of strategies) {
    const best = dijkstra(originSeeds, strategy.key);

    // Find best destination node, including walk time from stop to destination
    let bestDestNode: string | null = null;
    let bestWeight = Number.POSITIVE_INFINITY;

    for (const destNodeId of destNodeIds) {
      const state = best.get(destNodeId);
      if (!state) continue;
      // Add the final walk-to-destination time so nearby stops are preferred
      const finalWalkMin = destWalkMap.get(destNodeId) ?? 0;
      const adjustedState = { ...state, time: state.time + finalWalkMin };
      const w = weight(adjustedState, strategy.key);
      if (w < bestWeight) {
        bestWeight = w;
        bestDestNode = destNodeId;
      }
    }

    if (!bestDestNode) continue;

    const edges = reconstructPath(best, bestDestNode);
    if (edges.length === 0) continue;

    const mergedLegs = mergeEdgesIntoLegs(edges);

    // 4. Build walk leg from origin to first stop
    const firstNode = graph.nodes.get(mergedLegs[0]!.from);
    const lastNode = graph.nodes.get(mergedLegs[mergedLegs.length - 1]!.to);

    const legs: RouteLeg[] = [];
    let legNum = 1;

    // Walk from origin to first stop
    if (firstNode) {
      const walkDist = haversineKm(origin, firstNode);
      if (walkDist > 0.05) {
        const walkResult = await estimateWalk(origin, firstNode);
        legs.push({
          legNumber: legNum++,
          from: "Your location",
          to: firstNode.name,
          mode: "walk",
          vehicleName: "Walking",
          cost: 0,
          duration: Math.max(1, Math.round(walkResult.durationSeconds / 60)),
          geometry: walkResult.geometry,
        });
      }
    }

    // Transit legs with OSRM geometry
    const geometryPromises = mergedLegs.map((leg) =>
      resolveGeometry(leg.waypoints, leg.mode)
    );
    const geometries = await Promise.all(geometryPromises);

    for (let i = 0; i < mergedLegs.length; i++) {
      const leg = mergedLegs[i]!;
      const geo = geometries[i]!;
      const fromNode = graph.nodes.get(leg.from);
      const toNode = graph.nodes.get(leg.to);

      legs.push({
        legNumber: legNum++,
        from: fromNode?.name ?? leg.from,
        to: toNode?.name ?? leg.to,
        mode: leg.mode,
        vehicleName:
          leg.mode === "jutc"
            ? leg.label
            : leg.mode === "taxi"
              ? "Route Taxi"
              : "Walking",
        cost: leg.costJmd,
        duration: Math.max(1, leg.durationMinutes),
        geometry: geo.geometry,
      });
    }

    // Walk from last stop to destination
    if (lastNode) {
      const walkDist = haversineKm(lastNode, destination);
      if (walkDist > 0.05) {
        const walkResult = await estimateWalk(lastNode, destination);
        legs.push({
          legNumber: legNum++,
          from: lastNode.name,
          to: "Destination",
          mode: "walk",
          vehicleName: "Walking",
          cost: 0,
          duration: Math.max(1, Math.round(walkResult.durationSeconds / 60)),
          geometry: walkResult.geometry,
        });
      }
    }

    const totalCost = legs.reduce((sum, l) => sum + l.cost, 0);
    const totalDuration = legs.reduce((sum, l) => sum + l.duration, 0);
    const transferCount = legs.filter((l) => l.mode !== "walk").length;

    // Score: weighted combination of time, cost, and transfers
    const score =
      strategy.key === "time"
        ? totalDuration + transferCount * 5
        : totalCost * 0.01 + totalDuration * 0.5 + transferCount * 3;

    candidates.push({
      id: `route-${strategy.tag.toLowerCase()}`,
      destination: lastNode?.name ?? "Destination",
      legs,
      totalCost,
      totalDuration,
      score,
      tag: strategy.tag,
    });
  }

  // Deduplicate — if both strategies found the same path, keep one and relabel
  const unique = deduplicateRoutes(candidates);

  // Sort by score (lower is better)
  unique.sort((a, b) => a.score - b.score);

  // Tag the best as "Best Route"
  if (unique.length > 0) {
    (unique[0] as PlannedRoute).tag = "Best Route";
  }

  return unique.slice(0, 3);
}

function deduplicateRoutes(routes: PlannedRoute[]): PlannedRoute[] {
  const seen = new Set<string>();
  const unique: PlannedRoute[] = [];

  for (const route of routes) {
    const key = route.legs.map((l) => `${l.from}→${l.to}:${l.mode}`).join("|");
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(route);
  }

  return unique;
}
