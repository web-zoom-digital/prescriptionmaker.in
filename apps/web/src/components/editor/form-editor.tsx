'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2, ChevronDown, ChevronUp, Search, X, Zap, Check, CheckCircle } from 'lucide-react'
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
  const SOAP_TEMPLATES = ['soap-clinical', 'vitals-first', 'medical-prescription-form']
  const isVitalsTemplate = SOAP_TEMPLATES.includes(template.slug)

  const hasDoctorProfile = Boolean(initialData?.doctorName)

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    doctor: !hasDoctorProfile,
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
      <div className="bg-gradient-to-r from-teal-50 to-blue-50 border border-teal-200/80 rounded-xl p-3.5 shadow-sm mb-3">
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-teal-600 animate-pulse" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">⚡ 1-Click Auto-Fill Presets (All 10 Templates)</h3>
          </div>
          <button
            type="button"
            onClick={() => reset({
              doctorName: '', doctorQualifications: '', doctorSpecialization: '', doctorRegNumber: '', clinicName: '', clinicPhone: '', clinicAddress: '',
              patient: { name: '', age: '', gender: 'male' }, diagnosis: '', medicines: [{ id: '1', name: '', strength: '', form: 'tablet', frequency: 'BD', timing: 'after_food', duration: '5 days', route: 'oral' }], tests: [], advice: '', followUp: '',
              signatureDataUrl: watch('signatureDataUrl')
            })}
            className="px-2.5 py-1 bg-white border border-slate-300 text-slate-700 text-[11px] font-semibold rounded-md hover:bg-slate-100 transition active:scale-95 shadow-2xs"
          >
            Clear Form
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {/* 1. Classic Letterhead */}
          <button
            type="button"
            onClick={() => {
              reset({
                doctorName: 'Dr. Rahul Sharma',
                doctorQualifications: 'MBBS, MD (Medicine)',
                doctorSpecialization: 'Senior Consultant Physician',
                doctorRegNumber: 'MCI-48291',
                clinicName: 'Apollo Clinic & Healthcare Centre',
                clinicPhone: '+91 98110 23456',
                clinicAddress: 'B-12, Green Park Main, South Ext., New Delhi',
                patient: { name: 'Aarav Verma', age: '32', gender: 'male' },
                diagnosis: 'Acute Viral Fever with Exudative Pharyngitis',
                medicines: [
                  { id: '1', name: 'Paracetamol', strength: '650mg', form: 'tablet', frequency: 'QID', timing: 'after_food', duration: '3 days', route: 'oral', instructions: 'SOS if temperature > 100°F' },
                  { id: '2', name: 'Azithromycin', strength: '500mg', form: 'tablet', frequency: 'OD', timing: 'before_food', duration: '3 days', route: 'oral', instructions: '1 hr before breakfast. Complete full 3-day course' },
                  { id: '3', name: 'Levocetirizine + Montelukast', strength: '5mg/10mg', form: 'tablet', frequency: 'OD', timing: 'bedtime', duration: '5 days', route: 'oral', instructions: 'Take at bedtime. May cause mild drowsiness' },
                  { id: '4', name: 'Ascoril-D Cough Syrup', strength: '10ml', form: 'syrup', frequency: 'TDS', timing: 'after_food', duration: '5 days', route: 'oral', instructions: 'Take 2 tsp with lukewarm water' }
                ],
                tests: [{ id: '1', name: 'Complete Blood Count (CBC)' }, { id: '2', name: 'Dengue NS1 Antigen' }],
                advice: 'Drink 3-4 liters warm water daily. Warm salt water gargles TDS. Complete bed rest for 3 days.',
                followUp: '3 days',
                signatureDataUrl: watch('signatureDataUrl'),
                clinicLogoUrl: watch('clinicLogoUrl'),
                stampUrl: watch('stampUrl'),
              })
            }}
            className="px-2.5 py-1 bg-blue-700 text-white text-[11px] font-bold rounded-md hover:bg-blue-800 transition active:scale-95 shadow-2xs"
          >
            📜 1. Classic Letterhead
          </button>

          {/* 2. Two-Column Sidebar */}
          <button
            type="button"
            onClick={() => {
              reset({
                doctorName: 'Dr. Priya Nair',
                doctorQualifications: 'MBBS, MD, DM (Cardiology), FACC',
                doctorSpecialization: 'Chief Interventional Cardiologist',
                doctorRegNumber: 'KMC-72940',
                clinicName: 'Metro Heart Institute',
                clinicPhone: '+91 98450 12345',
                clinicAddress: '42, Indiranagar 100ft Road, Bengaluru',
                patient: { name: 'Ramesh Sundaram', age: '58', gender: 'male' },
                diagnosis: 'Stage 2 Essential Hypertension & Dyslipidemia',
                medicines: [
                  { id: '1', name: 'Telmisartan + Amlodipine', strength: '40mg/5mg', form: 'tablet', frequency: 'OD', timing: 'after_food', duration: '30 days', route: 'oral', instructions: 'Every morning after breakfast regularly' },
                  { id: '2', name: 'Atorvastatin', strength: '20mg', form: 'tablet', frequency: 'OD', timing: 'bedtime', duration: '30 days', route: 'oral', instructions: 'Take at night daily' },
                  { id: '3', name: 'Ecosprin (Aspirin)', strength: '75mg', form: 'tablet', frequency: 'OD', timing: 'after_food', duration: '30 days', route: 'oral', instructions: 'Post-lunch only. Never on empty stomach' }
                ],
                tests: [{ id: '1', name: 'Fasting Lipid Profile' }, { id: '2', name: 'ECG 12-Lead' }, { id: '3', name: 'Serum Creatinine' }],
                advice: 'Strict low sodium intake (< 2g/day). Avoid fried snacks. 40 min morning walk. Record daily BP chart.',
                followUp: '1 month',
                signatureDataUrl: watch('signatureDataUrl'),
                clinicLogoUrl: watch('clinicLogoUrl'),
                stampUrl: watch('stampUrl'),
              })
            }}
            className="px-2.5 py-1 bg-indigo-700 text-white text-[11px] font-bold rounded-md hover:bg-indigo-800 transition active:scale-95 shadow-2xs"
          >
            🏥 2. Two-Column Sidebar
          </button>

          {/* 3. Hospital OPD Form */}
          <button
            type="button"
            onClick={() => {
              reset({
                doctorName: 'Dr. Vikram Malhotra',
                doctorQualifications: 'MBBS, DNB (Emergency Medicine)',
                doctorSpecialization: 'Senior Medical Officer / OPD In-charge',
                doctorRegNumber: 'DMC-88124',
                clinicName: 'Civil Multi-Speciality Hospital',
                clinicPhone: '+91 11 2659 8700',
                clinicAddress: 'OPD Block C, Ring Road, New Delhi',
                patient: { name: 'Sunita Devi', age: '28', gender: 'female' },
                diagnosis: 'Acute Gastroenteritis & Dehydration',
                medicines: [
                  { id: '1', name: 'Ofloxacin + Ornidazole', strength: '200/500mg', form: 'tablet', frequency: 'BD', timing: 'after_food', duration: '5 days', route: 'oral', instructions: 'After meals with plenty of water' },
                  { id: '2', name: 'Ondansetron (Vomikind MD)', strength: '4mg', form: 'tablet', frequency: 'SOS', timing: 'before_food', duration: '3 days', route: 'oral', instructions: 'Mouth dissolving 30 mins before food' },
                  { id: '3', name: 'Racecadotril', strength: '100mg', form: 'capsule', frequency: 'TDS', timing: 'before_food', duration: '3 days', route: 'oral', instructions: 'Before food until diarrhea subsides' },
                  { id: '4', name: 'WHO ORS (Electral)', strength: '21.8g Sachet', form: 'other', frequency: 'TDS', timing: 'after_food', duration: '3 days', route: 'oral', instructions: 'Dissolve in 1L water, sip throughout day' }
                ],
                tests: [{ id: '1', name: 'Stool Routine & Microscopy' }, { id: '2', name: 'Serum Electrolytes' }],
                advice: 'Strict liquid diet for 24h (kanji, coconut water, light khichdi). Avoid dairy & outside food.',
                followUp: '48 hours',
                signatureDataUrl: watch('signatureDataUrl'),
                clinicLogoUrl: watch('clinicLogoUrl'),
                stampUrl: watch('stampUrl'),
              })
            }}
            className="px-2.5 py-1 bg-slate-800 text-white text-[11px] font-bold rounded-md hover:bg-slate-900 transition active:scale-95 shadow-2xs"
          >
            🏛️ 3. Hospital OPD
          </button>

          {/* 4. SOAP Clinical */}
          <button
            type="button"
            onClick={() => {
              reset({
                doctorName: 'Dr. Ananya Roy',
                doctorQualifications: 'MBBS, MD, DNB (Endocrinology)',
                doctorSpecialization: 'Consultant Endocrinologist',
                doctorRegNumber: 'WBMC-63189',
                clinicName: 'Fortis Diabetes & Endocrine Centre',
                clinicPhone: '+91 98300 54321',
                clinicAddress: '730, EM Bypass, Kolkata',
                patient: { name: 'Mohan Lal Agarwal', age: '54', gender: 'male' },
                diagnosis: 'Uncontrolled Type 2 Diabetes Mellitus with Neuropathy',
                medicines: [
                  { id: '1', name: 'Metformin SR', strength: '1000mg', form: 'tablet', frequency: 'BD', timing: 'after_food', duration: '30 days', route: 'oral', instructions: 'Take with breakfast & dinner' },
                  { id: '2', name: 'Dapagliflozin', strength: '10mg', form: 'tablet', frequency: 'OD', timing: 'before_food', duration: '30 days', route: 'oral', instructions: 'Morning before breakfast with water' },
                  { id: '3', name: 'Pregabalin + Methylcobalamin', strength: '75/1500mcg', form: 'capsule', frequency: 'OD', timing: 'bedtime', duration: '30 days', route: 'oral', instructions: 'Night for tingling & burning pain' }
                ],
                tests: [{ id: '1', name: 'HbA1c Glycated Hemoglobin' }, { id: '2', name: 'Urine Microalbumin/Creatinine' }, { id: '3', name: 'Fundoscopy' }],
                advice: 'Strict diabetic diet. Zero direct sugar/sweets. 45 min daily brisk walking. Daily inspection of feet.',
                followUp: '4 weeks',
                signatureDataUrl: watch('signatureDataUrl'),
                clinicLogoUrl: watch('clinicLogoUrl'),
                stampUrl: watch('stampUrl'),
              })
            }}
            className="px-2.5 py-1 bg-violet-700 text-white text-[11px] font-bold rounded-md hover:bg-violet-800 transition active:scale-95 shadow-2xs"
          >
            📋 4. SOAP Clinical
          </button>

          {/* 5. Vitals-First */}
          <button
            type="button"
            onClick={() => {
              reset({
                doctorName: 'Dr. Siddharth Mehta',
                doctorQualifications: 'MBBS, MD, DM, FACC',
                doctorSpecialization: 'Director — Interventional Cardiology',
                doctorRegNumber: 'MMC-39045',
                clinicName: 'Lilavati Hospital & Research Centre',
                clinicPhone: '+91 98200 67890',
                clinicAddress: 'A-791, Bandra Reclamation, Mumbai',
                patient: { name: 'Harshvardhan Patil', age: '64', gender: 'male' },
                diagnosis: 'Post-PTCA (DES in LAD), Stable Ischemic Heart Disease',
                medicines: [
                  { id: '1', name: 'Ticagrelor (Brilinta)', strength: '90mg', form: 'tablet', frequency: 'BD', timing: 'after_food', duration: '90 days', route: 'oral', instructions: 'Do NOT skip any dose' },
                  { id: '2', name: 'Aspirin Gastro-resistant', strength: '75mg', form: 'tablet', frequency: 'OD', timing: 'after_food', duration: '90 days', route: 'oral', instructions: 'After lunch with water' },
                  { id: '3', name: 'Rosuvastatin + Ezetimibe', strength: '20mg/10mg', form: 'tablet', frequency: 'OD', timing: 'bedtime', duration: '90 days', route: 'oral', instructions: 'At bedtime daily' },
                  { id: '4', name: 'Metoprolol Succinate ER', strength: '25mg', form: 'tablet', frequency: 'OD', timing: 'after_food', duration: '90 days', route: 'oral', instructions: 'Morning after food' }
                ],
                tests: [{ id: '1', name: '2D Echocardiography' }, { id: '2', name: 'Lipid Profile' }, { id: '3', name: 'Liver Function Tests' }],
                advice: 'Low salt, zero trans-fat heart healthy diet. Daily 30 min morning walk. Keep SOS Sorbitrate 5mg handy.',
                followUp: '3 months',
                signatureDataUrl: watch('signatureDataUrl'),
                clinicLogoUrl: watch('clinicLogoUrl'),
                stampUrl: watch('stampUrl'),
              })
            }}
            className="px-2.5 py-1 bg-rose-700 text-white text-[11px] font-bold rounded-md hover:bg-rose-800 transition active:scale-95 shadow-2xs"
          >
            ❤️ 5. Vitals-First
          </button>

          {/* 6. Detailed Drug Chart */}
          <button
            type="button"
            onClick={() => {
              reset({
                doctorName: 'Dr. Shalini Deshmukh',
                doctorQualifications: 'MBBS, MD, DM (Neurology)',
                doctorSpecialization: 'Senior Consultant Neurologist',
                doctorRegNumber: 'MMC-55412',
                clinicName: 'Brain & Spine Institute',
                clinicPhone: '+91 98900 45678',
                clinicAddress: 'Plot 18, F.C. Road, Shivajinagar, Pune',
                patient: { name: 'Sneha Kulkarni', age: '29', gender: 'female' },
                diagnosis: 'Frequent Episodic Migraine with Aura & Cervical Spasm',
                medicines: [
                  { id: '1', name: 'Flunarizine', strength: '10mg', form: 'tablet', frequency: 'OD', timing: 'bedtime', duration: '30 days', route: 'oral', instructions: 'Night at bedtime for migraine prevention' },
                  { id: '2', name: 'Naproxen + Domperidone', strength: '500/10mg', form: 'tablet', frequency: 'SOS', timing: 'after_food', duration: '10 days', route: 'oral', instructions: 'Take at first sign of aura with water' },
                  { id: '3', name: 'Thiocolchicoside', strength: '4mg', form: 'capsule', frequency: 'BD', timing: 'after_food', duration: '5 days', route: 'oral', instructions: 'Muscle relaxant after meals' },
                  { id: '4', name: 'Magnesium Glycinate', strength: '400mg', form: 'tablet', frequency: 'OD', timing: 'bedtime', duration: '60 days', route: 'oral', instructions: 'Night with water for neuro-protection' }
                ],
                tests: [{ id: '1', name: 'Serum Vitamin B12 & D3' }, { id: '2', name: 'MRI Brain (Plain) Review' }],
                advice: 'Maintain migraine diary. Strictly avoid skipping meals, lack of sleep, and flashing screens.',
                followUp: '4 weeks',
                signatureDataUrl: watch('signatureDataUrl'),
                clinicLogoUrl: watch('clinicLogoUrl'),
                stampUrl: watch('stampUrl'),
              })
            }}
            className="px-2.5 py-1 bg-emerald-700 text-white text-[11px] font-bold rounded-md hover:bg-emerald-800 transition active:scale-95 shadow-2xs"
          >
            💊 6. Detailed Drug Chart
          </button>

          {/* 7. Multi-Section Boxed (Pediatrics) */}
          <button
            type="button"
            onClick={() => {
              reset({
                doctorName: 'Dr. Arvind Joshi',
                doctorQualifications: 'MBBS, MD (Pediatrics), FIAP',
                doctorSpecialization: 'Senior Pediatrician & Neonatologist',
                doctorRegNumber: 'G-28941',
                clinicName: 'Little Angels Children Hospital',
                clinicPhone: '+91 98790 11223',
                clinicAddress: 'Opp. Parimal Garden, C.G. Road, Ahmedabad',
                patient: { name: 'Master Vivaan Patel', age: '3.5 yrs', gender: 'male' },
                diagnosis: 'Acute Viral Wheezy Bronchitis (First Episode)',
                medicines: [
                  { id: '1', name: 'Levosalbutamol + Budesonide Inhaler', strength: '50/100mcg', form: 'inhaler', frequency: 'BD', timing: 'after_food', duration: '5 days', route: 'inhalation', instructions: '2 puffs via Pediatric Spacer with Face Mask' },
                  { id: '2', name: 'Mefenamic Acid Suspension (Meftal-P)', strength: '100mg/5ml', form: 'syrup', frequency: 'SOS', timing: 'after_food', duration: '3 days', route: 'oral', instructions: '4ml only if fever > 100°F (Max TDS)' },
                  { id: '3', name: 'Cetirizine Syrup (Zyrtec)', strength: '5mg/5ml', form: 'syrup', frequency: 'OD', timing: 'bedtime', duration: '5 days', route: 'oral', instructions: '2.5ml once daily at night' },
                  { id: '4', name: 'Saline Nasal Drops (Nasoclear)', strength: '0.65% NaCl', form: 'drops', frequency: 'QID', timing: 'before_food', duration: '5 days', route: 'topical', instructions: '2 drops in each nostril before feeds' }
                ],
                tests: [{ id: '1', name: 'Chest X-Ray PA View (if wheeze persists)' }],
                advice: 'Steam inhalation twice daily. Keep child in warm environment. Avoid cold drinks & ice creams.',
                followUp: '48 hours',
                signatureDataUrl: watch('signatureDataUrl'),
                clinicLogoUrl: watch('clinicLogoUrl'),
                stampUrl: watch('stampUrl'),
              })
            }}
            className="px-2.5 py-1 bg-sky-700 text-white text-[11px] font-bold rounded-md hover:bg-sky-800 transition active:scale-95 shadow-2xs"
          >
            📦 7. Multi-Section Boxed (Pediatric)
          </button>

          {/* 8. Minimal Print Ruled (Dermatology) */}
          <button
            type="button"
            onClick={() => {
              reset({
                doctorName: 'Dr. Meera Kapoor',
                doctorQualifications: 'MBBS, MD (Dermatology, DVL)',
                doctorSpecialization: 'Consultant Dermatologist & Aesthetician',
                doctorRegNumber: 'DMC-91024',
                clinicName: 'SkinCraft Dermatology & Laser Clinic',
                clinicPhone: '+91 98100 78901',
                clinicAddress: 'Galleria Market, Phase IV, DLF Gurgaon',
                patient: { name: 'Riya Singhania', age: '22', gender: 'female' },
                diagnosis: 'Moderate Inflammatory Acne Vulgaris (Grade III)',
                medicines: [
                  { id: '1', name: 'Doxycycline', strength: '100mg', form: 'capsule', frequency: 'OD', timing: 'after_food', duration: '21 days', route: 'oral', instructions: 'Post-lunch with full glass water. Do not lie down' },
                  { id: '2', name: 'Adapalene 0.1% + Benzoyl Peroxide Gel', strength: 'Topical Gel', form: 'cream', frequency: 'OD', timing: 'bedtime', duration: '30 days', route: 'topical', instructions: 'Pea-sized amount at night 20m after moisturizer' },
                  { id: '3', name: 'Clindamycin 1% + Nicotinamide 4% Gel', strength: 'Topical Gel', form: 'cream', frequency: 'OD', timing: 'after_food', duration: '30 days', route: 'topical', instructions: 'Apply on active red pimples morning' },
                  { id: '4', name: 'Mineral Sunscreen Gel SPF 50', strength: 'Matte Gel', form: 'cream', frequency: 'BD', timing: 'before_food', duration: 'Daily', route: 'topical', instructions: 'Apply 15m before sun. Reapply every 4h outdoors' }
                ],
                tests: [{ id: '1', name: 'Serum Total Testosterone' }, { id: '2', name: 'Pelvic USG (PCOD)' }],
                advice: 'Gentle salicylic acid wash twice daily. Do not pick/squeeze pimples. Avoid heavy cosmetics.',
                followUp: '3 weeks',
                signatureDataUrl: watch('signatureDataUrl'),
                clinicLogoUrl: watch('clinicLogoUrl'),
                stampUrl: watch('stampUrl'),
              })
            }}
            className="px-2.5 py-1 bg-cyan-700 text-white text-[11px] font-bold rounded-md hover:bg-cyan-800 transition active:scale-95 shadow-2xs"
          >
            ✒️ 8. Minimal Print Ruled (Derma)
          </button>

          {/* 9. Bilingual Indian */}
          <button
            type="button"
            onClick={() => {
              reset({
                doctorName: 'Dr. Santosh Kumar Verma',
                doctorQualifications: 'MBBS, PGDGM (Family Medicine)',
                doctorSpecialization: 'Senior Family Physician & GP',
                doctorRegNumber: 'UP-45210',
                clinicName: 'Verma Health Clinic (वर्मा स्वास्थ्य केंद्र)',
                clinicPhone: '+91 94150 12345',
                clinicAddress: '14, Civil Lines, Hazratganj, Lucknow',
                patient: { name: 'Ram Prasad Yadav (राम प्रसाद)', age: '46', gender: 'male' },
                diagnosis: 'Seasonal Viral Influenza & Bronchitis (मौसमी फ्लू एवं खांसी)',
                medicines: [
                  { id: '1', name: 'Paracetamol 650mg (पैरासिटामोल)', strength: '650mg', form: 'tablet', frequency: 'BD', timing: 'after_food', duration: '3 दिन', route: 'oral', instructions: 'खाना खाने के बाद (बुखार 100°F से ऊपर होने पर)' },
                  { id: '2', name: 'Cefixime 200mg (सेफिक्सिम)', strength: '200mg', form: 'tablet', frequency: 'BD', timing: 'after_food', duration: '5 दिन', route: 'oral', instructions: 'सुबह-शाम भोजन के बाद। पूरा 5 दिन का कोर्स लें' },
                  { id: '3', name: 'Ambroxol Cough Syrup (खांसी सिरप)', strength: '10ml', form: 'syrup', frequency: 'TDS', timing: 'after_food', duration: '5 दिन', route: 'oral', instructions: 'दो चम्मच गुनगुने पानी के साथ दिन में 3 बार' },
                  { id: '4', name: 'Pantoprazole 40mg (गैस की गोली)', strength: '40mg', form: 'tablet', frequency: 'OD', timing: 'before_food', duration: '5 दिन', route: 'oral', instructions: 'सुबह खाली पेट नाश्ते से 30 मिनट पहले' }
                ],
                tests: [{ id: '1', name: 'सीबीसी (CBC)' }, { id: '2', name: 'मलेरिया कार्ड टेस्ट (Malaria Card)' }],
                advice: 'केवल गुनगुना पानी पिएं। ठंडी चीजों व चावल से परहेज। दिन में दो बार भाप (Steam) लें।',
                followUp: '3 दिन बाद (After 3 days)',
                signatureDataUrl: watch('signatureDataUrl'),
                clinicLogoUrl: watch('clinicLogoUrl'),
                stampUrl: watch('stampUrl'),
              })
            }}
            className="px-2.5 py-1 bg-amber-700 text-white text-[11px] font-bold rounded-md hover:bg-amber-800 transition active:scale-95 shadow-2xs"
          >
            🇮🇳 9. Bilingual Indian (द्विभाषी)
          </button>

          {/* 10. Compartmentalized Grid (Ortho) */}
          <button
            type="button"
            onClick={() => {
              reset({
                doctorName: 'Dr. Rajesh Khanna',
                doctorQualifications: 'MBBS, MS (Orthopedics), MCh',
                doctorSpecialization: 'Joint Replacement & Spine Surgeon',
                doctorRegNumber: 'DMC-33981',
                clinicName: 'Khanna Bone & Joint Super Speciality Clinic',
                clinicPhone: '+91 98110 99887',
                clinicAddress: 'C-48, Hauz Khas Enclave, New Delhi',
                patient: { name: 'Kamla Devi', age: '61', gender: 'female' },
                diagnosis: 'Bilateral Primary Osteoarthritis Knees (Grade II-III)',
                medicines: [
                  { id: '1', name: 'Etoricoxib', strength: '90mg', form: 'tablet', frequency: 'OD', timing: 'after_food', duration: '7 days', route: 'oral', instructions: 'After dinner. SOS only for severe joint pain' },
                  { id: '2', name: 'Diacerein + Glucosamine Sulfate', strength: '50/750mg', form: 'tablet', frequency: 'BD', timing: 'after_food', duration: '60 days', route: 'oral', instructions: 'After breakfast & dinner with water' },
                  { id: '3', name: 'Cholecalciferol (Vitamin D3 60K)', strength: '60,000 IU', form: 'other', frequency: 'OD', timing: 'after_food', duration: '8 weeks', route: 'oral', instructions: '1 sachet in warm milk every Sunday' },
                  { id: '4', name: 'Diclofenac Gel 1.16%', strength: 'Topical Gel', form: 'cream', frequency: 'BD', timing: 'after_food', duration: '30 days', route: 'topical', instructions: 'Gently apply on both knees morning and night' }
                ],
                tests: [{ id: '1', name: 'Digital X-Ray Both Knees AP/Lat' }, { id: '2', name: 'Serum Calcium & Vitamin D3' }, { id: '3', name: 'Serum Uric Acid' }],
                advice: 'Quadriceps exercises daily. Avoid floor squatting and cross-legged sitting. Use western commode.',
                followUp: '2 weeks',
                signatureDataUrl: watch('signatureDataUrl'),
                clinicLogoUrl: watch('clinicLogoUrl'),
                stampUrl: watch('stampUrl'),
              })
            }}
            className="px-2.5 py-1 bg-amber-900 text-white text-[11px] font-bold rounded-md hover:bg-amber-950 transition active:scale-95 shadow-2xs"
          >
            ⚕️ 10. Compartmentalized Grid (Ortho)
          </button>
        </div>
      </div>

      {/* Doctor Information */}
      <EditorSection
        title="Doctor Information"
        badge={
          watch('doctorName') ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
              <Check className="h-3 w-3" /> Auto-filled from Profile
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 border border-amber-200">
              Profile not set
            </span>
          )
        }
        summary={watch('doctorName') ? `Dr. ${watch('doctorName')}${watch('clinicName') ? ` · ${watch('clinicName')}` : ''}` : undefined}
        open={openSections['doctor']!}
        onToggle={() => toggleSection('doctor')}
      >
        {watch('doctorName') && (
          <div className="mb-4 flex items-center justify-between rounded-lg bg-emerald-50/80 p-3 border border-emerald-200/80 text-xs text-emerald-800">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>
                <strong>Profile loaded:</strong> Dr. {watch('doctorName')}{watch('clinicName') ? ` (${watch('clinicName')})` : ''}. Auto-filled on prescription header.
              </span>
            </div>
            <Link
              href="/dashboard/profile"
              target="_blank"
              className="text-primary hover:underline font-semibold shrink-0 ml-2"
            >
              Account Profile ↗
            </Link>
          </div>
        )}
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

          {['bilingual-indian', 'medical-prescription-form'].includes(template.slug) && (
            <>
              <FormField id="patient-address" label="Address" className="sm:col-span-2" error={errors.patient?.address?.message}>
                <input id="patient-address" type="text" {...register('patient.address')} className="form-input" placeholder="e.g. 123 Main St" />
              </FormField>
              <FormField id="patient-allergies" label="Allergies" className="sm:col-span-2" error={errors.patient?.allergies?.message}>
                <input id="patient-allergies" type="text" {...register('patient.allergies')} className="form-input" placeholder="e.g. Penicillin, Peanuts" />
              </FormField>
              {template.slug === 'medical-prescription-form' && (
                <>
                  <FormField id="patient-dob" label="Date of Birth" className="sm:col-span-2" error={(errors.patient as any)?.dob?.message}>
                    <input id="patient-dob" type="text" {...register('patient.dob' as any)} className="form-input" placeholder="e.g. 15-08-1990" />
                  </FormField>
                  <FormField id="patient-occupation" label="Occupation" className="sm:col-span-2" error={(errors.patient as any)?.occupation?.message}>
                    <input id="patient-occupation" type="text" {...register('patient.occupation' as any)} className="form-input" placeholder="e.g. Teacher" />
                  </FormField>
                  <FormField id="patient-insurance" label="Insurance No." className="sm:col-span-2" error={(errors.patient as any)?.insuranceNo?.message}>
                    <input id="patient-insurance" type="text" {...register('patient.insuranceNo' as any)} className="form-input" placeholder="e.g. INS-456" />
                  </FormField>
                  <FormField id="patient-provider" label="Care Provider" className="sm:col-span-2" error={(errors.patient as any)?.careProvider?.message}>
                    <input id="patient-provider" type="text" {...register('patient.careProvider' as any)} className="form-input" placeholder="e.g. Star Health" />
                  </FormField>
                  <FormField id="patient-healthcard" label="Health Card No." className="sm:col-span-2" error={(errors.patient as any)?.healthCardNo?.message}>
                    <input id="patient-healthcard" type="text" {...register('patient.healthCardNo' as any)} className="form-input" placeholder="e.g. HC-789" />
                  </FormField>
                  <FormField id="patient-idno" label="Patient ID No." className="sm:col-span-2" error={(errors.patient as any)?.patientIdNo?.message}>
                    <input id="patient-idno" type="text" {...register('patient.patientIdNo' as any)} className="form-input" placeholder="e.g. PID-102" />
                  </FormField>
                  <FormField id="patient-disabilities" label="Disabilities if any" className="sm:col-span-4" error={(errors.patient as any)?.disabilities?.message}>
                    <input id="patient-disabilities" type="text" {...register('patient.disabilities' as any)} className="form-input" placeholder="e.g. None" />
                  </FormField>
                </>
              )}
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
  badge,
  summary,
}: {
  title: string
  open: boolean
  onToggle: () => void
  children: React.ReactNode
  accent?: boolean
  badge?: React.ReactNode
  summary?: React.ReactNode
}) {
  return (
    <div className={cn(
      'overflow-hidden rounded-lg border bg-white shadow-soft-sm transition-all',
      accent ? 'border-teal-200' : 'border-border'
    )}>
      <button
        type="button"
        className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-slate-50/70 transition-colors"
        onClick={onToggle}
        aria-expanded={open}
      >
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className={cn('text-sm font-semibold', accent ? 'text-teal-800' : 'text-slate-900')}>
            {title}
          </span>
          {badge}
        </div>
        <div className="flex items-center gap-2">
          {!open && summary && (
            <span className="text-xs text-muted-foreground hidden sm:inline-block max-w-xs truncate font-medium">
              {summary}
            </span>
          )}
          {open ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden="true" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden="true" />
          )}
        </div>
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
