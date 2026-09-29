'use client'

import { useState, useEffect } from 'react'
import { Save, Loader2, CheckCircle, User, Building2, ImageIcon } from 'lucide-react'
import { AssetUploader } from '@/components/ui/asset-uploader'

// Mock user ID for now — in production, get from JWT/session
const MOCK_USER_ID = 'demo-user-id'

interface ProfileData {
  doctorName: string
  qualifications: string
  specialization: string
  registrationNumber: string
  experienceYears: string
  clinicName: string
  clinicPhone: string
  clinicAddress: string
  clinicCity: string
  clinicState: string
  clinicPincode: string
  clinicEmail: string
  clinicWebsite: string
  clinicLogoUrl: string
  stampUrl: string
  signatureUrl: string
}

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<'personal' | 'clinic' | 'assets'>('personal')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [profile, setProfile] = useState<ProfileData>({
    doctorName: '',
    qualifications: '',
    specialization: '',
    registrationNumber: '',
    experienceYears: '',
    clinicName: '',
    clinicPhone: '',
    clinicAddress: '',
    clinicCity: '',
    clinicState: '',
    clinicPincode: '',
    clinicEmail: '',
    clinicWebsite: '',
    clinicLogoUrl: '',
    stampUrl: '',
    signatureUrl: '',
  })

  // Fetch existing profile
  useEffect(() => {
    fetch('/api/profile')
      .then((r) => r.json())
      .then(({ data }) => {
        if (data) {
          setProfile({
            doctorName: data.doctor_name ?? '',
            qualifications: data.qualifications ?? '',
            specialization: data.specialization ?? '',
            registrationNumber: data.registration_number ?? '',
            experienceYears: data.experience_years?.toString() ?? '',
            clinicName: data.clinic_name ?? '',
            clinicPhone: data.clinic_phone ?? '',
            clinicAddress: data.clinic_address ?? '',
            clinicCity: data.clinic_city ?? '',
            clinicState: data.clinic_state ?? '',
            clinicPincode: data.clinic_pincode ?? '',
            clinicEmail: data.clinic_email ?? '',
            clinicWebsite: data.clinic_website ?? '',
            clinicLogoUrl: data.clinic_logo_url ?? '',
            stampUrl: data.stamp_url ?? '',
            signatureUrl: data.signature_url ?? '',
          })
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    try {
      await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorName: profile.doctorName,
          qualifications: profile.qualifications,
          specialization: profile.specialization,
          registrationNumber: profile.registrationNumber,
          experienceYears: parseInt(profile.experienceYears) || null,
          clinicName: profile.clinicName,
          clinicPhone: profile.clinicPhone,
          clinicAddress: profile.clinicAddress,
          clinicCity: profile.clinicCity,
          clinicState: profile.clinicState,
          clinicPincode: profile.clinicPincode,
          clinicEmail: profile.clinicEmail,
          clinicWebsite: profile.clinicWebsite,
        }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const field = (
    label: string,
    key: keyof ProfileData,
    placeholder?: string,
    type: string = 'text'
  ) => (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      <input
        type={type}
        value={profile[key]}
        onChange={(e) => setProfile((p) => ({ ...p, [key]: e.target.value }))}
        placeholder={placeholder}
        className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
      />
    </div>
  )

  const tabs = [
    { id: 'personal', label: 'Doctor Info', icon: User },
    { id: 'clinic', label: 'Clinic Info', icon: Building2 },
    { id: 'assets', label: 'Logo & Stamp', icon: ImageIcon },
  ] as const

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Profile & Settings</h1>
          <p className="text-slate-500 mt-1 text-sm">This info will appear on all your prescriptions.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-lg transition-all disabled:opacity-50 shadow-teal-500/20 shadow-md"
        >
          {saving ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
          ) : saved ? (
            <><CheckCircle className="w-4 h-4" /> Saved!</>
          ) : (
            <><Save className="w-4 h-4" /> Save Changes</>
          )}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mb-6 w-fit">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === id
                ? 'bg-white text-teal-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Panel */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        {activeTab === 'personal' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {field('Full Name', 'doctorName', 'Dr. Rahul Sharma')}
            {field('Qualifications', 'qualifications', 'MBBS, MD')}
            {field('Specialization', 'specialization', 'General Medicine')}
            {field('Registration No.', 'registrationNumber', 'MCI-12345')}
            {field('Experience (Years)', 'experienceYears', '10', 'number')}
          </div>
        )}

        {activeTab === 'clinic' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {field('Clinic Name', 'clinicName', 'City Health Clinic')}
            {field('Phone', 'clinicPhone', '+91 98765 43210', 'tel')}
            {field('Email', 'clinicEmail', 'clinic@example.com', 'email')}
            {field('Website', 'clinicWebsite', 'https://yourclinic.in', 'url')}
            <div className="sm:col-span-2">
              {field('Address', 'clinicAddress', '123, MG Road, Near City Hospital')}
            </div>
            {field('City', 'clinicCity', 'Mumbai')}
            {field('State', 'clinicState', 'Maharashtra')}
            {field('PIN Code', 'clinicPincode', '400001')}
          </div>
        )}

        {activeTab === 'assets' && (
          <div className="space-y-8">
            <AssetUploader
              userId={MOCK_USER_ID}
              type="logo"
              label="Clinic Logo"
              description="Shown in the top-left of your prescription. Recommended: PNG with transparent background, 200×200px."
              currentUrl={profile.clinicLogoUrl || null}
              onUploadComplete={(url) => setProfile((p) => ({ ...p, clinicLogoUrl: url }))}
            />

            <div className="border-t border-slate-100" />

            <AssetUploader
              userId={MOCK_USER_ID}
              type="stamp"
              label="Doctor Stamp / Seal"
              description="Circular stamp image shown at the bottom of the prescription. PNG with transparent background."
              currentUrl={profile.stampUrl || null}
              onUploadComplete={(url) => setProfile((p) => ({ ...p, stampUrl: url }))}
            />

            <div className="border-t border-slate-100" />

            <AssetUploader
              userId={MOCK_USER_ID}
              type="signature"
              label="Digital Signature"
              description="Your handwritten signature image. PNG with white or transparent background."
              currentUrl={profile.signatureUrl || null}
              onUploadComplete={(url) => setProfile((p) => ({ ...p, signatureUrl: url }))}
            />

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-sm text-amber-800">
                <strong>⚠️ Note:</strong> Make sure the <code className="bg-amber-100 px-1 rounded">doctor-assets</code> storage bucket is created in your Supabase project (Settings → Storage → New Bucket → set to <strong>Private</strong>).
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
