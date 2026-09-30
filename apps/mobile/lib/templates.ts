// Template definitions for the mobile app prescription generator
// Premium templates matching the web app catalog
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
  layout: 'classic' | 'minimal' | 'two-column' | 'modern' | 'premium'
  styles: TemplateStyle
  isPremium: boolean
  emoji: string
}

export const MOBILE_TEMPLATES: Template[] = [
  {
    id: 'royal-indigo',
    name: 'Royal Indigo',
    description: 'Premium Rx-style with patient grid & drug table. Used by top hospital consultants.',
    category: 'clinic',
    layout: 'premium',
    styles: { primaryColor: '#4338ca', accentColor: '#818cf8', bgColor: '#f5f5ff', fontFamily: 'sans-serif' },
    isPremium: true,
    emoji: '👑',
  },
  {
    id: 'executive-gold',
    name: 'Executive Gold',
    description: 'Luxury gold accent with full patient details. Trusted by senior consultants.',
    category: 'specialty',
    layout: 'premium',
    styles: { primaryColor: '#1a1a2e', accentColor: '#c9a84c', bgColor: '#fffef7', fontFamily: 'serif' },
    isPremium: true,
    emoji: '🥇',
  },
  {
    id: 'emerald-specialist',
    name: 'Emerald Specialist',
    description: 'Deep emerald for cardiology, surgery & internal medicine specialists.',
    category: 'specialty',
    layout: 'premium',
    styles: { primaryColor: '#064e3b', accentColor: '#10b981', bgColor: '#f0fdf4', fontFamily: 'sans-serif' },
    isPremium: true,
    emoji: '💎',
  },
  {
    id: 'sapphire-hospital',
    name: 'Sapphire Hospital',
    description: 'Institutional hospital OPD with department, MRN & dual signature block.',
    category: 'hospital',
    layout: 'premium',
    styles: { primaryColor: '#1e3a8a', accentColor: '#93c5fd', bgColor: '#eff6ff', fontFamily: 'sans-serif' },
    isPremium: true,
    emoji: '🏨',
  },
  {
    id: 'platinum-minimal',
    name: 'Platinum Minimal',
    description: 'Ultra-premium minimal for elite private practices. Playfair typography.',
    category: 'clinic',
    layout: 'minimal',
    styles: { primaryColor: '#111827', accentColor: '#9ca3af', bgColor: '#ffffff', fontFamily: 'serif' },
    isPremium: true,
    emoji: '⬜',
  },
  {
    id: 'crimson-cardiology',
    name: 'Crimson Cardiology',
    description: 'Bold high-contrast with BP/HR/SpO2 vitals section for cardiologists.',
    category: 'specialty',
    layout: 'premium',
    styles: { primaryColor: '#7f1d1d', accentColor: '#f87171', bgColor: '#fff5f5', fontFamily: 'sans-serif' },
    isPremium: true,
    emoji: '❤️',
  },
  {
    id: 'teal-modern-clinic',
    name: 'Teal Modern Clinic',
    description: 'Contemporary teal for urban multi-specialty clinics with card-style medicines.',
    category: 'clinic',
    layout: 'modern',
    styles: { primaryColor: '#0d9488', accentColor: '#5eead4', bgColor: '#f0fdfb', fontFamily: 'sans-serif' },
    isPremium: true,
    emoji: '🏥',
  },
  {
    id: 'ocean-pediatric',
    name: 'Ocean Pediatric',
    description: 'Professional ocean blue with weight-based dosing & immunization for pediatricians.',
    category: 'pediatric',
    layout: 'premium',
    styles: { primaryColor: '#0c4a6e', accentColor: '#38bdf8', bgColor: '#f0f9ff', fontFamily: 'sans-serif' },
    isPremium: true,
    emoji: '👶',
  },
  {
    id: 'obsidian-surgeon',
    name: 'Obsidian Surgeon',
    description: 'Dark authority header for surgical consultants with pre/post-op sections.',
    category: 'specialty',
    layout: 'premium',
    styles: { primaryColor: '#0f172a', accentColor: '#e2e8f0', bgColor: '#ffffff', fontFamily: 'sans-serif' },
    isPremium: true,
    emoji: '🔬',
  },
  {
    id: 'violet-dermatology',
    name: 'Violet Dermatology',
    description: 'Sophisticated violet with topical/systemic medication split for dermatologists.',
    category: 'specialty',
    layout: 'premium',
    styles: { primaryColor: '#4c1d95', accentColor: '#c4b5fd', bgColor: '#faf5ff', fontFamily: 'sans-serif' },
    isPremium: true,
    emoji: '✨',
  },
  {
    id: 'slate-corporate',
    name: 'Slate Corporate',
    description: 'Corporate-grade for occupational health & fitness-for-duty assessments.',
    category: 'clinic',
    layout: 'modern',
    styles: { primaryColor: '#334155', accentColor: '#0ea5e9', bgColor: '#f8fafc', fontFamily: 'sans-serif' },
    isPremium: true,
    emoji: '🏢',
  },
  {
    id: 'rose-gynecology',
    name: 'Rose Gynecology',
    description: 'Elegant rose for gynecologists with obstetric history & pregnancy tracking.',
    category: 'specialty',
    layout: 'premium',
    styles: { primaryColor: '#9d174d', accentColor: '#f9a8d4', bgColor: '#fff1f2', fontFamily: 'sans-serif' },
    isPremium: true,
    emoji: '🌸',
  },
]
