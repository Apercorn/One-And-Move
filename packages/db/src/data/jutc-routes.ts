export type RouteType =
  | "Express Carriage Route (Rural)"
  | "Premium Express Routes"
  | "Regular Route"
  | "Rural Stage Carriage Route";

export interface JutcRouteData {
  depot: string;
  destination: string;
  origin: string;
  route: string;
  scheduleUrl: string;
  type: RouteType;
  via: string;
}

export const JUTC_ROUTES: JutcRouteData[] = [
  {
    route: "610",
    origin: "Ocho Rios",
    destination: "City",
    via: "North-South Highway",
    depot: "Spanish Town",
    type: "Rural Stage Carriage Route",
    scheduleUrl:
      "https://jutc.gov.jm/bus-route-info/timetables/Schedule_610.pdf",
  },
  {
    route: "513",
    origin: "May Pen",
    destination: "City",
    via: "East-West Highway, Six Miles, Three Miles",
    depot: "Spanish Town",
    type: "Rural Stage Carriage Route",
    scheduleUrl:
      "https://jutc.gov.jm/bus-route-info/timetables/Schedule_513.pdf",
  },
  {
    route: "20C",
    origin: "Greater Portmore",
    destination: "City",
    via: "Portmore Toll, Three Miles, Spanish Town Road",
    depot: "Portmore",
    type: "Regular Route",
    scheduleUrl:
      "https://jutc.gov.jm/bus-route-info/timetables/Schedule_20C.pdf",
  },
  {
    route: "3C",
    origin: "Christian Gardens",
    destination: "City",
    via: "Portmore Toll, Three Miles, Spanish Town Road",
    depot: "Portmore",
    type: "Regular Route",
    scheduleUrl:
      "https://jutc.gov.jm/bus-route-info/timetables/Schedule_3C.pdf",
  },
  {
    route: "19",
    origin: "Greater Portmore",
    destination: "Papine/ UWI Back Gate",
    via: "Portmore Toll, HWT",
    depot: "Portmore",
    type: "Regular Route",
    scheduleUrl:
      "https://jutc.gov.jm/bus-route-info/timetables/Schedule_19.pdf",
  },
  {
    route: "13",
    origin: "Greater Portmore",
    destination: "Caribbean Maritime University (CMU)",
    via: "Marcus Garvey Drive, City",
    depot: "Portmore",
    type: "Regular Route",
    scheduleUrl:
      "https://jutc.gov.jm/bus-route-info/timetables/Schedule_13.pdf",
  },
  {
    route: "27",
    origin: "Kitson Town",
    destination: "Spanish Town",
    via: "St. John's Road",
    depot: "Spanish Town",
    type: "Rural Stage Carriage Route",
    scheduleUrl:
      "https://jutc.gov.jm/bus-route-info/timetables/Schedule_27.pdf",
  },
  {
    route: "620Ex",
    origin: "Montego Bay",
    destination: "Half Way Tree",
    via: "North-South Highway",
    depot: "Portmore/ Montego Bay",
    type: "Express Carriage Route (Rural)",
    scheduleUrl:
      "https://jutc.gov.jm/bus-route-info/timetables/Schedule_620Ex.pdf",
  },
  {
    route: "606Ex",
    origin: "Linstead",
    destination: "Downtown",
    via: "North-South Highway, Three Miles",
    depot: "Spanish Town",
    type: "Express Carriage Route (Rural)",
    scheduleUrl:
      "https://jutc.gov.jm/bus-route-info/timetables/Schedule_606Ex.pdf",
  },
  {
    route: "520Ex",
    origin: "Negril",
    destination: "Half Way Tree",
    via: "South Coast",
    depot: "Portmore/ Montego Bay",
    type: "Express Carriage Route (Rural)",
    scheduleUrl:
      "https://jutc.gov.jm/bus-route-info/timetables/Schedule_520Ex.pdf",
  },
  {
    route: "512",
    origin: "Mandeville",
    destination: "Kingston",
    via: "Toll Road",
    depot: "Mandeville",
    type: "Rural Stage Carriage Route",
    scheduleUrl:
      "https://jutc.gov.jm/bus-route-info/timetables/Schedule_512.pdf",
  },
  {
    route: "509",
    origin: "Longville Park",
    destination: "Spanish Town",
    via: "Old Harbour, Gutters, McCooks Pen",
    depot: "Spanish Town",
    type: "Rural Stage Carriage Route",
    scheduleUrl:
      "https://jutc.gov.jm/bus-route-info/timetables/Schedule_509.pdf",
  },
  {
    route: "508",
    origin: "Old Harbour",
    destination: "UWI Front Gate",
    via: "Gutters, McCooks Pen, Spanish Town, Half Way Tree",
    depot: "Spanish Town",
    type: "Rural Stage Carriage Route",
    scheduleUrl:
      "https://jutc.gov.jm/bus-route-info/timetables/Schedule_508.pdf",
  },
  {
    route: "605",
    origin: "Linstead",
    destination: "Spanish Town",
    via: "Bog Walk, Angels",
    depot: "Spanish Town",
    type: "Rural Stage Carriage Route",
    scheduleUrl:
      "https://jutc.gov.jm/bus-route-info/timetables/Schedule_605.pdf",
  },
  {
    route: "504",
    origin: "Chapelton",
    destination: "May Pen",
    via: "Turners, New Longsville",
    depot: "Spanish Town",
    type: "Rural Stage Carriage Route",
    scheduleUrl:
      "https://jutc.gov.jm/bus-route-info/timetables/Schedule_504.pdf",
  },
  {
    route: "52B",
    origin: "Grande Hole",
    destination: "Half Way Tree",
    via: "Castleton, Toms River, Temple Hall, Golden Spring, Stony Hill",
    depot: "Rockfort",
    type: "Rural Stage Carriage Route",
    scheduleUrl:
      "https://jutc.gov.jm/bus-route-info/timetables/Schedule_52B.pdf",
  },
  {
    route: "9",
    origin: "Naggo Head",
    destination: "Spanish Town",
    via: "Braeton Parkway, Braeton Road, Salt Pond Road",
    depot: "Portmore",
    type: "Regular Route",
    scheduleUrl: "https://jutc.gov.jm/bus-route-info/timetables/Schedule_9.pdf",
  },
  {
    route: "501",
    origin: "Old Harbour",
    destination: "Denbigh/May Pen",
    via: "Free Town, Bustamante Highway",
    depot: "Spanish Town",
    type: "Rural Stage Carriage Route",
    scheduleUrl:
      "https://jutc.gov.jm/bus-route-info/timetables/Schedule_501.pdf",
  },
  {
    route: "502",
    origin: "Lionel Town",
    destination: "Denbigh/May Pen",
    via: "Vere, Hayes, Mineral Heights",
    depot: "Spanish Town",
    type: "Rural Stage Carriage Route",
    scheduleUrl:
      "https://jutc.gov.jm/bus-route-info/timetables/Schedule_502.pdf",
  },
  {
    route: "511",
    origin: "May Pen",
    destination: "Spanish Town",
    via: "East-West Highway",
    depot: "Spanish Town",
    type: "Rural Stage Carriage Route",
    scheduleUrl:
      "https://jutc.gov.jm/bus-route-info/timetables/Schedule_511.pdf",
  },
  {
    route: "510",
    origin: "Old Harbour",
    destination: "Spanish Town",
    via: "Church Pen, Gutters, McCooks Pen, Old Harbour Road",
    depot: "Spanish Town",
    type: "Rural Stage Carriage Route",
    scheduleUrl:
      "https://jutc.gov.jm/bus-route-info/timetables/Schedule_510.pdf",
  },
  {
    route: "702",
    origin: "Morant Bay",
    destination: "City",
    via: "White Horses, Pamphret, Yallahs, Albion, Bull Bay",
    depot: "Rockfort",
    type: "Rural Stage Carriage Route",
    scheduleUrl:
      "https://jutc.gov.jm/bus-route-info/timetables/Schedule_702.pdf",
  },
  {
    route: "311",
    origin: "Catherine Estates",
    destination: "Cross Roads",
    via: "Braeton Road, Portmore Toll Road, Half Way Tree, Knutsford Boulevard",
    depot: "Portmore",
    type: "Premium Express Routes",
    scheduleUrl:
      "https://jutc.gov.jm/bus-route-info/timetables/PREMIUM_SCHEDULE.pdf",
  }
] as const;

/** Quick lookup: route number → route data */
export const JUTC_ROUTE_MAP = new Map(JUTC_ROUTES.map((r) => [r.route, r]));

/** Just the route numbers, useful for dropdowns */
export const JUTC_ROUTE_NUMBERS = JUTC_ROUTES.map((r) => r.route);
