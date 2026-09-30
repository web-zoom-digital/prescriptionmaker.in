'use client'

import { useEffect, useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2, ChevronDown, ChevronUp, Search, X, Zap } from 'lucide-react'
import { prescriptionFormSchema, type PrescriptionFormValues } from '@prescriptionmaker/validation'
import { DIAGNOSIS_TEMPLATES, searchTemplates, type DiagnosisTemplate } from '@/lib/diagnosis-templates'
import { cn } from '@/lib/utils'
import type { Template } from '@prescriptionmaker/types'

interface FormEditorProps {
  template: Template
  initialData?: any
  onDataChange: (data: Record<string, unknown>) => void
}

const DOSE_FREQUENCIES = [{label: 'Once daily (OD)', value: 'OD'}, {label: 'Twice daily (BD)', value: 'BD'}, {label: 'Three times (TDS)', value: 'TDS'}, {label: 'Four times (QID)', value: 'QID'}, {label: 'SOS', value: 'SOS'}, {label: '1-0-1', value: '1-0-1'}, {label: '1-1-1', value: '1-1-1'}, {label: '1-0-0', value: '1-0-0'}, {label: '0-0-1', value: '0-0-1'}]
const DOSE_TIMINGS = [{label: 'Before food', value: 'before_food'}, {label: 'After food', value: 'after_food'}, {label: 'With food', value: 'with_food'}, {label: 'Empty stomach', value: 'empty_stomach'}, {label: 'At bedtime', value: 'bedtime'}]

