import * as turf from '@turf/turf';
import { Location } from '../director';

export function generateEquallySpacedPointsAlongLine(ls: turf.LineString, numPoints: number) {
  const lineString = turf.lineString(ls.coordinates);
  const lineLength = turf.length(lineString, { units: 'kilometers' });
  const interval = lineLength / (numPoints - 1);

  const equallySpacedPoints: turf.Position[] = [];
  for (let i = 0; i < numPoints - 1; i++) {
    const distance = i * interval;
    const point = turf.along(lineString, distance, { units: 'kilometers' });
    equallySpacedPoints.push(point.geometry.coordinates);
  }

  // Add the last point in the LineString to ensure 
  // we reach the destination.
  equallySpacedPoints.push(lineString.geometry.coordinates[lineString.geometry.coordinates.length - 1]);

  return equallySpacedPoints as Location[];
}

export function isDev() {
  return process.env.IS_DEV === "1"
}
