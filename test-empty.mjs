import fs from 'fs';
import path from 'path';

async function generate() {
  try {
    const res = await fetch('http://localhost:3000/api/prescriptions/generate-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        template: {
          id: 'test',
          name: 'Multi-Section Boxed',
          slug: 'multi-section-boxed',
          type: 'prescription',
          premium: false,
          colors: { primary: '#1e3a8a', accent: '#3b82f6', background: '#ffffff' }
        },
        prescriptionData: {
          doctor: { name: '', clinicName: '', phone: '', address: '', qualifications: '', specialization: '' },
          patient: { name: '', age: '', gender: '' },
          vitals: {},
          medicines: [],
          diagnosis: '',
          advice: '',
          labTests: '',
          followUpDate: ''
        },
        lang: 'en'
      })
    });
    const status = res.status;
    if (status !== 200) {
      const text = await res.text();
      console.error(status, text);
    } else {
      console.log(status, 'Success');
    }
  } catch (e) {
    console.error(e);
  }
}
generate();
