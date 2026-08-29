'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Stage, Layer, Line, Text, Rect, Group } from 'react-konva';
import { Box, Typography, Chip, Paper, IconButton, TextField, Button, Drawer, Divider } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { PLOT_COLORS, MAP_OBJECT_COLORS } from '../admin/ProjectMapEditor/types';
import { polygonToKonvaPoints, polygonCenter, normalizeGeometry } from '../admin/ProjectMapEditor/geometry';

interface PublicMapViewerProps {
  project: any;
  plots: any[];
  mapObjects?: any[];
}

interface PlotDetail {
  plot: any;
  x: number;
  y: number;
}

export default function PublicMapViewer({ project, plots: rawPlots, mapObjects: rawObjects = [] }: PublicMapViewerProps) {
  const plots = useMemo(() => rawPlots.map((p) => ({ ...p, polygon_geometry: normalizeGeometry(p.polygon_geometry) })), [rawPlots]);
  const mapObjects = useMemo(() => rawObjects.map((o) => ({ ...o, geometry: normalizeGeometry(o.geometry) })), [rawObjects]);

  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<any>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 420 });
  const [selectedPlot, setSelectedPlot] = useState<PlotDetail | null>(null);
  const [search, setSearch] = useState('');
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string[]>(['AVAILABLE', 'HOLD', 'BOOKED', 'SOLD', 'BLOCKED']);
  const [showLayers, setShowLayers] = useState({ plots: true, mapObjects: true });
  const [layerPanelOpen, setLayerPanelOpen] = useState(false);
  const [stageScale, setStageScale] = useState(1);

  useEffect(() => {
    const resize = () => {
      if (containerRef.current) {
        setCanvasSize({ width: containerRef.current.offsetWidth, height: containerRef.current.offsetHeight });
      }
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  // Center map on public stage at 100% scale (1:1)
  useEffect(() => {
    if (!stageRef.current || canvasSize.width <= 0) return;
    const allCoords: number[][] = [];
    plots.forEach((p: any) => {
      if (p.polygon_geometry?.coordinates?.[0]) {
        allCoords.push(...p.polygon_geometry.coordinates[0]);
      }
    });
    mapObjects.forEach((o: any) => {
      if (o.geometry?.coordinates?.[0]) {
        allCoords.push(...o.geometry.coordinates[0]);
      }
    });

    const boardWidth = 1600;
    const boardHeight = 1000;
    let centerX = boardWidth / 2;
    let centerY = boardHeight / 2;

    if (allCoords.length > 0) {
      const xs = allCoords.map(c => c[0]);
      const ys = allCoords.map(c => c[1]);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);
      centerX = (minX + (maxX - minX) / 2) * boardWidth;
      centerY = (minY + (maxY - minY) / 2) * boardHeight;
    }

    const stage = stageRef.current;
    if (stage) {
      const isMobile = window.innerWidth <= 768;
      const initialScale = isMobile ? 0.4 : 1.0;

      stage.scale({ x: initialScale, y: initialScale });
      stage.position({
        x: canvasSize.width / 2 - (centerX * initialScale),
        y: canvasSize.height / 2 - (centerY * initialScale),
      });
      setStageScale(initialScale);
      stage.batchDraw();
    }
  }, [plots, mapObjects, canvasSize]);

  const getPlotColor = useCallback((plot: any) => {
    return plot.display_color ?? PLOT_COLORS[plot.status as keyof typeof PLOT_COLORS] ?? '#22c55e';
  }, []);

  const handlePlotClick = (e: any, plot: any) => {
    e.cancelBubble = true;
    const stage = stageRef.current;
    if (stage) {
      const pos = stage.getPointerPosition();
      setSelectedPlot({ plot, x: pos?.x ?? (canvasSize.width / 2), y: pos?.y ?? (canvasSize.height / 2) });
    }
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    if (!value.trim()) {
      setHighlightId(null);
      return;
    }
    const match = plots.find((p: any) => p.plot_number.toLowerCase().includes(value.toLowerCase().trim()));
    if (match) {
      setHighlightId(match.id);
      
      const stage = stageRef.current;
      if (stage && match.polygon_geometry?.coordinates?.[0]) {
        const center = polygonCenter(match.polygon_geometry.coordinates[0]);
        const boardWidth = 1600;
        const boardHeight = 1000;
        const plotX = center[0] * boardWidth;
        const plotY = center[1] * boardHeight;
        
        // Target scale - slightly zoomed in if we were zoomed out
        const targetScale = Math.max(stage.scaleX(), 1.5);
        
        // Animate pan to center
        stage.to({
          x: canvasSize.width / 2 - (plotX * targetScale),
          y: canvasSize.height / 2 - (plotY * targetScale),
          scaleX: targetScale,
          scaleY: targetScale,
          duration: 0.4,
        });
        setStageScale(targetScale);
      }
    } else {
      setHighlightId(null);
    }
  };

  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;
    const scaleBy = 1.08;
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };
    const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
    const clampedScale = Math.max(0.3, Math.min(5, newScale));
    stage.scale({ x: clampedScale, y: clampedScale });
    stage.position({
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale,
    });
    setStageScale(clampedScale);
    stage.batchDraw();
  };

  // Touch Pinch Zoom Handler
  const touchState = useRef<{ lastCenter: { x: number; y: number } | null; lastDist: number }>({ lastCenter: null, lastDist: 0 });

  const handleTouchMove = (e: any) => {
    const evt = e.evt as TouchEvent;
    if (evt.touches.length === 2) {
      evt.preventDefault();
      const stage = stageRef.current;
      if (!stage) return;

      const p1 = { x: evt.touches[0].clientX, y: evt.touches[0].clientY };
      const p2 = { x: evt.touches[1].clientX, y: evt.touches[1].clientY };
      const dist = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));

      if (touchState.current.lastDist === 0) {
        touchState.current.lastDist = dist;
        return;
      }

      const oldScale = stage.scaleX();
      const scaleBy = dist / touchState.current.lastDist;
      const newScale = Math.max(0.3, Math.min(5, oldScale * scaleBy));

      const center = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
      const pointTo = {
        x: (center.x - stage.x()) / oldScale,
        y: (center.y - stage.y()) / oldScale,
      };

      stage.scale({ x: newScale, y: newScale });
      stage.position({
        x: center.x - pointTo.x * newScale,
        y: center.y - pointTo.y * newScale,
      });
      setStageScale(newScale);
      touchState.current.lastDist = dist;
      stage.batchDraw();
    }
  };

  const handleTouchEnd = () => {
    touchState.current.lastDist = 0;
  };

  const filteredPlots = useMemo(() => {
    return plots.filter(p => filterStatus.includes(p.status));
  }, [plots, filterStatus]);

  const statuses = [
    { key: 'AVAILABLE', label: 'Available' },
    { key: 'HOLD', label: 'Hold' },
    { key: 'BOOKED', label: 'Booked' },
    { key: 'SOLD', label: 'Sold' },
    { key: 'BLOCKED', label: 'Blocked' },
  ];

  const toggleStatus = (key: string) => {
    setFilterStatus(prev =>
      prev.includes(key) ? prev.filter(s => s !== key) : [...prev, key]
    );
  };

  const googleMapsUrl = project?.latitude && project?.longitude
    ? `https://www.google.com/maps/search/?api=1&query=${project.latitude},${project.longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${project?.name || ''}, ${project?.city || 'Rewa'}, ${project?.state || 'Madhya Pradesh'}`)}`;

  return (
    <Box sx={{ minHeight: { xs: 'auto', md: 620 }, width: '100%', display: 'flex', flexDirection: 'column' }}>
      
      {/* ─── TOP FILTER BAR ─── */}
      <Box sx={{ p: 1.5, bgcolor: '#FFFFFF', borderBottom: '1px solid #E2E8F0', display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', zIndex: 10 }}>
        {/* Left: Filter Status Chips */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, flexWrap: 'wrap' }}>
          {statuses.map((s) => {
            const isSelected = filterStatus.includes(s.key);
            const count = plots.filter((p: any) => p.status === s.key).length;
            return (
              <Chip
                key={s.key}
                label={`${s.label}: ${count}`}
                size="small"
                onClick={() => toggleStatus(s.key)}
                sx={{
                  bgcolor: isSelected ? '#1B4FD8' : '#F1F5F9',
                  color: isSelected ? '#FFFFFF' : '#64748B',
                  border: isSelected ? '1.5px solid #1B4FD8' : '1px solid #CBD5E1',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  height: 28,
                  transition: 'all 0.2s ease',
                  '&:hover': { bgcolor: isSelected ? '#1541B5' : '#E2E8F0' },
                }}
              />
            );
          })}
        </Box>

        {/* Right: Search Plot # Input */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', flex: { xs: 1, sm: 'none' } }}>
          <TextField
            size="small"
            placeholder="Plot number likhkar search karein..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon fontSize="small" sx={{ mr: 0.8, color: '#1B4FD8' }} />,
            }}
            sx={{
              width: { xs: '100%', sm: 300, md: 340 },
              '& .MuiOutlinedInput-root': {
                borderRadius: 2.5,
                height: 38,
                fontSize: '0.88rem',
                fontWeight: 500,
                bgcolor: '#F8FAFC',
                '&:hover': { bgcolor: '#FFFFFF' },
                '&.Mui-focused': { bgcolor: '#FFFFFF' },
              },
            }}
          />
        </Box>
      </Box>

      {/* ─── MAIN CONTENT AREA: MAP (LEFT) & ALL DETAILS (RIGHT) ─── */}
      <Box sx={{ flex: 1, width: '100%', display: 'flex', flexDirection: { xs: 'column', md: 'row' }, position: 'relative' }}>
        
        {/* ─── LEFT: MAP CANVAS AREA (Strict height lock on mobile so scroll up never expands it) ─── */}
        <Box sx={{ width: { xs: '100%', md: 'auto' }, flex: { md: 1 }, height: { xs: 320, sm: 360, md: 580 }, maxHeight: { xs: 320, sm: 360, md: 580 }, flexShrink: 0, position: 'relative', overflow: 'hidden', p: { xs: 1, md: 1.5 }, bgcolor: '#F8FAFC' }}>
          <Box
            sx={{
              width: '100%',
              height: '100%',
              maxHeight: '100%',
              position: 'relative',
              overflow: 'hidden',
              borderRadius: 2.5,
              border: '2.5px solid #1B4FD8',
              boxShadow: '0 4px 20px rgba(27, 79, 216, 0.12), inset 0 0 10px rgba(15, 23, 42, 0.03)',
              bgcolor: '#F7F3EB',
            }}
            ref={containerRef}
          >
            {canvasSize.width > 0 && (
              <Stage
                ref={stageRef}
                width={canvasSize.width}
                height={canvasSize.height}
                draggable
                onWheel={handleWheel}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onClick={(e) => { if (e.target.name() === 'bg') setSelectedPlot(null); }}
              >
                <Layer>
                  {/* Soft Faded Brown Outer Backdrop */}
                  <Rect x={-10000} y={-10000} width={20000} height={20000} fill="#F7F3EB" name="bg" />

                  {/* 📐 Project Map Board */}
                  <Rect x={0} y={0} width={1600} height={1000} fill="#EFE8DC" stroke="#CBD5E1" strokeWidth={2} name="bg" />

                  {/* Map Objects / Road / Amenities */}
                  {showLayers.mapObjects && mapObjects.map((obj: any, i: number) => {
                    const geom = obj.geometry;
                    if (!geom?.coordinates?.[0]) return null;
                    const pts = polygonToKonvaPoints(geom.coordinates[0], 1600, 1000);
                    const fillColor = obj.display_style?.fillColor ?? MAP_OBJECT_COLORS[obj.type as keyof typeof MAP_OBJECT_COLORS] ?? '#94a3b8';
                    const center = polygonCenter(geom.coordinates[0]);
                    return (
                      <Group key={obj.id || i}>
                        <Line points={pts} closed fill={fillColor} opacity={0.35} stroke="#fff" strokeWidth={1.5} />
                        {obj.name && (
                          <Text x={center[0] * 1600 - 40} y={center[1] * 1000 - 7} width={80} text={obj.name} fontSize={11} fill="#334155" align="center" listening={false} />
                        )}
                      </Group>
                    );
                  })}

                  {/* Plots */}
                  {showLayers.plots && filteredPlots.map((plot: any) => {
                    const geom = plot.polygon_geometry;
                    if (!geom?.coordinates?.[0]) return null;
                    const pts = polygonToKonvaPoints(geom.coordinates[0], 1600, 1000);
                    const isHighlighted = highlightId === plot.id;
                    const isSelected = selectedPlot?.plot.id === plot.id;
                    const fillColor = getPlotColor(plot);
                    const center = polygonCenter(geom.coordinates[0]);

                    return (
                      <Group key={plot.id} onClick={(e) => handlePlotClick(e, plot)} onTap={(e) => handlePlotClick(e, plot)}>
                        <Line
                          points={pts}
                          closed
                          fill={fillColor}
                          opacity={0.8}
                          stroke={isHighlighted || isSelected ? '#1E293B' : '#fff'}
                          strokeWidth={isHighlighted || isSelected ? 3 : 1.5}
                        />
                        <Text
                          x={center[0] * 1600 - 20}
                          y={center[1] * 1000 - 8}
                          width={40}
                          text={plot.plot_number}
                          fontSize={10}
                          fontStyle="bold"
                          fill="#fff"
                          align="center"
                          listening={false}
                        />
                      </Group>
                    );
                  })}
                </Layer>
              </Stage>
            )}

            {/* Zoom hints & percentage */}
            <Box sx={{ position: 'absolute', bottom: 8, right: 8, display: 'flex', gap: 0.5, alignItems: 'center', zIndex: 5 }}>
              <Chip
                label={`${Math.round(stageScale * 100)}%`}
                size="small"
                onClick={() => { const s = stageRef.current; if (s) { s.scale({ x: 1, y: 1 }); s.position({ x: 0, y: 0 }); setStageScale(1); s.batchDraw(); } }}
                sx={{ cursor: 'pointer', fontWeight: 700, bgcolor: '#0F172A', color: '#38BDF8' }}
              />
              <Chip label="+" size="small" onClick={() => { const s = stageRef.current; if (s) { const sc = s.scaleX() * 1.2; s.scale({ x: sc, y: sc }); setStageScale(sc); s.batchDraw(); } }} sx={{ cursor: 'pointer', fontWeight: 700 }} />
              <Chip label="-" size="small" onClick={() => { const s = stageRef.current; if (s) { const sc = s.scaleX() / 1.2; s.scale({ x: sc, y: sc }); setStageScale(sc); s.batchDraw(); } }} sx={{ cursor: 'pointer', fontWeight: 700 }} />
              <Chip label="Reset" size="small" onClick={() => { const s = stageRef.current; if (s) { s.scale({ x: 1, y: 1 }); s.position({ x: 0, y: 0 }); setStageScale(1); s.batchDraw(); } }} sx={{ cursor: 'pointer' }} />
            </Box>

            {/* No plots hint */}
            {plots.filter(p => p.polygon_geometry?.coordinates?.[0]).length === 0 && (
              <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                <Typography variant="body2" sx={{ color: '#94A3B8', bgcolor: 'white', px: 3, py: 1.5, borderRadius: 2, boxShadow: 1 }}>
                  No plot layout available for this project yet.
                </Typography>
              </Box>
            )}
          </Box>
        </Box>

        {/* ─── RIGHT SIDEBAR PANEL (Plot Details on Desktop & Mobile | Overview on Desktop Only) ─── */}
        <Paper
          elevation={0}
          sx={{
            width: { xs: '100%', md: 360 },
            flexShrink: 0,
            bgcolor: '#FFFFFF',
            borderLeft: { md: '1px solid #E2E8F0' },
            borderTop: { xs: '2px solid #38BDF8', md: 'none' },
            p: 2.5,
            display: { xs: selectedPlot ? 'flex' : 'none', md: 'flex' },
            flexDirection: 'column',
            gap: 2.5,
            overflowY: 'auto',
            maxHeight: { md: 580 },
            zIndex: 10,
          }}
        >
          {/* 1. SELECTED PLOT DETAILS (If clicked) */}
          {selectedPlot ? (
            <Box sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: 2.5, border: '1.5px solid #38BDF8' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5, alignItems: 'center' }}>
                <Typography variant="h6" fontWeight={800} color="#0F172A">
                  Plot #{selectedPlot.plot.plot_number}
                </Typography>
                <IconButton size="small" onClick={() => setSelectedPlot(null)}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>

              <Chip
                label={selectedPlot.plot.status}
                size="small"
                sx={{
                  bgcolor: PLOT_COLORS[selectedPlot.plot.status as keyof typeof PLOT_COLORS] + '22',
                  color: PLOT_COLORS[selectedPlot.plot.status as keyof typeof PLOT_COLORS],
                  fontWeight: 700,
                  mb: 2,
                  width: 'fit-content',
                }}
              />

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
                {selectedPlot.plot.area && (
                  <Typography variant="body2" sx={{ color: '#475569' }}>
                    Area: <Typography component="span" fontWeight={700} color="text.primary">{selectedPlot.plot.area} {selectedPlot.plot.area_unit || 'SQ_FT'}</Typography>
                  </Typography>
                )}
                {selectedPlot.plot.width && selectedPlot.plot.length && (
                  <Typography variant="body2" sx={{ color: '#475569' }}>
                    Size: <Typography component="span" fontWeight={700} color="text.primary">{selectedPlot.plot.width} ft × {selectedPlot.plot.length} ft</Typography>
                  </Typography>
                )}
                {selectedPlot.plot.facing && (
                  <Typography variant="body2" sx={{ color: '#475569' }}>
                    Facing: <Typography component="span" fontWeight={700} color="text.primary">{selectedPlot.plot.facing.replace('_', ' ')}</Typography>
                  </Typography>
                )}
                {selectedPlot.plot.price && (
                  <Box sx={{ mt: 1, p: 1.5, bgcolor: '#FFFFFF', borderRadius: 2, border: '1px solid #E2E8F0' }}>
                    <Typography variant="caption" color="text.secondary">Price</Typography>
                    <Typography variant="h6" sx={{ color: '#1B4FD8', fontWeight: 800 }}>
                      ₹{Number(selectedPlot.plot.price).toLocaleString('en-IN')}
                    </Typography>
                  </Box>
                )}
                {selectedPlot.plot.status === 'AVAILABLE' && (
                  <Button size="medium" variant="contained" fullWidth sx={{ mt: 1.5, py: 1, borderRadius: 2, fontWeight: 700 }}>
                    Contact for Booking
                  </Button>
                )}
              </Box>
            </Box>
          ) : (
            <Box sx={{ p: 1.5, bgcolor: '#F8FAFC', borderRadius: 2, border: '1px solid #E2E8F0', textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                👉 Click any plot on the map to view specs
              </Typography>
            </Box>
          )}

          {/* DESKTOP ONLY DETAILS (To prevent duplication on mobile) */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, flexDirection: 'column', gap: 2.5 }}>
            <Divider />

            {/* 2. PROJECT OVERVIEW */}
            <Box>
              <Typography variant="subtitle1" fontWeight={700} mb={1.5} color="#0F172A">
                Project Overview
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Developer</Typography>
                  <Typography variant="body2" fontWeight={700} color="#0F172A">{project?.developer || 'N/A'}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Total Area</Typography>
                  <Typography variant="body2" fontWeight={700} color="#0F172A">{project?.total_area ? `${project.total_area} Sq Ft` : 'N/A'}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Total Plots</Typography>
                  <Typography variant="body2" fontWeight={700} color="#0F172A">{project?.total_plots || plots.length || 0}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Location</Typography>
                  <Typography variant="body2" fontWeight={700} color="#0F172A">{project?.address || `${project?.city || 'Rewa'}, ${project?.state || 'Madhya Pradesh'}`}</Typography>
                </Box>
              </Box>
            </Box>

            <Divider />

            {/* 3. REAL WORLD LOCATION & GOOGLE MAPS BUTTON */}
            <Box>
              <Typography variant="subtitle1" fontWeight={700} mb={1} color="#0F172A">
                Real World Location
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" mb={1.5}>
                {project?.address || `${project?.city || 'Rewa'}, ${project?.state || 'Madhya Pradesh'}`}
              </Typography>
              <Button
                fullWidth
                variant="contained"
                startIcon={<LocationOnIcon />}
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  borderRadius: 2,
                  fontWeight: 700,
                  bgcolor: '#1B4FD8',
                  textTransform: 'none',
                  boxShadow: 'none',
                  py: 1,
                  fontSize: '0.85rem',
                  '&:hover': { bgcolor: '#1541B5', boxShadow: 'none' },
                }}
              >
                See on Google Maps
              </Button>
            </Box>
          </Box>
        </Paper>
      </Box>

      {/* Layer Panel Drawer */}
      <Drawer anchor="right" open={layerPanelOpen} onClose={() => setLayerPanelOpen(false)}>
        <Box sx={{ width: 240, p: 3 }}>
          <Typography variant="h6" fontWeight={700} mb={2}>Map Layers</Typography>
          {Object.entries(showLayers).map(([key, val]) => (
            <Box key={key} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>{key}</Typography>
              <input type="checkbox" checked={val} onChange={(e) => setShowLayers(prev => ({ ...prev, [key]: e.target.checked }))} />
            </Box>
          ))}
        </Box>
      </Drawer>
    </Box>
  );
}