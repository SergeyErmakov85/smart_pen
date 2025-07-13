import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useBluetooth } from '../contexts/BluetoothContext';

const DrawingCanvas = ({ onCanvasChange, initialData = null }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [context, setContext] = useState(null);
  const [strokes, setStrokes] = useState([]);
  const { strokeData, clearStrokeData } = useBluetooth();

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    // Configure context
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    setContext(ctx);

    // Load initial data if provided
    if (initialData) {
      loadCanvasData(ctx, initialData);
    }
  }, [initialData]);

  useEffect(() => {
    // Handle bluetooth stroke data
    if (strokeData.length > 0 && context) {
      strokeData.forEach(data => {
        drawPoint(data.x, data.y, data.pressure);
      });
      clearStrokeData();
    }
  }, [strokeData, context, clearStrokeData]);

  const loadCanvasData = (ctx, data) => {
    if (data && data.startsWith('data:image')) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        ctx.drawImage(img, 0, 0);
      };
      img.src = data;
    }
  };

  const getMousePos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const getTouchPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: e.touches[0].clientX - rect.left,
      y: e.touches[0].clientY - rect.top
    };
  };

  const startDrawing = useCallback((e) => {
    setIsDrawing(true);
    const pos = e.type.includes('mouse') ? getMousePos(e) : getTouchPos(e);
    
    if (context) {
      context.beginPath();
      context.moveTo(pos.x, pos.y);
    }

    setStrokes(prev => [...prev, [{ x: pos.x, y: pos.y }]]);
  }, [context]);

  const draw = useCallback((e) => {
    if (!isDrawing || !context) return;
    
    e.preventDefault();
    const pos = e.type.includes('mouse') ? getMousePos(e) : getTouchPos(e);
    
    context.lineTo(pos.x, pos.y);
    context.stroke();

    setStrokes(prev => {
      const newStrokes = [...prev];
      newStrokes[newStrokes.length - 1].push({ x: pos.x, y: pos.y });
      return newStrokes;
    });
  }, [isDrawing, context]);

  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
    if (context) {
      context.closePath();
    }
    
    // Export canvas data
    if (canvasRef.current && onCanvasChange) {
      const dataURL = canvasRef.current.toDataURL('image/png');
      onCanvasChange(dataURL);
    }
  }, [context, onCanvasChange]);

  const drawPoint = useCallback((x, y, pressure = 1) => {
    if (!context) return;
    
    const normalizedX = (x / 4096) * canvasRef.current.width;
    const normalizedY = (y / 4096) * canvasRef.current.height;
    const lineWidth = Math.max(1, pressure / 255 * 5);
    
    context.lineWidth = lineWidth;
    context.beginPath();
    context.arc(normalizedX, normalizedY, lineWidth / 2, 0, 2 * Math.PI);
    context.fill();
  }, [context]);

  const clearCanvas = useCallback(() => {
    if (context && canvasRef.current) {
      context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      setStrokes([]);
      
      if (onCanvasChange) {
        const dataURL = canvasRef.current.toDataURL('image/png');
        onCanvasChange(dataURL);
      }
    }
  }, [context, onCanvasChange]);

  const undoLastStroke = useCallback(() => {
    if (strokes.length === 0 || !context) return;
    
    const newStrokes = strokes.slice(0, -1);
    setStrokes(newStrokes);
    
    // Redraw canvas
    context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    
    context.strokeStyle = '#1e293b';
    context.lineWidth = 2;
    
    newStrokes.forEach(stroke => {
      if (stroke.length > 0) {
        context.beginPath();
        context.moveTo(stroke[0].x, stroke[0].y);
        stroke.slice(1).forEach(point => {
          context.lineTo(point.x, point.y);
        });
        context.stroke();
      }
    });
    
    if (onCanvasChange) {
      const dataURL = canvasRef.current.toDataURL('image/png');
      onCanvasChange(dataURL);
    }
  }, [strokes, context, onCanvasChange]);

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className="drawing-canvas border border-gray-300 rounded-lg w-full h-full"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        style={{ touchAction: 'none' }}
      />
      
      <div className="absolute top-4 right-4 flex space-x-2">
        <button
          onClick={undoLastStroke}
          className="bg-white p-2 rounded-full shadow-md hover:shadow-lg transition-shadow"
          disabled={strokes.length === 0}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
        </button>
        
        <button
          onClick={clearCanvas}
          className="bg-white p-2 rounded-full shadow-md hover:shadow-lg transition-shadow"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default DrawingCanvas;