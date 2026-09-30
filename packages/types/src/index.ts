// =============================================================================
// USER & AUTH TYPES
// =============================================================================

export type UserRole = 'doctor' | 'clinic_admin' | 'hospital_admin' | 'super_admin'

export type UserPlan = 'free' | 'pro' | 'enterprise'

export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending_verification'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  plan: UserPlan
  status: UserStatus
  avatarUrl?: string
  phone?: string
  specialization?: string
  registrationNumber?: string
  createdAt: string
  updatedAt: string
  emailVerifiedAt?: string
  lastLoginAt?: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresAt: number
}

export interface AuthSession {
  user: User
  tokens: AuthTokens
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface SignupCredentials {
  name: string
  email: string
  password: string
  phone?: string
}

// =============================================================================
// DOCTOR PROFILE
// =============================================================================

export interface DoctorProfile {
  id: string
  userId: string
  name: string
  qualifications: string
  specialization: string
  registrationNumber: string
  signature?: string // base64 or URL
  profilePhoto?: string
}

export interface ClinicProfile {
  id: string
  userId: string
  name: string
  address: string
  city: string
  state: string
  pincode: string
  phone: string
  email?: string
  website?: string
  logo?: string
  timings?: string
}

// =============================================================================
// TEMPLATE TYPES
// =============================================================================

export type TemplateLayout =
  | 'classic'
  | 'minimal'
  | 'modern'
  | 'two-column'
  | 'compact'
  | 'traditional'
  | 'specialty'
  // Premium template layouts
  | 'royal-indigo'
  | 'executive-gold'
  | 'emerald-specialist'
  | 'sapphire-hospital'
  | 'platinum-minimal'
  | 'crimson-cardiology'
  | 'teal-modern'
  | 'ocean-pediatric'
  | 'obsidian-surgeon'
  | 'violet-dermatology'
  | 'slate-corporate'
  | 'rose-gynecology'

export type TemplateCategory =
  | 'general'
  | 'pediatric'
  | 'specialty'
  | 'hospital'
  | 'clinic'
  | 'minimal'
  | 'custom'

export interface TemplateSection {
  id: string
  name: string
  visible: boolean
  order: number
  style?: Record<string, string>
}

export interface TemplatePrintSettings {
  pageSize: 'A4' | 'Letter' | 'A5'
  orientation: 'portrait' | 'landscape'
  margins: {
    top: number
    right: number
    bottom: number
    left: number
  }
  showWatermark?: boolean
}

export interface TemplateStyles {
  primaryColor: string
  secondaryColor?: string
  accentColor: string
  bgColor?: string
  fontFamily: string
  headerStyle:
    | 'full'
    | 'minimal'
    | 'logo-left'
    | 'centered'
    | 'bordered'
    | 'two-col-divided'
    | 'hospital-banner'
    | 'elegant-centered'
    | 'banner-left'
    | 'sidebar-left'
    | 'pediatric-banner'
    | 'dark-banner'
    | 'corporate-split'
  medicineTableStyle:
    | 'bordered'
    | 'striped'
    | 'minimal'
    | 'card'
    | 'grid'
    | 'hairline'
    | 'numbered-rows'
    | 'hospital-grid'
    | 'category-rows'
    | 'weight-dosed'
    | 'structured-rows'
    | 'split-topical-systemic'
    | 'clean-rows'
    | 'detailed-rows'
  signatureStyle:
    | 'bottom-right'
    | 'bottom-left'
    | 'inline'
    | 'seal'
    | 'dual'
    | 'inline-right'
  footerStyle:
    | 'bordered'
    | 'minimal'
    | 'none'
    | 'colored-band'
    | 'dark-band'
    | 'teal-band'
    | 'rose-band'
    | 'hairline'
    | 'institutional'
    | 'corporate-band'
}

export interface Template {
  id: string
  name: string
  slug: string
  description: string
  category: TemplateCategory
  layout: TemplateLayout
  preview: string // URL
  thumbnail: string // URL
  styles: TemplateStyles
  sections: TemplateSection[]
  printSettings: TemplatePrintSettings
  isPublished: boolean
  isFeatured: boolean
  isPremium: boolean
  usageCount: number
  tags: string[]
  seoTitle?: string
  seoDescription?: string
  createdAt: string
  updatedAt: string
}

// =============================================================================
// PRESCRIPTION TYPES
// =============================================================================

export type PrescriptionStatus = 'draft' | 'complete' | 'archived'

export type EditorMode = 'form' | 'hand'

export interface PatientInfo {
  name: string
  age: string
  gender: 'male' | 'female' | 'other'
  phone?: string
  address?: string
  uhid?: string // Unique Health ID
}

export interface VitalsInfo {
  bloodPressure?: string
  temperature?: string
  pulse?: string
  weight?: string
  height?: string
  spo2?: string
  bmi?: string
  respiratoryRate?: string
}

export type MedicineForm =
  | 'tablet'
  | 'capsule'
  | 'syrup'
  | 'injection'
  | 'cream'
  | 'drops'
  | 'inhaler'
  | 'patch'
  | 'suppository'
  | 'other'

export type MedicineFrequency =
  | '1-0-0'
  | '0-1-0'
  | '0-0-1'
  | '1-0-1'
  | '1-1-0'
  | '0-1-1'
  | '1-1-1'
  | 'SOS'
  | 'BD'
  | 'TDS'
  | 'QID'
  | 'OD'
  | 'custom'

export type MedicineTiming = 'before_food' | 'after_food' | 'with_food' | 'empty_stomach' | 'bedtime'

export type MedicineRoute =
  | 'oral'
  | 'topical'
  | 'inhalation'
  | 'intravenous'
  | 'intramuscular'
  | 'subcutaneous'
  | 'sublingual'
  | 'rectal'
  | 'ophthalmic'
  | 'otic'

export interface Medicine {
  id: string
  name: string
  strength?: string
  form?: MedicineForm
  dose?: string
  frequency?: MedicineFrequency
  customFrequency?: string
  timing?: MedicineTiming
  duration?: string
  route?: MedicineRoute
  instructions?: string
}

export interface LabTest {
  id: string
  name: string
  instructions?: string
}

export interface PrescriptionFormData {
  // Doctor & Clinic (pulled from profile but overridable)
  doctorName: string
  doctorQualifications: string
  doctorSpecialization: string
  doctorRegNumber: string
  clinicName: string
  clinicAddress: string
  clinicPhone: string
  clinicEmail?: string

