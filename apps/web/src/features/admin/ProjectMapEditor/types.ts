// --- Core Map Types ------------------------------------------------------------

export type PlotStatus = 'AVAILABLE' | 'HOLD' | 'BOOKED' | 'SOLD' | 'BLOCKED';
export type MapObjectType =
  | 'PROJECT_BOUNDARY' | 'LAND_PARCEL' | 'ROAD' | 'GARDEN' | 'PARK'
  | 'WATER' | 'COMMERCIAL_AREA' | 'AMENITY' | 'PARKING' | 'OTHER' | 'LABEL';

export type EditorTool =
  | 'SELECT'
  | 'PAN'
  | 'DRAW_BOUNDARY'
  | 'DRAW_LAND'
  | 'DRAW_ROAD'
  | 'DRAW_GARDEN'
  | 'DRAW_PARK'
  | 'DRAW_WATER'
  | 'DRAW_AMENITY'
  | 'DRAW_PLOT'
  | 'DRAW_LABEL'
  | 'DELETE';

/** Normalized coordinate [x, y] in range [0,1] */
export type LocalCoord = [number, number];

export interface LocalPolygon {
  type: 'Polygon';
  coordinates: LocalCoord[][];
}

export interface LocalPolyline {
  type: 'Polyline';
  coordinates: LocalCoord[];
}

export interface LocalPoint {
  type: 'Point';
  coordinates: LocalCoord;
}

export type LocalGeometry = LocalPolygon | LocalPolyline | LocalPoint;

export interface MapObjectData {
  id?: string;           // undefined if not yet saved
  tempId: string;        // always set, used as React key
  type: MapObjectType;
  name?: string;
  geometry: LocalGeometry;
  displayStyle?: {
    fillColor?: string;
    strokeColor?: string;
    strokeWidth?: number;
    opacity?: number;
    fontSize?: number;
  };
  phaseId?: string | null;
  metadata?: Record<string, any>;
  isDirty?: boolean;     // unsaved changes
}

export interface PlotData {
  id?: string;
  tempId: string;
  plotNumber: string;
  area?: number;
  areaUnit?: string;
  width?: number;
  length?: number;
  price?: number;
  priceType?: string;
  facing?: string;
  status: PlotStatus;
  displayColor?: string;
  description?: string;
  geometry?: LocalPolygon;
  phaseId?: string | null;
  clusterId?: string | null;
  isDirty?: boolean;
}

export interface PhaseData {
  id?: string;
  name: string;
  description?: string;
  orderIndex: number;
  status: 'PLANNED' | 'ACTIVE' | 'COMPLETED';
}

export interface ClusterData {
  id?: string;
  name: string;
  color?: string;
  phaseId?: string | null;
}

export type SelectedObject =
  | { kind: 'plot'; tempId: string }
  | { kind: 'mapObject'; tempId: string }
  | null;

export const PLOT_COLORS: Record<PlotStatus, string> = {
  AVAILABLE: '#22c55e',
  HOLD:      '#eab308',
  BOOKED:    '#f97316',
  SOLD:      '#ef4444',
  BLOCKED:   '#94a3b8',
};

export const MAP_OBJECT_COLORS: Record<MapObjectType, string> = {
  PROJECT_BOUNDARY: '#1e40af',
  LAND_PARCEL:      '#92400e',
  ROAD:             '#475569',
  GARDEN:           '#16a34a',
  PARK:             '#15803d',
  WATER:            '#0284c7',
  COMMERCIAL_AREA:  '#9333ea',
  AMENITY:          '#0891b2',
  PARKING:          '#4b5563',
  OTHER:            '#6b7280',
  LABEL:            '#1e293b',
};

export const MAP_OBJECT_LABELS: Record<MapObjectType, string> = {
  PROJECT_BOUNDARY: 'Project Boundary',
  LAND_PARCEL:      'Land Parcel',
  ROAD:             'Road',
  GARDEN:           'Garden',
  PARK:             'Park',
  WATER:            'Water',
  COMMERCIAL_AREA:  'Commercial Area',
  AMENITY:          'Amenity',
  PARKING:          'Parking',
  OTHER:            'Other',
  LABEL:            'Label',
};
