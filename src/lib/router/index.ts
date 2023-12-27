import mapboxDirections, {
  DirectionsService,
  DirectionsResponse,
} from "@mapbox/mapbox-sdk/services/directions";
import { LineString, MultiLineString } from "@turf/turf";

import { Location } from "director";

export type RouterResponse = DirectionsResponse<LineString | MultiLineString>;
export interface IRouter {
  getRoute: (start: Location, end: Location) => Promise<RouterResponse>;
}

export default class Router implements IRouter {
  directionsService: DirectionsService;

  constructor(mapboxAccessToken: string) {
    this.directionsService = mapboxDirections({
      accessToken: mapboxAccessToken,
    });
  }

  async getRoute(start: Location, end: Location) {
    const config = {
      profile: "cycling" as const,
      steps: true,
      voiceUnits: "metric" as const,
      geometries: "geojson" as const,
      waypoints: [
        {
          name: "Start",
          coordinates: start,
        },
        {
          name: "End",
          coordinates: end,
        },
      ],
    };

    const res = await this.directionsService.getDirections(config).send();
    return res.body;
  }
}

export class MockRouter implements IRouter {
  response: RouterResponse | undefined;

  constructor() {
    this.response = undefined;
  }

  setResponse(response: RouterResponse) {
    this.response = response;
  }

  async getRoute(start: Location, end: Location) {
    if (!this.response) {
      throw new Error("No response set");
    }

    return this.response;
  }
}