  // Patient
  patient: PatientInfo

  // Clinical
  date: string
  chiefComplaint?: string
  diagnosis?: string
  vitals?: VitalsInfo
  symptoms?: string[]

  // Treatment
  medicines: Medicine[]
  tests: LabTest[]
  advice?: string
  followUp?: string
  referral?: string

  // Signature
  signatureDataUrl?: string

  // Additional
  notes?: string
}

export interface HandModeCanvasData {
  strokes: unknown[] // Raw canvas stroke data
  elements: unknown[] // Text, images, etc.
  version: number
}

export interface Prescription {
  id: string
  userId: string
  templateId: string
  editorMode: EditorMode
  status: PrescriptionStatus
  title: string
  formData?: PrescriptionFormData
  canvasData?: HandModeCanvasData
  pdfUrl?: string
  createdAt: string
  updatedAt: string
  lastSavedAt?: string
}

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

export interface ApiError {
  success: false
  error: {
    code: string
    message: string
    details?: Record<string, string[]>
  }
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export interface PaginationParams {
  page?: number
  limit?: number
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

// =============================================================================
// BLOG / CONTENT TYPES
// =============================================================================

export interface BlogAuthor {
  id: string
  name: string
  avatarUrl?: string
  bio?: string
}

export interface BlogCategory {
  id: string
  name: string
  slug: string
}

export interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  authorId: string
  author?: BlogAuthor
  categoryId?: string
  category?: BlogCategory
  tags: string[]
  featuredImage?: string
  publishedAt?: string
  updatedAt: string
  createdAt: string
  isPublished: boolean
  seoTitle?: string
  seoDescription?: string
  readingTimeMinutes?: number
}

// =============================================================================
// SUBSCRIPTION / PLAN TYPES
// =============================================================================

export interface PlanFeatures {
  maxPrescriptionsPerMonth: number | 'unlimited'
  maxTemplates: number | 'unlimited'
  handModeEnabled: boolean
  pdfDownloadEnabled: boolean
  prioritySupport: boolean
  customBranding: boolean
  teamMembers: number
}

export interface Plan {
  id: string
  name: string
  slug: UserPlan
  priceMonthly: number
  priceYearly: number
  currency: 'INR'
  features: PlanFeatures
  isPopular: boolean
}

// =============================================================================
// ANALYTICS EVENT TYPES
// =============================================================================

export type AnalyticsEvent =
  | 'signup'
  | 'login'
  | 'logout'
  | 'template_viewed'
  | 'template_selected'
  | 'editor_opened'
  | 'prescription_created'
  | 'prescription_saved'
  | 'prescription_deleted'
  | 'pdf_generated'
  | 'pdf_downloaded'
  | 'pdf_printed'
  | 'editor_mode_switched'
  | 'medicine_added'
  | 'medicine_removed'

export interface AnalyticsEventPayload {
  event: AnalyticsEvent
  properties?: Record<string, string | number | boolean>
  timestamp?: string
}

// =============================================================================
// SUPPORT / FAQ TYPES
// =============================================================================

export interface FaqItem {
  id: string
  question: string
  answer: string
  category?: string
  order: number
}

export interface ContactMessage {
  name: string
  email: string
  phone?: string
  subject: string
  message: string
}
