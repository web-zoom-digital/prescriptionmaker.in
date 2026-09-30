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
}

export const MOBILE_TEMPLATES: Template[] = [
  // 1. Classic Letterhead
  {
    id: 'classic-letterhead',
    name: 'Classic Letterhead',
    description: 'Centered serif clinic letterhead with numbered Rx list. Elegant, for senior practitioners.',
    category: 'clinic',
    layout: 'classic',
    styles: { primaryColor: '#1a365d', accentColor: '#2b6cb0', bgColor: '#ffffff', fontFamily: 'serif' },
    isPremium: false,
    emoji: '📜',
  },
  // 2. Two-Column Sidebar
  {
    id: 'two-column-sidebar',
    name: 'Two-Column Sidebar',
    description: 'Left sidebar for doctor vitals + clinic info. Right panel for patient Rx. For cardiologists.',
    category: 'specialty',
    layout: 'two-column',
    styles: { primaryColor: '#1e3a5f', accentColor: '#3182ce', bgColor: '#f7fafc', fontFamily: 'sans-serif' },
    isPremium: true,
    emoji: '🏥',
  },
  // 3. Hospital OPD Form
  {
    id: 'hospital-opd',
    name: 'Hospital OPD Form',
    description: 'Institutional format with MRN, Ward, Bed, HOD signature. For government/private hospitals.',
    category: 'hospital',
    layout: 'modern',
    styles: { primaryColor: '#155e75', accentColor: '#0ea5e9', bgColor: '#f0f9ff', fontFamily: 'sans-serif' },
    isPremium: true,
    emoji: '🏛️',
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
  },
  // 8. Minimal Print Ruled
  {
    id: 'minimal-print-ruled',
    name: 'Minimal Print Ruled',
    description: 'Ultra-minimal like a premium notepad. Hairline rules, large Rx symbol, serif. Elite clinics.',
    category: 'clinic',
    layout: 'minimal',
    styles: { primaryColor: '#1a202c', accentColor: '#718096', bgColor: '#ffffff', fontFamily: 'serif' },
    isPremium: false,
    emoji: '✒️',
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
  },
]

export const TEMPLATE_CATEGORIES = [
  { id: 'all', name: 'All', emoji: '🏥' },
  { id: 'clinic', name: 'Clinic', emoji: '🩺' },
  { id: 'hospital', name: 'Hospital', emoji: '🏛️' },
  { id: 'specialty', name: 'Specialty', emoji: '⚕️' },
  { id: 'general', name: 'General', emoji: '👨‍⚕️' },
  { id: 'pediatric', name: 'Pediatric', emoji: '👶' },
]
