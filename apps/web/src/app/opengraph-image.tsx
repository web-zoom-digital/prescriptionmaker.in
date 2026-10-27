import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'PrescriptionMaker — Free Digital Prescription Software for Indian Doctors'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #042f2e 0%, #0f172a 100%)',
          padding: '60px 80px',
          fontFamily: 'sans-serif',
          color: 'white',
        }}
      >
        {/* Brand header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '12px',
              backgroundColor: '#0d9488',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              fontWeight: 'bold',
            }}
          >
            Rx
          </div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', letterSpacing: '-0.5px' }}>
            Prescription<span style={{ color: '#2dd4bf' }}>Maker</span>
          </div>
          <div
            style={{
              marginLeft: '20px',
              backgroundColor: 'rgba(45, 212, 191, 0.15)',
              border: '1px solid rgba(45, 212, 191, 0.3)',
              borderRadius: '999px',
              padding: '6px 16px',
              fontSize: '15px',
              color: '#2dd4bf',
              fontWeight: '600',
            }}
          >
            🇮🇳 Built for Indian Doctors
          </div>
        </div>

        {/* Main headline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '950px' }}>
          <div
            style={{
              fontSize: '54px',
              fontWeight: '800',
              lineHeight: 1.15,
              letterSpacing: '-1px',
            }}
          >
            Create Professional Digital Prescriptions in 60 Seconds
          </div>
          <div
            style={{
              fontSize: '22px',
              color: '#94a3b8',
              lineHeight: 1.4,
            }}
          >
            15+ Clinical Templates • Form Editor & Stylus Mode • 1-Click WhatsApp Share • 100% NMC 2023 Compliant
          </div>
        </div>

        {/* Footer features */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            borderTop: '1px solid rgba(255, 255, 255, 0.15)',
            paddingTop: '28px',
          }}
        >
          <div style={{ display: 'flex', gap: '32px', fontSize: '16px', color: '#cbd5e1' }}>
            <span>✓ High-Res Vector A4 PDF</span>
            <span>✓ Indian Dosage Format (1-0-1, OD, BD)</span>
            <span>✓ Free Plan Available Forever</span>
          </div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#2dd4bf' }}>
            prescriptionmaker.in
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
