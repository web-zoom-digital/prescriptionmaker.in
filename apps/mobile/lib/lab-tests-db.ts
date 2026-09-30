export const COMMON_LAB_TESTS = [
  // Blood Routine
  { name: 'Complete Blood Count (CBC)', category: 'Hematology', short: 'CBC' },
  { name: 'Hemoglobin (Hb)', category: 'Hematology', short: 'Hb' },
  { name: 'Erythrocyte Sedimentation Rate (ESR)', category: 'Hematology', short: 'ESR' },
  { name: 'Peripheral Blood Smear (PBF)', category: 'Hematology', short: 'PBF' },
  
  // Biochemistry
  { name: 'Fasting Blood Sugar (FBS)', category: 'Biochemistry', short: 'FBS' },
  { name: 'Post Prandial Blood Sugar (PPBS)', category: 'Biochemistry', short: 'PPBS' },
  { name: 'HbA1c (Glycosylated Hemoglobin)', category: 'Biochemistry', short: 'HbA1c' },
  { name: 'Liver Function Test (LFT)', category: 'Biochemistry', short: 'LFT' },
  { name: 'Renal Function Test (RFT / KFT)', category: 'Biochemistry', short: 'RFT' },
  { name: 'Lipid Profile', category: 'Biochemistry', short: 'Lipid' },
  { name: 'Serum Creatinine', category: 'Biochemistry', short: 'Creatinine' },
  { name: 'Blood Urea Nitrogen (BUN)', category: 'Biochemistry', short: 'BUN' },
  { name: 'Serum Uric Acid', category: 'Biochemistry', short: 'Uric Acid' },
  { name: 'Serum Calcium', category: 'Biochemistry', short: 'Calcium' },
  { name: 'Serum Electrolytes (Na, K, Cl)', category: 'Biochemistry', short: 'Electrolytes' },

  // Thyroid & Hormones
  { name: 'Thyroid Profile (T3, T4, TSH)', category: 'Endocrinology', short: 'Thyroid' },
  { name: 'TSH (Thyroid Stimulating Hormone)', category: 'Endocrinology', short: 'TSH' },
  { name: 'Vitamin B12', category: 'Endocrinology', short: 'Vit B12' },
  { name: 'Vitamin D3 (25-OH Cholecalciferol)', category: 'Endocrinology', short: 'Vit D3' },
  { name: 'Serum Ferritin', category: 'Endocrinology', short: 'Ferritin' },

  // Infectious & Serology
  { name: 'Widal Test (Typhoid)', category: 'Serology', short: 'Widal' },
  { name: 'Dengue NS1 Antigen', category: 'Serology', short: 'Dengue NS1' },
  { name: 'Dengue IgG / IgM', category: 'Serology', short: 'Dengue Ab' },
  { name: 'Malaria Antigen (Rapid)', category: 'Serology', short: 'Malaria Ag' },
  { name: 'CRP (C-Reactive Protein)', category: 'Serology', short: 'CRP' },
  { name: 'VDRL / RPR', category: 'Serology', short: 'VDRL' },
  { name: 'HBsAg', category: 'Serology', short: 'HBsAg' },
  { name: 'Anti-HCV', category: 'Serology', short: 'HCV' },
  { name: 'HIV 1 & 2', category: 'Serology', short: 'HIV' },

  // Urine & Stool
  { name: 'Urine Routine & Microscopy', category: 'Pathology', short: 'Urine R/M' },
  { name: 'Urine Culture & Sensitivity', category: 'Pathology', short: 'Urine Culture' },
  { name: 'Stool Routine & Microscopy', category: 'Pathology', short: 'Stool R/M' },
  { name: 'Stool Occult Blood', category: 'Pathology', short: 'Stool OB' },

  // Radiology & Imaging
  { name: 'Chest X-Ray (PA View)', category: 'Radiology', short: 'CXR' },
  { name: 'Ultrasound Whole Abdomen', category: 'Radiology', short: 'USG W/A' },
  { name: 'Ultrasound KUB', category: 'Radiology', short: 'USG KUB' },
  { name: 'ECG (Electrocardiogram)', category: 'Cardiology', short: 'ECG' },
  { name: 'ECHO (Echocardiography)', category: 'Cardiology', short: 'ECHO' },
  { name: 'MRI Brain', category: 'Radiology', short: 'MRI Brain' },
  { name: 'MRI Lumbosacral Spine', category: 'Radiology', short: 'MRI LS Spine' },
  { name: 'CT Scan Head (NCCT)', category: 'Radiology', short: 'CT Head' },
]

export const TEST_PANELS = [
  {
    name: 'Fever Panel',
    tests: ['CBC', 'Widal Test (Typhoid)', 'Dengue NS1 Antigen', 'Malaria Antigen (Rapid)', 'Urine Routine & Microscopy']
  },
  {
    name: 'Diabetic Profile',
    tests: ['Fasting Blood Sugar (FBS)', 'Post Prandial Blood Sugar (PPBS)', 'HbA1c (Glycosylated Hemoglobin)', 'Lipid Profile', 'Serum Creatinine', 'Urine Routine & Microscopy']
  },
  {
    name: 'Routine Health Checkup',
    tests: ['Complete Blood Count (CBC)', 'Liver Function Test (LFT)', 'Renal Function Test (RFT / KFT)', 'Lipid Profile', 'Thyroid Profile (T3, T4, TSH)', 'Urine Routine & Microscopy']
  },
  {
    name: 'Anemia Profile',
    tests: ['Complete Blood Count (CBC)', 'Peripheral Blood Smear (PBF)', 'Serum Ferritin', 'Vitamin B12']
  }
]

export function searchLabTests(query: string) {
  if (!query) return COMMON_LAB_TESTS
  const q = query.toLowerCase()
  return COMMON_LAB_TESTS.filter(t => 
    t.name.toLowerCase().includes(q) || 
    t.short.toLowerCase().includes(q) || 
    t.category.toLowerCase().includes(q)
  )
}
