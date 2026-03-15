/**
 * Transit graph — in-memory weighted graph of the Jamaican public
 * transit network.
 *
 * Nodes = bus stops + taxi stands.
 * Edges = bus connections (shared routeIds), taxi connections
 *         (POPULAR_TAXI_ROUTES), walking transfers (≤ 500 m).
 *
 * Built once as a module-level singleton — no DB queries required.
 */

import { BUS_STOPS } from "@One-and-Move/db/data/bus-stops";
import { TAXI_STAND_MAP, TAXI_STANDS } from "@One-and-Move/db/data/taxi-stands";
import { haversineKm, type LatLng } from "./osrm";

/* ── Edge & node types ──────────────────────────── */

export type TransitMode = "walk" | "jutc" | "taxi";

export interface GraphNode {
  id: string;
  /** "bus" or "taxi" — determines which icon / label to use */
  kind: "bus" | "taxi";
  lat: number;
  lng: number;
  name: string;
}

export interface GraphEdge {
  /** One-way fare in JMD (0 for walk legs) */
  costJmd: number;
  /** Distance in km */
  distanceKm: number;
  /** Estimated travel time in minutes */
  durationMinutes: number;
  from: string;
  /** Human label, e.g. "JUTC 20C" or "Route Taxi" */
  label: string;
  mode: TransitMode;
  to: string;
}

export interface TransitGraph {
  /** adjacency list — key = source nodeId */
  edges: Map<string, GraphEdge[]>;
  nodes: Map<string, GraphNode>;
}

/* ── Constants ──────────────────────────────────── */

const WALK_TRANSFER_RADIUS_KM = 0.8;
const WALK_SPEED_KMH = 5;
const BUS_AVG_SPEED_KMH = 22;
const TAXI_AVG_SPEED_KMH = 30;
const JUTC_FLAT_FARE_JMD = 180;

/** Popular taxi routes with coordinates via stand IDs */
const POPULAR_TAXI_ROUTES: ReadonlyArray<{
  fromStandId: string;
  toStandId: string;
  label: string;
  fare: number;
}> = [
  {
    fromStandId: "half-way-tree",
    toStandId: "papine",
    label: "HWT → Papine",
    fare: 200,
  },
  {
    fromStandId: "cross-roads",
    toStandId: "downtown-kingston",
    label: "Cross Roads → Downtown",
    fare: 200,
  },
  {
    fromStandId: "liguanea",
    toStandId: "half-way-tree",
    label: "Liguanea → HWT",
    fare: 200,
  },
  {
    fromStandId: "constant-spring",
    toStandId: "cross-roads",
    label: "Constant Spring → Cross Roads",
    fare: 220,
  },
  {
    fromStandId: "barbican",
    toStandId: "papine",
    label: "Barbican → Papine",
    fare: 200,
  },
  {
    fromStandId: "downtown-kingston",
    toStandId: "half-way-tree",
    label: "Downtown → HWT",
    fare: 200,
  },
  {
    fromStandId: "portmore",
    toStandId: "half-way-tree",
    label: "Portmore → HWT",
    fare: 350,
  },
  {
    fromStandId: "greater-portmore",
    toStandId: "downtown-kingston",
    label: "Greater Portmore → Downtown",
    fare: 400,
  },
  {
    fromStandId: "naggo-head",
    toStandId: "spanish-town",
    label: "Naggo Head → Spanish Town",
    fare: 300,
  },
  {
    fromStandId: "waterford",
    toStandId: "portmore",
    label: "Waterford → Portmore",
    fare: 200,
  },
  {
    fromStandId: "spanish-town",
    toStandId: "half-way-tree",
    label: "Spanish Town → HWT",
    fare: 400,
  },
  {
    fromStandId: "old-harbour",
    toStandId: "spanish-town",
    label: "Old Harbour → Spanish Town",
    fare: 350,
  },
  {
    fromStandId: "ochorios",
    toStandId: "moneague",
    label: "Ocho Rios → Moneague",
    fare: 350,
  },
  {
    fromStandId: "ochorios",
    toStandId: "stanns-bay",
    label: "Ocho Rios → St Ann's Bay",
    fare: 250,
  },
  {
    fromStandId: "runaway-bay",
    toStandId: "ochorios",
    label: "Runaway Bay → Ocho Rios",
    fare: 300,
  },
  {
    fromStandId: "port-maria",
    toStandId: "annotto-bay",
    label: "Port Maria → Annotto Bay",
    fare: 250,
  },
  {
    fromStandId: "montego-bay",
    toStandId: "falmouth",
    label: "Montego Bay → Falmouth",
    fare: 400,
  },
  {
    fromStandId: "montego-bay",
    toStandId: "anchovy",
    label: "Montego Bay → Anchovy",
    fare: 250,
  },
  {
    fromStandId: "cambridge",
    toStandId: "montego-bay",
    label: "Cambridge → Montego Bay",
    fare: 550,
  },
] as const;

/* ── Graph builder ──────────────────────────────── */

