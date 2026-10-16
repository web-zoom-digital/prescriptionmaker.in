// Template definitions for the mobile app prescription generator
// 10 Structurally Distinct Premium Templates — matching the web app catalog
export type TemplateStyle = {
  primaryColor: string
  accentColor: string
  bgColor: string
  fontFamily: string
}

export type Template = {
  id: string
  name: string
  description: string
  category: string
  layout: 'classic' | 'minimal' | 'two-column' | 'modern' | 'premium' | 'soap' | 'bilingual' | 'boxed' | 'detailed' | 'grid'
  styles: TemplateStyle
  isPremium: boolean
  emoji: string
  image: any
}

export const MOBILE_TEMPLATES: Template[] = [
  // 1. Classic Letterhead
  {
    id: 'classic-letterhead',
    name: 'Classic Letterhead',
    description: 'Centered serif clinic letterhead with numbered Rx list. Elegant, for senior practitioners.',
    category: 'clinic',
    layout: 'classic',
    styles: { primaryColor: '#102A56', accentColor: '#155EEF', bgColor: '#ffffff', fontFamily: 'serif' },
    isPremium: false,
    emoji: '📜',
    image: require('../assets/templates/classic-letterhead.jpg'),
  },
  // 2. Two-Column Sidebar
  {
    id: 'two-column-sidebar',
    name: 'Two-Column Sidebar',
    description: 'Left sidebar for doctor vitals + clinic info. Right panel for patient Rx. For cardiologists.',
    category: 'specialty',
    layout: 'two-column',
    styles: { primaryColor: '#102A56', accentColor: '#155EEF', bgColor: '#F4F7FF', fontFamily: 'sans-serif' },
    isPremium: true,
    emoji: '🏥',
    image: require('../assets/templates/two-column-sidebar.jpg'),
  },
  // 4. SOAP Clinical Notes
  {
    id: 'soap-clinical',
    name: 'SOAP Clinical Notes',
    description: 'Structured S/O/A/P format. For western-trained and academic doctors.',
    category: 'specialty',
    layout: 'soap',
    styles: { primaryColor: '#312e81', accentColor: '#6366f1', bgColor: '#fafafa', fontFamily: 'sans-serif' },
    isPremium: true,
    emoji: '📋',
    image: require('../assets/templates/soap-clinical.jpg'),
  },
  // 5. Vitals-First
  {
    id: 'vitals-first',
    name: 'Vitals-First',
    description: 'Prominent vitals grid (BP, HR, SpO₂, Temp, Weight) before Rx. For cardiologists & ICU.',
    category: 'specialty',
    layout: 'detailed',
    styles: { primaryColor: '#9b2335', accentColor: '#e53e3e', bgColor: '#fff5f5', fontFamily: 'sans-serif' },
    isPremium: true,
    emoji: '❤️',
    image: require('../assets/templates/vitals-first.jpg'),
  },
  // 6. Detailed Drug Chart
  {
    id: 'detailed-drug-chart',
    name: 'Detailed Drug Chart',
    description: 'Each medicine gets its own card with route, timing, instructions. For complex regimens.',
    category: 'specialty',
    layout: 'detailed',
    styles: { primaryColor: '#065f46', accentColor: '#10b981', bgColor: '#f0fdf4', fontFamily: 'sans-serif' },
    isPremium: true,
    emoji: '💊',
    image: require('../assets/templates/detailed-drug-chart.jpg'),
  },
  // 7. Multi-Section Boxed
  {
    id: 'multi-section-boxed',
    name: 'Multi-Section Boxed',
    description: 'Separate bordered boxes for Complaint, Diagnosis, Rx, Investigations, Advice. Systematic.',
    category: 'pediatric',
    layout: 'boxed',
    styles: { primaryColor: '#0c4a6e', accentColor: '#38bdf8', bgColor: '#f0f9ff', fontFamily: 'sans-serif' },
    isPremium: true,
    emoji: '📦',
    image: require('../assets/templates/multi-section-boxed.jpg'),
  },
  // 8. Minimal Print Ruled
  {
    id: 'minimal-print-ruled',
    name: 'Minimal Print Ruled',
    description: 'Ultra-minimal like a premium notepad. Hairline rules, large Rx symbol, serif. Elite clinics.',
    category: 'clinic',
    layout: 'minimal',
    styles: { primaryColor: '#102A56', accentColor: '#64748b', bgColor: '#ffffff', fontFamily: 'serif' },
    isPremium: false,
    emoji: '✒️',
    image: require('../assets/templates/minimal-print-ruled.jpg'),
  },
  // 9. Bilingual Indian
  {
    id: 'bilingual-indian',
    name: 'Bilingual Indian',
    description: 'English + Hindi labels side-by-side. Indian format for GPs in Tier 2-3 cities.',
    category: 'general',
    layout: 'bilingual',
    styles: { primaryColor: '#7c3aed', accentColor: '#a78bfa', bgColor: '#faf5ff', fontFamily: 'sans-serif' },
    isPremium: false,
    emoji: '🇮🇳',
    image: require('../assets/templates/bilingual-indian.jpg'),
  },
  // 10. Compartmentalized Grid
  {
    id: 'compartmentalized-grid',
    name: 'Compartmentalized Grid',
    description: '3-col patient bar, diagnosis band, grid Rx table, 2-col footer. Multi-specialty consultants.',
    category: 'specialty',
    layout: 'grid',
    styles: { primaryColor: '#92400e', accentColor: '#f59e0b', bgColor: '#fffbeb', fontFamily: 'sans-serif' },
    isPremium: true,
    emoji: '⚕️',
    image: require('../assets/templates/compartmentalized-grid.jpg'),
  },
  // 11. Dental & Clinic Rx
  {
    id: 'dental-clinic',
    name: 'Dental & Clinic Rx',
    description: 'Classic clinic letterhead with prominent ℞ emblem, clinic hours, phone, underlined patient fields, and License/PTR credentials.',
    category: 'dental',
    layout: 'classic',
    styles: { primaryColor: '#18181b', accentColor: '#3f3f46', bgColor: '#ffffff', fontFamily: 'serif' },
    isPremium: false,
    emoji: '🦷',
    image: require('../assets/templates/dental-clinic.jpg'),
  },
  // 12. Modern Teal Ribbon
  {
    id: 'modern-teal-ribbon',
    name: 'Modern Teal Ribbon',
    description: 'Contemporary geometric teal chevron header & footer, Caduceus emblem, tracked qualification accent, and 3-row patient bar.',
    category: 'general',
    layout: 'modern',
    styles: { primaryColor: '#00b4d8', accentColor: '#0f2330', bgColor: '#ffffff', fontFamily: 'sans-serif' },
    isPremium: true,
    emoji: '💠',
    image: require('../assets/templates/modern-teal-ribbon.jpg'),
  },
]