export function FormEditor({ template, initialData, onDataChange }: FormEditorProps) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    doctor: true,
    patient: true,
    medicines: true,
    advice: false,
  })

  const { register, control, watch, formState: { errors }, reset } = useForm<PrescriptionFormValues>({
    resolver: zodResolver(prescriptionFormSchema),
    defaultValues: initialData || {
      medicines: [{ id: '1', name: '', strength: '', form: 'tablet', frequency: 'BD', timing: 'after_food', duration: '5 days', route: 'oral' }],
    },
  })

  const [templateSearch, setTemplateSearch] = useState('')
  const [showTemplateModal, setShowTemplateModal] = useState(false)

  // Removed useEffect calling reset(initialData) to prevent infinite loop
  // defaultValues is sufficient since FormEditor mounts after isLoading is false.

  const { fields: medicineFields, append: appendMedicine, remove: removeMedicine } = useFieldArray({
    control,
    name: 'medicines',
  })

  useEffect(() => {
    const subscription = watch((value) => {
      onDataChange(value as unknown as Record<string, unknown>)
    })
    return () => subscription.unsubscribe()
  }, [watch, onDataChange])

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const applyDiagnosisTemplate = (tpl: DiagnosisTemplate) => {
    // We use setValue from useForm to update fields directly
    control._formValues.diagnosis = tpl.diagnosis
    
    // Add medicines from template
    const newMeds = tpl.medicines.map((m, i) => ({
      id: `tpl-${Date.now()}-${i}`,
      name: m.name,
      strength: m.strength,
      frequency: m.frequency,
      timing: 'after_food', // default
      duration: m.duration,
      instructions: m.instructions,
      form: 'tablet', // default
      route: 'oral'
    }))
    
    // Append or replace
    const currentMeds = control._formValues.medicines || []
    if (currentMeds.length === 1 && !currentMeds[0].name) {
       control._formValues.medicines = newMeds
    } else {
       control._formValues.medicines = [...currentMeds, ...newMeds]
    }
    
    if (tpl.advice) {
      const prevAdvice = control._formValues.advice
      control._formValues.advice = prevAdvice ? `${prevAdvice}\n${tpl.advice}` : tpl.advice
    }
    
    if (tpl.followUp) {
      control._formValues.followUpDate = tpl.followUp
    }
    
    // Trigger re-render by doing a hard reset with the updated values
    const { reset } = require('react-hook-form')
    // We just trigger form update
    const formVals = { ...control._formValues }
    onDataChange(formVals)
    
    setShowTemplateModal(false)
    setTemplateSearch('')
  }

  return (
    <div className="mx-auto max-w-2xl p-5 space-y-4">
      {/* Doctor Information */}
      <EditorSection
        title="Doctor Information"
        open={openSections['doctor']!}
        onToggle={() => toggleSection('doctor')}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FormField id="doctor-name" label="Doctor Name" error={errors.doctorName?.message}>
            <input
              id="doctor-name"
              type="text"
              {...register('doctorName')}
              className="form-input"
              placeholder="Dr. Full Name"
            />
          </FormField>

          <FormField id="doctor-qualifications" label="Qualifications" error={errors.doctorQualifications?.message}>
            <input
              id="doctor-qualifications"
              type="text"
              {...register('doctorQualifications')}
              className="form-input"
              placeholder="MBBS, MD"
            />
          </FormField>

          <FormField id="doctor-specialization" label="Specialization" error={errors.doctorSpecialization?.message}>
            <input
              id="doctor-specialization"
              type="text"
              {...register('doctorSpecialization')}
              className="form-input"
              placeholder="General Medicine"
            />
          </FormField>

          <FormField id="doctor-registration" label="Registration No." error={errors.doctorRegNumber?.message}>
            <input
              id="doctor-registration"
              type="text"
              {...register('doctorRegNumber')}
              className="form-input"
              placeholder="MCI/State Reg. No."
            />
          </FormField>

          <FormField id="doctor-clinic" label="Clinic / Hospital Name" className="sm:col-span-2" error={errors.clinicName?.message}>
            <input
              id="doctor-clinic"
              type="text"
              {...register('clinicName')}
              className="form-input"
              placeholder="Name of your clinic"
            />
          </FormField>

          <FormField id="doctor-phone" label="Contact Phone" error={errors.clinicPhone?.message}>
            <input
              id="doctor-phone"
              type="tel"
              {...register('clinicPhone')}
              className="form-input"
              placeholder="+91 XXXXX XXXXX"
            />
          </FormField>

          <FormField id="doctor-address" label="Clinic Address" error={errors.clinicAddress?.message}>
            <input
              id="doctor-address"
              type="text"
              {...register('clinicAddress')}
              className="form-input"
              placeholder="City, State"
            />
          </FormField>
        </div>
      </EditorSection>

      {/* Patient Information */}
      <EditorSection
        title="Patient Information"
        open={openSections['patient']!}
        onToggle={() => toggleSection('patient')}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FormField id="patient-name" label="Patient Name" className="sm:col-span-2" error={errors.patient?.name?.message}>
            <input
              id="patient-name"
              type="text"
              {...register('patient.name')}
              className="form-input"
              placeholder="Patient full name"
            />
          </FormField>

          <FormField id="patient-age" label="Age" error={errors.patient?.age?.message}>
            <input
              id="patient-age"
              type="text"
              {...register('patient.age')}
              className="form-input"
              placeholder="e.g. 34"
            />
          </FormField>

          <FormField id="patient-gender" label="Gender" error={errors.patient?.gender?.message}>
            <select id="patient-gender" {...register('patient.gender')} className="form-input">
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </FormField>

          <div className="sm:col-span-2">
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="patient-diagnosis" className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                Diagnosis / Chief Complaint
              </label>
              <button
                type="button"
                onClick={() => setShowTemplateModal(true)}
                className="flex items-center gap-1.5 rounded-lg bg-teal-50 px-2.5 py-1 text-xs font-bold text-primary transition-colors hover:bg-teal-100"
              >
                <Zap className="h-3 w-3" /> Use Template
              </button>
            </div>
            <input
              id="patient-diagnosis"
              type="text"
              {...register('diagnosis')}
              className={cn("form-input", errors.diagnosis?.message && 'border-red-300 bg-red-50')}
              placeholder="e.g. Acute Pharyngitis"
            />
            {errors.diagnosis?.message && (
              <p className="mt-1 text-xs font-medium text-red-500">{errors.diagnosis.message}</p>
            )}
          </div>
        </div>
      </EditorSection>

      {/* Medicines */}
      <EditorSection
        title={`Medicines (Rx) — ${medicineFields.length}`}
        open={openSections['medicines']!}
        onToggle={() => toggleSection('medicines')}
        accent
      >
        <div className="space-y-3">
          {medicineFields.map((field, index) => (
            <div
              key={field.id}
              className="relative rounded-lg border border-teal-200 bg-teal-50/30 p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-teal-700">Medicine {index + 1}</span>
                {medicineFields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeMedicine(index)}
                    className="rounded p-1 text-muted-foreground hover:bg-red-50 hover:text-red-500 transition-colors"
                    aria-label={`Remove medicine ${index + 1}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <FormField id={`med-name-${index}`} label="Medicine Name" className="sm:col-span-2">
                  <input
                    id={`med-name-${index}`}
                    type="text"
                    {...register(`medicines.${index}.name`)}
                    className="form-input"
                    placeholder="e.g. Amoxicillin"
                  />
                </FormField>

                <FormField id={`med-strength-${index}`} label="Strength / Dose">
                  <input
                    id={`med-strength-${index}`}
                    type="text"
                    {...register(`medicines.${index}.strength`)}
                    className="form-input"
                    placeholder="e.g. 500mg"
                  />
                </FormField>

                <FormField id={`med-form-${index}`} label="Form">
                  <select id={`med-form-${index}`} {...register(`medicines.${index}.form`)} className="form-input">
                    {['tablet', 'capsule', 'syrup', 'injection', 'cream', 'drops', 'inhaler', 'suspension', 'powder', 'patch'].map((f) => (
                      <option key={f} value={f} className="capitalize">{f}</option>
                    ))}
                  </select>
                </FormField>

                <FormField id={`med-frequency-${index}`} label="Frequency">
                  <select id={`med-frequency-${index}`} {...register(`medicines.${index}.frequency`)} className="form-input">
                    {DOSE_FREQUENCIES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                  </select>
                </FormField>

                <FormField id={`med-timing-${index}`} label="Timing">
                  <select id={`med-timing-${index}`} {...register(`medicines.${index}.timing`)} className="form-input">
                    {DOSE_TIMINGS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </FormField>

                <FormField id={`med-duration-${index}`} label="Duration">
                  <input
                    id={`med-duration-${index}`}
                    type="text"
                    {...register(`medicines.${index}.duration`)}
                    className="form-input"
                    placeholder="e.g. 5 days"
                  />
                </FormField>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={() => appendMedicine({
              id: Date.now().toString(),
              name: '',
              strength: '',
              form: 'tablet',
              frequency: 'BD',
              timing: 'after_food',
              duration: '',
              route: 'oral',
            })}
            className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-teal-300 py-3 text-sm font-medium text-teal-600 transition-colors hover:border-teal-500 hover:bg-teal-50"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add Medicine
          </button>
        </div>
      </EditorSection>

      {/* Advice & Follow-up */}
      <EditorSection
        title="Advice & Follow-up"
        open={openSections['advice']!}
        onToggle={() => toggleSection('advice')}
      >
        <div className="space-y-3">
          <FormField id="advice-text" label="General Advice">
            <textarea
              id="advice-text"
              rows={3}
              {...register('advice')}
              className="form-input resize-none"
              placeholder="Rest, drink plenty of fluids, avoid cold food…"
            />
          </FormField>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormField id="lab-tests" label="Lab Tests / Investigations">
              <input
                id="lab-tests"
                type="text"
                {...register('tests' as any)}
                className="form-input"
                placeholder="CBC, Blood sugar, etc."
              />
            </FormField>

            <FormField id="follow-up" label="Follow-up Date / Duration">
              <input
                id="follow-up"
                type="text"
                {...register('followUp')}
                className="form-input"
                placeholder="After 5 days / 01-10-2026"
              />
            </FormField>
          </div>
        </div>
      </EditorSection>

      {/* Diagnosis Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="flex h-[80vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-border p-4">
              <h2 className="text-lg font-bold text-slate-900">Diagnosis Templates</h2>
              <button onClick={() => setShowTemplateModal(false)} className="rounded-lg p-2 hover:bg-slate-100 text-slate-500">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-4 border-b border-border bg-slate-50/50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input 
                  type="text" 
                  value={templateSearch}
                  onChange={(e) => setTemplateSearch(e.target.value)}
                  placeholder="Search templates (e.g. Viral Fever, Migraine)"
                  className="w-full rounded-xl border border-border bg-white py-2.5 pl-9 pr-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {searchTemplates(templateSearch).map(item => (
                <button
                  key={item.id}
                  onClick={() => applyDiagnosisTemplate(item)}
                  className="flex w-full items-center gap-4 rounded-xl border border-border bg-white p-4 text-left transition-all hover:border-primary/40 hover:bg-teal-50/30 hover:shadow-soft-sm"
                >
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-slate-100 text-2xl">
                    {item.emoji}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-bold text-slate-900">{item.name}</h3>
                    <p className="mt-1 text-sm text-slate-500 truncate">
                      <span className="font-medium text-slate-700">{item.medicines.length} medicines</span> • {item.category}
                    </p>
                  </div>
                  <Plus className="h-5 w-5 text-muted-foreground" />
                </button>
              ))}
              {searchTemplates(templateSearch).length === 0 && (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  No templates found for "{templateSearch}"
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function EditorSection({
  title,
  open,
  onToggle,
  children,
  accent = false,
}: {
  title: string
  open: boolean
  onToggle: () => void
  children: React.ReactNode
  accent?: boolean
}) {
  return (
    <div className={cn(
      'overflow-hidden rounded-lg border bg-white shadow-soft-sm',
      accent ? 'border-teal-200' : 'border-border'
    )}>
      <button
        type="button"
        className="flex w-full items-center justify-between px-4 py-3 text-left"
        onClick={onToggle}
        aria-expanded={open}
      >
        <span className={cn('text-sm font-semibold', accent ? 'text-teal-800' : 'text-slate-900')}>
          {title}
        </span>
        {open ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        )}
      </button>
      {open && (
        <div className="border-t border-border px-4 pb-4 pt-3">
          {children}
        </div>
      )}
    </div>
  )
}

function FormField({
  id,
  label,
  children,
  error,
  className,
}: {
  id: string
  label: string
  children: React.ReactNode
  error?: string
  className?: string
}) {
  return (
    <div className={cn('field-group', className)}>
      <label htmlFor={id} className="block text-xs font-medium text-slate-600">
        {label}
      </label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
