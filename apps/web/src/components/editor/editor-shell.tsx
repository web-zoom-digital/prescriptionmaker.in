'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, Pen, ArrowLeft, Download, Save, Eye, Loader2, MessageCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { TEMPLATES } from '@prescriptionmaker/config/templates'
import { FormEditor } from './form-editor'
import { PrescriptionPreview } from './prescription-preview'
import { CanvasEditor } from './canvas-editor'
import { usePdfExport } from '@/hooks/use-pdf-export'
import { cn } from '@/lib/utils'
import type { Template } from '@prescriptionmaker/types'

type EditorMode = 'form' | 'hand'

export function EditorShell() {
  const searchParams = useSearchParams()
  const templateSlug = searchParams.get('template') ?? TEMPLATES[0]?.slug ?? 'classic-medical'

  const selectedTemplate = (TEMPLATES.find((t) => t.slug === templateSlug) ?? TEMPLATES[0]!) as Template
  const [mode, setMode] = useState<EditorMode>('form')
  const [showPreview, setShowPreview] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [prescriptionData, setPrescriptionData] = useState<Record<string, unknown>>({})
  const [isLoading, setIsLoading] = useState(true)

  const id = searchParams.get('id')
  const router = useRouter()

  useEffect(() => {
    async function loadData() {
      if (!id) {
        setIsLoading(false)
        return
      }
      try {
        const res = await fetch(`/api/prescriptions/${id}`)
        const json = await res.json()
        if (json.success && json.data) {
          const { mode: dbMode, canvas_data, doctor_info, patient_info, diagnosis, medicines, lab_tests, advice, follow_up_date } = json.data
          if (dbMode) setMode(dbMode)
          setPrescriptionData({
            doctorName: doctor_info?.name,
            doctorQualifications: doctor_info?.qualifications,
            doctorSpecialization: doctor_info?.specialization,
            doctorRegNumber: doctor_info?.registrationNumber,
            clinicName: doctor_info?.clinicName,
            clinicPhone: doctor_info?.phone,
            clinicAddress: doctor_info?.address,
            patient: patient_info,
            diagnosis,
            medicines,
            tests: lab_tests ? lab_tests.split(',').map((t: string) => ({ name: t })) : undefined, // simplified
            advice,
            followUp: follow_up_date,
            canvasData: canvas_data
          })
        }
      } catch (err) {
        console.error('Failed to load prescription:', err)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [id])

  const { exportPdf, generatePdfBlob, isExporting } = usePdfExport()

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const payload = {
        title: (prescriptionData.patient as any)?.name ? `Rx: ${(prescriptionData.patient as any).name}` : 'Untitled',
        status: 'complete',
        templateSlug: selectedTemplate.slug,
        mode,
        doctorInfo: {
           name: prescriptionData.doctorName,
           qualifications: prescriptionData.doctorQualifications,
           specialization: prescriptionData.doctorSpecialization,
           registrationNumber: prescriptionData.doctorRegNumber,
           clinicName: prescriptionData.clinicName,
           phone: prescriptionData.clinicPhone,
           address: prescriptionData.clinicAddress,
        },
        patientInfo: prescriptionData.patient,
        diagnosis: prescriptionData.diagnosis,
        medicines: prescriptionData.medicines,
        labTests: Array.isArray(prescriptionData.tests) ? prescriptionData.tests.map((t: any) => t.name).join(', ') : '',
        advice: prescriptionData.advice,
        followUpDate: prescriptionData.followUp,
        canvasData: prescriptionData.canvasData
      }

      let url = '/api/prescriptions'
      let method = 'POST'
      if (id) {
        url = `/api/prescriptions/${id}`
        method = 'PUT'
      }
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const json = await res.json()
      if (json.success && !id) {
        // Redirect to new ID
        router.replace(`/editor?id=${json.data.id}`)
      }
    } catch (err) {
      console.error('Failed to save prescription:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleExportPdf = () => {
    const data = prescriptionData as {
      doctorInfo?: Record<string, string>
      patientInfo?: Record<string, string>
      diagnosis?: string
      medicines?: Record<string, string>[]
      labTests?: string
      advice?: string
      followUpDate?: string
    }
    exportPdf({
      templateSlug: selectedTemplate.slug,
      doctor: data.doctorInfo ?? {},
      patient: data.patientInfo ?? {},
      diagnosis: data.diagnosis,
      medicines: (data.medicines ?? []) as Record<string, string>[],
      labTests: data.labTests,
      advice: data.advice,
      followUpDate: data.followUpDate,
    })
  }

  const handleShareWhatsApp = async () => {
    const data = prescriptionData as {
      doctorInfo?: Record<string, string>
      patientInfo?: Record<string, string>
      diagnosis?: string
      medicines?: Record<string, string>[]
      labTests?: string
      advice?: string
      followUpDate?: string
    }
    const result = await generatePdfBlob({
      templateSlug: selectedTemplate.slug,
      doctor: data.doctorInfo ?? {},
      patient: data.patientInfo ?? {},
      diagnosis: data.diagnosis,
      medicines: (data.medicines ?? []) as Record<string, string>[],
      labTests: data.labTests,
      advice: data.advice,
      followUpDate: data.followUpDate,
    })
    
    if (result) {
      const file = new File([result.blob], result.filename, { type: 'application/pdf' })
      const text = `Hello ${(data.patientInfo as any)?.name ?? 'Patient'},\n\nPlease find your digital prescription attached.\n\nDr. ${(data.doctorInfo as any)?.name ?? ''}`
      
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            title: 'Prescription',
            text: text,
            files: [file]
          })
        } catch (err) {
          console.error('Error sharing:', err)
        }
      } else {
        // Fallback for desktop: Create a generic whatsapp link
        const url = `https://wa.me/?text=${encodeURIComponent(text)}`
        window.open(url, '_blank')
        // We can't attach the PDF directly to wa.me, so we also trigger download
        exportPdf({
          templateSlug: selectedTemplate.slug,
          doctor: data.doctorInfo ?? {},
          patient: data.patientInfo ?? {},
          diagnosis: data.diagnosis,
          medicines: (data.medicines ?? []) as Record<string, string>[],
          labTests: data.labTests,
          advice: data.advice,
          followUpDate: data.followUpDate,
        })
      }
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Editor Top Bar */}
      <header className="flex h-14 flex-shrink-0 items-center justify-between border-b border-border bg-white px-4 shadow-soft-sm">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </Link>

          <div className="flex items-center gap-2 border-l border-border pl-3">
            <div
              className="h-3 w-3 rounded-sm"
              style={{ backgroundColor: selectedTemplate.styles.primaryColor }}
              aria-hidden="true"
            />
            <span className="text-sm font-semibold text-slate-900 truncate max-w-[150px] sm:max-w-none">
              {selectedTemplate.name}
            </span>
          </div>
        </div>

        {/* Mode toggle */}
        <div
          className="flex items-center rounded-lg border border-border bg-slate-50 p-0.5"
          role="tablist"
          aria-label="Editor mode"
        >
          <button
            role="tab"
            aria-selected={mode === 'form'}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-200',
              mode === 'form'
                ? 'bg-white text-slate-900 shadow-soft-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
            onClick={() => setMode('form')}
          >
            <FileText className="h-3.5 w-3.5" aria-hidden="true" />
            Form
          </button>
          <button
            role="tab"
            aria-selected={mode === 'hand'}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-200',
              mode === 'hand'
                ? 'bg-white text-slate-900 shadow-soft-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
            onClick={() => setMode('hand')}
          >
            <Pen className="h-3.5 w-3.5" aria-hidden="true" />
            Hand Mode
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            className={cn(
              'hidden sm:flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground',
              'transition-colors hover:border-primary/30 hover:text-primary'
            )}
            onClick={() => setShowPreview(!showPreview)}
          >
            <Eye className="h-3.5 w-3.5" aria-hidden="true" />
            {showPreview ? 'Hide' : 'Show'} Preview
          </button>

          <button
            className={cn(
              'flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground',
              'transition-colors hover:border-primary/30 hover:text-primary',
              isSaving && 'opacity-60 cursor-not-allowed'
            )}
            onClick={handleSave}
            disabled={isSaving}
          >
            <Save className={cn('h-3.5 w-3.5', isSaving && 'animate-pulse')} aria-hidden="true" />
            {isSaving ? 'Saving…' : 'Save'}
          </button>

          <button
            onClick={handleShareWhatsApp}
            disabled={isExporting}
            className={cn(
              'flex items-center gap-1.5 rounded-md bg-[#25D366] px-3 py-1.5 text-xs font-semibold text-white shadow-soft-sm transition-all duration-200 hover:bg-[#128C7E]',
              isExporting && 'opacity-70 cursor-not-allowed'
            )}
            aria-label="Share via WhatsApp"
          >
            {isExporting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            <span className="hidden sm:inline">{isExporting ? 'Preparing…' : 'WhatsApp'}</span>
          </button>

          <button
            id="editor-export-pdf"
            className={cn(
              'flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-white shadow-teal transition-all duration-200 hover:bg-primary/90 hover:shadow-teal-lg',
              isExporting && 'opacity-70 cursor-not-allowed'
            )}
            onClick={handleExportPdf}
            disabled={isExporting}
            aria-label="Export prescription as PDF"
          >
            {isExporting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            {isExporting ? 'Generating…' : 'Export PDF'}
          </button>
        </div>
      </header>

      {/* Editor body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Editor panel */}
        <div
          className={cn(
            'flex-1 overflow-auto bg-slate-50 transition-all duration-300',
            showPreview && 'lg:w-1/2 lg:flex-none'
          )}
        >
          <AnimatePresence mode="wait">
            {mode === 'form' ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                {!isLoading && (
                  <FormEditor
                    template={selectedTemplate}
                    initialData={prescriptionData}
                    onDataChange={setPrescriptionData}
                  />
                )}
              </motion.div>
            ) : (
              <motion.div
                key="hand"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                {!isLoading && (
                  <CanvasEditor 
                    template={selectedTemplate} 
                    initialData={prescriptionData.canvasData}
                    onSave={(json) => {
                      setPrescriptionData(prev => ({ ...prev, canvasData: json }))
                    }}
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Preview panel */}
        {showPreview && (
          <div className="hidden border-l border-border bg-white lg:flex lg:w-1/2 lg:flex-col">
            <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
              <span className="text-xs font-semibold text-slate-900">Preview</span>
              <span className="text-xs text-muted-foreground">A4 · {selectedTemplate.name}</span>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <PrescriptionPreview template={selectedTemplate} data={prescriptionData} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
