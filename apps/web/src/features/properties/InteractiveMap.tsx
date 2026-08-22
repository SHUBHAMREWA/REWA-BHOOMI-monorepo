'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Box } from '@mui/material';

interface MapProps {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
}

export default function InteractiveMap({ lat, lng, onChange }: MapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    // Only run on client
    if (typeof window === 'undefined' || !mapContainerRef.current) return;

    // Configure Default Icon
    const DefaultIcon = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      tooltipAnchor: [16, -28],
      shadowSize: [41, 41]
    });
    L.Marker.prototype.options.icon = DefaultIcon;

    // Initialize Map if not already initialized
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapContainerRef.current).setView([lat, lng], 16);

      // Esri Satellite Tiles
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri',
        maxNativeZoom: 17,
        maxZoom: 21
      }).addTo(mapInstanceRef.current);

      // Esri Labels
      L.tileLayer('https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
        attribution: '',
        maxNativeZoom: 17,
        maxZoom: 21
      }).addTo(mapInstanceRef.current);

      // Initialize Marker
      markerRef.current = L.marker([lat, lng], { draggable: true }).addTo(mapInstanceRef.current);

      // Marker Drag Event
      markerRef.current.on('dragend', (e) => {
        const position = e.target.getLatLng();
        onChange(position.lat, position.lng);
      });

      // Map Click Event
      mapInstanceRef.current.on('click', (e) => {
        onChange(e.latlng.lat, e.latlng.lng);
      });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update center when lat/lng change from props (e.g. from reverse geocode search)
  useEffect(() => {
    if (mapInstanceRef.current && markerRef.current) {
      mapInstanceRef.current.setView([lat, lng]);
      markerRef.current.setLatLng([lat, lng]);
    }
  }, [lat, lng]);

  return (
    <Box sx={{ height: '100%', width: '100%', position: 'relative' }}>
      <Box 
        ref={mapContainerRef} 
        sx={{ 
          height: '100%', 
          width: '100%', 
          zIndex: 1,
          '& .leaflet-container': { zIndex: 1, width: '100%', height: '100%' }
        }} 
      />
    </Box>
  );
}
