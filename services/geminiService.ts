import type { Waypoint, WaypointWithCoords, BorderLocation } from '../types';

// Helper to add a delay between requests to avoid overwhelming the public API
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const getCoordinatesForLocations = async (locations: string[]): Promise<(Waypoint & { lat?: number; lng?: number; })[]> => {
    const results: (Waypoint & { lat?: number; lng?: number; })[] = [];

    // Process locations sequentially with a delay to respect API usage policies
    for (let i = 0; i < locations.length; i++) {
        const locName = locations[i];
        try {
            // Using OpenStreetMap's free Nominatim API for geocoding
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(locName)}&limit=1`);
            if (!response.ok) {
                console.error(`Nominatim API returned status ${response.status} for ${locName}`);
                throw new Error(`Network response was not ok for ${locName}`);
            }
            const data = await response.json();

            if (data && data.length > 0) {
                const { lat, lon } = data[0];
                results.push({
                    id: (i + 1).toString(),
                    name: locName,
                    lat: parseFloat(lat),
                    lng: parseFloat(lon), // Nominatim uses 'lon', converting to 'lng'
                });
            } else {
                // Location not found
                results.push({
                    id: (i + 1).toString(),
                    name: locName,
                    lat: undefined,
                    lng: undefined,
                });
            }
        } catch (error) {
            console.error(`Error fetching coordinates for ${locName}:`, error);
            // Push with undefined coords on error to not block the whole process
            results.push({
                id: (i + 1).toString(),
                name: locName,
                lat: undefined,
                lng: undefined,
            });
        }
        // Nominatim usage policy: max 1 request per second. Add a delay.
        if (i < locations.length - 1) {
            await delay(1000);
        }
    }
    return results;
};

export const getBorderForLocation = async (location: BorderLocation): Promise<{ waypoints: WaypointWithCoords[]; bounds: [number, number, number, number]; center: [number, number] }> => {
    try {
        const locationName = location.name;
        let searchUrl: string;

        if (location.type === 'postal') {
            // Use the 'postalcode' parameter for more accurate postal code searches.
            // We limit to 1 as postal code searches should be specific.
            searchUrl = `https://nominatim.openstreetmap.org/search?format=jsonv2&postalcode=${encodeURIComponent(locationName)}&polygon_geojson=1&limit=1`;
        } else {
            // Use the standard free-form query 'q' for names.
            // Fetch up to 5 results to increase chances of finding one with a boundary polygon.
            searchUrl = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(locationName)}&polygon_geojson=1&limit=5`;
        }
        
        const response = await fetch(searchUrl);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();

        if (!data || data.length === 0) {
            throw new Error(`Could not find any location matching "${locationName}".`);
        }
        
        // Find the first result that has a Polygon or MultiPolygon. This is more robust.
        const locationWithPolygon = data.find((loc: any) =>
            loc.geojson && (loc.geojson.type === 'Polygon' || loc.geojson.type === 'MultiPolygon')
        );

        if (!locationWithPolygon) {
             if (location.type === 'postal') {
                throw new Error(`Could not find a border for postal code "${locationName}". The postal code may be invalid or not have a defined boundary in OpenStreetMap.`);
            }
            throw new Error(`Could not find a border for "${locationName}". Please try a more specific query (e.g., "Dhaka Division, Bangladesh") as the location might not have a defined boundary in OpenStreetMap.`);
        }
        
        // Bounding box from nominatim is [south, north, west, east] as strings.
        const bounds: [number, number, number, number] = locationWithPolygon.boundingbox.map((s: string) => parseFloat(s));
        const center: [number, number] = [parseFloat(locationWithPolygon.lat), parseFloat(locationWithPolygon.lon)];

        const geojson = locationWithPolygon.geojson;
        let polygon: [number, number][] = [];

        if (geojson.type === 'Polygon') {
            // Use the first (outer) ring of coordinates
            polygon = geojson.coordinates[0];
        } else if (geojson.type === 'MultiPolygon') {
            // Find the largest polygon in the multipolygon (most vertices) to represent the main area
            let largestPolygon: [number, number][] = [];
            for (const poly of geojson.coordinates) {
                const currentPolygon = poly[0]; // Get outer ring
                if (currentPolygon.length > largestPolygon.length) {
                    largestPolygon = currentPolygon;
                }
            }
            polygon = largestPolygon;
        }

        if (polygon.length < 4) {
            throw new Error(`Could not generate a valid border for "${locationName}". The found boundary data was incomplete.`);
        }
        
        // Nominatim returns [lng, lat], Leaflet needs [lat, lng].
        // Map to WaypointWithCoords format.
        const waypoints = polygon.map((coord, index) => ({
            id: `border-pt-${index}`,
            name: `Border Point ${index + 1}`,
            lat: coord[1],
            lng: coord[0],
        }));

        // Ensure the polygon is a closed loop for a seamless animation
        if (waypoints.length > 0) {
            const firstPoint = waypoints[0];
            const lastPoint = waypoints[waypoints.length-1];
            if (firstPoint.lat !== lastPoint.lat || firstPoint.lng !== lastPoint.lng) {
                 waypoints.push(JSON.parse(JSON.stringify(firstPoint)));
            }
        }

        return { waypoints, bounds, center };

    } catch (error) {
        console.error(`Error fetching border for ${location.name}:`, error);
        if (error instanceof Error) {
            // Re-throw specific, user-friendly errors
            throw error;
        }
        throw new Error(`Failed to get border from map service for "${location.name}".`);
    }
};

/**
 * Fetches the road route for a single segment (between two waypoints).
 * Falls back to a direct straight line if a route cannot be found.
 */
const fetchRouteSegment = async (startPoint: WaypointWithCoords, endPoint: WaypointWithCoords, segmentIndex: number): Promise<WaypointWithCoords[]> => {
    const coordinates = `${startPoint.lng},${startPoint.lat};${endPoint.lng},${endPoint.lat}`;
    const url = `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`OSRM API error for route from "${startPoint.name}" to "${endPoint.name}". Status: ${response.status}. Using a direct path as fallback. Details: ${errorText}`);
        return [startPoint, endPoint]; // Fallback
      }

      const data = await response.json();
      if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
        console.warn(`No road route found between "${startPoint.name}" and "${endPoint.name}". Using a direct path as fallback.`);
        return [startPoint, endPoint]; // Fallback
      }

      const routeCoordinates = data.routes[0].geometry.coordinates;
      const routeSegment: WaypointWithCoords[] = routeCoordinates.map((coord: [number, number], index: number) => ({
        id: `route-pt-${segmentIndex}-${index}`,
        name: `Route Point ${segmentIndex}-${index}`,
        lat: coord[1],
        lng: coord[0],
      }));
      
      // Fallback for an empty but successful route response
      if (routeSegment.length === 0) {
          return [startPoint, endPoint];
      }

      return routeSegment;

    } catch (error) {
      console.error(`Network or other error fetching route from "${startPoint.name}" to "${endPoint.name}". Using a direct path as fallback.`, error);
      return [startPoint, endPoint]; // Fallback
    }
}


