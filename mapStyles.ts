
import type { MapStyle } from './types';

export const MAP_STYLES: MapStyle[] = [
  // -----------------
  // Curated & Verified Core Maps
  // -----------------
  {
    id: 'carto-dark',
    name: 'GeoLayer Dark',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 20,
  },
  {
    id: 'carto-light',
    name: 'GeoLayer Light',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 20,
  },
    {
    id: 'carto-dark-nolabels',
    name: 'Dark Matter',
    url: 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 20,
  },
  // Replaced original osm-standard with more reliable alternatives
  {
    id: 'carto-voyager',
    name: 'Standard (Voyager)', // Renamed for clarity
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 20,
  },
  {
    id: 'esri-street',
    name: 'Standard (Street)', // New reliable alternative
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012',
    maxZoom: 19,
  },
  {
    id: 'osm-bw',
    name: 'Black & White',
    url: 'https://{s}.tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  },
  {
    id: 'esri-terrain',
    name: 'Vintage Terrain',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Terrain_Base/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: USGS, Esri, TANA, DeLorme, and NPS',
    maxZoom: 13,
  },
  {
    id: 'wikimedia',
    name: 'Classical Atlas',
    url: 'https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}{r}.png',
    attribution: '<a href="https://wikimediafoundation.org/wiki/Maps_Terms_of_Use">Wikimedia</a>',
    maxZoom: 19,
  },
  {
    id: 'osm-humanitarian',
    name: 'Humanitarian (Detailed)',
    url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles style by <a href="https://www.hotosm.org/" target="_blank">HOT</a>',
    maxZoom: 19,
  },
  {
    id: 'esri-natgeo',
    name: 'National Geographic',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; National Geographic, Esri, DeLorme, NAVTEQ, UNEP-WCMC, USGS, NASA, ESA, METI, NRCAN, GEBCO, NOAA, iPC',
    maxZoom: 16,
  },
  {
    id: 'esri-gray',
    name: 'Light Gray Canvas',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
    maxZoom: 16,
  },
  {
    id: 'opentopomap',
    name: 'Topo Map',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)',
    maxZoom: 17,
  },
  {
    id: 'esri-imagery',
    name: 'ESRI Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    maxZoom: 19,
  },
  
  // -----------------
  // Additional Thematic & Regional Maps
  // -----------------
  {
    id: 'cyclosm',
    name: 'CyclOSM',
    url: 'https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png',
    attribution: '© CyclOSM, OpenStreetMap contributors',
    maxZoom: 20,
  },
  {
    id: 'hike-bike',
    name: 'Hike & Bike',
    url: 'https://tiles.wmflabs.org/hikebike/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors, CC-BY-SA',
    maxZoom: 18,
  },
  {
    id: 'public-transport',
    name: 'Public Transport',
    url: 'https://tileserver.memomaps.de/tilegen/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors, memomaps.de',
    maxZoom: 18,
  },
  {
    id: 'osm-france',
    name: 'OSM France',
    url: 'https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap France contributors',
    maxZoom: 20,
  },
  {
    id: 'osm-de',
    name: 'OSM Germany',
    url: 'https://{s}.tile.openstreetmap.de/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap Germany contributors',
    maxZoom: 18,
  },

  // -----------------
  // Ancient/Classic Styles
  // -----------------
  {
    id: 'esri-shaded-relief',
    name: 'Classic Relief Map',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Shaded_Relief/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri',
    maxZoom: 13,
  },
  {
    id: 'gsi-pale',
    name: 'Pale Vintage',
    url: 'https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png',
    attribution: 'Geospatial Information Authority of Japan',
    maxZoom: 18,
  },
];
