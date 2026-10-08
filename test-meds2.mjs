import fs from 'fs';
import path from 'path';

async function generate() {
  try {
    const res = await fetch('http://localhost:3000/api/prescriptions/generate-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        templateSlug: 'multi-section-boxed',
        doctor: { name: 'Test', clinicName: 'Test Clinic' },
        patient: { name: 'Patient', age: '30', gender: 'Male' },
        medicines: [{
          name: 'Telmisartan 40mg', 
          form: 'tablet', 
          frequency: 'OD', 
          duration: '30 days',
          strength: ''
        }],
        diagnosis: 'Test Diagnosis',
        labTests: 'Test Lab',
        advice: 'Test Advice',
        followUpDate: 'Tomorrow'
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