export const TEMPLATE_CATEGORIES = [
  { id: 'all', name: 'All', emoji: '🏥' },
  { id: 'clinic', name: 'Clinic', emoji: '🩺' },
  { id: 'dental', name: 'Dental', emoji: '🦷' },
  { id: 'hospital', name: 'Hospital', emoji: '🏛️' },
  { id: 'specialty', name: 'Specialty', emoji: '⚕️' },
  { id: 'general', name: 'General', emoji: '👨‍⚕️' },
  { id: 'pediatric', name: 'Pediatric', emoji: '👶' },
]

export type TemplateFieldConfig = {
  hasChiefComplaint: boolean
  chiefComplaintLabel?: string
  hasDiagnosis: boolean
  diagnosisLabel?: string
  hasAddress: boolean
  hasAllergies: boolean
  hasWeightInPatient: boolean
  hasOpdRef: boolean
  opdRefLabel?: string
  hasVitals: boolean
  vitalsList?: ('bp' | 'pulse' | 'temp' | 'spo2' | 'weight' | 'height')[]
  hasAdvice?: boolean
  hasInvestigations?: boolean
  hasFollowUp?: boolean
  hasLogo?: boolean
}

/**
 * Returns exactly which fields belong to each template layout.
 * Ensures the doctor is only presented with fields that actually appear
 * on the selected prescription template, eliminating unnecessary inputs.
 */
