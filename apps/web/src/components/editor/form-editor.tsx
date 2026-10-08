'use client'

import { useEffect, useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2, ChevronDown, ChevronUp, Search, X, Zap } from 'lucide-react'
import { prescriptionFormSchema, type PrescriptionFormValues } from '@prescriptionmaker/validation'
import { DIAGNOSIS_TEMPLATES, searchTemplates, type DiagnosisTemplate } from '@/lib/diagnosis-templates'
import { COMMON_LAB_TESTS, searchLabTests, TEST_PANELS } from '@/lib/lab-tests-db'
import { searchMedicines, type MedicineEntry } from '@/lib/medicine-db'
import { checkInteractions } from '@/lib/medicine-interactions'
import { LANGUAGES } from '@/lib/translations'
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
  const SOAP_TEMPLATES = ['soap-clinical', 'vitals-first']
  const isVitalsTemplate = SOAP_TEMPLATES.includes(template.slug)

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    doctor: true,
    patient: true,
    vitals: true,
    medicines: true,
    labtests: true,
    advice: false,
  })

  const { register, control, watch, setValue, formState: { errors }, reset } = useForm<PrescriptionFormValues>({
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

  const { fields: testFields, append: appendTest, remove: removeTest } = useFieldArray({
    control,
    name: 'tests',
  })

  const [testSearch, setTestSearch] = useState('')
  const [showTestModal, setShowTestModal] = useState(false)
  const [activeMedIndex, setActiveMedIndex] = useState<number | null>(null)
  
  // Hardcode language options since we have translations
  const LANGUAGES = [
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'हिंदी (Hindi)' },
    { code: 'mr', label: 'मराठी (Marathi)' },
    { code: 'bn', label: 'বাংলা (Bengali)' },
    { code: 'te', label: 'తెలుగు (Telugu)' }
  ]
  const currentMedicines = watch('medicines') || []

  useEffect(() => {
    const subscription = watch((value) => {
      onDataChange(value as unknown as Record<string, unknown>)
    })
    return () => subscription.unsubscribe()
  }, [watch, onDataChange])

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const activeAlerts = checkInteractions(watch('medicines') || [])

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
      {/* DEV AUTOFILL TOOLBAR */}
      <div className="bg-teal-50/50 border border-teal-200 rounded-xl p-4 shadow-sm mb-2">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="h-4 w-4 text-teal-600" />
          <h3 className="text-xs font-bold text-teal-800 uppercase tracking-wide">Developer Autofill</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              reset({
                doctorName: 'Vatsalya Bhardwaj',
                doctorQualifications: 'MBBS, MD (Medicine)',
                doctorSpecialization: 'General Physician',
                doctorRegNumber: 'MCI-12345',
                clinicName: 'Zoom Digital Clinic',
                clinicPhone: '+91 98765 43210',
                clinicAddress: 'Sector 5, New Delhi',
                patient: { name: 'Rahul Kumar', age: '34', gender: 'male' },
                diagnosis: 'Viral Fever with URI',
                medicines: [
                  { id: '1', name: 'Paracetamol', strength: '650mg', form: 'tablet', frequency: 'TDS', timing: 'after_food', duration: '3 days', route: 'oral', instructions: 'Take if fever is above 100°F' },
                  { id: '2', name: 'Azithromycin', strength: '500mg', form: 'tablet', frequency: 'OD', timing: 'after_food', duration: '3 days', route: 'oral', instructions: 'Complete the full course' },
                  { id: '3', name: 'Levocetirizine', strength: '5mg', form: 'tablet', frequency: 'OD', timing: 'bedtime', duration: '5 days', route: 'oral', instructions: 'May cause drowsiness' }
                ],
                tests: [{ id: '1', name: 'Complete Blood Count (CBC)' }, { id: '2', name: 'Dengue NS1 Antigen' }],
                advice: 'Drink plenty of warm fluids. Take complete rest.',
                followUp: '3 days',
                signatureDataUrl: watch('signatureDataUrl'),
                clinicLogoUrl: watch('clinicLogoUrl'),
                stampUrl: watch('stampUrl'),
              })
            }}
            className="px-3 py-1.5 bg-teal-600 text-white text-xs font-bold rounded-md hover:bg-teal-700 transition active:scale-95"
          >
            Adult Fever Case
          </button>
          <button
            type="button"
            onClick={() => {
              reset({
                doctorName: 'Vatsalya Bhardwaj',
                doctorQualifications: 'MBBS, DCH',
                doctorSpecialization: 'Pediatrician',
                doctorRegNumber: 'MCI-67890',
                clinicName: 'Zoom Kids Clinic',
                clinicPhone: '+91 98765 43210',
                clinicAddress: 'Sector 5, New Delhi',
                patient: { name: 'Aarav Sharma', age: '4 years', gender: 'male' },
                diagnosis: 'Acute Otitis Media (Ear Infection)',
                medicines: [
                  { id: '1', name: 'Amoxicillin', strength: '250mg/5ml', form: 'syrup', frequency: 'TDS', timing: 'after_food', duration: '5 days', route: 'oral', instructions: 'Take 5ml three times a day' },
                  { id: '2', name: 'Ibuprofen', strength: '100mg/5ml', form: 'syrup', frequency: 'SOS', timing: 'after_food', duration: '3 days', route: 'oral', instructions: 'Take 5ml if pain or fever' }
                ],
                tests: [],
                advice: 'Do not allow water to enter the ears during bath.',
                followUp: '5 days',
                signatureDataUrl: watch('signatureDataUrl'),
                clinicLogoUrl: watch('clinicLogoUrl'),
                stampUrl: watch('stampUrl'),
              })
            }}
            className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-md hover:bg-indigo-700 transition active:scale-95"
          >
            Pediatric Case
          </button>
          <button
            type="button"
            onClick={() => {
              reset({
                doctorName: 'Vatsalya Bhardwaj',
                doctorQualifications: 'MD, DM (Cardiology)',
                doctorSpecialization: 'Cardiologist',
                doctorRegNumber: 'MCI-11223',
                clinicName: 'Heart Care Center',
                clinicPhone: '+91 98765 43210',
                clinicAddress: 'Sector 5, New Delhi',
                patient: { name: 'Ramesh Singh', age: '58', gender: 'male' },
                diagnosis: 'Hypertension, Dyslipidemia',
                medicines: [
                  { id: '1', name: 'Telmisartan', strength: '40mg', form: 'tablet', frequency: 'OD', timing: 'before_food', duration: '30 days', route: 'oral', instructions: 'Take in morning' },
                  { id: '2', name: 'Atorvastatin', strength: '20mg', form: 'tablet', frequency: 'OD', timing: 'bedtime', duration: '30 days', route: 'oral', instructions: '' },
                  { id: '3', name: 'Aspirin', strength: '75mg', form: 'tablet', frequency: 'OD', timing: 'after_food', duration: '30 days', route: 'oral', instructions: 'Do not take on empty stomach' }
                ],
                tests: [{ id: '1', name: 'Lipid Profile' }, { id: '2', name: 'ECG' }],
                advice: 'Strictly avoid oily food and salt. 30 mins walk daily.',
                followUp: '1 month',
                signatureDataUrl: watch('signatureDataUrl'),
                clinicLogoUrl: watch('clinicLogoUrl'),
                stampUrl: watch('stampUrl'),
              })
            }}
            className="px-3 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-md hover:bg-rose-700 transition active:scale-95"
          >
            Cardiology Case
          </button>
          <button
            type="button"
            onClick={() => reset({
              doctorName: '', doctorQualifications: '', doctorSpecialization: '', doctorRegNumber: '', clinicName: '', clinicPhone: '', clinicAddress: '',
              patient: { name: '', age: '', gender: 'male' }, diagnosis: '', medicines: [{ id: '1', name: '', strength: '', form: 'tablet', frequency: 'BD', timing: 'after_food', duration: '5 days', route: 'oral' }], tests: [], advice: '', followUp: '',
              signatureDataUrl: watch('signatureDataUrl')
            })}
            className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 text-xs font-bold rounded-md hover:bg-slate-50 transition active:scale-95 ml-auto"
          >
            Clear Form
          </button>
        </div>
      </div>

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

          <FormField id="doctor-signature" label="Digital Signature (Upload)" className="sm:col-span-2" error={errors.signatureDataUrl?.message}>
            <div className="flex items-center gap-4">
              <input
                id="doctor-signature"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    const reader = new FileReader()
                    reader.onloadend = () => {
                      setValue('signatureDataUrl', reader.result as string)
                    }
                    reader.readAsDataURL(file)
                  }
                }}
                className="form-input flex-1 file:mr-4 file:py-1 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 cursor-pointer"
              />
              {watch('signatureDataUrl') && (
                <div className="relative border border-slate-200 rounded-md p-1 bg-white">
                  <img src={watch('signatureDataUrl')} alt="Signature Preview" className="h-10 w-24 object-contain" />
                  <button
                    type="button"
                    onClick={() => setValue('signatureDataUrl', '')}
                    className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full p-0.5 hover:bg-red-200"
                    title="Remove Signature"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">Upload a clean image of your signature (PNG/JPG with white/transparent background).</p>
          </FormField>
        </div>
      </EditorSection>

      {/* Patient Information */}
      <EditorSection
        title="Patient Information"
        open={openSections['patient']!}
        onToggle={() => toggleSection('patient')}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <FormField id="patient-name" label="Patient Name" className="sm:col-span-2" error={errors.patient?.name?.message}>
            <input
              id="patient-name"
              type="text"
              {...register('patient.name')}
              className="form-input"
              placeholder="Patient full name"
            />
          </FormField>

          <FormField id="patient-age" label="Age" className="sm:col-span-1" error={errors.patient?.age?.message}>
            <input
              id="patient-age"
              type="text"
              {...register('patient.age')}
              className="form-input"
              placeholder="e.g. 34"
            />
          </FormField>

          <FormField id="patient-gender" label="Gender" className="sm:col-span-1" error={errors.patient?.gender?.message}>
            <select id="patient-gender" {...register('patient.gender')} className="form-input">
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </FormField>

          {template.slug === 'bilingual-indian' && (
            <>
              <FormField id="patient-address" label="Address" className="sm:col-span-2" error={errors.patient?.address?.message}>
                <input id="patient-address" type="text" {...register('patient.address')} className="form-input" placeholder="e.g. 123 Main St" />
              </FormField>
              <FormField id="patient-allergies" label="Allergies" className="sm:col-span-2" error={errors.patient?.allergies?.message}>
                <input id="patient-allergies" type="text" {...register('patient.allergies')} className="form-input" placeholder="e.g. Penicillin, Peanuts" />
              </FormField>
            </>
          )}

          {template.slug === 'hospital-opd' && (
            <>
              <FormField id="patient-mrn" label="MRN No." className="sm:col-span-1" error={errors.patient?.mrn?.message}>
                <input id="patient-mrn" type="text" {...register('patient.mrn')} className="form-input" placeholder="e.g. MRN-123" />
              </FormField>
              <FormField id="patient-ward" label="Ward" className="sm:col-span-1" error={errors.patient?.ward?.message}>
                <input id="patient-ward" type="text" {...register('patient.ward')} className="form-input" placeholder="e.g. General" />
              </FormField>
              <FormField id="patient-bed" label="Bed No." className="sm:col-span-1" error={errors.patient?.bedNo?.message}>
                <input id="patient-bed" type="text" {...register('patient.bedNo')} className="form-input" placeholder="e.g. 4B" />
              </FormField>
              <FormField id="patient-ipop" label="IP/OP No." className="sm:col-span-1" error={errors.patient?.ipOpNo?.message}>
                <input id="patient-ipop" type="text" {...register('patient.ipOpNo')} className="form-input" placeholder="e.g. IP-123" />
              </FormField>
              <FormField id="patient-insurance" label="Insurance No." className="sm:col-span-2" error={errors.patient?.insuranceNo?.message}>
                <input id="patient-insurance" type="text" {...register('patient.insuranceNo')} className="form-input" placeholder="e.g. INS-456" />
              </FormField>
              <FormField id="patient-provider" label="Care Provider" className="sm:col-span-2" error={errors.patient?.careProvider?.message}>
                <input id="patient-provider" type="text" {...register('patient.careProvider')} className="form-input" placeholder="e.g. Star Health" />
              </FormField>
            </>
          )}

          {template.slug === 'executive-gold' && (
            <>
              <FormField id="patient-insurance" label="Health Insurance No." className="sm:col-span-2" error={errors.patient?.insuranceNo?.message}>
                <input id="patient-insurance" type="text" {...register('patient.insuranceNo')} className="form-input" placeholder="e.g. INS-456" />
              </FormField>
              <FormField id="patient-provider" label="Health Care Provider" className="sm:col-span-2" error={errors.patient?.careProvider?.message}>
                <input id="patient-provider" type="text" {...register('patient.careProvider')} className="form-input" placeholder="e.g. Star Health" />
              </FormField>
            </>
          )}

          <div className="sm:col-span-4">
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

      {/* Vitals & Examination — Only for SOAP Clinical / Vitals-First templates */}
      {isVitalsTemplate && (
        <EditorSection
          title="O — Vitals & Examination Findings"
          open={openSections['vitals']!}
          onToggle={() => toggleSection('vitals')}
        >
          <div className="space-y-3">
            {/* Vitals grid */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <FormField id="vitals-bp" label="Blood Pressure (mmHg)">
                <input
                  id="vitals-bp"
                  type="text"
                  {...register('vitals.bloodPressure')}
                  className="form-input"
                  placeholder="e.g. 120/80"
                />
              </FormField>

              <FormField id="vitals-hr" label="Heart Rate (bpm)">
                <input
                  id="vitals-hr"
                  type="text"
                  {...register('vitals.pulse')}
                  className="form-input"
                  placeholder="e.g. 72"
                />
              </FormField>

              <FormField id="vitals-temp" label="Temp (°F)">
                <input
                  id="vitals-temp"
                  type="text"
                  {...register('vitals.temperature')}
                  className="form-input"
                  placeholder="e.g. 98.6"
                />
              </FormField>

              <FormField id="vitals-spo2" label="SpO₂ (%)">
                <input
                  id="vitals-spo2"
                  type="text"
                  {...register('vitals.spo2')}
                  className="form-input"
                  placeholder="e.g. 99"
                />
              </FormField>

              <FormField id="vitals-weight" label="Weight (kg)">
                <input
                  id="vitals-weight"
                  type="text"
                  {...register('vitals.weight')}
                  className="form-input"
                  placeholder="e.g. 65"
                />
              </FormField>

              <FormField id="vitals-rr" label="Resp. Rate (/min)">
                <input
                  id="vitals-rr"
                  type="text"
                  {...register('vitals.respiratoryRate')}
                  className="form-input"
                  placeholder="e.g. 16"
                />
              </FormField>
            </div>

            {/* Examination Findings */}
            <FormField id="vitals-examination" label="Examination Findings (O/E)">
              <textarea
                id="vitals-examination"
                {...register('chiefComplaint')}
                className="form-input min-h-[80px] resize-y"
                placeholder="e.g. Chest clear, mild pharyngeal congestion, TMs bilateral intact..."
                rows={3}
              />
            </FormField>
          </div>
        </EditorSection>
      )}

      {/* Medicines */}
      <EditorSection
        title={`Medicines (Rx) — ${medicineFields.length}`}
        open={openSections['medicines']!}
        onToggle={() => toggleSection('medicines')}
        accent
      >
        <div className="space-y-3">
          {activeAlerts.length > 0 && (
            <div className="rounded-lg border border-red-300 bg-red-50 p-4 shadow-soft-sm">
              <div className="flex items-center gap-2 mb-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-100 text-red-600">
                  <Zap className="h-4 w-4" />
                </span>
                <h3 className="text-sm font-bold text-red-700">Medicine Interaction Alerts ({activeAlerts.length})</h3>
              </div>
              <div className="space-y-3 pl-8">
                {activeAlerts.map((alert, i) => (
                  <div key={i} className="text-sm">
                    <p className="font-semibold text-red-800">
                      {alert.foundDrugs[0]} + {alert.foundDrugs[1]}
                    </p>
                    <p className="mt-0.5 text-red-700">{alert.interaction.description}</p>
                    <p className="mt-1 font-medium text-red-600">Recommended: {alert.interaction.recommendation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {medicineFields.map((field, index) => (
            <div
              key={field.id}
              className="relative rounded-lg border border-slate-200 bg-white p-3 shadow-sm hover:border-teal-300 transition-colors flex flex-col gap-2.5"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded bg-teal-100 text-xs font-bold text-teal-700">
                    {index + 1}
                  </span>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Medicine</span>
                </div>
                {medicineFields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeMedicine(index)}
                    className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                    aria-label={`Remove medicine ${index + 1}`}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                )}
              </div>

              {/* Row 1: Name and Form */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  {(() => {
                    const nameReg = register(`medicines.${index}.name`)
                    const currentValue = currentMedicines[index]?.name || ''
                    const results = searchMedicines(currentValue)
                    return (
                      <>
                        <input
                          id={`med-name-${index}`}
                          type="text"
                          {...nameReg}
                          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 placeholder:font-normal placeholder:text-slate-400"
                          placeholder="Start typing medicine name..."
                          onFocus={() => setActiveMedIndex(index)}
                          onBlur={(e) => {
                            nameReg.onBlur(e)
                            setTimeout(() => setActiveMedIndex(null), 200)
                          }}
                          autoComplete="off"
                        />
                        {activeMedIndex === index && results.length > 0 && (
                          <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-48 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                            {results.map((med, i) => (
                              <button
                                key={i}
                                type="button"
                                className="w-full px-4 py-2 text-left text-sm hover:bg-teal-50 focus:bg-teal-50 outline-none flex justify-between items-center border-b border-slate-50 last:border-0"
                                onMouseDown={(e) => {
                                  e.preventDefault(); // prevent blur
                                  setValue(`medicines.${index}.name`, med.name, { shouldValidate: true })
                                  setValue(`medicines.${index}.strength`, med.commonStrengths[0] || '', { shouldValidate: true })
                                  setValue(`medicines.${index}.frequency`, (med.commonFrequency as any) || '1-0-1', { shouldValidate: true })
                                  setValue(`medicines.${index}.duration`, med.commonDuration || '5 days', { shouldValidate: true })
                                  
                                  // Guess form based on name/category
                                  const formGuessed = med.name.toLowerCase().includes('syr') || med.category.toLowerCase().includes('syrup') ? 'syrup' 
                                                    : med.name.toLowerCase().includes('inj') ? 'injection'
                                                    : med.name.toLowerCase().includes('cap') ? 'capsule'
                                                    : med.name.toLowerCase().includes('drop') ? 'drops'
                                                    : med.name.toLowerCase().includes('cream') || med.name.toLowerCase().includes('oint') ? 'cream'
                                                    : 'tablet';
                                  setValue(`medicines.${index}.form`, formGuessed, { shouldValidate: true })
                                  
                                  setActiveMedIndex(null)
                                }}
                              >
                                <span className="font-bold text-slate-700">{med.name}</span>
                                <span className="text-[10px] uppercase tracking-wider text-teal-600 bg-teal-100 px-1.5 py-0.5 rounded">{med.category}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    )
                  })()}
                </div>

                <select {...register(`medicines.${index}.form`)} className="w-full sm:w-28 shrink-0 rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500">
                  {['tablet', 'capsule', 'syrup', 'injection', 'cream', 'drops', 'inhaler', 'suspension', 'powder', 'patch'].map((f) => (
                    <option key={f} value={f} className="capitalize">{f}</option>
                  ))}
                </select>
              </div>

              {/* Row 2: Dose, Freq, Timing, Duration */}
              <div className="flex flex-wrap sm:flex-nowrap gap-2 bg-slate-50 p-2 rounded-md border border-slate-100">
                <input
                  type="text"
                  {...register(`medicines.${index}.strength`)}
                  className="w-full sm:w-20 shrink-0 rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  placeholder="e.g. 500mg"
                  title="Strength / Dose"
                />
                <select {...register(`medicines.${index}.frequency`)} className="w-full sm:flex-1 rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500" title="Frequency">
                  {DOSE_FREQUENCIES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
                <select {...register(`medicines.${index}.timing`)} className="w-full sm:flex-1 rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500" title="Timing">
                  {DOSE_TIMINGS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                <input
                  type="text"
                  {...register(`medicines.${index}.duration`)}
                  className="w-full sm:w-24 shrink-0 rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  placeholder="e.g. 5 days"
                  title="Duration"
                />
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

      {/* Lab Tests & Investigations */}
      <EditorSection
        title={`Lab Tests & Investigations — ${testFields.length}`}
        open={openSections['labtests']!}
        onToggle={() => toggleSection('labtests')}
      >
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <button
              type="button"
              onClick={() => setShowTestModal(true)}
              className="flex items-center gap-1.5 rounded-lg bg-teal-50 px-3 py-1.5 text-xs font-bold text-teal-700 transition-colors hover:bg-teal-100 border border-teal-200"
            >
              <Search className="h-3.5 w-3.5" /> Find & Add Tests
            </button>
            <button
              type="button"
              onClick={() => appendTest({ id: Date.now().toString(), name: '' })}
              className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-200"
            >
              <Plus className="h-3.5 w-3.5" /> Add Custom
            </button>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {testFields.map((field, index) => (
              <div key={field.id} className="flex items-center gap-2">
                <input
                  type="text"
                  {...register(`tests.${index}.name`)}
                  className="form-input flex-1"
                  placeholder="Test Name (e.g. CBC)"
                />
                <button
                  type="button"
                  onClick={() => removeTest(index)}
                  className="rounded p-2 text-muted-foreground hover:bg-red-50 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          {testFields.length === 0 && (
            <p className="text-sm text-slate-500 italic">No lab tests added.</p>
          )}
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

          <div className="grid grid-cols-1 gap-3">
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

          <div className="mt-6 border-t border-border pt-6">
            <h3 className="mb-4 text-base font-semibold text-slate-900 flex items-center gap-2">
              <span>Prescription Language 🇮🇳</span>
            </h3>
            <p className="text-sm text-slate-500 mb-4">Select language for printed instructions</p>
            <FormField id="language" label="Language">
              <select
                id="language"
                {...register('language' as any)}
                className="form-input"
              >
                {LANGUAGES.map(lang => (
                  <option key={lang.code} value={lang.code}>{lang.label}</option>
                ))}
              </select>
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

      {/* Lab Tests Modal */}
      {showTestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="flex h-[80vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-border p-4">
              <h2 className="text-lg font-bold text-slate-900">Add Lab Tests</h2>
              <button onClick={() => setShowTestModal(false)} className="rounded-lg p-2 hover:bg-slate-100 text-slate-500">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-4 border-b border-border bg-slate-50/50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input 
                  type="text" 
                  value={testSearch}
                  onChange={(e) => setTestSearch(e.target.value)}
                  placeholder="Search lab tests (e.g. CBC, Lipid)..."
                  className="w-full rounded-xl border border-border bg-white py-2.5 pl-9 pr-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Common Panels */}
              {(!testSearch || testSearch.length < 2) && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Quick Panels</h3>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {TEST_PANELS.map(panel => (
                      <button
                        key={panel.name}
                        onClick={() => {
                          panel.tests.forEach(t => appendTest({ id: Date.now().toString() + Math.random(), name: t }))
                          setShowTestModal(false)
                        }}
                        className="flex flex-col items-start gap-1 rounded-xl border border-teal-100 bg-teal-50/50 p-3 text-left transition-all hover:border-teal-300 hover:bg-teal-100"
                      >
                        <span className="font-bold text-teal-900">{panel.name}</span>
                        <span className="text-xs text-teal-700">{panel.tests.length} tests</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Individual Tests */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                  {testSearch ? 'Search Results' : 'Common Tests'}
                </h3>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {searchLabTests(testSearch).map(test => (
                    <button
                      key={test.name}
                      onClick={() => {
                        appendTest({ id: Date.now().toString(), name: test.name })
                        setTestSearch('')
                      }}
                      className="flex items-center justify-between rounded-xl border border-border bg-white p-3 text-left transition-all hover:border-primary/40 hover:bg-slate-50"
                    >
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900">{test.short}</span>
                        <span className="text-xs text-slate-500">{test.name}</span>
                      </div>
                      <Plus className="h-4 w-4 text-primary" />
                    </button>
                  ))}
                </div>
                {searchLabTests(testSearch).length === 0 && (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    No lab tests found for "{testSearch}"
                  </div>
                )}
              </div>
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
