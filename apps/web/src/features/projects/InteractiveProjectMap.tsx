'use client';

import { useEffect, useRef, useState } from 'react';
import { Box, Typography, Switch, FormControlLabel } from '@mui/material';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface InteractiveProjectMapProps {
  project: any;
  plots: any[];
}

export default function InteractiveProjectMap({ project, plots }: InteractiveProjectMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const polygonLayer = useRef<L.LayerGroup | null>(null);
  const [heatMapMode, setHeatMapMode] = useState(false);

  const centerLat = project.latitude || 24.5372;
  const centerLng = project.longitude || 81.3042;
  const maxPrice = Math.max(...plots.map(p => Number(p.price) || 0), 1);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return '#22c55e';
      case 'RESERVED': return '#eab308';
      case 'SOLD': return '#ef4444';
      case 'BLOCKED': return '#94a3b8';
      default: return '#3b82f6';
    }
  };

  const getHeatMapColor = (price: number) => {
    const ratio = price / maxPrice;
    if (ratio > 0.8) return '#ef4444';
    if (ratio > 0.5) return '#f97316';
    if (ratio > 0.2) return '#eab308';
    return '#3b82f6';
  };

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize map only once
    if (!mapInstance.current) {
      const map = L.map(mapRef.current).setView([centerLat, centerLng], 16);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      polygonLayer.current = L.layerGroup().addTo(map);
      mapInstance.current = map;
    }

    // Clean up and redraw polygons when mode changes
    const layerGroup = polygonLayer.current;
    if (layerGroup) {
      layerGroup.clearLayers();

      plots
        .filter(p => p?.polygon_geometry?.coordinates)
        .forEach(plot => {
          const positions = plot.polygon_geometry.coordinates[0].map((coord: number[]) => [coord[1], coord[0]] as [number, number]);
          
          const fillColor = heatMapMode 
            ? getHeatMapColor(Number(plot.price)) 
            : getStatusColor(plot.status);

          const polygon = L.polygon(positions, {
            color: 'white',
            weight: 2,
            fillColor: fillColor,
            fillOpacity: 0.6
          });

          // Custom HTML popup
          const popupContent = `
            <div style="font-family: Inter, sans-serif; min-width: 150px;">
              <div style="font-weight: 700; font-size: 14px; margin-bottom: 4px;">Plot #${plot.plot_number}</div>
              <div style="font-size: 13px; color: #475569;">Status: ${plot.status}</div>
              <div style="font-size: 13px; color: #475569;">Area: ${plot.area} ${plot.area_unit}</div>
              <div style="font-size: 13px; font-weight: 600; color: #1B4FD8; margin-top: 4px;">
                Price: ₹${Number(plot.price).toLocaleString()}
              </div>
            </div>
          `;
          
          polygon.bindPopup(popupContent);
          polygon.addTo(layerGroup);
        });
    }

    return () => {
      // Cleanup happens on unmount
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [centerLat, centerLng, heatMapMode, plots]);

  return (
    <Box sx={{ height: '100%', width: '100%', position: 'relative' }}>
      <Box sx={{ position: 'absolute', top: 10, right: 10, zIndex: 1000, bgcolor: 'white', px: 2, py: 1, borderRadius: 2, boxShadow: 1 }}>
        <FormControlLabel
          control={<Switch checked={heatMapMode} onChange={(e) => setHeatMapMode(e.target.checked)} />}
          label={
            <Typography variant="body2" fontWeight={600}>
              {heatMapMode ? 'Heat Map (Price)' : 'Availability Map'}
            </Typography>
          }
        />
      </Box>
      <Box ref={mapRef} sx={{ height: '100%', width: '100%' }} />
    </Box>
  );
}