export function getTemplateFieldConfig(templateId?: string): TemplateFieldConfig {
  switch (templateId) {
    case 'classic-letterhead':
      return {
        hasChiefComplaint: true,
        chiefComplaintLabel: 'Chief Complaint',
        hasDiagnosis: true,
        diagnosisLabel: 'Diagnosis',
        hasAddress: false,
        hasAllergies: false,
        hasWeightInPatient: false,
        hasOpdRef: false,
        hasVitals: false, // Zero vitals on Classic Letterhead
        hasAdvice: true,
        hasInvestigations: true,
        hasFollowUp: true,
      }

    case 'two-column-sidebar':
      return {
        hasChiefComplaint: false,
        hasDiagnosis: true,
        diagnosisLabel: 'Diagnosis',
        hasAddress: false,
        hasAllergies: false,
        hasWeightInPatient: false,
        hasOpdRef: true,
        opdRefLabel: 'OPD Ref / Slip No.',
        hasVitals: true,
        vitalsList: ['bp', 'pulse', 'temp', 'spo2', 'weight', 'height'],
        hasFollowUp: true,
        hasLogo: true,
      }

    case 'vitals-first':
      return {
        hasChiefComplaint: false,
        hasDiagnosis: true,
        diagnosisLabel: 'Diagnosis',
        hasAddress: false,
        hasAllergies: false,
        hasWeightInPatient: false,
        hasOpdRef: false,
        hasVitals: true,
        vitalsList: ['bp', 'pulse', 'temp', 'spo2', 'weight'],
        hasInvestigations: true,
        hasFollowUp: true,
      }

    case 'soap-clinical':
      return {
        hasChiefComplaint: true,
        chiefComplaintLabel: 'S — Subjective (Symptoms & History)',
        hasDiagnosis: true,
        diagnosisLabel: 'A — Assessment (Clinical Diagnosis)',
        hasAddress: false,
        hasAllergies: false,
        hasWeightInPatient: false,
        hasOpdRef: false,
        hasVitals: true,
        vitalsList: ['bp', 'pulse', 'temp', 'spo2', 'weight'],
        hasFollowUp: true,
      }


    case 'multi-section-boxed':
      return {
        hasChiefComplaint: true,
        chiefComplaintLabel: 'Chief Complaint',
        hasDiagnosis: true,
        diagnosisLabel: 'Diagnosis',
        hasAddress: false,
        hasAllergies: false,
        hasWeightInPatient: false,
        hasOpdRef: true,
        opdRefLabel: 'Patient Ref / Slip No.',
        hasVitals: false,
        hasAdvice: true,
        hasInvestigations: true,
        hasFollowUp: true,
      }

    case 'bilingual-indian':
      return {
        hasChiefComplaint: false,
        hasDiagnosis: true,
        diagnosisLabel: 'रोग निदान / Diagnosis',
        hasAddress: true,
        hasAllergies: true,
        hasWeightInPatient: false,
        hasOpdRef: false,
        hasVitals: false,
        hasAdvice: true,
        hasInvestigations: true,
        hasFollowUp: true,
      }

    case 'dental-clinic':
      return {
        hasChiefComplaint: false,
        hasDiagnosis: false,
        hasAddress: true,
        hasAllergies: false,
        hasWeightInPatient: false,
        hasOpdRef: false,
        hasVitals: false,
      }

    case 'modern-teal-ribbon':
      return {
        hasChiefComplaint: false,
        hasDiagnosis: true,
        diagnosisLabel: 'Diagnosis',
        hasAddress: false,
        hasAllergies: false,
        hasWeightInPatient: true,
        hasOpdRef: false,
        hasVitals: false,
      }

    case 'minimal-print-ruled':
      return {
        hasChiefComplaint: false,
        hasDiagnosis: true,
        diagnosisLabel: 'Diagnosis',
        hasAddress: false,
        hasAllergies: false,
        hasWeightInPatient: false,
        hasOpdRef: false,
        hasVitals: false,
      }

    case 'detailed-drug-chart':
      return {
        hasChiefComplaint: false,
        hasDiagnosis: true,
        diagnosisLabel: 'Diagnosis',
        hasAddress: false,
        hasAllergies: false,
        hasWeightInPatient: false,
        hasOpdRef: false,
        hasVitals: false,
        hasAdvice: true,
        hasInvestigations: true,
        hasFollowUp: true,
      }

    case 'compartmentalized-grid':
      return {
        hasChiefComplaint: true,
        chiefComplaintLabel: 'Chief Complaint',
        hasDiagnosis: true,
        diagnosisLabel: 'Diagnosis',
        hasAddress: false,
        hasAllergies: false,
        hasWeightInPatient: false,
        hasOpdRef: false,
        hasVitals: false,
        hasAdvice: true,
        hasFollowUp: true,
      }

    default:
      return {
        hasChiefComplaint: true,
        chiefComplaintLabel: 'Chief Complaint',
        hasDiagnosis: true,
        diagnosisLabel: 'Diagnosis',
        hasAddress: false,
        hasAllergies: false,
        hasWeightInPatient: false,
        hasOpdRef: false,
        hasVitals: false,
        hasAdvice: true,
        hasInvestigations: true,
        hasFollowUp: true,
      }
  }
}


