'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Crop, Upload, Check, X, RefreshCw, ZoomIn, ZoomOut, Layers } from 'lucide-react';

interface PdfDiagramCropToolProps {
  currentQuestionNumber: number;
  onSaveCroppedDiagram: (blob: Blob, altText: string, targetType: 'question' | 'option' | 'passage') => Promise<void>;
}

export function PdfDiagramCropTool({
  currentQuestionNumber,
  onSaveCroppedDiagram,
}: PdfDiagramCropToolProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [currentBox, setCurrentBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [altText, setAltText] = useState(`Diagram for question ${currentQuestionNumber}`);
  const [isSaving, setIsSaving] = useState(false);
  const [scale, setScale] = useState(1);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Load image when file is selected
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setImageSrc(event.target.result);
        setCurrentBox(null);
      }
    };
    reader.readAsDataURL(file);
  };

  // Redraw canvas when image or box changes
  useEffect(() => {
    if (!imageSrc || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      imgRef.current = img;
      canvas.width = img.width;
      canvas.height = img.height;

      // Draw original image
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      // Draw crop selection box if present
      if (currentBox && currentBox.w > 0 && currentBox.h > 0) {
        // Darken outside area
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(0, 0, canvas.width, currentBox.y);
        ctx.fillRect(0, currentBox.y, currentBox.x, currentBox.h);
        ctx.fillRect(currentBox.x + currentBox.w, currentBox.y, canvas.width - (currentBox.x + currentBox.w), currentBox.h);
        ctx.fillRect(0, currentBox.y + currentBox.h, canvas.width, canvas.height - (currentBox.y + currentBox.h));

        // Draw selection border
        ctx.strokeStyle = '#0056b3';
        ctx.lineWidth = 3;
        ctx.strokeRect(currentBox.x, currentBox.y, currentBox.w, currentBox.h);

        // Draw corner handles
        ctx.fillStyle = '#ffffff';
        const handles = [
          { x: currentBox.x, y: currentBox.y },
          { x: currentBox.x + currentBox.w, y: currentBox.y },
          { x: currentBox.x, y: currentBox.y + currentBox.h },
          { x: currentBox.x + currentBox.w, y: currentBox.y + currentBox.h },
        ];
        handles.forEach((h) => {
          ctx.fillRect(h.x - 4, h.y - 4, 8, 8);
          ctx.strokeRect(h.x - 4, h.y - 4, 8, 8);
        });
      }
    };
  }, [imageSrc, currentBox]);

  // Mouse event handlers for drawing crop box
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e);
    setIsDrawing(true);
    setStartPos(coords);
    setCurrentBox({ x: coords.x, y: coords.y, w: 0, h: 0 });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPos) return;
    const coords = getCanvasCoords(e);
    const x = Math.min(startPos.x, coords.x);
    const y = Math.min(startPos.y, coords.y);
    const w = Math.abs(coords.x - startPos.x);
    const h = Math.abs(coords.y - startPos.y);
    setCurrentBox({ x, y, w, h });
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  // Perform Crop and Save
  const handleSaveCrop = async (targetType: 'question' | 'option' | 'passage') => {
    if (!imgRef.current || !currentBox || currentBox.w < 10 || currentBox.h < 10) return;
    setIsSaving(true);

    try {
      // Create offscreen canvas for the crop slice
      const offscreen = document.createElement('canvas');
      offscreen.width = currentBox.w;
      offscreen.height = currentBox.h;
      const offCtx = offscreen.getContext('2d');
      if (!offCtx) return;

      offCtx.drawImage(
        imgRef.current,
        currentBox.x,
        currentBox.y,
        currentBox.w,
        currentBox.h,
        0,
        0,
        currentBox.w,
        currentBox.h
      );

      offscreen.toBlob(
        async (blob) => {
          if (blob) {
            await onSaveCroppedDiagram(blob, altText, targetType);
            setCurrentBox(null);
          }
          setIsSaving(false);
        },
        'image/png'
      );
    } catch {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <Crop className="w-4 h-4 text-[#0056b3]" />
            <span>PDF Page / Past Paper Diagram Manual Crop Tool</span>
          </h3>
          <p className="text-xs text-slate-500">
            Upload or render any PDF/scanned paper page, draw a box around the diagram or table with your mouse, and save it directly to the question.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="px-4 py-2 rounded-xl bg-[#0056b3] hover:bg-blue-700 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs">
            <Upload className="w-3.5 h-3.5" /> Select Page Image / PDF Screenshot
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {imageSrc ? (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700">Alt Text:</span>
              <input
                type="text"
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                placeholder="Description of cropped diagram"
                className="px-3 py-1 bg-white rounded-lg border border-slate-200 text-xs font-semibold w-72"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={!currentBox || currentBox.w < 10 || isSaving}
                onClick={() => handleSaveCrop('question')}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold cursor-pointer inline-flex items-center gap-1.5 shadow-xs disabled:opacity-40"
              >
                {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                Save as Question {currentQuestionNumber} Diagram
              </button>

              <button
                type="button"
                disabled={!currentBox || currentBox.w < 10 || isSaving}
                onClick={() => handleSaveCrop('passage')}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer inline-flex items-center gap-1.5 shadow-xs disabled:opacity-40"
              >
                <Layers className="w-3.5 h-3.5" /> Save as Shared Passage
              </button>

              {currentBox && (
                <button
                  type="button"
                  onClick={() => setCurrentBox(null)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-200 text-slate-700 font-bold cursor-pointer"
                >
                  Clear Box
                </button>
              )}
            </div>
          </div>

          {/* Canvas Viewport */}
          <div className="relative border border-slate-300 rounded-2xl overflow-auto max-h-[600px] bg-slate-900/5 flex justify-center p-2">
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              className="cursor-crosshair shadow-md max-w-full rounded-lg"
            />
          </div>
        </div>
      ) : (
        <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-2xl text-xs text-slate-500 space-y-2">
          <Crop className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="font-bold text-slate-700">No page image loaded</p>
          <p>Select an image of a PDF page or past paper to draw and crop diagrams.</p>
        </div>
      )}
    </div>
  );
}

export default PdfDiagramCropTool;
