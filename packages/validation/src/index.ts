import { z } from 'zod'

// =============================================================================
// AUTH SCHEMAS
// =============================================================================

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export const signupSchema = z
  .object({
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name must be less than 100 characters'),
    email: z.string().email('Please enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      ),
    confirmPassword: z.string(),
    phone: z
      .string()
      .regex(/^[6-9]\d{9}$/, 'Please enter a valid Indian mobile number')
      .optional()
      .or(z.literal('')),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

export const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      ),
    confirmPassword: z.string(),
    token: z.string().min(1),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

// =============================================================================
// DOCTOR / CLINIC PROFILE SCHEMAS
// =============================================================================

export const doctorProfileSchema = z.object({
  name: z.string().min(2, 'Name is required').max(100),
  qualifications: z.string().min(2, 'Qualifications are required').max(200),
  specialization: z.string().min(2, 'Specialization is required').max(100),
  registrationNumber: z.string().min(1, 'Registration number is required').max(50),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Please enter a valid Indian mobile number')
    .optional()
    .or(z.literal('')),
})

export const clinicProfileSchema = z.object({
  name: z.string().min(2, 'Clinic name is required').max(200),
  address: z.string().min(5, 'Address is required').max(500),
  city: z.string().min(2, 'City is required').max(100),
  state: z.string().min(2, 'State is required').max(100),
  pincode: z.string().regex(/^\d{6}$/, 'Please enter a valid 6-digit pincode'),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Please enter a valid Indian mobile number'),
  email: z.string().email('Please enter a valid email').optional().or(z.literal('')),
  website: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  timings: z.string().max(200).optional(),
})

// =============================================================================
// PATIENT SCHEMA
// =============================================================================

export const patientSchema = z.object({
  name: z.string().min(2, 'Patient name is required').max(100),
  age: z.string().min(1, 'Age is required').max(10),
  gender: z.enum(['male', 'female', 'other']),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Please enter a valid mobile number')
    .optional()
    .or(z.literal('')),
  address: z.string().max(500).optional(),
  allergies: z.string().max(500).optional(),
  uhid: z.string().max(50).optional(),
  
  // Hospital OPD specific fields
  mrn: z.string().max(50).optional(),
  ward: z.string().max(50).optional(),
  bedNo: z.string().max(50).optional(),
  ipOpNo: z.string().max(50).optional(),
  insuranceNo: z.string().max(50).optional(),
  careProvider: z.string().max(100).optional(),
})

// =============================================================================
// VITALS SCHEMA
// =============================================================================

export const vitalsSchema = z.object({
  bloodPressure: z.string().max(20).optional(),
  temperature: z.string().max(10).optional(),
  pulse: z.string().max(10).optional(),
  weight: z.string().max(10).optional(),
  height: z.string().max(10).optional(),
  spo2: z.string().max(10).optional(),
  bmi: z.string().max(10).optional(),
  respiratoryRate: z.string().max(10).optional(),
})

// =============================================================================
// MEDICINE SCHEMA
// =============================================================================

export const medicineSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Medicine name is required').max(200),
  strength: z.string().max(50).optional(),
  form: z
    .enum([
      'tablet',
      'capsule',
      'syrup',
      'injection',
      'cream',
      'drops',
      'inhaler',
      'patch',
      'suppository',
      'other',
    ])
    .optional(),
  dose: z.string().max(50).optional(),
  frequency: z
    .enum([
      '1-0-0',
      '0-1-0',
      '0-0-1',
      '1-0-1',
      '1-1-0',
      '0-1-1',
      '1-1-1',
      'SOS',
      'BD',
      'TDS',
      'QID',
      'OD',
      'custom',
    ])
    .optional(),
  customFrequency: z.string().max(50).optional(),
  timing: z
    .enum(['before_food', 'after_food', 'with_food', 'empty_stomach', 'bedtime'])
    .optional(),
  duration: z.string().max(50).optional(),
  route: z
    .enum([
      'oral',
      'topical',
      'inhalation',
      'intravenous',
      'intramuscular',
      'subcutaneous',
      'sublingual',
      'rectal',
      'ophthalmic',
      'otic',
    ])
    .optional(),
  instructions: z.string().max(500).optional(),
})

export const labTestSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Test name is required').max(200),
  instructions: z.string().max(300).optional(),
})

// =============================================================================
// PRESCRIPTION FORM SCHEMA
// =============================================================================

export const prescriptionFormSchema = z.object({
  // Doctor & Clinic
  doctorName: z.string().min(2, 'Doctor name is required').max(100),
  doctorQualifications: z.string().min(2, 'Qualifications are required').max(200),
  doctorSpecialization: z.string().min(2, 'Specialization is required').max(100),
  doctorRegNumber: z.string().min(1, 'Registration number is required').max(50),
  clinicName: z.string().min(2, 'Clinic name is required').max(200),
  clinicAddress: z.string().min(5, 'Address is required').max(500),
  clinicPhone: z.string().min(1, 'Phone number is required').max(20),
  clinicEmail: z.string().email().optional().or(z.literal('')),

  // Patient
  patient: patientSchema,

  // Clinical
  date: z.string().min(1, 'Date is required'),
  chiefComplaint: z.string().max(500).optional(),
  diagnosis: z.string().max(1000).optional(),
  vitals: vitalsSchema.optional(),
  symptoms: z.array(z.string().max(200)).optional(),

  // Treatment
  medicines: z.array(medicineSchema).min(0).max(50),
  tests: z.array(labTestSchema).min(0).max(30),
  advice: z.string().max(2000).optional(),
  followUp: z.string().max(200).optional(),
  referral: z.string().max(500).optional(),

  // Signature and Assets
  signatureDataUrl: z.string().optional(),
  clinicLogoUrl: z.string().optional(),
  stampUrl: z.string().optional(),

  // Additional
  notes: z.string().max(1000).optional(),
})

// =============================================================================
// CONTACT SCHEMA
// =============================================================================

export const contactSchema = z.object({
  name: z.string().min(2, 'Name is required').max(100),
  email: z.string().email('Please enter a valid email address'),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Please enter a valid mobile number')
    .optional()
    .or(z.literal('')),
  subject: z.string().min(5, 'Subject is required').max(200),
  message: z.string().min(20, 'Message must be at least 20 characters').max(2000),
})

// =============================================================================
// EXPORTED TYPES FROM SCHEMAS
// =============================================================================

export type LoginFormValues = z.infer<typeof loginSchema>
export type SignupFormValues = z.infer<typeof signupSchema>
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>
export type DoctorProfileFormValues = z.infer<typeof doctorProfileSchema>
export type ClinicProfileFormValues = z.infer<typeof clinicProfileSchema>
export type PatientFormValues = z.infer<typeof patientSchema>
export type VitalsFormValues = z.infer<typeof vitalsSchema>
export type MedicineFormValues = z.infer<typeof medicineSchema>
export type LabTestFormValues = z.infer<typeof labTestSchema>
export type PrescriptionFormValues = z.infer<typeof prescriptionFormSchema>
export type ContactFormValues = z.infer<typeof contactSchema>
