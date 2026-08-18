'use client';

import React from 'react';
import {
  Box, Tooltip, Divider, Typography,
  ToggleButton, ToggleButtonGroup, IconButton,
} from '@mui/material';
import type { EditorTool, MapObjectType } from './types';

interface EditorToolbarProps {
  activeTool: EditorTool;
  onToolChange: (tool: EditorTool) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onSave: () => void;
  onPublish: () => void;
  isSaving: boolean;
}

const tools: { tool: EditorTool; label: string; icon: string; group: string }[] = [
  { tool: 'SELECT',         label: 'Select Object',       icon: '↖',  group: 'basic' },
  { tool: 'PAN',            label: 'Pan (Hand Tool)',     icon: '🖐',  group: 'basic' },
  { tool: 'DELETE',         label: 'Delete Object',       icon: '✕',  group: 'basic' },
  { tool: 'DRAW_BOUNDARY',  label: 'Draw Boundary',       icon: '⬡',  group: 'draw' },
  { tool: 'DRAW_LAND',      label: 'Draw Land Parcel',    icon: '◼',  group: 'draw' },
  { tool: 'DRAW_ROAD',      label: 'Draw Road',           icon: '—',  group: 'draw' },
  { tool: 'DRAW_GARDEN',    label: 'Draw Garden',         icon: '🌳',  group: 'draw' },
  { tool: 'DRAW_PARK',      label: 'Draw Park',           icon: '⛳',  group: 'draw' },
  { tool: 'DRAW_WATER',     label: 'Draw Water Area',     icon: '💧',  group: 'draw' },
  { tool: 'DRAW_AMENITY',   label: 'Draw Amenity',        icon: '🏠',  group: 'draw' },
  { tool: 'DRAW_PLOT',      label: 'Draw Plot',           icon: '⊕',  group: 'plot' },
];

const toolColors: Record<string, string> = {
  SELECT:        '#3b82f6',
  PAN:           '#8b5cf6',
  DELETE:        '#ef4444',
  DRAW_BOUNDARY: '#1e40af',
  DRAW_LAND:     '#92400e',
  DRAW_ROAD:     '#475569',
  DRAW_GARDEN:   '#16a34a',
  DRAW_PARK:     '#15803d',
  DRAW_WATER:    '#0284c7',
  DRAW_AMENITY:  '#0891b2',
  DRAW_PLOT:     '#22c55e',
};

export default function EditorToolbar({
  activeTool, onToolChange,
  onUndo, onRedo, canUndo, canRedo,
  onZoomIn, onZoomOut, onZoomReset,
  onSave, onPublish, isSaving,
}: EditorToolbarProps) {
  return (
    <Box
      sx={{
        width: 72,
        height: '100%',
        bgcolor: '#0F172A',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        py: 2,
        gap: 0.5,
        borderRight: '1px solid #1E293B',
        overflowY: 'auto',
        flexShrink: 0,
      }}
    >
      {tools.map((t) => (
        <Tooltip key={t.tool} title={t.label} placement="right" arrow>
          <Box
            onClick={() => onToolChange(t.tool)}
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: t.icon.length > 1 ? 18 : 22,
              cursor: 'pointer',
              bgcolor: activeTool === t.tool ? toolColors[t.tool] || '#3b82f6' : 'transparent',
              color: activeTool === t.tool ? 'white' : '#94A3B8',
              border: activeTool === t.tool ? 'none' : '1px solid transparent',
              transition: 'all 0.15s',
              '&:hover': {
                bgcolor: activeTool === t.tool ? toolColors[t.tool] : '#1E293B',
                color: 'white',
              },
            }}
          >
            {t.icon}
          </Box>
        </Tooltip>
      ))}

      <Divider sx={{ borderColor: '#1E293B', width: '80%', my: 1 }} />

      {/* Undo / Redo */}
      <Tooltip title="Undo (Ctrl+Z)" placement="right">
        <Box
          onClick={canUndo ? onUndo : undefined}
          sx={{
            width: 48, height: 48, borderRadius: 2,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, cursor: canUndo ? 'pointer' : 'not-allowed',
            color: canUndo ? '#94A3B8' : '#334155',
            '&:hover': canUndo ? { bgcolor: '#1E293B', color: 'white' } : {},
          }}
        >↩</Box>
      </Tooltip>
      <Tooltip title="Redo (Ctrl+Y)" placement="right">
        <Box
          onClick={canRedo ? onRedo : undefined}
          sx={{
            width: 48, height: 48, borderRadius: 2,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, cursor: canRedo ? 'pointer' : 'not-allowed',
            color: canRedo ? '#94A3B8' : '#334155',
            '&:hover': canRedo ? { bgcolor: '#1E293B', color: 'white' } : {},
          }}
        >↪</Box>
      </Tooltip>

      <Divider sx={{ borderColor: '#1E293B', width: '80%', my: 1 }} />

      {/* Zoom controls */}
      <Tooltip title="Zoom In" placement="right">
        <Box onClick={onZoomIn} sx={{ width: 48, height: 48, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, cursor: 'pointer', color: '#94A3B8', '&:hover': { bgcolor: '#1E293B', color: 'white' } }}>+</Box>
      </Tooltip>
      <Tooltip title="Zoom Out" placement="right">
        <Box onClick={onZoomOut} sx={{ width: 48, height: 48, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, cursor: 'pointer', color: '#94A3B8', '&:hover': { bgcolor: '#1E293B', color: 'white' } }}>−</Box>
      </Tooltip>
      <Tooltip title="Reset Zoom" placement="right">
        <Box onClick={onZoomReset} sx={{ width: 48, height: 48, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, cursor: 'pointer', color: '#94A3B8', '&:hover': { bgcolor: '#1E293B', color: 'white' } }}>1:1</Box>
      </Tooltip>

      <Box sx={{ flex: 1 }} />

      <Divider sx={{ borderColor: '#1E293B', width: '80%', my: 1 }} />

      {/* Save */}
      <Tooltip title="Save Draft" placement="right">
        <Box
          onClick={isSaving ? undefined : onSave}
          sx={{
            width: 48, height: 48, borderRadius: 2,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, cursor: isSaving ? 'wait' : 'pointer',
            color: isSaving ? '#475569' : '#22c55e',
            '&:hover': { bgcolor: '#1E293B' },
          }}
        >💾</Box>
      </Tooltip>
      {/* Publish */}
      <Tooltip title="Publish Map" placement="right">
        <Box
          onClick={onPublish}
          sx={{
            width: 48, height: 48, borderRadius: 2,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, cursor: 'pointer', color: '#f59e0b',
            '&:hover': { bgcolor: '#1E293B' },
          }}
        >🚀</Box>
      </Tooltip>
    </Box>
  );
}
