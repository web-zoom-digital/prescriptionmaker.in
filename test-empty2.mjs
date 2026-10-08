import fs from 'fs';
import path from 'path';

async function generate() {
  try {
    const res = await fetch('http://localhost:3000/api/prescriptions/generate-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        templateSlug: 'multi-section-boxed',
        doctor: { name: 'Test', clinicName: '', phone: '', address: '', qualifications: '', specialization: '', logoUrl: '' },
        patient: { name: 'Patient', age: '', gender: '' },
        medicines: [{name: '', form: '', frequency: '', duration: '', strength: ''}],
        diagnosis: '',
        labTests: '',
        advice: '',
        followUpDate: ''
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