export const getRouteForWaypoints = async (waypoints: WaypointWithCoords[]): Promise<WaypointWithCoords[]> => {
  if (waypoints.length < 2) {
    return waypoints;
  }

  // Create an array of promises, one for each route segment.
  // These will be executed in parallel for maximum speed.
  const segmentPromises: Promise<WaypointWithCoords[]>[] = [];
  for (let i = 0; i < waypoints.length - 1; i++) {
    const startPoint = waypoints[i];
    const endPoint = waypoints[i + 1];
    segmentPromises.push(fetchRouteSegment(startPoint, endPoint, i));
  }

  // Wait for all the routing requests to complete.
  const allSegments = await Promise.all(segmentPromises);

  // Stitch the route segments together into one continuous path.
  const fullRoute: WaypointWithCoords[] = [];
  allSegments.forEach((segment, index) => {
    if (segment.length > 0) {
      // For the first segment, add all points. For subsequent segments,
      // skip the first point to avoid duplicating the connection points.
      const pointsToAdd = (index === 0) ? segment : segment.slice(1);
      fullRoute.push(...pointsToAdd);
    }
  });

  // To ensure the animation starts and ends precisely on the user's waypoints,
  // we replace the first and last points of the entire generated route.
  if (fullRoute.length > 0) {
    fullRoute[0] = waypoints[0];
    fullRoute[fullRoute.length - 1] = waypoints[waypoints.length - 1];
  } else {
    // If all routing failed and we have an empty array, return the original waypoints for a direct path.
    return waypoints;
  }

  return fullRoute;
};