function buildGraph(): TransitGraph {
  const nodes = new Map<string, GraphNode>();
  const edges = new Map<string, GraphEdge[]>();

  const addNode = (
    id: string,
    name: string,
    lat: number,
    lng: number,
    kind: "bus" | "taxi"
  ) => {
    nodes.set(id, { id, name, lat, lng, kind });
    if (!edges.has(id)) edges.set(id, []);
  };

  const addEdge = (edge: GraphEdge) => {
    const list = edges.get(edge.from);
    if (list) list.push(edge);
  };

  // 1. Add all bus stops as nodes
  for (const stop of BUS_STOPS) {
    addNode(`bus:${stop.id}`, stop.name, stop.lat, stop.lng, "bus");
  }

  // 2. Add all taxi stands as nodes
  for (const stand of TAXI_STANDS) {
    addNode(`taxi:${stand.id}`, stand.name, stand.lat, stand.lng, "taxi");
  }

  // 3. Bus edges: connect stops that share a routeId
  //    For each route, sort stops by latitude and connect sequentially
  const routeToStops = new Map<string, typeof BUS_STOPS>();
  for (const stop of BUS_STOPS) {
    for (const routeId of stop.routeIds) {
      const existing = routeToStops.get(routeId);
      if (existing) {
        existing.push(stop);
      } else {
        routeToStops.set(routeId, [stop]);
      }
    }
  }

  for (const [routeId, stops] of routeToStops) {
    if (stops.length < 2) continue;
    // Sort by latitude to approximate route order
    const sorted = [...stops].sort((a, b) => a.lat - b.lat);

    for (let i = 0; i < sorted.length - 1; i++) {
      const a = sorted[i] as (typeof sorted)[0];
      const b = sorted[i + 1] as (typeof sorted)[0];
      const distKm = haversineKm(a, b);
      const durationMin = (distKm / BUS_AVG_SPEED_KMH) * 60;

      // Bidirectional
      addEdge({
        from: `bus:${a.id}`,
        to: `bus:${b.id}`,
        mode: "jutc",
        durationMinutes: Math.max(1, Math.round(durationMin)),
        costJmd: JUTC_FLAT_FARE_JMD,
        label: `JUTC ${routeId}`,
        distanceKm: distKm,
      });
      addEdge({
        from: `bus:${b.id}`,
        to: `bus:${a.id}`,
        mode: "jutc",
        durationMinutes: Math.max(1, Math.round(durationMin)),
        costJmd: JUTC_FLAT_FARE_JMD,
        label: `JUTC ${routeId}`,
        distanceKm: distKm,
      });
    }
  }

  // 4. Taxi edges from POPULAR_TAXI_ROUTES (bidirectional)
  for (const taxiRoute of POPULAR_TAXI_ROUTES) {
    const from = TAXI_STAND_MAP.get(taxiRoute.fromStandId);
    const to = TAXI_STAND_MAP.get(taxiRoute.toStandId);
    if (!from || !to) continue;

    const distKm = haversineKm(from, to);
    const durationMin = (distKm / TAXI_AVG_SPEED_KMH) * 60;

    addEdge({
      from: `taxi:${from.id}`,
      to: `taxi:${to.id}`,
      mode: "taxi",
      durationMinutes: Math.max(1, Math.round(durationMin)),
      costJmd: taxiRoute.fare,
      label: `Route Taxi`,
      distanceKm: distKm,
    });
    addEdge({
      from: `taxi:${to.id}`,
      to: `taxi:${from.id}`,
      mode: "taxi",
      durationMinutes: Math.max(1, Math.round(durationMin)),
      costJmd: taxiRoute.fare,
      label: `Route Taxi`,
      distanceKm: distKm,
    });
  }

  // 5. Walking transfer edges between any stops/stands within 500m
  const allNodeList = [...nodes.values()];
  for (let i = 0; i < allNodeList.length; i++) {
    const a = allNodeList[i] as GraphNode;
    for (let j = i + 1; j < allNodeList.length; j++) {
      const b = allNodeList[j] as GraphNode;

      // Skip edges between same-type nodes that already have transit edges
      const distKm = haversineKm(a, b);
      if (distKm > WALK_TRANSFER_RADIUS_KM) continue;

      const walkMinutes = ((distKm * 1.4) / WALK_SPEED_KMH) * 60;

      addEdge({
        from: a.id,
        to: b.id,
        mode: "walk",
        durationMinutes: Math.max(1, Math.round(walkMinutes)),
        costJmd: 0,
        label: "Walk",
        distanceKm: distKm * 1.4,
      });
      addEdge({
        from: b.id,
        to: a.id,
        mode: "walk",
        durationMinutes: Math.max(1, Math.round(walkMinutes)),
        costJmd: 0,
        label: "Walk",
        distanceKm: distKm * 1.4,
      });
    }
  }

  return { nodes, edges };
}

/* ── Singleton ──────────────────────────────────── */

let _graph: TransitGraph | null = null;

export function getTransitGraph(): TransitGraph {
  if (!_graph) {
    _graph = buildGraph();
  }
  return _graph;
}

/**
 * Find the nearest graph nodes (bus stops + taxi stands) within a
 * radius of the given point. Returns nodeIds sorted by distance.
 */
export function findNearbyNodes(
  point: LatLng,
  maxDistanceKm = 2
): Array<{ nodeId: string; distKm: number }> {
  const graph = getTransitGraph();
  const results: Array<{ nodeId: string; distKm: number }> = [];

  for (const node of graph.nodes.values()) {
    const dist = haversineKm(point, node);
    if (dist <= maxDistanceKm) {
      results.push({ nodeId: node.id, distKm: dist });
    }
  }

  results.sort((a, b) => a.distKm - b.distKm);
  return results;
}
