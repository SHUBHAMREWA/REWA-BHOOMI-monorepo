'use client';

import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { Box, Chip } from '@mui/material';
import { Stage, Layer, Line, Circle, Text, Rect, Group } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import type {
  EditorTool, PlotData, MapObjectData, LocalCoord, LocalPolygon,
  MapObjectType, PhaseData, ClusterData, SelectedObject,
} from './types';
import { PLOT_COLORS, MAP_OBJECT_COLORS, MAP_OBJECT_LABELS } from './types';
import { toNormalized, polygonToKonvaPoints, polygonCenter, genTempId } from './geometry';

interface EditorCanvasProps {
  stageRef: React.MutableRefObject<any>;
  width: number;
  height: number;
  boardWidth: number;
  boardHeight: number;
  onBoardSizeChange: (size: { width: number; height: number }) => void;
  activeTool: EditorTool;
  activePhaseId: string | null;
  plots: PlotData[];
  mapObjects: MapObjectData[];
  selected: SelectedObject;
  onSelect: (obj: SelectedObject) => void;
  onPlotsChange: (plots: PlotData[]) => void;
  onMapObjectsChange: (objs: MapObjectData[]) => void;
  onNewPlotDrawn: (geometry: LocalPolygon) => void;
  onToolChange: (tool: EditorTool) => void;
  showLayers: Record<string, boolean>;
}

