// Template definitions for the mobile app prescription generator
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
  layout: 'classic' | 'minimal' | 'two-column' | 'modern'
  styles: TemplateStyle
  isPremium: boolean
  emoji: string
}

export const MOBILE_TEMPLATES: Template[] = [
  {
    id: 'classic-medical',
    name: 'Classic Medical',
    description: 'Traditional clinic style with formal layout',
    category: 'general',
    layout: 'classic',
    styles: { primaryColor: '#0f766e', accentColor: '#14b8a6', bgColor: '#f0fdf4', fontFamily: 'serif' },
    isPremium: false,
    emoji: '🏥',
  },
  {
    id: 'minimal-clinical',
    name: 'Minimal Clinical',
    description: 'Clean modern minimal design',
    category: 'general',
    layout: 'minimal',
    styles: { primaryColor: '#1e40af', accentColor: '#3b82f6', bgColor: '#eff6ff', fontFamily: 'sans-serif' },
    isPremium: false,
    emoji: '📋',
  },
  {
    id: 'two-column-pro',
    name: 'Two Column Pro',
    description: 'Efficient two-column professional layout',
    category: 'specialist',
    layout: 'two-column',
    styles: { primaryColor: '#7c3aed', accentColor: '#a78bfa', bgColor: '#f5f3ff', fontFamily: 'sans-serif' },
    isPremium: true,
    emoji: '⚕️',
  },
  {
    id: 'pediatric',
    name: 'Pediatric Care',
    description: 'Friendly layout for children patients',
    category: 'pediatric',
    layout: 'modern',
    styles: { primaryColor: '#0891b2', accentColor: '#06b6d4', bgColor: '#ecfeff', fontFamily: 'sans-serif' },
    isPremium: false,
    emoji: '👶',
  },
  {
    id: 'cardiology',
    name: 'Cardiology',
    description: 'Specialist layout for cardiology practice',
    category: 'specialist',
    layout: 'two-column',
    styles: { primaryColor: '#be123c', accentColor: '#f43f5e', bgColor: '#fff1f2', fontFamily: 'serif' },
    isPremium: true,
    emoji: '❤️',
  },
  {
    id: 'dermatology',
    name: 'Dermatology',
    description: 'Aesthetic clean design for skin specialists',
    category: 'specialist',
    layout: 'minimal',
    styles: { primaryColor: '#b45309', accentColor: '#f59e0b', bgColor: '#fffbeb', fontFamily: 'sans-serif' },
    isPremium: false,
    emoji: '✨',
  },
]
