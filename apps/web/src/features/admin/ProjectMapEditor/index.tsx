'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import {
  Box, Typography, Button, CircularProgress, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, Alert, Chip, IconButton, Tooltip
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import { useRouter } from 'next/navigation';
import { apiGet, apiPost, apiPatch } from '@/lib/api';
import toast from 'react-hot-toast';

import EditorToolbar from './EditorToolbar';
import EditorSidebar from './EditorSidebar';
import type {
  EditorTool, PlotData, MapObjectData, SelectedObject,
  PhaseData, ClusterData, LocalPolygon,
} from './types';
import { genTempId, normalizeGeometry } from './geometry';

const EditorCanvas = dynamic(() => import('./EditorCanvas'), { ssr: false });

interface ProjectMapEditorProps {
  projectId: string;
}

interface HistoryState {
  plots: PlotData[];
  mapObjects: MapObjectData[];
}

export default function ProjectMapEditor({ projectId }: ProjectMapEditorProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const stageRef = useRef<any>(null);

  // ─── State ───────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [activeTool, setActiveTool] = useState<EditorTool>('SELECT');
  const [activePhaseId, setActivePhaseId] = useState<string | null>(null);
  const [selected, setSelected] = useState<SelectedObject>(null);
  const [showLayers, setShowLayers] = useState<Record<string, boolean>>({ plots: true, mapObjects: true });

  const [plots, setPlots] = useState<PlotData[]>([]);
  const [mapObjects, setMapObjects] = useState<MapObjectData[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [boardSize, setBoardSize] = useState({ width: 1600, height: 1000 });

  const [phases, setPhases] = useState<PhaseData[]>([]);
  const [clusters, setClusters] = useState<ClusterData[]>([]);

  // Undo / Redo history
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // New Plot Dialog
  const [pendingGeometry, setPendingGeometry] = useState<LocalPolygon | null>(null);
  const [plotFormOpen, setPlotFormOpen] = useState(false);
  const [plotForm, setPlotForm] = useState({
    plotNumber: '', area: '', areaUnit: 'SQ_FT', width: '', length: '',
    price: '', facing: '', status: 'AVAILABLE', description: '',
  });

  // ─── Canvas Resize ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;
    const updateSize = () => {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth || containerRef.current.offsetWidth;
        const h = containerRef.current.clientHeight || containerRef.current.offsetHeight;
        if (w > 0 && h > 0) {
          setCanvasSize({ width: w, height: h });
        }
      }
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(containerRef.current);
    window.addEventListener('resize', updateSize);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  // ─── Load Project Data ───────────────────────────────────────────────────
  const loadProjectData = useCallback(async (showLoading = true) => {
    if (!projectId) return;
    if (showLoading) setLoading(true);
    try {
      const data = await apiGet<any>(`/admin/projects/${projectId}`);
      setProject(data);
      
      const existingPlots: PlotData[] = (data.plots || []).map((p: any) => ({
        id: p.id,
        tempId: genTempId(),
        plotNumber: p.plot_number,
        area: Number(p.area),
        areaUnit: p.area_unit,
        width: p.width ? Number(p.width) : undefined,
        length: p.length ? Number(p.length) : undefined,
        price: Number(p.price),
        facing: p.facing,
        status: p.status,
        displayColor: p.display_color,
        description: p.description,
        geometry: normalizeGeometry(p.polygon_geometry),
        phaseId: p.phase_id,
        clusterId: p.cluster_id,
        isDirty: false,
      }));
      setPlots(existingPlots);

      const existingObjects: MapObjectData[] = (data.mapObjects || []).map((o: any) => ({
        id: o.id,
        tempId: genTempId(),
        type: o.type,
        name: o.name,
        geometry: normalizeGeometry(o.geometry) as LocalPolygon,
        displayStyle: o.display_style,
        phaseId: o.phase_id,
        metadata: o.metadata,
        isDirty: false,
      }));
      setMapObjects(existingObjects);

      const existingPhases: PhaseData[] = (data.phases || []).map((ph: any) => ({
        id: ph.id,
        name: ph.name,
        description: ph.description,
        orderIndex: ph.order_index,
        status: ph.status,
      }));
      setPhases(existingPhases);

      const existingClusters: ClusterData[] = (data.clusters || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        color: c.color,
        phaseId: c.phase_id,
      }));
      setClusters(existingClusters);
      
      // Initialize history baseline
      setHistory([{ plots: existingPlots, mapObjects: existingObjects }]);
      setHistoryIndex(0);
    } catch (err) {
      console.error('Failed to load project:', err);
      toast.error('Failed to load project data');
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadProjectData(true);
  }, [loadProjectData]);

  // ─── History ─────────────────────────────────────────────────────────────
  const pushHistory = useCallback((newPlots: PlotData[], newObjects: MapObjectData[]) => {
    const snapshot: HistoryState = { plots: newPlots, mapObjects: newObjects };
    setHistoryIndex((currentIndex) => {
      setHistory((prev) => {
        const trimmed = prev.slice(0, currentIndex + 1);
        return [...trimmed, snapshot].slice(-50); // Keep last 50
      });
      return Math.min(currentIndex + 1, 49);
    });
  }, []);

  const handlePlotsChange = useCallback((newPlots: PlotData[]) => {
    pushHistory(newPlots, mapObjects);
    setPlots(newPlots);
  }, [mapObjects, pushHistory]);

  const handleMapObjectsChange = useCallback((newObjects: MapObjectData[]) => {
    pushHistory(plots, newObjects);
    setMapObjects(newObjects);
  }, [plots, pushHistory]);

  const handleUndo = useCallback(() => {
    setHistoryIndex((currentIndex) => {
      if (currentIndex <= 0) return currentIndex;
      const newIndex = currentIndex - 1;
      setPlots(history[newIndex].plots);
      setMapObjects(history[newIndex].mapObjects);
      return newIndex;
    });
  }, [history]);

  const handleRedo = useCallback(() => {
    setHistoryIndex((currentIndex) => {
      if (currentIndex >= history.length - 1) return currentIndex;
      const newIndex = currentIndex + 1;
      setPlots(history[newIndex].plots);
      setMapObjects(history[newIndex].mapObjects);
      return newIndex;
    });
  }, [history]);

  // Keyboard shortcuts
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); handleUndo(); }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) { e.preventDefault(); handleRedo(); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [handleUndo, handleRedo]);

  // ─── New Plot Flow ────────────────────────────────────────────────────────
  const handleNewPlotDrawn = useCallback((geometry: LocalPolygon) => {
    setPendingGeometry(geometry);
    setPlotFormOpen(true);
  }, []);

  const handlePlotFormSave = () => {
    if (!plotForm.plotNumber || !plotForm.price) {
      toast.error('Plot number and price are required');
      return;
    }
    if (!pendingGeometry) return;

    const newPlot: PlotData = {
      tempId: genTempId(),
      plotNumber: plotForm.plotNumber,
      area: plotForm.area ? parseFloat(plotForm.area) : undefined,
      areaUnit: plotForm.areaUnit,
      width: plotForm.width ? parseFloat(plotForm.width) : undefined,
      length: plotForm.length ? parseFloat(plotForm.length) : undefined,
      price: parseFloat(plotForm.price),
      facing: plotForm.facing || undefined,
      status: plotForm.status as any,
      description: plotForm.description || undefined,
      geometry: pendingGeometry,
      phaseId: activePhaseId,
      isDirty: true,
    };

    handlePlotsChange([...plots, newPlot]);
    setPlotFormOpen(false);
    setPendingGeometry(null);
    setPlotForm({ plotNumber: '', area: '', areaUnit: 'SQ_FT', width: '', length: '', price: '', facing: '', status: 'AVAILABLE', description: '' });
    setActiveTool('SELECT');
    toast.success(`Plot ${newPlot.plotNumber} added`);
  };

  // ─── Phases ───────────────────────────────────────────────────────────────
  const handleAddPhase = async (name: string) => {
    try {
      const data = await apiPost<any>(`/admin/projects/${projectId}/phases`, {
        name, order_index: phases.length, status: 'PLANNED',
      });
      setPhases((prev) => [...prev, { id: data.data.id, name: data.data.name, orderIndex: data.data.order_index, status: data.data.status }]);
      toast.success(`Phase "${name}" created`);
    } catch {
      toast.error('Failed to create phase');
    }
  };

  // ─── Save ─────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const originalPlots = history[0]?.plots || [];
      const originalObjects = history[0]?.mapObjects || [];

      const currentPlotIds = new Set(plots.map(p => p.id).filter(Boolean));
      const deletedPlotIds = originalPlots
        .filter(p => p.id && !currentPlotIds.has(p.id))
        .map(p => p.id);

      const currentObjectIds = new Set(mapObjects.map(o => o.id).filter(Boolean));
      const deletedObjectIds = originalObjects
        .filter(o => o.id && !currentObjectIds.has(o.id))
        .map(o => o.id);

      await apiPost(`/admin/projects/${projectId}/map-data/bulk-save`, {
        plots: plots.map((p) => ({
          id: p.id,
          plot_number: p.plotNumber,
          area: p.area,
          area_unit: p.areaUnit ?? 'SQ_FT',
          width: p.width,
          length: p.length,
          price: p.price,
          facing: p.facing,
          status: p.status,
          display_color: p.displayColor,
          description: p.description,
          geometry: p.geometry,
          phase_id: p.phaseId,
          cluster_id: p.clusterId,
        })),
        mapObjects: mapObjects.map((o) => ({
          id: o.id,
          type: o.type,
          name: o.name,
          geometry: o.geometry,
          display_style: o.displayStyle,
          phase_id: o.phaseId,
          metadata: o.metadata,
        })),
        deletedPlotIds,
        deletedObjectIds,
      });
      toast.success('Map saved as draft!');
      
      // Reload project data silently to populate new DB IDs and reset history baseline
      await loadProjectData(false);
    } catch {
      toast.error('Failed to save map');
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Publish ──────────────────────────────────────────────────────────────
  const handlePublish = async () => {
    if (!confirm('Publish this map? It will be visible to users.')) return;
    try {
      await handleSave();
      const version = await apiPost<any>(`/admin/projects/${projectId}/map-versions`, { snapshot: {} });
      await apiPatch(`/admin/projects/${projectId}/map-versions/${version.data.id}/publish`, {});
      toast.success('Map published!');
    } catch {
      toast.error('Failed to publish');
    }
  };

  // ─── Zoom ─────────────────────────────────────────────────────────────────
  const handleZoom = (direction: 'in' | 'out' | 'reset') => {
    const stage = stageRef.current;
    if (!stage) return;
    if (direction === 'reset') { stage.scale({ x: 1, y: 1 }); stage.position({ x: 0, y: 0 }); stage.batchDraw(); return; }
    const factor = direction === 'in' ? 1.2 : 1 / 1.2;
    const newScale = Math.max(0.3, Math.min(5, stage.scaleX() * factor));
    stage.scale({ x: newScale, y: newScale });
    stage.batchDraw();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading project map...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      display: 'flex', flexDirection: 'column', bgcolor: '#0A0F1E',
      ...(isFullscreen ? {
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        height: '100vh',
      } : {
        height: '100vh',
      })
    }}>
      {/* Top Bar */}
      <Box sx={{ display: 'flex', alignItems: 'center', px: 2, py: 1, bgcolor: '#0F172A', borderBottom: '1px solid #1E293B', gap: 2, flexShrink: 0 }}>
        <Button startIcon={<ArrowBackIcon />} size="small" onClick={() => router.back()} sx={{ color: '#94A3B8' }}>Back</Button>
        <Typography variant="subtitle1" fontWeight={700} sx={{ color: 'white' }}>
          Map Editor — {project?.name}
        </Typography>
        <Chip label={`${plots.length} Plots`} size="small" sx={{ bgcolor: '#1E293B', color: '#94A3B8' }} />
        <Chip label={`${mapObjects.length} Objects`} size="small" sx={{ bgcolor: '#1E293B', color: '#94A3B8' }} />
        
        <Tooltip title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Mode"}>
          <IconButton size="small" onClick={() => setIsFullscreen(!isFullscreen)} sx={{ color: '#94A3B8', ml: 1 }}>
            {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
          </IconButton>
        </Tooltip>

        <Box sx={{ flex: 1 }} />
        <Typography variant="caption" sx={{ color: '#475569' }}>
          {activeTool === 'SELECT' ? 'Select mode' : `Drawing: ${activeTool.replace('DRAW_', '')}`}
        </Typography>
        <Button variant="outlined" size="small" onClick={handleSave} disabled={isSaving} sx={{ borderColor: '#22c55e', color: '#22c55e' }}>
          {isSaving ? 'Saving...' : 'Save Draft'}
        </Button>
        <Button variant="contained" size="small" onClick={handlePublish} sx={{ bgcolor: '#f59e0b', '&:hover': { bgcolor: '#d97706' } }}>
          Publish
        </Button>
      </Box>

      {/* Main Editor Area */}
      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Toolbar */}
        <EditorToolbar
          activeTool={activeTool}
          onToolChange={setActiveTool}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={historyIndex > 0}
          canRedo={historyIndex < history.length - 1}
          onZoomIn={() => handleZoom('in')}
          onZoomOut={() => handleZoom('out')}
          onZoomReset={() => handleZoom('reset')}
          onSave={handleSave}
          onPublish={handlePublish}
          isSaving={isSaving}
        />

        {/* Canvas */}
        <Box ref={containerRef} sx={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          {canvasSize.width > 0 && (
            <EditorCanvas
              stageRef={stageRef}
              width={canvasSize.width}
              height={canvasSize.height}
              boardWidth={boardSize.width}
              boardHeight={boardSize.height}
              onBoardSizeChange={setBoardSize}
              activeTool={activeTool}
              activePhaseId={activePhaseId}
              plots={plots}
              mapObjects={mapObjects}
              selected={selected}
              onSelect={setSelected}
              onPlotsChange={handlePlotsChange}
              onMapObjectsChange={handleMapObjectsChange}
              onNewPlotDrawn={handleNewPlotDrawn}
              onToolChange={setActiveTool}
              showLayers={showLayers}
            />
          )}
        </Box>

        {/* Sidebar */}
        <EditorSidebar
          selected={selected}
          plots={plots}
          mapObjects={mapObjects}
          phases={phases}
          clusters={clusters}
          onPlotsChange={handlePlotsChange}
          onMapObjectsChange={handleMapObjectsChange}
          showLayers={showLayers}
          onLayersChange={setShowLayers}
          activePhaseId={activePhaseId}
          onPhaseChange={setActivePhaseId}
          onAddPhase={handleAddPhase}
        />
      </Box>

      {/* Plot Info Dialog */}
      <Dialog open={plotFormOpen} onClose={() => { setPlotFormOpen(false); setPendingGeometry(null); setActiveTool('SELECT'); }} maxWidth="sm" fullWidth>
        <DialogTitle>New Plot Details</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, pt: 1 }}>
            <TextField label="Plot Number *" value={plotForm.plotNumber} onChange={(e) => setPlotForm({ ...plotForm, plotNumber: e.target.value })} size="small" />
            <TextField label="Status" select value={plotForm.status} onChange={(e) => setPlotForm({ ...plotForm, status: e.target.value })} size="small">
              {['AVAILABLE', 'HOLD', 'BOOKED', 'SOLD', 'BLOCKED'].map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </TextField>
            <TextField label="Area" type="number" value={plotForm.area} onChange={(e) => setPlotForm({ ...plotForm, area: e.target.value })} size="small" />
            <TextField label="Area Unit" select value={plotForm.areaUnit} onChange={(e) => setPlotForm({ ...plotForm, areaUnit: e.target.value })} size="small">
              {['SQ_FT', 'SQ_MT', 'ACRE', 'BIGHA', 'HECTARE'].map((u) => <MenuItem key={u} value={u}>{u}</MenuItem>)}
            </TextField>
            <TextField label="Width (ft)" type="number" value={plotForm.width} onChange={(e) => setPlotForm({ ...plotForm, width: e.target.value })} size="small" />
            <TextField label="Length (ft)" type="number" value={plotForm.length} onChange={(e) => setPlotForm({ ...plotForm, length: e.target.value })} size="small" />
            <TextField label="Price (₹) *" type="number" value={plotForm.price} onChange={(e) => setPlotForm({ ...plotForm, price: e.target.value })} size="small" />
            <TextField label="Facing" select value={plotForm.facing} onChange={(e) => setPlotForm({ ...plotForm, facing: e.target.value })} size="small">
              <MenuItem value="">None</MenuItem>
              {['NORTH','SOUTH','EAST','WEST','NORTH_EAST','NORTH_WEST','SOUTH_EAST','SOUTH_WEST'].map((f) => <MenuItem key={f} value={f}>{f.replace('_',' ')}</MenuItem>)}
            </TextField>
            <TextField label="Description" value={plotForm.description} onChange={(e) => setPlotForm({ ...plotForm, description: e.target.value })} size="small" multiline rows={2} sx={{ gridColumn: '1 / -1' }} />
          </Box>
          {pendingGeometry && (
            <Alert severity="success" sx={{ mt: 2 }}>
              ✓ Polygon with {pendingGeometry.coordinates.length} points captured
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setPlotFormOpen(false); setPendingGeometry(null); setActiveTool('SELECT'); }}>Cancel</Button>
          <Button variant="contained" onClick={handlePlotFormSave}>Add Plot</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
