'use client'

import { useEffect, useRef, useState } from 'react'
import * as fabric from 'fabric'
import { Eraser, Undo, Redo, Save, Trash2, Pen } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Template } from '@prescriptionmaker/types'
import { PrescriptionPreview } from './prescription-preview'

interface CanvasEditorProps {
  template: Template
  initialData?: any
  fullData?: any
  onSave?: (canvasJSON: any) => void
}

export function CanvasEditor({ template, initialData, fullData, onSave }: CanvasEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null)
  const [isDrawing, setIsDrawing] = useState(true)
  const [brushSize, setBrushSize] = useState(2)
  const [brushColor, setBrushColor] = useState('#0f172a') // Slate-900

  // History state for undo/redo (simplified version)
  const [history, setHistory] = useState<string[]>([])
  const [historyStep, setHistoryStep] = useState(-1)

  useEffect(() => {
    if (!canvasRef.current) return

    // Initialize Fabric Canvas
    const initCanvas = new fabric.Canvas(canvasRef.current, {
      isDrawingMode: true,
      backgroundColor: 'rgba(255,255,255,0)',
    })

    // Set initial brush
    const brush = new fabric.PencilBrush(initCanvas)
    brush.color = brushColor
    brush.width = brushSize
    initCanvas.freeDrawingBrush = brush

    // If we have initial data, load it
    if (initialData) {
      initCanvas.loadFromJSON(initialData, () => {
        initCanvas.renderAll()
        saveHistory(initCanvas)
      })
    } else {
      saveHistory(initCanvas)
    }

    // Save history on changes
    initCanvas.on('path:created', () => saveHistory(initCanvas))
    initCanvas.on('object:modified', () => saveHistory(initCanvas))

    setCanvas(initCanvas)

    // Cleanup
    return () => {
      initCanvas.dispose()
    }
  }, []) // Empty dependency array means this runs once on mount

  // History Management
  const saveHistory = (currentCanvas: fabric.Canvas) => {
    if (!currentCanvas) return
    const json = currentCanvas.toJSON()
    const jsonString = JSON.stringify(json)
    
    setHistory((prev) => {
      const newHistory = prev.slice(0, historyStep + 1)
      newHistory.push(jsonString)
      return newHistory
    })
    setHistoryStep((prev) => prev + 1)
  }

  const undo = () => {
    if (historyStep > 0 && canvas) {
      const prevStep = historyStep - 1
      setHistoryStep(prevStep)
      canvas.loadFromJSON(history[prevStep], () => canvas.renderAll())
    }
  }

  const redo = () => {
    if (historyStep < history.length - 1 && canvas) {
      const nextStep = historyStep + 1
      setHistoryStep(nextStep)
      canvas.loadFromJSON(history[nextStep], () => canvas.renderAll())
    }
  }

  const clearCanvas = () => {
    if (canvas) {
      canvas.clear()
      canvas.backgroundColor = 'rgba(255,255,255,0)'
      canvas.renderAll()
      saveHistory(canvas)
    }
  }

  // Brush controls
  useEffect(() => {
    if (canvas) {
      canvas.isDrawingMode = isDrawing
      if (isDrawing && canvas.freeDrawingBrush) {
        canvas.freeDrawingBrush.color = brushColor
        canvas.freeDrawingBrush.width = brushSize
      }
    }
  }, [canvas, isDrawing, brushColor, brushSize])

  const setEraser = () => {
    if (canvas) {
      setIsDrawing(true)
      // White brush acts as eraser on white background
      setBrushColor('#ffffff')
      setBrushSize(15) 
    }
  }

  const setPen = () => {
    setIsDrawing(true)
    setBrushColor('#0f172a')
    setBrushSize(2)
  }

  return (
    <div className="flex h-full flex-col bg-slate-100">
      {/* Toolbar */}
      <div className="flex items-center gap-2 border-b border-border bg-white px-4 py-2 shadow-sm">
        <div className="flex items-center gap-1 border-r border-border pr-2">
          <button
            onClick={setPen}
            className={cn(
              'rounded-md p-2 transition-colors',
              isDrawing && brushColor !== '#ffffff' ? 'bg-teal-50 text-teal-600' : 'text-slate-500 hover:bg-slate-100'
            )}
            title="Pen Tool"
          >
            <Pen className="h-4 w-4" />
          </button>
          <button
            onClick={setEraser}
            className={cn(
              'rounded-md p-2 transition-colors',
              isDrawing && brushColor === '#ffffff' ? 'bg-teal-50 text-teal-600' : 'text-slate-500 hover:bg-slate-100'
            )}
            title="Eraser Tool"
          >
            <Eraser className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-1 border-r border-border pr-2">
           <button
            onClick={undo}
            disabled={historyStep <= 0}
            className="rounded-md p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50 transition-colors"
            title="Undo"
          >
            <Undo className="h-4 w-4" />
          </button>
          <button
            onClick={redo}
            disabled={historyStep >= history.length - 1}
            className="rounded-md p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50 transition-colors"
            title="Redo"
          >
            <Redo className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-1 items-center justify-end gap-2">
          <button
            onClick={clearCanvas}
            className="flex items-center gap-1 rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear
          </button>
          <button
            onClick={() => {
              if (canvas && onSave) {
                onSave({
                  json: canvas.toJSON(),
                  image: canvas.toDataURL({ format: 'png', multiplier: 2 })
                })
              }
            }}
            className="flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-primary/90 transition-colors"
          >
            <Save className="h-3.5 w-3.5" />
            Save Canvas
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex flex-1 items-center justify-center overflow-auto p-4 lg:p-8">
        <div 
           className="shadow-soft-xl bg-white relative"
           style={{ 
             width: '210mm', 
             height: '297mm', // A4 ratio
             maxWidth: '100%',
             maxHeight: '100%',
             aspectRatio: '210/297'
           }}
        >
          {/* Background Template Preview */}
          <div className="absolute inset-0 pointer-events-none opacity-40 select-none overflow-hidden">
            <PrescriptionPreview template={template} data={fullData || {}} />
          </div>

          <canvas
            ref={canvasRef}
            width={794} // A4 width at 96 DPI
            height={1123} // A4 height at 96 DPI
            className="h-full w-full object-contain cursor-crosshair"
          />
        </div>
      </div>
    </div>
  )
}
