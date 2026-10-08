const res = await fetch('http://localhost:3000/api/prescriptions/generate-pdf', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    templateSlug: 'multi-section-boxed',
    doctor: { name: 'Test' },
    patient: { name: 'Patient' },
    medicines: []
  })
});
const text = await res.text();
console.log(res.status, text);
