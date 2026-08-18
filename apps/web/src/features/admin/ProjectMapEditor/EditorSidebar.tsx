'use client';

import React, { useState } from 'react';
import {
  Box, Typography, Divider, TextField, MenuItem,
  Button, FormControlLabel, Switch, Chip, IconButton,
  Accordion, AccordionSummary, AccordionDetails,
} from '@mui/material';
import type { PlotData, MapObjectData, SelectedObject, PlotStatus, PhaseData, ClusterData } from './types';
import { PLOT_COLORS, MAP_OBJECT_COLORS, MAP_OBJECT_LABELS } from './types';

interface EditorSidebarProps {
  selected: SelectedObject;
  plots: PlotData[];
  mapObjects: MapObjectData[];
  phases: PhaseData[];
  clusters: ClusterData[];
  onPlotsChange: (plots: PlotData[]) => void;
  onMapObjectsChange: (objs: MapObjectData[]) => void;
  showLayers: Record<string, boolean>;
  onLayersChange: (layers: Record<string, boolean>) => void;
  activePhaseId: string | null;
  onPhaseChange: (id: string | null) => void;
  onAddPhase: (name: string) => void;
}

export default function EditorSidebar({
  selected, plots, mapObjects, phases, clusters,
  onPlotsChange, onMapObjectsChange,
  showLayers, onLayersChange, activePhaseId, onPhaseChange, onAddPhase,
}: EditorSidebarProps) {
  const [newPhaseName, setNewPhaseName] = useState('');

  const selectedPlot = selected?.kind === 'plot'
    ? plots.find((p) => p.tempId === selected.tempId)
    : null;

  const selectedObj = selected?.kind === 'mapObject'
    ? mapObjects.find((o) => o.tempId === selected.tempId)
    : null;

  const updatePlot = (updates: Partial<PlotData>) => {
    if (!selectedPlot) return;
    onPlotsChange(
      plots.map((p) => p.tempId === selectedPlot.tempId ? { ...p, ...updates, isDirty: true } : p)
    );
  };

  const updateObj = (updates: Partial<MapObjectData>) => {
    if (!selectedObj) return;
    onMapObjectsChange(
      mapObjects.map((o) => o.tempId === selectedObj.tempId ? { ...o, ...updates, isDirty: true } : o)
    );
  };

  const statuses: PlotStatus[] = ['AVAILABLE', 'HOLD', 'BOOKED', 'SOLD', 'BLOCKED'];
  const facings = ['NORTH', 'SOUTH', 'EAST', 'WEST', 'NORTH_EAST', 'NORTH_WEST', 'SOUTH_EAST', 'SOUTH_WEST'];
  const areaUnits = ['SQ_FT', 'SQ_MT', 'ACRE', 'BIGHA', 'HECTARE'];

  return (
    <Box sx={{ width: 300, bgcolor: '#0F172A', color: 'white', display: 'flex', flexDirection: 'column', overflow: 'hidden', borderLeft: '1px solid #1E293B', flexShrink: 0 }}>
      {/* Properties Panel */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
        <Typography variant="caption" sx={{ color: '#64748B', textTransform: 'uppercase', fontWeight: 700, letterSpacing: 1 }}>
          {selected ? 'Properties' : 'Object Properties'}
        </Typography>

        {!selected && (
          <Typography variant="body2" sx={{ mt: 2, color: '#475569' }}>
            Select an object on the canvas to edit its properties.
          </Typography>
        )}

        {/* Plot Properties */}
        {selectedPlot && (
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Typography variant="subtitle2" sx={{ color: '#94A3B8', fontWeight: 700 }}>
              Plot #{selectedPlot.plotNumber}
            </Typography>

            <TextField
              label="Plot Number" size="small" fullWidth
              value={selectedPlot.plotNumber}
              onChange={(e) => updatePlot({ plotNumber: e.target.value })}
              InputLabelProps={{ style: { color: '#94A3B8' } }}
              InputProps={{ style: { color: 'white', backgroundColor: 'transparent', borderColor: '#334155' } }}
              sx={{ '& .MuiOutlinedInput-notchedOutline': { borderColor: '#334155' } }}
            />

            <TextField
              label="Status" select size="small" fullWidth
              value={selectedPlot.status}
              onChange={(e) => updatePlot({ status: e.target.value as PlotStatus })}
              InputLabelProps={{ style: { color: '#94A3B8' } }}
              InputProps={{ style: { color: 'white', backgroundColor: 'transparent' } }}
              sx={{ '& .MuiOutlinedInput-notchedOutline': { borderColor: '#334155' } }}
            >
              {statuses.map((s) => (
                <MenuItem key={s} value={s}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: PLOT_COLORS[s] }} />
                    {s}
                  </Box>
                </MenuItem>
              ))}
            </TextField>

            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                label="Area" size="small" type="number"
                value={selectedPlot.area ?? ''}
                onChange={(e) => updatePlot({ area: parseFloat(e.target.value) })}
                InputLabelProps={{ style: { color: '#94A3B8' } }}
                InputProps={{ style: { color: 'white', backgroundColor: 'transparent' } }}
                sx={{ flex: 1, '& .MuiOutlinedInput-notchedOutline': { borderColor: '#334155' } }}
              />
              <TextField
                label="Unit" select size="small"
                value={selectedPlot.areaUnit ?? 'SQ_FT'}
                onChange={(e) => updatePlot({ areaUnit: e.target.value })}
                InputLabelProps={{ style: { color: '#94A3B8' } }}
                InputProps={{ style: { color: 'white', backgroundColor: 'transparent' } }}
                sx={{ width: 100, '& .MuiOutlinedInput-notchedOutline': { borderColor: '#334155' } }}
              >
                {areaUnits.map((u) => <MenuItem key={u} value={u}>{u}</MenuItem>)}
              </TextField>
            </Box>

            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField label="Width (ft)" size="small" type="number"
                value={selectedPlot.width ?? ''}
                onChange={(e) => updatePlot({ width: parseFloat(e.target.value) })}
                InputLabelProps={{ style: { color: '#94A3B8' } }}
                InputProps={{ style: { color: 'white', backgroundColor: 'transparent' } }}
                sx={{ flex: 1, '& .MuiOutlinedInput-notchedOutline': { borderColor: '#334155' } }}
              />
              <TextField label="Length (ft)" size="small" type="number"
                value={selectedPlot.length ?? ''}
                onChange={(e) => updatePlot({ length: parseFloat(e.target.value) })}
                InputLabelProps={{ style: { color: '#94A3B8' } }}
                InputProps={{ style: { color: 'white', backgroundColor: 'transparent' } }}
                sx={{ flex: 1, '& .MuiOutlinedInput-notchedOutline': { borderColor: '#334155' } }}
              />
            </Box>

            <TextField label="Price (₹)" size="small" type="number"
              value={selectedPlot.price ?? ''}
              onChange={(e) => updatePlot({ price: parseFloat(e.target.value) })}
              InputLabelProps={{ style: { color: '#94A3B8' } }}
              InputProps={{ style: { color: 'white', backgroundColor: 'transparent' } }}
              sx={{ '& .MuiOutlinedInput-notchedOutline': { borderColor: '#334155' } }}
            />

            <TextField label="Facing" select size="small" fullWidth
              value={selectedPlot.facing ?? ''}
              onChange={(e) => updatePlot({ facing: e.target.value })}
              InputLabelProps={{ style: { color: '#94A3B8' } }}
              InputProps={{ style: { color: 'white', backgroundColor: 'transparent' } }}
              sx={{ '& .MuiOutlinedInput-notchedOutline': { borderColor: '#334155' } }}
            >
              <MenuItem value="">None</MenuItem>
              {facings.map((f) => <MenuItem key={f} value={f}>{f.replace('_', ' ')}</MenuItem>)}
            </TextField>

            <TextField label="Description" size="small" fullWidth multiline rows={2}
              value={selectedPlot.description ?? ''}
              onChange={(e) => updatePlot({ description: e.target.value })}
              InputLabelProps={{ style: { color: '#94A3B8' } }}
              InputProps={{ style: { color: 'white', backgroundColor: 'transparent' } }}
              sx={{ '& .MuiOutlinedInput-notchedOutline': { borderColor: '#334155' } }}
            />

            <TextField label="Phase" select size="small" fullWidth
              value={selectedPlot.phaseId ?? ''}
              onChange={(e) => updatePlot({ phaseId: e.target.value || null })}
              InputLabelProps={{ style: { color: '#94A3B8' } }}
              InputProps={{ style: { color: 'white', backgroundColor: 'transparent' } }}
              sx={{ '& .MuiOutlinedInput-notchedOutline': { borderColor: '#334155' } }}
            >
              <MenuItem value="">No Phase</MenuItem>
              {phases.map((ph) => <MenuItem key={ph.id ?? ph.name} value={ph.id ?? ph.name}>{ph.name}</MenuItem>)}
            </TextField>

            <TextField label="Cluster" select size="small" fullWidth
              value={selectedPlot.clusterId ?? ''}
              onChange={(e) => updatePlot({ clusterId: e.target.value || null })}
              InputLabelProps={{ style: { color: '#94A3B8' } }}
              InputProps={{ style: { color: 'white', backgroundColor: 'transparent' } }}
              sx={{ '& .MuiOutlinedInput-notchedOutline': { borderColor: '#334155' } }}
            >
              <MenuItem value="">No Cluster</MenuItem>
              {clusters.map((c) => <MenuItem key={c.id ?? c.name} value={c.id ?? c.name}>{c.name}</MenuItem>)}
            </TextField>

            <Button
              variant="outlined"
              color="error"
              size="small"
              onClick={() => {
                onPlotsChange(plots.filter(p => p.tempId !== selectedPlot.tempId));
              }}
              sx={{ mt: 1, borderColor: '#ef4444', color: '#ef4444', '&:hover': { bgcolor: 'rgba(239,68,68,0.1)', borderColor: '#ef4444' } }}
            >
              Delete Plot
            </Button>
          </Box>
        )}

        {/* Map Object Properties */}
        {selectedObj && (
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Typography variant="subtitle2" sx={{ color: '#94A3B8', fontWeight: 700 }}>
              {MAP_OBJECT_LABELS[selectedObj.type]}
            </Typography>
            <TextField label="Name" size="small" fullWidth
              value={selectedObj.name ?? ''}
              onChange={(e) => updateObj({ name: e.target.value })}
              InputLabelProps={{ style: { color: '#94A3B8' } }}
              InputProps={{ style: { color: 'white', backgroundColor: 'transparent' } }}
              sx={{ '& .MuiOutlinedInput-notchedOutline': { borderColor: '#334155' } }}
            />
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Typography variant="caption" sx={{ color: '#94A3B8' }}>Fill Color</Typography>
              <input
                type="color"
                value={selectedObj.displayStyle?.fillColor ?? '#94a3b8'}
                onChange={(e) => updateObj({ displayStyle: { ...selectedObj.displayStyle, fillColor: e.target.value } })}
                style={{ cursor: 'pointer', borderRadius: 4, border: 'none', height: 32, width: 50 }}
              />
            </Box>

            <Button
              variant="outlined"
              color="error"
              size="small"
              onClick={() => {
                onMapObjectsChange(mapObjects.filter(o => o.tempId !== selectedObj.tempId));
              }}
              sx={{ mt: 1, borderColor: '#ef4444', color: '#ef4444', '&:hover': { bgcolor: 'rgba(239,68,68,0.1)', borderColor: '#ef4444' } }}
            >
              Delete Object
            </Button>
          </Box>
        )}

        <Divider sx={{ borderColor: '#1E293B', my: 2 }} />

        {/* Phases */}
        <Typography variant="caption" sx={{ color: '#64748B', textTransform: 'uppercase', fontWeight: 700, letterSpacing: 1 }}>
          Phases
        </Typography>
        <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          <Chip
            label="All"
            size="small"
            onClick={() => onPhaseChange(null)}
            sx={{ bgcolor: activePhaseId === null ? '#3b82f6' : '#1E293B', color: 'white', cursor: 'pointer' }}
          />
          {phases.map((ph) => (
            <Chip
              key={ph.id ?? ph.name}
              label={ph.name}
              size="small"
              onClick={() => onPhaseChange(ph.id ?? ph.name)}
              sx={{ bgcolor: activePhaseId === (ph.id ?? ph.name) ? '#3b82f6' : '#1E293B', color: 'white', cursor: 'pointer' }}
            />
          ))}
        </Box>
        <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
          <TextField
            size="small" placeholder="New phase name"
            value={newPhaseName}
            onChange={(e) => setNewPhaseName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newPhaseName.trim()) {
                onAddPhase(newPhaseName.trim());
                setNewPhaseName('');
              }
            }}
            InputProps={{ style: { color: 'white', backgroundColor: 'transparent', fontSize: 12 } }}
            sx={{ flex: 1, '& .MuiOutlinedInput-notchedOutline': { borderColor: '#334155' } }}
          />
          <Button
            size="small" variant="contained"
            onClick={() => { if (newPhaseName.trim()) { onAddPhase(newPhaseName.trim()); setNewPhaseName(''); } }}
            sx={{ minWidth: 40, px: 1 }}
          >+</Button>
        </Box>

        <Divider sx={{ borderColor: '#1E293B', my: 2 }} />

        {/* Layer Controls */}
        <Typography variant="caption" sx={{ color: '#64748B', textTransform: 'uppercase', fontWeight: 700, letterSpacing: 1 }}>
          Layer Controls
        </Typography>
        <Box sx={{ mt: 1 }}>
          {Object.keys(showLayers).map((layer) => (
            <FormControlLabel
              key={layer}
              control={
                <Switch
                  size="small"
                  checked={showLayers[layer]}
                  onChange={(e) => onLayersChange({ ...showLayers, [layer]: e.target.checked })}
                  sx={{ '& .MuiSwitch-thumb': { bgcolor: showLayers[layer] ? '#3b82f6' : '#475569' } }}
                />
              }
              label={<Typography variant="body2" sx={{ color: '#94A3B8', textTransform: 'capitalize' }}>{layer}</Typography>}
              sx={{ display: 'flex', m: 0 }}
            />
          ))}
        </Box>

        {/* Stats */}
        <Divider sx={{ borderColor: '#1E293B', my: 2 }} />
        <Typography variant="caption" sx={{ color: '#64748B', textTransform: 'uppercase', fontWeight: 700, letterSpacing: 1 }}>
          Summary
        </Typography>
        <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Typography variant="body2" sx={{ color: '#94A3B8' }}>Total Plots: <b style={{ color: 'white' }}>{plots.length}</b></Typography>
          <Typography variant="body2" sx={{ color: '#94A3B8' }}>Map Objects: <b style={{ color: 'white' }}>{mapObjects.length}</b></Typography>
          <Typography variant="body2" sx={{ color: '#94A3B8' }}>Phases: <b style={{ color: 'white' }}>{phases.length}</b></Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
            {['AVAILABLE', 'HOLD', 'SOLD', 'BLOCKED'].map((s) => (
              <Chip
                key={s}
                label={`${s}: ${plots.filter(p => p.status === s).length}`}
                size="small"
                sx={{ bgcolor: PLOT_COLORS[s as PlotStatus] + '33', color: PLOT_COLORS[s as PlotStatus], fontSize: 10 }}
              />
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
