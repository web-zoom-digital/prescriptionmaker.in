import { TEMPLATES } from '@prescriptionmaker/config/templates'
import { PrescriptionPreview } from '@/components/editor/prescription-preview'

const dummyData = {
  doctorName: 'Full Name',
  doctorQualifications: 'MBBS, MD',
  doctorSpecialization: 'General Medicine',
  clinicName: 'Name of your clinic',
  patient: { name: 'Patient full name', age: '34', gender: 'Male' },
  diagnosis: 'Acute Pharyngitis',
  medicines: [
    { name: 'Medicine Name', dosage: '1-0-1', duration: '5 days' },
    { name: 'Second Medicine', dosage: '0-0-1', duration: '3 days' }
  ]
}

export default function ScreenshotHelper() {
  return (
    <div className="flex flex-col gap-20 p-10 bg-slate-100">
      {TEMPLATES.map(t => (
        <div key={t.slug} id={t.slug} className="bg-white shadow-xl w-[210mm] min-h-[297mm]">
          <PrescriptionPreview template={t as any} data={dummyData} />
        </div>
      ))}
    </div>
  )
}
