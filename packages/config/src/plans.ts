import type { Plan } from '@prescriptionmaker/types'

export const PLANS: Plan[] = [
  {
    id: 'plan_free',
    name: 'Free',
    slug: 'free',
    priceMonthly: 0,
    priceYearly: 0,
    currency: 'INR',
    features: {
      maxPrescriptionsPerMonth: 10,
      maxTemplates: 3,
      handModeEnabled: false,
      pdfDownloadEnabled: true,
      prioritySupport: false,
      customBranding: false,
      teamMembers: 1,
    },
    isPopular: false,
  },
  {
    id: 'plan_pro',
    name: 'Pro',
    slug: 'pro',
    priceMonthly: 299,
    priceYearly: 2499,
    currency: 'INR',
    features: {
      maxPrescriptionsPerMonth: 'unlimited',
      maxTemplates: 'unlimited',
      handModeEnabled: true,
      pdfDownloadEnabled: true,
      prioritySupport: false,
      customBranding: true,
      teamMembers: 1,
    },
    isPopular: true,
  },
  {
    id: 'plan_enterprise',
    name: 'Enterprise',
    slug: 'enterprise',
    priceMonthly: 999,
    priceYearly: 8999,
    currency: 'INR',
    features: {
      maxPrescriptionsPerMonth: 'unlimited',
      maxTemplates: 'unlimited',
      handModeEnabled: true,
      pdfDownloadEnabled: true,
      prioritySupport: true,
      customBranding: true,
      teamMembers: 10,
    },
    isPopular: false,
  },
]

// App-wide constants
export const APP_CONFIG = {
  name: 'PrescriptionMaker',
  domain: 'prescriptionmaker.in',
  url: 'https://prescriptionmaker.in',
  apiUrl: process.env['NEXT_PUBLIC_API_URL'] ?? 'https://api.prescriptionmaker.in',
  supportEmail: 'support@prescriptionmaker.in',
  contactEmail: 'hello@prescriptionmaker.in',
  twitterHandle: '@prescriptionmaker',
  linkedinUrl: 'https://linkedin.com/company/prescriptionmaker',
} as const

export const MEDICINE_FREQUENCIES = [
  { value: 'OD', label: 'OD — Once daily' },
  { value: 'BD', label: 'BD — Twice daily' },
  { value: 'TDS', label: 'TDS — Three times daily' },
  { value: 'QID', label: 'QID — Four times daily' },
  { value: '1-0-0', label: '1-0-0 — Morning only' },
  { value: '0-1-0', label: '0-1-0 — Afternoon only' },
  { value: '0-0-1', label: '0-0-1 — Night only' },
  { value: '1-0-1', label: '1-0-1 — Morning + Night' },
  { value: '1-1-0', label: '1-1-0 — Morning + Afternoon' },
  { value: '0-1-1', label: '0-1-1 — Afternoon + Night' },
  { value: '1-1-1', label: '1-1-1 — Three times' },
  { value: 'SOS', label: 'SOS — As needed' },
  { value: 'custom', label: 'Custom...' },
] as const

export const MEDICINE_FORMS = [
  { value: 'tablet', label: 'Tablet' },
  { value: 'capsule', label: 'Capsule' },
  { value: 'syrup', label: 'Syrup' },
  { value: 'injection', label: 'Injection' },
  { value: 'cream', label: 'Cream / Ointment' },
  { value: 'drops', label: 'Drops' },
  { value: 'inhaler', label: 'Inhaler' },
  { value: 'patch', label: 'Patch' },
  { value: 'suppository', label: 'Suppository' },
  { value: 'other', label: 'Other' },
] as const

export const MEDICINE_TIMINGS = [
  { value: 'before_food', label: 'Before food' },
  { value: 'after_food', label: 'After food' },
  { value: 'with_food', label: 'With food' },
  { value: 'empty_stomach', label: 'Empty stomach' },
  { value: 'bedtime', label: 'At bedtime' },
] as const

export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Puducherry', 'Chandigarh',
  'Andaman & Nicobar Islands', 'Dadra & Nagar Haveli', 'Lakshadweep',
] as const
