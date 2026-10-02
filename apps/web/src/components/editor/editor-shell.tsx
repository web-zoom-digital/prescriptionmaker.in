'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
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
import { toast } from 'sonner'

type EditorMode = 'form' | 'hand'

export function EditorShell() {
  const searchParams = useSearchParams()
  const templateSlug = searchParams.get('template') ?? TEMPLATES[0]?.slug ?? 'classic-medical'

  const baseTemplate = (TEMPLATES.find((t) => t.slug === templateSlug) ?? TEMPLATES[0]!) as Template
  const [customColor, setCustomColor] = useState<string | null>(null)
  
  const selectedTemplate = {
    ...baseTemplate,
    styles: {
      ...baseTemplate.styles,
      primaryColor: customColor ?? baseTemplate.styles.primaryColor
    }
  }

  const [mode, setMode] = useState<EditorMode>('form')
  const [showPreview, setShowPreview] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [prescriptionData, setPrescriptionData] = useState<Record<string, unknown>>({})
  const [isLoading, setIsLoading] = useState(true)

  const previewContainerRef = useRef<HTMLDivElement>(null)
  const [previewScale, setPreviewScale] = useState(1)

  useEffect(() => {
    if (!showPreview) return
    const container = previewContainerRef.current
    if (!container) return

    const observer = new ResizeObserver((entries) => {
      const { width } = entries[0].contentRect
      const A4_WIDTH = 794 // Approximate A4 width in pixels
      const padding = 40 // 20px padding on each side
      const availableWidth = width - padding
      
      if (availableWidth < A4_WIDTH) {
        setPreviewScale(availableWidth / A4_WIDTH)
      } else {
        setPreviewScale(1)
      }
    })

    observer.observe(container)
    return () => observer.disconnect()
  }, [showPreview])

  const id = searchParams.get('id')
  const router = useRouter()

  useEffect(() => {
    async function loadData() {
        let baseDoctorInfo: any = {}
        try {
          const profRes = await fetch('/api/profile')
          const profJson = await profRes.json()
          if (profJson.data) {
            baseDoctorInfo = {
              doctorName: profJson.data.doctor_name,
              doctorQualifications: profJson.data.qualifications,
              doctorSpecialization: profJson.data.specialization,
              doctorRegNumber: profJson.data.registration_number,
              clinicName: profJson.data.clinic_name,
              clinicPhone: profJson.data.clinic_phone,
              clinicAddress: profJson.data.clinic_address,
              signatureDataUrl: profJson.data.signature_url,
              clinicLogoUrl: profJson.data.clinic_logo_url,
              stampUrl: profJson.data.stamp_url,
            }
          }
        } catch (e) {
          console.error('Failed to load profile', e)
        }

        if (!id) {
          setPrescriptionData(baseDoctorInfo)
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
              ...baseDoctorInfo,
              doctorName: doctor_info?.name || baseDoctorInfo.doctorName,
              doctorQualifications: doctor_info?.qualifications || baseDoctorInfo.doctorQualifications,
              doctorSpecialization: doctor_info?.specialization || baseDoctorInfo.doctorSpecialization,
              doctorRegNumber: doctor_info?.registrationNumber || baseDoctorInfo.doctorRegNumber,
              clinicName: doctor_info?.clinicName || baseDoctorInfo.clinicName,
              clinicPhone: doctor_info?.phone || baseDoctorInfo.clinicPhone,
              clinicAddress: doctor_info?.address || baseDoctorInfo.clinicAddress,
              signatureDataUrl: doctor_info?.signatureUrl || baseDoctorInfo.signatureDataUrl,
              clinicLogoUrl: doctor_info?.logoUrl || baseDoctorInfo.clinicLogoUrl,
              stampUrl: doctor_info?.stampUrl || baseDoctorInfo.stampUrl,
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
           signatureUrl: prescriptionData.signatureDataUrl,
           logoUrl: prescriptionData.clinicLogoUrl,
           stampUrl: prescriptionData.stampUrl,
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
    const data = prescriptionData as any
    const labTestsStr = Array.isArray(data.tests) ? data.tests.map((t: any) => t.name).join(', ') : ''
    exportPdf({
      templateSlug: selectedTemplate.slug,
      customColor: customColor ?? undefined,
      doctor: {
        name: data.doctorInfo?.name ?? data.doctorName,
        qualifications: data.doctorInfo?.qualifications ?? data.doctorQualifications,
        specialization: data.doctorInfo?.specialization ?? data.doctorSpecialization,
        registrationNumber: data.doctorInfo?.registrationNumber ?? data.doctorRegNumber,
        clinicName: data.doctorInfo?.clinicName ?? data.clinicName,
        phone: data.doctorInfo?.phone ?? data.clinicPhone,
        address: data.doctorInfo?.address ?? data.clinicAddress,
        signatureUrl: data.doctorInfo?.signatureUrl ?? data.signatureDataUrl,
        logoUrl: data.doctorInfo?.logoUrl ?? data.clinicLogoUrl,
        stampUrl: data.doctorInfo?.stampUrl ?? data.stampUrl,
      },
      patient: data.patientInfo ?? data.patient ?? {},
      diagnosis: data.diagnosis,
      medicines: (data.medicines ?? []) as Record<string, string>[],
      labTests: labTestsStr,
      advice: data.advice,
      followUpDate: data.followUp ?? data.followUpDate,
    })
  }

  const handleShareWhatsApp = async () => {
    const data = prescriptionData as any
    const labTestsStr = Array.isArray(data.tests) ? data.tests.map((t: any) => t.name).join(', ') : ''
    const payload = {
      templateSlug: selectedTemplate.slug,
      customColor: customColor ?? undefined,
      doctor: data.doctorInfo ?? {
        name: data.doctorName,
        qualifications: data.doctorQualifications,
        specialization: data.doctorSpecialization,
        registrationNumber: data.doctorRegNumber,
        clinicName: data.clinicName,
        phone: data.clinicPhone,
        address: data.clinicAddress,
        signatureUrl: data.signatureDataUrl,
        logoUrl: data.clinicLogoUrl,
        stampUrl: data.stampUrl,
      },
      patient: data.patientInfo ?? data.patient ?? {},
      diagnosis: data.diagnosis,
      medicines: (data.medicines ?? []) as Record<string, string>[],
      labTests: labTestsStr,
      advice: data.advice,
      followUpDate: data.followUp ?? data.followUpDate,
    }

    const result = await generatePdfBlob(payload)
    
    if (result) {
      const file = new File([result.blob], result.filename, { type: 'application/pdf' })
      const text = `Hello ${(data.patientInfo ?? data.patient)?.name ?? 'Patient'},\n\nPlease find your digital prescription attached.\n\nDr. ${data.doctorName ?? ''}`
      
      // Check if native sharing with files is supported (mostly mobile)
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        toast('Prescription ready', {
          description: 'Tap below to share via WhatsApp',
          action: {
            label: 'Share',
            onClick: () => {
              navigator.share({
                title: 'Prescription',
                text: text,
                files: [file]
              }).catch(err => console.error('Error sharing:', err))
            }
          },
          duration: 10000,
        })
      } else {
        // Fallback for desktop: PDF must be downloaded and manually attached.
        const url = `https://wa.me/?text=${encodeURIComponent(text)}`
        
        // Trigger download
        exportPdf(payload)
        
        // Try opening WhatsApp Web (might be blocked by popup blocker)
        const newWindow = window.open(url, '_blank')
        
        if (!newWindow) {
          // If popup was blocked, show a toast with a button
          toast.success('PDF Downloaded for WhatsApp', {
            description: 'Your browser blocked the popup. Click below to open WhatsApp Web.',
            action: {
              label: 'Open WhatsApp',
              onClick: () => window.open(url, '_blank')
            },
            duration: 10000
          })
        } else {
          toast.success('Opening WhatsApp Web', {
            description: 'Please drag & drop the downloaded PDF into the chat.',
            duration: 5000
          })
        }
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

          <div className="flex items-center gap-3 border-l border-border pl-3">
            <span className="text-sm font-semibold text-slate-900 truncate max-w-[150px] sm:max-w-none">
              {selectedTemplate.name}
            </span>
            <label className="relative flex items-center gap-1.5 cursor-pointer rounded-md border border-slate-200 bg-slate-50 px-2 py-1 shadow-sm transition-colors hover:bg-slate-100 hover:border-slate-300">
              <input 
                type="color" 
                value={selectedTemplate.styles.primaryColor}
                onChange={(e) => setCustomColor(e.target.value)}
                className="absolute opacity-0 w-full h-full cursor-pointer"
                title="Change Template Color"
              />
              <div
                className="h-3.5 w-3.5 rounded-full border shadow-[inset_0_0_0_1px_rgba(0,0,0,0.1)] transition-transform hover:scale-110"
                style={{ backgroundColor: selectedTemplate.styles.primaryColor }}
                aria-hidden="true"
              />
              <span className="text-xs font-semibold text-slate-600">Change Color</span>
            </label>
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

        {/* Actions - Desktop */}
        <div className="hidden lg:flex items-center gap-2">
          <button
            className={cn(
              'flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground',
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
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            )}
            <span>{isExporting ? 'Preparing…' : 'WhatsApp'}</span>
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
                    onDataChange={(newData) => setPrescriptionData(prev => ({ ...prev, ...newData }))}
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
                    fullData={prescriptionData}
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
          <div className="hidden border-l border-border bg-slate-50/80 lg:flex lg:w-1/2 lg:flex-col">
            <div className="flex items-center justify-between border-b border-border bg-white px-4 py-2.5 z-10 shadow-sm">
              <span className="text-xs font-semibold text-slate-900">Preview</span>
              <span className="text-xs text-muted-foreground">A4 · {selectedTemplate.name}</span>
            </div>
            <div 
              ref={previewContainerRef}
              className="flex-1 overflow-y-auto overflow-x-hidden p-4 flex justify-center items-start"
            >
              <div 
                className="origin-top shadow-xl transition-transform duration-200"
                style={{ 
                  transform: `scale(${previewScale})`,
                  width: '210mm',
                  marginBottom: `calc((1 - ${previewScale}) * -297mm)`,
                }}
              >
                <div className="bg-white">
                  <PrescriptionPreview template={selectedTemplate} data={prescriptionData} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Actions Bottom Bar - Premium App Style */}
      <div 
        className="grid grid-cols-4 lg:hidden flex-shrink-0 border-t border-slate-200/60 bg-white/90 backdrop-blur-md shadow-[0_-8px_30px_-5px_rgba(0,0,0,0.08)] z-20 w-full"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {/* Preview */}
        <button
          className={cn(
            'flex flex-col items-center justify-center gap-1.5 py-3 transition-colors hover:bg-slate-50',
            showPreview ? 'text-primary' : 'text-slate-500'
          )}
          onClick={() => setShowPreview(!showPreview)}
        >
          <Eye className="h-5 w-5" aria-hidden="true" />
          <span className="text-[10px] font-medium leading-none">{showPreview ? 'Hide' : 'Preview'}</span>
        </button>

        {/* Save */}
        <button
          className={cn(
            'flex flex-col items-center justify-center gap-1.5 py-3 text-slate-500 transition-colors hover:bg-slate-50',
            isSaving && 'opacity-60 cursor-not-allowed text-primary'
          )}
          onClick={handleSave}
          disabled={isSaving}
        >
          <Save className={cn('h-5 w-5', isSaving && 'animate-pulse')} aria-hidden="true" />
          <span className="text-[10px] font-medium leading-none">{isSaving ? 'Saving' : 'Save'}</span>
        </button>

        {/* WhatsApp */}
        <button
          onClick={handleShareWhatsApp}
          disabled={isExporting}
          className={cn(
            'flex flex-col items-center justify-center gap-1.5 py-3 transition-colors hover:bg-green-50/50',
            isExporting ? 'opacity-70 cursor-not-allowed' : 'text-[#25D366]'
          )}
          aria-label="Share via WhatsApp"
        >
          {isExporting ? (
            <Loader2 className="h-5 w-5 animate-spin text-slate-500" aria-hidden="true" />
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
          )}
          <span className="text-[10px] font-medium leading-none text-slate-500">{isExporting ? 'Preparing' : 'WhatsApp'}</span>
        </button>

        {/* Export PDF */}
        <button
          className={cn(
            'flex flex-col items-center justify-center gap-1.5 py-3 transition-colors hover:bg-primary/5',
            isExporting ? 'opacity-70 cursor-not-allowed' : 'text-primary'
          )}
          onClick={handleExportPdf}
          disabled={isExporting}
          aria-label="Export prescription as PDF"
        >
          {isExporting ? (
            <Loader2 className="h-5 w-5 animate-spin text-slate-500" aria-hidden="true" />
          ) : (
            <Download className="h-5 w-5" aria-hidden="true" />
          )}
          <span className="text-[10px] font-medium leading-none text-slate-500">{isExporting ? 'Generating' : 'Download'}</span>
        </button>
      </div>
    </div>
  )
}
