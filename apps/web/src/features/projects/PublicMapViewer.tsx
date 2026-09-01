'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Stage, Layer, Line, Text, Rect, Group } from 'react-konva';
import { Box, Typography, Chip, Paper, IconButton, TextField, Button, Drawer, Divider } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import jsPDF from 'jspdf';
import toast from 'react-hot-toast';
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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const toggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
  };

  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    const timer = setTimeout(() => {
      if (containerRef.current) {
        setCanvasSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    }, 60);
    return () => {
      clearTimeout(timer);
      document.body.style.overflow = '';
    };
  }, [isFullscreen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

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

  const handleDownloadPdf = async () => {
    const stage = stageRef.current;
    if (!stage) {
      toast.error('Map is not ready yet.');
      return;
    }

    try {
      setIsExportingPdf(true);
      toast.loading('Generating high-quality Map PDF...', { id: 'map-pdf' });

      // 1. Save current view configuration
      const prevScale = { x: stage.scaleX(), y: stage.scaleY() };
      const prevPos = { x: stage.x(), y: stage.y() };
      const prevSize = { width: stage.width(), height: stage.height() };

      // 2. Set stage to board coordinates (1600 x 1000) for clean full layout capture
      stage.width(1600);
      stage.height(1000);
      stage.scale({ x: 1, y: 1 });
      stage.position({ x: 0, y: 0 });
      stage.draw();

      // 3. Export crisp 2x resolution image (3200 x 2000 px)
      const mapImgData = stage.toDataURL({
        x: 0,
        y: 0,
        width: 1600,
        height: 1000,
        pixelRatio: 2,
        mimeType: 'image/jpeg',
        quality: 0.95,
      });

      // 4. Restore original viewport view
      stage.width(prevSize.width);
      stage.height(prevSize.height);
      stage.scale(prevScale);
      stage.position(prevPos);
      stage.draw();

      // 5. Build PDF Document (A4 Landscape: 297mm x 210mm)
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = 297;
      const pageHeight = 210;
      const sidebarWidth = 84;

      // ─── LEFT SIDEBAR: Brand & Project Details ───
      pdf.setFillColor(15, 23, 42); // #0F172A Dark Navy
      pdf.rect(0, 0, sidebarWidth, pageHeight, 'F');

      // Load & Render Brand Logo
      const logoDataUrl = await new Promise<string>((resolve) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || img.width;
          canvas.height = img.naturalHeight || img.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/png'));
          } else {
            resolve('');
          }
        };
        img.onerror = () => resolve('');
        img.src = '/brand-logo.png';
      });

      if (logoDataUrl) {
        // Embed official round brand logo
        pdf.addImage(logoDataUrl, 'PNG', 10, 9, 15, 15);

        pdf.setTextColor(56, 189, 248); // #38BDF8 Cyan
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(14);
        pdf.text('REWA BHOOMI', 28, 17);

        pdf.setTextColor(148, 163, 184); // #94A3B8
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(6.8);
        pdf.text('REAL ESTATE & PLOTTED DEVS', 28, 22);
      } else {
        pdf.setTextColor(56, 189, 248); // #38BDF8 Cyan
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(18);
        pdf.text('REWA BHOOMI', 10, 18);

        pdf.setTextColor(148, 163, 184); // #94A3B8
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(7.5);
        pdf.text('REAL ESTATE & PLOTTED DEVELOPMENTS', 10, 23);
      }

      // Divider Line
      pdf.setDrawColor(51, 65, 85); // #334155
      pdf.setLineWidth(0.4);
      pdf.line(10, 27, sidebarWidth - 10, 27);

      // Section Tag
      pdf.setTextColor(56, 189, 248);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7.5);
      pdf.text('PROJECT OVERVIEW', 10, 34);

      // Project Name
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      const splitTitle = pdf.splitTextToSize(project?.name || 'Project Layout', sidebarWidth - 20);
      pdf.text(splitTitle, 10, 41);

      let currentY = 41 + splitTitle.length * 5.5;

      // Status Badge
      const statusText = project?.status || 'ACTIVE';
      if (statusText === 'ONGOING') pdf.setFillColor(6, 95, 70);
      else if (statusText === 'UPCOMING') pdf.setFillColor(146, 64, 14);
      else pdf.setFillColor(30, 58, 138);
      pdf.roundedRect(10, currentY, 30, 5.5, 1.2, 1.2, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7);
      pdf.text(statusText, 12.5, currentY + 3.8);

      currentY += 10;

      // Key details
      const details = [
        { label: 'Developer', value: project?.developer || 'N/A' },
        { label: 'Location', value: project?.address || `${project?.city || 'Rewa'}, ${project?.state || 'Madhya Pradesh'}` },
        { label: 'Total Area', value: project?.total_area ? `${project.total_area} Sq Ft` : 'N/A' },
        { label: 'Total Plots', value: `${project?.total_plots || plots.length}` },
      ];

      details.forEach((item) => {
        pdf.setTextColor(148, 163, 184);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(7);
        pdf.text(item.label, 10, currentY);

        pdf.setTextColor(255, 255, 255);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(8.5);
        const splitVal = pdf.splitTextToSize(item.value, sidebarWidth - 20);
        pdf.text(splitVal, 10, currentY + 4);
        currentY += 6 + splitVal.length * 3.5;
      });

      // Plots Breakdown
      const availableCount = plots.filter((p: any) => p.status === 'AVAILABLE').length;
      const bookedCount = plots.filter((p: any) => p.status === 'BOOKED').length;
      const soldCount = plots.filter((p: any) => p.status === 'SOLD').length;

      pdf.setFillColor(30, 41, 59);
      pdf.roundedRect(10, currentY + 1, sidebarWidth - 20, 18, 1.5, 1.5, 'F');

      pdf.setTextColor(56, 189, 248);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7.5);
      pdf.text('PLOT INVENTORY', 14, currentY + 7);

      pdf.setTextColor(203, 213, 225);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
      pdf.text(`Available: ${availableCount}  |  Booked: ${bookedCount}  |  Sold: ${soldCount}`, 14, currentY + 13.5);

      // Contact Box at bottom
      pdf.setFillColor(27, 79, 216); // #1B4FD8
      pdf.roundedRect(10, 168, sidebarWidth - 20, 26, 2, 2, 'F');

      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.text('For Booking & Enquiries:', 14, 174);

      pdf.setFontSize(10);
      pdf.text('+91 8889999120', 14, 180);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7.5);
      pdf.text('Visit: rewabhoomi.com', 14, 186);

      pdf.setTextColor(100, 116, 139);
      pdf.setFontSize(6.5);
      pdf.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, 10, 202);

      // ─── RIGHT MAIN CANVAS: Map Layout Card ───
      const mapAreaX = sidebarWidth + 5;
      const mapAreaY = 8;
      const mapAreaWidth = pageWidth - mapAreaX - 6;
      const mapAreaHeight = 194;

      // Card Background
      pdf.setFillColor(255, 255, 255);
      pdf.setDrawColor(226, 232, 240);
      pdf.setLineWidth(0.4);
      pdf.roundedRect(mapAreaX, mapAreaY, mapAreaWidth, mapAreaHeight, 2.5, 2.5, 'FD');

      // Card Header
      pdf.setTextColor(15, 23, 42);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.text(`${project?.name || 'Project'} - Master Layout Plan`, mapAreaX + 6, mapAreaY + 8);

      pdf.setTextColor(100, 116, 139);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
      pdf.text('High-Definition Architectural Master Plan', mapAreaX + 6, mapAreaY + 12.5);

      // Map Aspect Ratio: 1600 / 1000 = 1.6
      const maxImgW = mapAreaWidth - 8;
      const maxImgH = mapAreaHeight - 21;
      let imgW = maxImgW;
      let imgH = imgW / 1.6;

      if (imgH > maxImgH) {
        imgH = maxImgH;
        imgW = imgH * 1.6;
      }

      const imgX = mapAreaX + (mapAreaWidth - imgW) / 2;
      const imgY = mapAreaY + 15 + (maxImgH - imgH) / 2;

      pdf.addImage(mapImgData, 'JPEG', imgX, imgY, imgW, imgH);

      // Footer Disclaimer
      pdf.setTextColor(148, 163, 184);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(6);
      pdf.text('Disclaimer: This layout plan is for illustrative and informational purposes only. Plot dimensions and availability subject to change.', mapAreaX + 6, mapAreaY + mapAreaHeight - 2.5);

      // Save PDF file
      const safeName = (project?.slug || project?.name || 'project').toLowerCase().replace(/[^a-z0-9]+/g, '-');
      pdf.save(`${safeName}-layout-map.pdf`);

      toast.success('Map PDF downloaded successfully!', { id: 'map-pdf' });
    } catch (err) {
      console.error('Failed to export PDF:', err);
      toast.error('Failed to generate PDF. Please try again.', { id: 'map-pdf' });
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Center map on public stage (0.4 scale on mobile, 1.0 scale on desktop)
  const centerMap = useCallback(() => {
    const stage = stageRef.current;
    if (!stage || canvasSize.width <= 0) return;

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

    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
    const initialScale = isMobile ? 0.4 : 1.0;

    stage.scale({ x: initialScale, y: initialScale });
    stage.position({
      x: canvasSize.width / 2 - (centerX * initialScale),
      y: canvasSize.height / 2 - (centerY * initialScale),
    });
    setStageScale(initialScale);
    stage.batchDraw();
  }, [plots, mapObjects, canvasSize]);

  useEffect(() => {
    centerMap();
  }, [centerMap]);

  const zoomAtCenter = (factor: number) => {
    const stage = stageRef.current;
    if (!stage) return;
    const oldScale = stage.scaleX();
    const newScale = Math.max(0.2, Math.min(5, oldScale * factor));
    const center = {
      x: canvasSize.width / 2,
      y: canvasSize.height / 2,
    };
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
    stage.batchDraw();
  };

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

  // Ultra-Smooth Google-Maps Style Multi-Touch Pinch Zoom Handler
  const zoomTextRef = useRef<HTMLSpanElement>(null);

  const touchState = useRef<{
    startDist: number;
    startScale: number;
    startPointTo: { x: number; y: number };
    isPinching: boolean;
  }>({
    startDist: 0,
    startScale: 1,
    startPointTo: { x: 0, y: 0 },
    isPinching: false,
  });

  const handleTouchStart = (e: any) => {
    const evt = e.evt as TouchEvent;
    const stage = stageRef.current;
    if (!stage) return;

    if (evt.touches.length >= 2) {
      if (stage.isDragging()) {
        stage.stopDrag();
      }
      stage.draggable(false);

      const container = containerRef.current;
      const rect = container ? container.getBoundingClientRect() : { left: 0, top: 0 };
      const touch1 = evt.touches[0];
      const touch2 = evt.touches[1];
      const p1 = { x: touch1.clientX - rect.left, y: touch1.clientY - rect.top };
      const p2 = { x: touch2.clientX - rect.left, y: touch2.clientY - rect.top };

      const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      const center = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
      const currentScale = stage.scaleX();

      touchState.current = {
        startDist: Math.max(1, dist),
        startScale: currentScale,
        startPointTo: {
          x: (center.x - stage.x()) / currentScale,
          y: (center.y - stage.y()) / currentScale,
        },
        isPinching: true,
      };
    } else {
      touchState.current.isPinching = false;
      stage.draggable(true);
    }
  };

  const handleTouchMove = (e: any) => {
    const evt = e.evt as TouchEvent;
    if (evt.touches.length === 2) {
      evt.preventDefault();
      const stage = stageRef.current;
      if (!stage) return;

      if (stage.isDragging()) {
        stage.stopDrag();
      }
      if (stage.draggable()) {
        stage.draggable(false);
      }

      const container = containerRef.current;
      const rect = container ? container.getBoundingClientRect() : { left: 0, top: 0 };

      const touch1 = evt.touches[0];
      const touch2 = evt.touches[1];
      const p1 = { x: touch1.clientX - rect.left, y: touch1.clientY - rect.top };
      const p2 = { x: touch2.clientX - rect.left, y: touch2.clientY - rect.top };

      const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      const center = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };

      const { startDist, startScale, startPointTo, isPinching } = touchState.current;

      if (!isPinching || startDist <= 0) {
        const currentScale = stage.scaleX();
        touchState.current = {
          startDist: Math.max(1, dist),
          startScale: currentScale,
          startPointTo: {
            x: (center.x - stage.x()) / currentScale,
            y: (center.y - stage.y()) / currentScale,
          },
          isPinching: true,
        };
        return;
      }

      // Smooth reference-anchored zoom (tracks fingers 1:1 without compounding drift)
      const scaleRatio = dist / startDist;
      const newScale = Math.max(0.15, Math.min(6, startScale * scaleRatio));

      // Anchor midpoint between fingers
      const newPos = {
        x: center.x - startPointTo.x * newScale,
        y: center.y - startPointTo.y * newScale,
      };

      stage.scale({ x: newScale, y: newScale });
      stage.position(newPos);
      stage.batchDraw();

      // Zero-overhead direct DOM update for percentage badge
      if (zoomTextRef.current) {
        zoomTextRef.current.textContent = `${Math.round(newScale * 100)}%`;
      }
    }
  };

  const handleTouchEnd = () => {
    touchState.current.isPinching = false;
    touchState.current.startDist = 0;
    const stage = stageRef.current;
    if (stage) {
      stage.draggable(true);
      const finalScale = stage.scaleX();
      setStageScale(finalScale);
      if (zoomTextRef.current) {
        zoomTextRef.current.textContent = `${Math.round(finalScale * 100)}%`;
      }
    }
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
      
      {/* ─── TOP FILTER BAR (Compact on mobile) ─── */}
      <Box sx={{ p: { xs: 1, sm: 1.5 }, bgcolor: '#FFFFFF', borderBottom: '1px solid #E2E8F0', display: 'flex', gap: { xs: 0.8, sm: 1.5 }, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', zIndex: 10 }}>
        {/* Left: Filter Status Chips */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 0.8 }, flexWrap: 'wrap' }}>
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
                  fontSize: { xs: '0.67rem', sm: '0.74rem' },
                  height: { xs: 23, sm: 27 },
                  px: { xs: 0.2, sm: 0.5 },
                  transition: 'all 0.15s ease',
                  '&:hover': { bgcolor: isSelected ? '#1541B5' : '#E2E8F0' },
                }}
              />
            );
          })}
        </Box>

        {/* Right: Search Plot # Input and Action Buttons */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', width: { xs: '100%', sm: 'auto' } }}>
          <TextField
            size="small"
            placeholder="Plot number likhkar search karein..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 0.6, color: '#1B4FD8', fontSize: { xs: 17, sm: 20 } }} />,
            }}
            sx={{
              flex: { xs: 1, sm: 'none' },
              width: { xs: 'auto', sm: 220, md: 280 },
              minWidth: { xs: '150px', sm: 'auto' },
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                height: { xs: 32, sm: 36 },
                fontSize: { xs: '0.78rem', sm: '0.86rem' },
                fontWeight: 500,
                bgcolor: '#F8FAFC',
                '&:hover': { bgcolor: '#FFFFFF' },
                '&.Mui-focused': { bgcolor: '#FFFFFF' },
              },
            }}
          />

          {/* Quick Action Buttons in Top Bar */}
          <Box sx={{ display: 'flex', gap: 0.8, alignItems: 'center' }}>
            <Button
              size="small"
              variant="contained"
              startIcon={<FullscreenIcon sx={{ fontSize: 16 }} />}
              onClick={toggleFullscreen}
              sx={{
                bgcolor: isFullscreen ? '#EF4444' : '#0F172A',
                color: '#FFFFFF',
                height: { xs: 32, sm: 36 },
                fontSize: { xs: '0.72rem', sm: '0.78rem' },
                fontWeight: 700,
                borderRadius: 2,
                px: { xs: 1, sm: 1.3 },
                textTransform: 'none',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                '&:hover': { bgcolor: isFullscreen ? '#DC2626' : '#1E293B' },
              }}
            >
              {isFullscreen ? 'Exit' : 'Full Screen'}
            </Button>

            <Button
              size="small"
              variant="contained"
              startIcon={<PictureAsPdfIcon sx={{ fontSize: 15 }} />}
              onClick={handleDownloadPdf}
              disabled={isExportingPdf}
              sx={{
                bgcolor: '#1B4FD8',
                color: '#FFFFFF',
                height: { xs: 32, sm: 36 },
                fontSize: { xs: '0.72rem', sm: '0.78rem' },
                fontWeight: 700,
                borderRadius: 2,
                px: { xs: 1, sm: 1.3 },
                textTransform: 'none',
                boxShadow: '0 2px 8px rgba(27,79,216,0.25)',
                '&:hover': { bgcolor: '#1541B5' },
              }}
            >
              {isExportingPdf ? 'Exporting...' : 'PDF'}
            </Button>
          </Box>
        </Box>
      </Box>

      {/* ─── MAIN CONTENT AREA: MAP (LEFT) & ALL DETAILS (RIGHT) ─── */}
      <Box sx={{ flex: 1, width: '100%', display: 'flex', flexDirection: { xs: 'column', md: 'row' }, position: 'relative' }}>
        
        {/* ─── LEFT: MAP CANVAS AREA (+22% height on mobile: 390px vs 320px | Fullscreen capable) ─── */}
        <Box sx={{
          width: { xs: '100%', md: 'auto' },
          flex: { md: 1 },
          height: { xs: 390, sm: 440, md: 580 },
          maxHeight: { xs: 390, sm: 440, md: 580 },
          flexShrink: 0,
          position: 'relative',
          overflow: 'hidden',
          p: { xs: 0.8, md: 1.5 },
          bgcolor: '#F8FAFC',
          ...(isFullscreen && {
            position: 'static',
          }),
        }}>
          <Box
            sx={{
              position: isFullscreen ? 'fixed' : 'relative',
              top: isFullscreen ? 0 : 'auto',
              left: isFullscreen ? 0 : 'auto',
              right: isFullscreen ? 0 : 'auto',
              bottom: isFullscreen ? 0 : 'auto',
              width: isFullscreen ? '100vw' : '100%',
              height: isFullscreen ? '100vh' : '100%',
              maxHeight: isFullscreen ? '100vh' : '100%',
              zIndex: isFullscreen ? 99999 : 1,
              overflow: 'hidden',
              borderRadius: isFullscreen ? 0 : 2.5,
              border: isFullscreen ? 'none' : '2.5px solid #1B4FD8',
              boxShadow: isFullscreen ? 'none' : '0 4px 20px rgba(27, 79, 216, 0.12), inset 0 0 10px rgba(15, 23, 42, 0.03)',
              bgcolor: '#F7F3EB',
              touchAction: 'none',
              userSelect: 'none',
              WebkitUserSelect: 'none',
            }}
            ref={containerRef}
          >
            {/* Top Bar inside Fullscreen */}
            {isFullscreen && (
              <Box sx={{
                position: 'absolute',
                top: 12,
                left: 12,
                right: 12,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                zIndex: 10001,
                pointerEvents: 'none',
              }}>
                <Box sx={{
                  bgcolor: 'rgba(15, 23, 42, 0.88)',
                  backdropFilter: 'blur(8px)',
                  color: '#FFFFFF',
                  px: 2,
                  py: 0.8,
                  borderRadius: 2,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
                  pointerEvents: 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}>
                  <Typography variant="subtitle2" fontWeight={800} sx={{ color: '#38BDF8', fontSize: '0.88rem' }}>
                    {project?.name || 'Project Layout'}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.72rem' }}>
                    (Full Screen)
                  </Typography>
                </Box>

                <IconButton
                  onClick={toggleFullscreen}
                  sx={{
                    bgcolor: 'rgba(239, 68, 68, 0.9)',
                    color: '#FFFFFF',
                    pointerEvents: 'auto',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                    '&:hover': { bgcolor: '#DC2626' }
                  }}
                  size="small"
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
            )}

            {canvasSize.width > 0 && (
              <Stage
                ref={stageRef}
                width={canvasSize.width}
                height={canvasSize.height}
                draggable
                onWheel={handleWheel}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onClick={(e) => { if (e.target.name() === 'bg') setSelectedPlot(null); }}
              >
                <Layer>
                  {/* 📐 Project Map Board (1600x1000) */}
                  <Rect x={0} y={0} width={1600} height={1000} fill="#EFE8DC" stroke="#CBD5E1" strokeWidth={2} name="bg" />

                  {/* Map Objects / Road / Amenities (Hit detection disabled for 60fps performance) */}
                  {showLayers.mapObjects && mapObjects.map((obj: any, i: number) => {
                    const geom = obj.geometry;
                    if (!geom?.coordinates?.[0]) return null;
                    const pts = polygonToKonvaPoints(geom.coordinates[0], 1600, 1000);
                    const fillColor = obj.display_style?.fillColor ?? MAP_OBJECT_COLORS[obj.type as keyof typeof MAP_OBJECT_COLORS] ?? '#94a3b8';
                    const center = polygonCenter(geom.coordinates[0]);
                    return (
                      <Group key={obj.id || i} listening={false}>
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

            {/* Bottom-Left Controls: Fullscreen & PDF Download */}
            <Box sx={{
              position: 'absolute',
              bottom: { xs: 8, sm: 10 },
              left: { xs: 8, sm: 10 },
              display: 'flex',
              gap: 0.8,
              alignItems: 'center',
              zIndex: 15,
            }}>
              {/* Fullscreen Toggle Button */}
              <Button
                size="small"
                variant="contained"
                startIcon={isFullscreen ? <FullscreenExitIcon sx={{ fontSize: 16 }} /> : <FullscreenIcon sx={{ fontSize: 16 }} />}
                onClick={toggleFullscreen}
                sx={{
                  bgcolor: isFullscreen ? '#EF4444' : '#0F172A',
                  color: '#FFFFFF',
                  height: { xs: 28, sm: 32 },
                  fontSize: { xs: '0.7rem', sm: '0.78rem' },
                  fontWeight: 700,
                  borderRadius: 2,
                  px: { xs: 1, sm: 1.5 },
                  boxShadow: '0 3px 10px rgba(0,0,0,0.25)',
                  textTransform: 'none',
                  '&:hover': { bgcolor: isFullscreen ? '#DC2626' : '#1E293B' },
                }}
              >
                {isFullscreen ? 'Exit' : 'Full Screen'}
              </Button>

              {/* Download PDF Button */}
              <Button
                size="small"
                variant="contained"
                startIcon={<PictureAsPdfIcon sx={{ fontSize: 15 }} />}
                onClick={handleDownloadPdf}
                disabled={isExportingPdf}
                sx={{
                  bgcolor: '#1B4FD8',
                  color: '#FFFFFF',
                  height: { xs: 28, sm: 32 },
                  fontSize: { xs: '0.7rem', sm: '0.78rem' },
                  fontWeight: 700,
                  borderRadius: 2,
                  px: { xs: 1, sm: 1.5 },
                  boxShadow: '0 3px 10px rgba(27,79,216,0.3)',
                  textTransform: 'none',
                  '&:hover': { bgcolor: '#1541B5' },
                }}
              >
                {isExportingPdf ? 'Exporting...' : 'PDF Map'}
              </Button>
            </Box>

            {/* Bottom-Right Controls: Zoom & Reset */}
            <Box sx={{
              position: 'absolute',
              bottom: { xs: 8, sm: 10 },
              right: { xs: 8, sm: 10 },
              display: 'flex',
              gap: 0.5,
              alignItems: 'center',
              zIndex: 15,
            }}>
              <Chip
                label={<span ref={zoomTextRef}>{Math.round(stageScale * 100)}%</span>}
                size="small"
                onClick={centerMap}
                sx={{ cursor: 'pointer', fontWeight: 700, bgcolor: '#0F172A', color: '#38BDF8', height: { xs: 26, sm: 30 }, fontSize: { xs: '0.7rem', sm: '0.78rem' } }}
              />
              <Chip label="+" size="small" onClick={() => zoomAtCenter(1.25)} sx={{ cursor: 'pointer', fontWeight: 700, height: { xs: 26, sm: 30 }, minWidth: { xs: 24, sm: 30 } }} />
              <Chip label="-" size="small" onClick={() => zoomAtCenter(1 / 1.25)} sx={{ cursor: 'pointer', fontWeight: 700, height: { xs: 26, sm: 30 }, minWidth: { xs: 24, sm: 30 } }} />
              <Chip label="Reset" size="small" onClick={centerMap} sx={{ cursor: 'pointer', height: { xs: 26, sm: 30 }, fontSize: { xs: '0.7rem', sm: '0.78rem' } }} />
            </Box>

            {/* No plots hint */}
            {plots.filter(p => p.polygon_geometry?.coordinates?.[0]).length === 0 && (
              <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                <Typography variant="body2" sx={{ color: '#94A3B8', bgcolor: 'white', px: 2.5, py: 1.2, borderRadius: 2, boxShadow: 1, fontSize: '0.8rem' }}>
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
            p: { xs: 1.2, md: 2.5 },
            display: { xs: selectedPlot ? 'flex' : 'none', md: 'flex' },
            flexDirection: 'column',
            gap: { xs: 1.2, md: 2.5 },
            overflowY: 'auto',
            maxHeight: { md: 580 },
            zIndex: 10,
          }}
        >
          {/* 1. SELECTED PLOT DETAILS (If clicked - Compact on mobile) */}
          {selectedPlot ? (
            <Box sx={{ p: { xs: 1.2, md: 2 }, bgcolor: '#F8FAFC', borderRadius: 2, border: '1.5px solid #38BDF8' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, alignItems: 'center' }}>
                <Typography variant="subtitle1" fontWeight={800} color="#0F172A" sx={{ fontSize: { xs: '0.88rem', md: '1.05rem' } }}>
                  Plot #{selectedPlot.plot.plot_number}
                </Typography>
                <IconButton size="small" onClick={() => setSelectedPlot(null)} sx={{ p: 0.4 }}>
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
                  fontSize: '0.67rem',
                  height: 22,
                  mb: 1.2,
                  width: 'fit-content',
                }}
              />

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                {selectedPlot.plot.area && (
                  <Typography variant="body2" sx={{ color: '#475569', fontSize: { xs: '0.78rem', md: '0.85rem' } }}>
                    Area: <Typography component="span" fontWeight={700} color="text.primary" sx={{ fontSize: 'inherit' }}>{selectedPlot.plot.area} {selectedPlot.plot.area_unit || 'SQ_FT'}</Typography>
                  </Typography>
                )}
                {selectedPlot.plot.width && selectedPlot.plot.length && (
                  <Typography variant="body2" sx={{ color: '#475569', fontSize: { xs: '0.78rem', md: '0.85rem' } }}>
                    Size: <Typography component="span" fontWeight={700} color="text.primary" sx={{ fontSize: 'inherit' }}>{selectedPlot.plot.width} ft × {selectedPlot.plot.length} ft</Typography>
                  </Typography>
                )}
                {selectedPlot.plot.facing && (
                  <Typography variant="body2" sx={{ color: '#475569', fontSize: { xs: '0.78rem', md: '0.85rem' } }}>
                    Facing: <Typography component="span" fontWeight={700} color="text.primary" sx={{ fontSize: 'inherit' }}>{selectedPlot.plot.facing.replace('_', ' ')}</Typography>
                  </Typography>
                )}
                {selectedPlot.plot.price && (
                  <Box sx={{ mt: 0.5, p: 1, bgcolor: '#FFFFFF', borderRadius: 1.5, border: '1px solid #E2E8F0' }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem', display: 'block' }}>Price</Typography>
                    <Typography variant="subtitle1" sx={{ color: '#1B4FD8', fontWeight: 800, fontSize: { xs: '0.92rem', md: '1.15rem' }, lineHeight: 1.2 }}>
                      ₹{Number(selectedPlot.plot.price).toLocaleString('en-IN')}
                    </Typography>
                  </Box>
                )}
                {selectedPlot.plot.status === 'AVAILABLE' && (
                  <Button size="small" variant="contained" fullWidth sx={{ mt: 1, py: 0.8, borderRadius: 2, fontWeight: 700, fontSize: '0.8rem', textTransform: 'none' }}>
                    Contact for Booking
                  </Button>
                )}
              </Box>
            </Box>
          ) : (
            <Box sx={{ p: 1, bgcolor: '#F8FAFC', borderRadius: 1.5, border: '1px solid #E2E8F0', textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ fontSize: '0.72rem' }}>
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