export default function EditorCanvas({
  stageRef, width, height, boardWidth, boardHeight, onBoardSizeChange,
  activeTool, activePhaseId,
  plots, mapObjects, selected,
  onSelect, onPlotsChange, onMapObjectsChange,
  onNewPlotDrawn, onToolChange, showLayers,
}: EditorCanvasProps) {
  const [drawingPoints, setDrawingPoints] = useState<LocalCoord[]>([]);
  const [mousePos, setMousePos] = useState<LocalCoord | null>(null);
  const [stageScale, setStageScale] = useState(1);

  const isDrawing = activeTool !== 'SELECT' && activeTool !== 'DELETE' && activeTool !== 'PAN';

  const getCanvasCoord = useCallback(
    (e: KonvaEventObject<MouseEvent>): LocalCoord => {
      const stage = stageRef.current;
      if (!stage) return [0, 0];
      const pos = stage.getPointerPosition();
      if (!pos) return [0, 0];
      const x = (pos.x - stage.x()) / stage.scaleX();
      const y = (pos.y - stage.y()) / stage.scaleY();
      return toNormalized(x, y, boardWidth, boardHeight);
    },
    [stageRef, boardWidth, boardHeight],
  );

  const finishPolygon = useCallback(() => {
    if (drawingPoints.length < 3) return;
    const geometry: LocalPolygon = { type: 'Polygon', coordinates: [drawingPoints] };

    if (activeTool === 'DRAW_PLOT') {
      onNewPlotDrawn(geometry);
    } else {
      const typeMap: Record<string, MapObjectType> = {
        DRAW_BOUNDARY: 'PROJECT_BOUNDARY',
        DRAW_LAND: 'LAND_PARCEL',
        DRAW_ROAD: 'ROAD',
        DRAW_GARDEN: 'GARDEN',
        DRAW_PARK: 'PARK',
        DRAW_WATER: 'WATER',
        DRAW_AMENITY: 'AMENITY',
      };
      const objType = typeMap[activeTool] ?? 'OTHER';
      const newObj: MapObjectData = {
        tempId: genTempId(),
        type: objType,
        geometry,
        phaseId: activePhaseId,
        displayStyle: {
          fillColor: MAP_OBJECT_COLORS[objType],
          strokeColor: '#fff',
          strokeWidth: 2,
          opacity: 0.5,
        },
        isDirty: true,
      };
      onMapObjectsChange([...mapObjects, newObj]);
    }

    setDrawingPoints([]);
    onToolChange('SELECT');
  }, [drawingPoints, activeTool, activePhaseId, mapObjects, onNewPlotDrawn, onMapObjectsChange, onToolChange]);

  const handleStageClick = useCallback(
    (e: KonvaEventObject<MouseEvent>) => {
      if (activeTool === 'SELECT') {
        if (e.target === e.target.getStage() || e.target.name() === 'background') {
          onSelect(null);
        }
        return;
      }
      if (activeTool === 'DELETE' || activeTool === 'PAN') return;

      const coord = getCanvasCoord(e);
      if (e.evt.detail === 2 && drawingPoints.length >= 3) {
        finishPolygon();
        return;
      }
      if (drawingPoints.length >= 3) {
        const first = drawingPoints[0];
        const pixelDist = Math.hypot((coord[0] - first[0]) * width, (coord[1] - first[1]) * height);
        if (pixelDist < 30) {
          finishPolygon();
          return;
        }
      }
      setDrawingPoints((prev) => [...prev, coord]);
    },
    [activeTool, drawingPoints, getCanvasCoord, finishPolygon, onSelect],
  );

  const handleMouseMove = useCallback(
    (e: KonvaEventObject<MouseEvent>) => {
      if (!isDrawing) return;
      setMousePos(getCanvasCoord(e));
    },
    [isDrawing, getCanvasCoord],
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target && ['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;
      if (e.key === 'Enter') finishPolygon();
      if (e.key === 'Escape') { setDrawingPoints([]); onToolChange('SELECT'); }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selected?.kind === 'mapObject') {
          onMapObjectsChange(mapObjects.filter(o => o.tempId !== selected.tempId));
          onSelect(null);
        } else if (selected?.kind === 'plot') {
          onPlotsChange(plots.filter(p => p.tempId !== selected.tempId));
          onSelect(null);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [finishPolygon, onToolChange, selected, mapObjects, plots, onMapObjectsChange, onPlotsChange, onSelect]);

  const handleWheel = (e: KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;
    const scaleBy = 1.1;
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    const mousePointTo = { x: (pointer.x - stage.x()) / oldScale, y: (pointer.y - stage.y()) / oldScale };
    const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
    const clampedScale = Math.max(0.2, Math.min(5, newScale));
    stage.scale({ x: clampedScale, y: clampedScale });
    stage.position({ x: pointer.x - mousePointTo.x * clampedScale, y: pointer.y - mousePointTo.y * clampedScale });
    setStageScale(clampedScale);
    stage.batchDraw();
  };

  const previewPoints = useMemo(() => {
    if (drawingPoints.length === 0 || !mousePos) return [];
    const all = [...drawingPoints, mousePos];
    return all.flatMap(([x, y]) => [x * boardWidth, y * boardHeight]);
  }, [drawingPoints, mousePos, boardWidth, boardHeight]);

  const dotPoints = useMemo(() =>
    drawingPoints.map(([x, y]) => ({ x: x * boardWidth, y: y * boardHeight })),
    [drawingPoints, boardWidth, boardHeight],
  );

  return (
    <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
    <Stage
      ref={stageRef}
      width={width}
      height={height}
      draggable={activeTool === 'SELECT' || activeTool === 'PAN'}
      onClick={handleStageClick}
      onMouseMove={handleMouseMove}
      onWheel={handleWheel}
      style={{ cursor: activeTool === 'PAN' ? 'grab' : isDrawing ? 'crosshair' : 'default', background: '#0F172A' }}
    >
      <Layer>
        {/* Outer Dark Canvas Backdrop */}
        <Rect x={-10000} y={-10000} width={20000} height={20000} fill="#0F172A" name="background" />

        {/* 📐 Main Project Canvas Board (Excalidraw Frame) */}
        <Rect
          x={0}
          y={0}
          width={boardWidth}
          height={boardHeight}
          fill="#FFFFFF"
          stroke="#3B82F6"
          strokeWidth={3}
          dash={[8, 4]}
          shadowColor="#000"
          shadowBlur={30}
          shadowOpacity={0.4}
          listening={false}
        />

        {/* Board Title Tag */}
        <Group x={0} y={-28} listening={false}>
          <Rect x={0} y={0} width={340} height={24} fill="#3B82F6" cornerRadius={[4, 4, 0, 0]} />
          <Text x={8} y={5} text={`📐 Project Map Canvas (${boardWidth} × ${boardHeight} px)`} fontSize={12} fontStyle="bold" fill="#FFFFFF" />
        </Group>

        {/* Grid Lines inside Canvas Board */}
        {Array.from({ length: 21 }).map((_, i) => (
          <React.Fragment key={i}>
            <Line points={[i * (boardWidth / 20), 0, i * (boardWidth / 20), boardHeight]} stroke="#E2E8F0" strokeWidth={0.5} dash={[3, 3]} listening={false} />
            <Line points={[0, i * (boardHeight / 20), boardWidth, i * (boardHeight / 20)]} stroke="#E2E8F0" strokeWidth={0.5} dash={[3, 3]} listening={false} />
          </React.Fragment>
        ))}

        {/* Interactive Resize Handle at Bottom Right of Board */}
        <Group
          x={boardWidth}
          y={boardHeight}
          draggable
          onDragMove={(e) => {
            const newW = Math.max(600, Math.round(e.target.x()));
            const newH = Math.max(400, Math.round(e.target.y()));
            onBoardSizeChange({ width: newW, height: newH });
          }}
          onDragEnd={(e) => {
            e.target.x(boardWidth);
            e.target.y(boardHeight);
          }}
        >
          <Circle radius={12} fill="#3B82F6" stroke="#FFFFFF" strokeWidth={2} shadowColor="#000" shadowBlur={6} shadowOpacity={0.3} />
          <Text x={-5} y={-5} text="⇲" fontSize={12} fill="#FFFFFF" fontStyle="bold" listening={false} />
        </Group>

        {showLayers.mapObjects && mapObjects.map((obj) => {
          if (obj.geometry?.type !== 'Polygon') return null;
          const pts = polygonToKonvaPoints(obj.geometry.coordinates[0] || [], boardWidth, boardHeight);
          const isSelected = selected?.kind === 'mapObject' && selected.tempId === obj.tempId;
          const fillColor = isSelected ? 'rgba(245, 158, 11, 0.4)' : (obj.displayStyle?.fillColor ?? MAP_OBJECT_COLORS[obj.type]);
          const center = polygonCenter(obj.geometry.coordinates[0] || []);
          return (
            <Group 
              key={obj.tempId} 
              draggable={isSelected && activeTool === 'SELECT'} 
              listening={!isDrawing} 
              onClick={(e) => {
                e.cancelBubble = true;
                if (activeTool === 'DELETE') {
                  onMapObjectsChange(mapObjects.filter(o => o.tempId !== obj.tempId));
                  if (selected?.tempId === obj.tempId) onSelect(null);
                } else {
                  onSelect({ kind: 'mapObject', tempId: obj.tempId! });
                }
              }}
              onDragStart={(e) => { e.cancelBubble = true; }}
              onDragEnd={(e) => {
                e.cancelBubble = true;
                const group = e.target;
                const dx = group.x() / boardWidth;
                const dy = group.y() / boardHeight;
                group.x(0); group.y(0);
                if (dx === 0 && dy === 0) return;
                
                const poly = obj.geometry as LocalPolygon;
                const newCoords = poly.coordinates[0].map(([cx, cy]) => [
                  cx + dx,
                  cy + dy
                ] as LocalCoord);
                const newObj = { ...obj, geometry: { ...poly, coordinates: [newCoords] }, isDirty: true };
                onMapObjectsChange(mapObjects.map(o => o.tempId === obj.tempId ? newObj : o));
              }}
            >
              <Line points={pts} closed fill={fillColor} opacity={obj.displayStyle?.opacity ?? 0.4} stroke={isSelected ? '#F59E0B' : (obj.displayStyle?.strokeColor ?? '#fff')} strokeWidth={isSelected ? 3 : (obj.displayStyle?.strokeWidth ?? 1.5)} />
              {obj.name && <Text x={center[0] * boardWidth - 40} y={center[1] * boardHeight - 7} width={80} text={obj.name} fontSize={11} fill="#1e293b" align="center" listening={false} />}
            </Group>
          );
        })}
        {showLayers.plots && plots.map((plot) => {
          if (plot.geometry?.type !== 'Polygon') return null;
          const pts = polygonToKonvaPoints(plot.geometry.coordinates[0] || [], boardWidth, boardHeight);
          const isSelected = selected?.kind === 'plot' && selected.tempId === plot.tempId;
          const fillColor = isSelected ? 'rgba(245, 158, 11, 0.4)' : PLOT_COLORS[plot.status];
          const center = polygonCenter(plot.geometry.coordinates[0] || []);
          return (
            <Group 
              key={plot.tempId} 
              draggable={isSelected && activeTool === 'SELECT'} 
              listening={!isDrawing} 
              onClick={(e) => {
                e.cancelBubble = true;
                if (activeTool === 'DELETE') {
                  onPlotsChange(plots.filter(p => p.tempId !== plot.tempId));
                  if (selected?.tempId === plot.tempId) onSelect(null);
                } else {
                  onSelect({ kind: 'plot', tempId: plot.tempId! });
                }
              }}
              onDragStart={(e) => { e.cancelBubble = true; }}
              onDragEnd={(e) => {
                e.cancelBubble = true;
                const group = e.target;
                const dx = group.x() / boardWidth;
                const dy = group.y() / boardHeight;
                group.x(0); group.y(0);
                if (dx === 0 && dy === 0) return;
                
                const poly = plot.geometry as LocalPolygon;
                const newCoords = poly.coordinates[0].map(([cx, cy]) => [
                  cx + dx,
                  cy + dy
                ] as LocalCoord);
                const newPlot = { ...plot, geometry: { ...poly, coordinates: [newCoords] }, isDirty: true };
                onPlotsChange(plots.map(p => p.tempId === plot.tempId ? newPlot : p));
              }}
            >
              <Line points={pts} closed fill={fillColor} opacity={0.75} stroke={isSelected ? '#F59E0B' : '#fff'} strokeWidth={isSelected ? 3 : 1.5} />
              <Text x={center[0] * boardWidth - 25} y={center[1] * boardHeight - 8} width={50} text={plot.plotNumber} fontSize={10} fontStyle="bold" fill="#fff" align="center" listening={false} />
            </Group>
          );
        })}
        {isDrawing && (
          <Group>
            <Line points={previewPoints} closed stroke={activeTool === 'DRAW_BOUNDARY' ? '#1B4FD8' : '#F59E0B'} strokeWidth={2} dash={[5, 5]} listening={false} />
            {dotPoints.map((pt, i) => <Circle key={i} x={pt.x} y={pt.y} radius={4} fill="#F59E0B" listening={false} />)}
            <Text x={10} y={height - 30} text={`${drawingPoints.length} point(s) - Enter/Double-click to finish, Esc to cancel`} fontSize={12} fill="#475569" listening={false} />
          </Group>
        )}
      </Layer>
    </Stage>

    {/* Floating Live Zoom Percentage Overlay */}
    <Box sx={{ position: 'absolute', bottom: 12, right: 12, display: 'flex', alignItems: 'center', gap: 1, zIndex: 10, pointerEvents: 'auto' }}>
      <Chip
        label={`Zoom: ${Math.round(stageScale * 100)}%`}
        size="small"
        onClick={() => {
          const stage = stageRef.current;
          if (stage) {
            stage.scale({ x: 1, y: 1 });
            stage.position({ x: 0, y: 0 });
            setStageScale(1);
            stage.batchDraw();
          }
        }}
        sx={{
          bgcolor: '#0F172A',
          color: '#38BDF8',
          fontWeight: 700,
          border: '1px solid #1E293B',
          cursor: 'pointer',
          fontSize: '0.75rem',
          boxShadow: 2,
          '&:hover': { bgcolor: '#1E293B' },
        }}
      />
    </Box>
    </Box>
  );
}
