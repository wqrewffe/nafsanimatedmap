import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import type { WaypointGroupWithCoords, CinematicZoomStyle, AnimationPathStyle, MapDisplayHandle } from '../types';
import { MAP_STYLES } from '../mapStyles';

// Use a global 'L' object from the Leaflet CDN script
declare const L: any;

interface MapDisplayProps {
  groups: WaypointGroupWithCoords[];
  animationSpeed: number;
  setAnimationSpeed: (speed: number | ((prev: number) => number)) => void;
  isAnimationPaused: boolean;
  mapStyleId: string;
  showMarkers: boolean;
  pathWeight: number;
  pathStyle: 'solid' | 'dashed';
  pathOpacity: number;
  cinematicZoom: CinematicZoomStyle;
  animationStyle: AnimationPathStyle;
  lookAhead: boolean;
  durationControlMode: 'speed' | 'time';
  totalDuration: number;
  durationPerLocation: number;
  flyToTarget: { bounds: [number, number, number, number] } | { center: [number, number]; zoom: number } | null;
  onFlyToComplete: () => void;
}

const hexToRgba = (hex: string, alpha: number = 1): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return `rgba(0,0,0,${alpha})`;
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const MapDisplay = forwardRef<MapDisplayHandle, MapDisplayProps>(({ 
  groups, 
  animationSpeed,
  setAnimationSpeed, 
  isAnimationPaused, 
  mapStyleId, 
  showMarkers,
  pathWeight,
  pathStyle,
  pathOpacity,
  cinematicZoom,
  animationStyle,
  lookAhead,
  durationControlMode,
  totalDuration,
  durationPerLocation,
  flyToTarget,
  onFlyToComplete,
}, ref) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const animationFrameIds = useRef<{ [key: string]: number }>({});
  const polylinesRef = useRef<{ [key: string]: any }>({});
  const travelerMarkersRef = useRef<{ [key: string]: any }>({});
  const animationSpeedRef = useRef(animationSpeed);
  const isAnimationPausedRef = useRef(isAnimationPaused);
  const animationIntervals = useRef<number[]>([]);
  const layerGroupRef = useRef<any>(null); // To manage all animation layers

  useImperativeHandle(ref, () => ({
    zoomIn: () => {
        mapRef.current?.zoomIn();
    },
    zoomOut: () => {
        mapRef.current?.zoomOut();
    },
  }));

  // Update refs when props change so the animation loop can access the latest values
  useEffect(() => {
    animationSpeedRef.current = animationSpeed;
  }, [animationSpeed]);

  useEffect(() => {
    isAnimationPausedRef.current = isAnimationPaused;
  }, [isAnimationPaused]);


  // Initialize map once on component mount
  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, { zoomControl: false }).setView([20, 0], 2);
      layerGroupRef.current = L.layerGroup().addTo(mapRef.current);
    }
    // Cleanup on unmount
    return () => {
      // FIX: Explicitly use window.clearInterval to avoid type conflicts with Node.js types.
      animationIntervals.current.forEach(window.clearInterval);
      if (mapRef.current) {
        mapRef.current['remove']();
        mapRef.current = null;
      }
    };
  }, []);

  // Effect to fly to specific bounds when requested
  useEffect(() => {
    if (flyToTarget && mapRef.current) {
      const options = {
          duration: 2.5,
          easeLinearity: 0.5,
      };

      if ('bounds' in flyToTarget) {
        // Nominatim provides [south, north, west, east].
        // Leaflet's fitBounds expects [[south, west], [north, east]].
        const leafletBounds = L.latLngBounds([
          [flyToTarget.bounds[0], flyToTarget.bounds[2]], // [south, west]
          [flyToTarget.bounds[1], flyToTarget.bounds[3]]  // [north, east]
        ]);
        
        mapRef.current.flyToBounds(leafletBounds, { ...options, padding: [50, 50] });
      } else if ('center' in flyToTarget) {
        mapRef.current.flyTo(flyToTarget.center, flyToTarget.zoom, options);
      }


      // Reset the state after the animation is complete to allow for subsequent flights
      const handleMoveEnd = () => {
          onFlyToComplete();
          mapRef.current.off('moveend zoomend', handleMoveEnd);
      };
      mapRef.current.on('moveend zoomend', handleMoveEnd);
    }
  }, [flyToTarget, onFlyToComplete]);

  // Interactive speed control via scroll
  useEffect(() => {
    if (!mapRef.current) return;
    const mapContainer = mapRef.current.getContainer();

    const handleWheel = (e: WheelEvent) => {
        if (durationControlMode === 'time') return; // Disable scroll-to-speed when in time mode
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setAnimationSpeed(prev => {
            const newSpeed = parseFloat((prev + delta).toFixed(1));
            return Math.max(0.5, Math.min(3.0, newSpeed));
        });
    };

    mapContainer.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
        mapContainer.removeEventListener('wheel', handleWheel);
    };
  }, [setAnimationSpeed, durationControlMode]);


  // Update tile layer when style changes
  useEffect(() => {
    if (!mapRef.current) return;

    const selectedStyle = MAP_STYLES.find(style => style.id === mapStyleId) || MAP_STYLES[0];
    const maxZoom = selectedStyle.maxZoom || 19;

    if (tileLayerRef.current) {
      mapRef.current.removeLayer(tileLayerRef.current);
    }

    tileLayerRef.current = L.tileLayer(selectedStyle.url, {
      attribution: selectedStyle.attribution,
      subdomains: 'abcd',
      maxZoom: maxZoom
    }).addTo(mapRef.current);
    
    if (mapRef.current.getZoom() > maxZoom) {
        mapRef.current.setZoom(maxZoom);
    }

  }, [mapStyleId]);

  // Effect to update path styles in real-time
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

  Object.values(polylinesRef.current).forEach((polyline) => {
    const p: any = polyline;
    // Add an extra check for `getElement()` to ensure the layer has been rendered to the DOM
    if (p && map.hasLayer(p) && typeof p.getElement === 'function' && p.getElement()) {
      p.setStyle({
        weight: pathWeight,
        opacity: pathOpacity,
        dashArray: pathStyle === 'dashed' ? '10' : undefined,
      });
    }
  });
  }, [pathWeight, pathStyle, pathOpacity]);

  // Animate path when groups change
  useEffect(() => {
    const map = mapRef.current;
    if (!map || groups.length === 0) return;

    let isCancelled = false;
    
    const travelerIcon = (color: string) => L.divIcon({
        html: `
            <div class="relative flex h-5 w-5" style="filter: drop-shadow(0 0 8px ${hexToRgba(color, 0.9)});">
                <div class="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style="background-color: ${color};"></div>
                <div class="relative inline-flex rounded-full h-5 w-5 border-2 border-white" style="background-color: ${color};"></div>
            </div>
        `,
        className: '',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
    });
    
    const runAnimationLoop = (groupId: string, onUpdate: (progress: number, distance: number, timestamp: number, delta: number) => void, totalPathDistance: number, animationDuration?: number) => {
        return new Promise<void>(resolve => {
            let startTime: number | null = null;
            let totalElapsedTime = 0;
            let lastTimestamp: number | null = null;
    
            const animate = (timestamp: number) => {
              if (isCancelled) return;
              if (!startTime) startTime = timestamp;
              if (!lastTimestamp) lastTimestamp = timestamp;
    
              let delta = 0;
              if (!isAnimationPausedRef.current) {
                delta = timestamp - lastTimestamp;
                totalElapsedTime += delta;
              }
              lastTimestamp = timestamp;
    
              let currentAnimationDuration: number;
              if (animationDuration !== undefined) {
                  currentAnimationDuration = animationDuration;
              } else {
                  let baseAnimationDuration = 5000;
                  if (cinematicZoom === 'close-up') baseAnimationDuration = 10000;
                  else if (cinematicZoom === 'smooth') baseAnimationDuration = 7500;
                  currentAnimationDuration = baseAnimationDuration / animationSpeedRef.current;
              }
              
              const progress = currentAnimationDuration > 0 ? Math.min(totalElapsedTime / currentAnimationDuration, 1) : 1;
              const distanceCovered = totalPathDistance * progress;
              
              onUpdate(progress, distanceCovered, timestamp, delta);
              
              if (progress < 1) {
                animationFrameIds.current[groupId] = requestAnimationFrame(animate);
              } else {
                onUpdate(1, totalPathDistance, timestamp, 0);
                resolve();
              }
            };
            animationFrameIds.current[groupId] = requestAnimationFrame(animate);
          });
    };

    const animateDraw = async (group: WaypointGroupWithCoords, isReveal = false, duration?: number) => {
      const { id, color, waypoints } = group;
      const latlngs = waypoints.map(wp => L.latLng(wp.lat, wp.lng));
      const path = L.polyline(latlngs);
      const totalPathDistance = path.getLatLngs().reduce((acc: number, latlng: any, i: number, arr: any[]) => i === 0 ? 0 : acc + latlng.distanceTo(arr[i-1]), 0);

      if (isReveal) {
          L.polyline(latlngs, {
            color: color, weight: Math.max(1, pathWeight - 2), opacity: pathOpacity * 0.2,
            dashArray: '5, 10',
          }).addTo(layerGroupRef.current);
      }
      polylinesRef.current[id] = L.polyline([], {
          color: color, weight: pathWeight, opacity: pathOpacity,
          dashArray: pathStyle === 'dashed' ? '10' : undefined,
      }).addTo(layerGroupRef.current);
      travelerMarkersRef.current[id] = L.marker(latlngs[0], { icon: travelerIcon(color), zIndexOffset: 1000 }).addTo(layerGroupRef.current);

      await runAnimationLoop(id, (progress, distanceCovered) => {
        const currentCoord = getPointAtDistance(path, distanceCovered);
        const polyline = polylinesRef.current[id];
        const marker = travelerMarkersRef.current[id];
        if (currentCoord && polyline && map.hasLayer(polyline) && marker && map.hasLayer(marker)) {
            polyline.addLatLng(currentCoord);
            marker.setLatLng(currentCoord);
        }
      }, totalPathDistance, duration);
    };
    
    const animateFlow = async (group: WaypointGroupWithCoords, duration?: number) => {
      const { id, color, waypoints } = group;
      const latlngs = waypoints.map(wp => L.latLng(wp.lat, wp.lng));
      const path = L.polyline(latlngs);
      const totalPathDistance = path.getLatLngs().reduce((acc, latlng, i, arr) => i === 0 ? 0 : acc + latlng.distanceTo(arr[i-1]), 0);
      
      // Draw faint base path
      L.polyline(latlngs, { color: color, weight: pathWeight, opacity: pathOpacity * 0.2 }).addTo(layerGroupRef.current);
      
      polylinesRef.current[id] = L.polyline([], {
          color: color, weight: pathWeight, opacity: pathOpacity,
          dashArray: `${pathWeight * 2}, ${pathWeight * 3}`,
      }).addTo(layerGroupRef.current);
      travelerMarkersRef.current[id] = L.marker(latlngs[0], { icon: travelerIcon(color), zIndexOffset: 1000 }).addTo(layerGroupRef.current);

      await runAnimationLoop(id, (progress, distance) => {
        const currentCoord = getPointAtDistance(path, distance);
        const polyline = polylinesRef.current[id];
        const marker = travelerMarkersRef.current[id];
        if (currentCoord && polyline && map.hasLayer(polyline) && marker && map.hasLayer(marker)) {
            polyline.addLatLng(currentCoord);
            marker.setLatLng(currentCoord);
        }
      }, totalPathDistance, duration);

      let offset = 0;
      // FIX: Explicitly use window.setInterval to get a number return type.
      const flowInterval = window.setInterval(() => {
          if (isAnimationPausedRef.current || isCancelled) {
              // FIX: Use window.clearInterval to match window.setInterval.
              window.clearInterval(flowInterval);
              return;
          };
          const line = polylinesRef.current[id];
          if (line && map.hasLayer(line)) {
              const pathElement = line.getElement();
              if (pathElement) {
                  offset -= animationSpeedRef.current;
                  pathElement.style.strokeDashoffset = offset;
              }
          }
      }, 30);
      animationIntervals.current.push(flowInterval);
    };

    const animateComet = async (group: WaypointGroupWithCoords, duration?: number) => {
        const { id, color, waypoints } = group;
        const latlngs = waypoints.map(wp => L.latLng(wp.lat, wp.lng));
        const path = L.polyline(latlngs);
        const totalPathDistance = path.getLatLngs().reduce((acc, latlng, i, arr) => i === 0 ? 0 : acc + latlng.distanceTo(arr[i-1]), 0);
        const tailGroup = L.layerGroup().addTo(layerGroupRef.current);

        travelerMarkersRef.current[id] = L.marker(latlngs[0], { icon: travelerIcon(color), zIndexOffset: 1000 }).addTo(layerGroupRef.current);

        await runAnimationLoop(id, (progress, distance) => {
            const currentCoord = getPointAtDistance(path, distance);
            if (!currentCoord) return;
            
            const marker = travelerMarkersRef.current[id];
            if (marker && map.hasLayer(marker)) {
                marker.setLatLng(currentCoord);
            }
            
            if (map.hasLayer(tailGroup)) {
                const particle = L.circleMarker(currentCoord, {
                    radius: pathWeight + 2, color: 'white', weight: 0, fillOpacity: 1, fillColor: color,
                }).addTo(tailGroup);
    
                setTimeout(() => {
                    if (!isCancelled && map.hasLayer(tailGroup) && tailGroup.hasLayer(particle)) {
                       tailGroup.removeLayer(particle);
                    }
                }, 800);
            }
        }, totalPathDistance, duration);
    };
    
    const animatePulse = async (group: WaypointGroupWithCoords, duration?: number) => {
        const { id, color, waypoints } = group;
        const latlngs = waypoints.map(wp => L.latLng(wp.lat, wp.lng));
        const path = L.polyline(latlngs);
        const totalPathDistance = path.getLatLngs().reduce((acc, latlng, i, arr) => i === 0 ? 0 : acc + latlng.distanceTo(arr[i - 1]), 0);

        polylinesRef.current[id] = L.polyline([], { color: color, weight: pathWeight, opacity: pathOpacity }).addTo(layerGroupRef.current);
        travelerMarkersRef.current[id] = L.marker(latlngs[0], { icon: travelerIcon(color), zIndexOffset: 1000 }).addTo(layerGroupRef.current);
        const pulseGroup = L.layerGroup().addTo(layerGroupRef.current);

        let lastPulseTime = 0;
        
        type ActivePulse = { layer: any; startTime: number; };
        const activePulses: ActivePulse[] = [];
        const pulseDuration = 1500;

        await runAnimationLoop(id, (progress, distance, timestamp) => {
            // This single, robust guard inside the main animation loop prevents all race conditions.
            // If the animation is cancelled or layers are cleared, we stop processing anything.
            if (isCancelled || !layerGroupRef.current || !map.hasLayer(layerGroupRef.current) || !layerGroupRef.current.hasLayer(pulseGroup)) {
                return;
            }

            const currentCoord = getPointAtDistance(path, distance);
            if (!currentCoord) return;

            const polyline = polylinesRef.current[id];
            const marker = travelerMarkersRef.current[id];
            if (polyline && map.hasLayer(polyline)) polyline.addLatLng(currentCoord);
            if (marker && map.hasLayer(marker)) marker.setLatLng(currentCoord);

            // Create new pulses
            const pulseInterval = 400 / animationSpeedRef.current;
            if (timestamp - lastPulseTime > pulseInterval) {
                lastPulseTime = timestamp;
                const pulseRing = L.circleMarker(currentCoord, {
                    radius: pathWeight, color: color, weight: pathWeight / 2, opacity: 0.8,
                    fillColor: color, fillOpacity: 0.2
                }).addTo(pulseGroup);
                activePulses.push({ layer: pulseRing, startTime: timestamp });
            }

            // Update all active pulses from this single loop
            for (let i = activePulses.length - 1; i >= 0; i--) {
                const pulse = activePulses[i];
                const elapsed = timestamp - pulse.startTime;
                const pulseProgress = elapsed / pulseDuration;

                if (pulseProgress < 1) {
                    const easeOutQuad = (t: number) => t * (2 - t);
                    const currentRadius = pathWeight + (pathWeight * 5 * easeOutQuad(pulseProgress));
                    const currentOpacity = 0.8 * (1 - pulseProgress);
                    pulse.layer.setRadius(currentRadius);
                    pulse.layer.setStyle({ opacity: currentOpacity, fillOpacity: currentOpacity * 0.5 });
                } else {
                    pulseGroup.removeLayer(pulse.layer);
                    activePulses.splice(i, 1);
                }
            }
        }, totalPathDistance, duration);
    };
    
    const executeAnimation = async () => {
      // FIX: Explicitly use window.clearInterval to avoid type conflicts with Node.js types.
      animationIntervals.current.forEach(window.clearInterval);
      animationIntervals.current = [];
      layerGroupRef.current.clearLayers();
      polylinesRef.current = {};
      travelerMarkersRef.current = {};
      animationFrameIds.current = {};
      if (isCancelled) return;

      const allLatLngs = groups.flatMap(g => g.waypoints.map(wp => L.latLng(wp.lat, wp.lng)));
      if(allLatLngs.length === 0) return;

      const bounds = L.latLngBounds(allLatLngs);

      const allPaths: { [key: string]: any } = {};
      const allDistances: { [key: string]: number } = {};
      let totalCombinedDistance = 0;

      groups.forEach(group => {
          if (group.waypoints.length < 2) return;
          const latlngs = group.waypoints.map(wp => L.latLng(wp.lat, wp.lng));
          const path = L.polyline(latlngs);
          const distance = path.getLatLngs().reduce((acc: number, latlng: any, i: number, arr: any[]) => i === 0 ? 0 : acc + latlng.distanceTo(arr[i-1]), 0);
          allPaths[group.id] = path;
          allDistances[group.id] = distance;
          totalCombinedDistance += distance;
      });

      if (showMarkers) {
        groups.forEach(group => {
            const markerPoints = group.userWaypoints || group.waypoints;
            markerPoints.forEach((wp, index) => {
                const waypointIcon = L.divIcon({
                    html: `<div class="relative flex items-center justify-center" style="width: 32px; height: 32px; filter: drop-shadow(0 0 8px ${group.color});"><svg viewBox="0 0 24 24" class="h-8 w-8" style="color:${group.color}"><path fill="currentColor" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg><span class="absolute text-xs font-bold text-white" style="top: 7px; text-shadow: 0 0 3px #000, 0 0 5px #000;">${index + 1}</span></div>`,
                    className: '', iconSize: [32, 32], iconAnchor: [16, 32], tooltipAnchor: [0, -32]
                });
                L.marker([wp.lat, wp.lng], { icon: waypointIcon }).addTo(layerGroupRef.current).bindTooltip(`${index + 1}. ${wp.name}`, { permanent: false, direction: 'top', className: 'leaflet-tooltip' });
            });
        });
      }
      
      // Animate groups sequentially
      for (const group of groups) {
        if (isCancelled) return;
        if (group.waypoints.length < 2) continue;

        // Zoom to current group's bounds before starting its animation
        const groupLatLngs = group.waypoints.map(wp => L.latLng(wp.lat, wp.lng));
        const groupBounds = L.latLngBounds(groupLatLngs);
        
        if (cinematicZoom !== 'none') {
            const flyToOptions: any = { padding: [50, 50], duration: !showMarkers ? 3.5 : 1.5 };
            switch(cinematicZoom) {
                case 'wide':
                    flyToOptions.maxZoom = 10;
                    break;
                case 'fly-to':
                    flyToOptions.maxZoom = 12;
                    break;
                case 'smooth':
                    flyToOptions.maxZoom = 14;
                    break;
                case 'close-up':
                    flyToOptions.maxZoom = 16;
                    break;
            }
            await new Promise<void>(resolve => {
                map.once('zoomend moveend', () => setTimeout(resolve, 200));
                map.flyToBounds(groupBounds, flyToOptions);
            });
            if (isCancelled) return;
        } else {
            map.fitBounds(groupBounds, { padding: [50, 50], maxZoom: 12 });
        }
        await delay(!showMarkers ? 800 : 300); // Pause briefly before animation starts
        if (isCancelled) return;
        
        let animationDurationForGroup: number | undefined = undefined;

        if (durationControlMode === 'time') {
            if (showMarkers) { // Route mode
                if (totalCombinedDistance > 0) {
                    const groupDistance = allDistances[group.id];
                    animationDurationForGroup = totalDuration * 1000 * (groupDistance / totalCombinedDistance);
                } else {
                    animationDurationForGroup = totalDuration * 1000 / groups.length; // Fallback if no distance
                }
            } else { // Border mode
                if (group.duration) { // Prioritize individual duration
                    animationDurationForGroup = group.duration;
                } else { // Fallback to uniform duration
                    animationDurationForGroup = durationPerLocation * 1000;
                }
            }
        }
        
        const isSmoothCamera = cinematicZoom === 'smooth' || cinematicZoom === 'close-up';
        if (isSmoothCamera) {
          const path = allPaths[group.id];
          const totalPathDistance = allDistances[group.id];
          runAnimationLoop(group.id + "-camera", (progress, distanceCovered, timestamp, delta) => {
              if(isAnimationPausedRef.current || delta === 0) return;
              
              const currentLatLng = getPointAtDistance(path, distanceCovered);
              if (!currentLatLng) return;

              const isLookAheadEnabled = lookAhead && isSmoothCamera;
              
              const lookAheadRatio = 0.05; // 5% of path
              const maxLookAheadMeters = 500000; // 500km cap for stability on large routes
              const lookAheadDistance = Math.min(totalPathDistance * lookAheadRatio, maxLookAheadMeters);

              const panTarget = isLookAheadEnabled
                  ? getPointAtDistance(path, Math.min(totalPathDistance, distanceCovered + lookAheadDistance))
                  : currentLatLng;
              if (!panTarget) return;

              const currentCenter = map.getCenter();
              
              // Frame-rate independent exponential smoothing for a buttery-smooth camera.
              const smoothing = 5.0; // Higher value = faster catch-up. 5.0 is a good balance.
              const interpolationFactor = 1 - Math.exp(-smoothing * (delta / 1000));
              
              const newCenter = L.latLng(
                  currentCenter.lat * (1 - interpolationFactor) + panTarget.lat * interpolationFactor,
                  currentCenter.lng * (1 - interpolationFactor) + panTarget.lng * interpolationFactor
              );
              map.panTo(newCenter, { animate: false });
          }, totalPathDistance, animationDurationForGroup);
        }

        const run = (duration?: number) => {
          switch(animationStyle) {
            case 'draw': return animateDraw(group, false, duration);
            case 'reveal': return animateDraw(group, true, duration);
            case 'flow': return animateFlow(group, duration);
            case 'comet': return animateComet(group, duration);
            case 'pulse': return animatePulse(group, duration);
            default: return animateDraw(group, false, duration);
          }
        };
        await run(animationDurationForGroup);
      }

      if (isCancelled) return;

      // After all animations, zoom out to show the full picture
      if (cinematicZoom === 'smooth' || cinematicZoom === 'close-up' || cinematicZoom === 'fly-to') {
        await new Promise(resolve => setTimeout(resolve, 500));
        if (isCancelled) return;
        await new Promise<void>(resolve => {
            map.once('zoomend moveend', () => resolve());
            map.flyToBounds(bounds, { padding: [50, 50], duration: 2, easeLinearity: 0.5 });
        });
      }
    };
    
    executeAnimation();
    
    return () => {
      isCancelled = true;
      // FIX: Explicitly use window.clearInterval to avoid type conflicts with Node.js types.
      animationIntervals.current.forEach(window.clearInterval);
      animationIntervals.current = [];
      Object.keys(animationFrameIds.current).forEach(key => cancelAnimationFrame(animationFrameIds.current[key]));
      try {
        if (map && typeof map.stop === 'function') {
          // Some Leaflet internals may throw if called during teardown; guard defensively.
          map.stop();
        }
      } catch (err) {
        // swallow errors during unmount to avoid crashing the app (Leaflet race condition)
        // console.warn('Error stopping map during cleanup', err);
      }
    };
  }, [groups, showMarkers, mapStyleId, cinematicZoom, animationStyle, lookAhead, pathStyle, pathWeight, pathOpacity, durationControlMode, totalDuration, durationPerLocation]);

  const getPointAtDistance = (polyline: any, distance: number) => {
    const latlngs = polyline.getLatLngs();
    if (latlngs.length < 1) return null;
    if (distance <= 0) return latlngs[0];

    let coveredDistance = 0;
    for (let i = 0; i < latlngs.length - 1; i++) {
        const from = latlngs[i];
        const to = latlngs[i + 1];
        const segmentDistance = from.distanceTo(to);

        // If the segment has no length (duplicate points), skip it.
        if (segmentDistance === 0) {
            continue;
        }

        if (coveredDistance + segmentDistance >= distance) {
            const ratio = (distance - coveredDistance) / segmentDistance;
            
            // Clamp ratio to prevent overshooting due to floating point errors
            const clampedRatio = Math.max(0, Math.min(1, ratio));

            let toLng = to.lng;
            const lngDiff = to.lng - from.lng;

            // Handle antimeridian crossing for interpolation
            if (lngDiff > 180) {
                toLng -= 360;
            } else if (lngDiff < -180) {
                toLng += 360;
            }

            const lat = from.lat + (to.lat - from.lat) * clampedRatio;
            let lng = from.lng + (toLng - from.lng) * clampedRatio;
            
            // Normalize longitude to be within -180 to 180
            while (lng <= -180) lng += 360;
            while (lng > 180) lng -= 360;
            
            return L.latLng(lat, lng);
        }
        coveredDistance += segmentDistance;
    }

    // If we get here (e.g., due to floating point inaccuracies), return the last point.
    return latlngs[latlngs.length - 1];
  }

  return (
    <div ref={mapContainerRef} className="h-full w-full" />
  );
});
