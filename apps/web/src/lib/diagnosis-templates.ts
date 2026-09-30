// ─── Diagnosis Templates Database ────────────────────────────────
// Standard treatment protocols for common Indian clinical conditions
// Each template includes diagnosis, symptoms, standard medicines & advice

export type TemplateMedicine = {
  name: string
  strength: string
  frequency: string
  duration: string
  instructions: string
}

export type DiagnosisTemplate = {
  id: string
  name: string          // Display name
  emoji: string
  category: string      // Disease category
  icd: string           // ICD-10 code for reference
  symptoms: string      // Pre-filled symptoms text
  diagnosis: string     // Pre-filled diagnosis
  medicines: TemplateMedicine[]
  advice: string
  followUp: string
  labTests?: string[]   // Suggested investigations
}

export const DIAGNOSIS_TEMPLATES: DiagnosisTemplate[] = [
  // ── INFECTIONS / FEVERS ─────────────────────────────────────────
  {
    id: 'viral-fever',
    name: 'Viral Fever',
    emoji: '🤒',
    category: 'Infectious',
    icd: 'A99',
    symptoms: 'Fever, body aches, headache, fatigue, loss of appetite',
    diagnosis: 'Viral Fever',
    medicines: [
      { name: 'Paracetamol', strength: '500mg', frequency: '1-1-1', duration: '5 days', instructions: 'SOS (only when fever > 38°C)' },
      { name: 'Cetirizine', strength: '10mg', frequency: '0-0-1', duration: '5 days', instructions: 'At bedtime' },
      { name: 'Pantoprazole', strength: '40mg', frequency: '1-0-0', duration: '5 days', instructions: '30 min before breakfast' },
      { name: 'Multivitamin', strength: '1 tab', frequency: '0-1-0', duration: '10 days', instructions: 'After meals' },
    ],
    advice: 'Complete bed rest. Drink plenty of fluids (ORS, coconut water, fruit juices). Light diet. Avoid cold foods. Do not take antibiotics unless prescribed.',
    followUp: '3 days (if fever persists)',
    labTests: ['CBC', 'Dengue NS1 Ag (if > 3 days)', 'Typhoid (Widal) if fever persists'],
  },
  {
    id: 'common-cold',
    name: 'Common Cold / URTI',
    emoji: '🤧',
    category: 'Infectious',
    icd: 'J00',
    symptoms: 'Running nose, sneezing, sore throat, mild cough, watery eyes',
    diagnosis: 'Acute Upper Respiratory Tract Infection (URTI)',
    medicines: [
      { name: 'Cetirizine', strength: '10mg', frequency: '0-0-1', duration: '5 days', instructions: 'At bedtime' },
      { name: 'Paracetamol', strength: '500mg', frequency: '1-1-1', duration: '3 days', instructions: 'SOS for fever/pain' },
      { name: 'Chlorpheniramine + Pseudoephedrine', strength: '4mg+60mg', frequency: '1-0-1', duration: '5 days', instructions: 'For nasal congestion' },
      { name: 'Vitamin C', strength: '500mg', frequency: '1-0-0', duration: '7 days', instructions: 'After breakfast' },
    ],
    advice: 'Steam inhalation twice daily. Warm saline gargle. Adequate fluids. Rest. Avoid cold drinks and air conditioning.',
    followUp: '5 days (if symptoms worsen)',
    labTests: [],
  },
  {
    id: 'throat-infection',
    name: 'Throat Infection / Tonsillitis',
    emoji: '😮',
    category: 'Infectious',
    icd: 'J03',
    symptoms: 'Severe sore throat, difficulty swallowing, fever, tonsillar enlargement with exudate',
    diagnosis: 'Acute Tonsillitis / Pharyngitis',
    medicines: [
      { name: 'Amoxicillin', strength: '500mg', frequency: '1-1-1', duration: '7 days', instructions: 'Complete the full course' },
      { name: 'Paracetamol', strength: '650mg', frequency: '1-1-1', duration: '5 days', instructions: 'After meals' },
      { name: 'Pantoprazole', strength: '40mg', frequency: '1-0-0', duration: '7 days', instructions: 'Before breakfast' },
      { name: 'Benzydamine Gargle', strength: '0.15%', frequency: '1-1-1', duration: '5 days', instructions: 'Gargle and spit, do not swallow' },
    ],
    advice: 'Warm saline gargle 3-4 times/day. Soft diet. Complete antibiotic course even if feeling better.',
    followUp: '7 days',
    labTests: ['Throat swab culture (if severe)'],
  },
  {
    id: 'acute-gastroenteritis',
    name: 'Gastroenteritis / Diarrhea',
    emoji: '🤢',
    category: 'GI',
    icd: 'A09',
    symptoms: 'Loose watery stools, nausea, vomiting, abdominal cramps, weakness',
    diagnosis: 'Acute Gastroenteritis',
    medicines: [
      { name: 'ORS (Oral Rehydration Salts)', strength: '1 sachet in 1L water', frequency: 'After each loose stool', duration: 'Till diarrhea stops', instructions: 'Drink 200ml after each loose stool' },
      { name: 'Zinc Sulfate', strength: '20mg', frequency: '0-1-0', duration: '14 days', instructions: 'After meals' },
      { name: 'Ondansetron', strength: '4mg', frequency: '1-0-1', duration: '3 days', instructions: 'For nausea/vomiting - SOS' },
      { name: 'Metronidazole', strength: '400mg', frequency: '1-1-1', duration: '5 days', instructions: 'After meals, avoid alcohol' },
    ],
    advice: 'RICE diet (Rice, boiled potatoes, bananas, toast). Avoid dairy, fried foods, spicy food. Maintain hydration. Wash hands frequently.',
    followUp: '3 days (if not improving)',
    labTests: ['Stool routine & culture (if blood in stool)'],
  },
  {
    id: 'typhoid',
    name: 'Typhoid Fever',
    emoji: '🌡️',
    category: 'Infectious',
    icd: 'A01.0',
    symptoms: 'Prolonged fever (> 5 days), stepladder pattern, headache, abdominal pain, constipation or diarrhea, rose spots',
    diagnosis: 'Typhoid Fever (Enteric Fever)',
    medicines: [
      { name: 'Azithromycin', strength: '500mg', frequency: '1-0-0', duration: '7 days', instructions: '1 hour before meals' },
      { name: 'Paracetamol', strength: '650mg', frequency: '1-1-1', duration: '7 days', instructions: 'For fever control' },
      { name: 'Pantoprazole', strength: '40mg', frequency: '1-0-0', duration: '10 days', instructions: 'Before breakfast' },
      { name: 'Lactobacillus', strength: '2 capsules', frequency: '0-0-1', duration: '14 days', instructions: 'After dinner' },
    ],
    advice: 'Strict bed rest. Light semi-solid diet. Plenty of fluids. Hygiene and sanitation. Isolate patient\'s utensils.',
    followUp: '5 days',
    labTests: ['Widal Test', 'Blood Culture (gold standard)', 'CBC', 'LFT'],
  },
  {
    id: 'malaria',
    name: 'Malaria (Uncomplicated)',
    emoji: '🦟',
    category: 'Infectious',
    icd: 'B54',
    symptoms: 'Cyclical fever with chills and rigors, sweating, headache, myalgia, splenomegaly',
    diagnosis: 'Uncomplicated Malaria',
    medicines: [
      { name: 'Artemether + Lumefantrine', strength: '20mg+120mg', frequency: '1-0-1', duration: '3 days', instructions: 'Take with fatty food. 6 doses total' },
      { name: 'Paracetamol', strength: '650mg', frequency: '1-1-1', duration: '3 days', instructions: 'For fever' },
      { name: 'Pantoprazole', strength: '40mg', frequency: '1-0-0', duration: '5 days', instructions: 'Before breakfast' },
    ],
    advice: 'Bed rest. Mosquito net and repellent. Plenty of fluids. Report immediately if confusion, difficulty breathing, or cannot take oral medication.',
    followUp: '3 days (blood smear repeat)',
    labTests: ['Peripheral Blood Smear', 'Malaria Rapid Antigen Test', 'CBC', 'LFT', 'RFT'],
  },
  {
    id: 'dengue',
    name: 'Dengue Fever',
    emoji: '🩸',
    category: 'Infectious',
    icd: 'A97',
    symptoms: 'High fever, severe headache, pain behind eyes, bone/joint pain, skin rash, mild bleeding',
    diagnosis: 'Dengue Fever',
    medicines: [
      { name: 'Paracetamol', strength: '650mg', frequency: '1-1-1', duration: '5 days', instructions: 'ONLY paracetamol - NO Ibuprofen/Aspirin/NSAIDs' },
      { name: 'ORS (Oral Rehydration Salts)', strength: '1 sachet', frequency: 'Frequently', duration: 'Till recovery', instructions: 'Stay well hydrated - target 2-3 litres/day' },
      { name: 'Papaya Leaf Extract', strength: '30ml', frequency: '1-0-1', duration: '5 days', instructions: 'Helps raise platelet count' },
    ],
    advice: '⚠️ AVOID NSAIDs (Aspirin, Ibuprofen, Diclofenac) — can cause bleeding. Rest completely. Monitor platelet count daily. Seek emergency care if platelets < 50,000.',
    followUp: 'Daily CBC monitoring',
    labTests: ['Dengue NS1 Antigen (Day 1-5)', 'Dengue IgM/IgG', 'CBC (daily platelets)', 'LFT'],
  },
  // ── RESPIRATORY ──────────────────────────────────────────────────
  {
    id: 'bronchitis',
    name: 'Acute Bronchitis / Cough',
    emoji: '😮‍💨',
    category: 'Respiratory',
    icd: 'J20',
    symptoms: 'Productive cough with sputum, chest tightness, mild fever, wheezing',
    diagnosis: 'Acute Bronchitis',
    medicines: [
      { name: 'Amoxicillin + Clavulanate', strength: '625mg', frequency: '1-0-1', duration: '7 days', instructions: 'After meals' },
      { name: 'Salbutamol', strength: '4mg', frequency: '1-0-1', duration: '5 days', instructions: 'For wheeze' },
      { name: 'Bromhexine + Guaifenesin', strength: '8mg+100mg', frequency: '1-1-1', duration: '7 days', instructions: 'Mucolytic - helps expectorate' },
      { name: 'Montelukast', strength: '10mg', frequency: '0-0-1', duration: '10 days', instructions: 'At bedtime' },
    ],
    advice: 'Steam inhalation. Avoid dust and cold air. No smoking. Increase fluid intake. Sleep elevated (extra pillow).',
    followUp: '7 days',
    labTests: ['Chest X-Ray (if severe)', 'Sputum AFB (if prolonged)'],
  },
  {
    id: 'asthma-acute',
    name: 'Asthma (Acute Episode)',
    emoji: '💨',
    category: 'Respiratory',
    icd: 'J45',
    symptoms: 'Sudden wheeze, breathlessness, chest tightness, cough worse at night',
    diagnosis: 'Acute Exacerbation of Bronchial Asthma',
    medicines: [
      { name: 'Salbutamol Inhaler', strength: '100mcg/puff', frequency: '2 puffs every 4-6 hours', duration: '7 days', instructions: 'Shake well, use spacer. First-line bronchodilator' },
      { name: 'Budesonide + Formoterol Inhaler', strength: '200+6 mcg', frequency: '1-0-1', duration: '30 days', instructions: 'Maintenance inhaler - rinse mouth after use' },
      { name: 'Montelukast', strength: '10mg', frequency: '0-0-1', duration: '30 days', instructions: 'At bedtime' },
      { name: 'Prednisolone', strength: '20mg', frequency: '1-0-0', duration: '5 days', instructions: 'Short course - taper after 5 days' },
    ],
    advice: 'Identify and avoid triggers (dust, smoke, cold air, pets). Always carry rescue inhaler. Use spacer device. Peak flow monitoring if available.',
    followUp: '2 weeks',
    labTests: ['Spirometry', 'Chest X-Ray', 'IgE levels', 'Allergy skin test'],
  },
  // ── GI CONDITIONS ─────────────────────────────────────────────────
  {
    id: 'gerd-acidity',
    name: 'GERD / Acidity',
    emoji: '🔥',
    category: 'Gastroenterology',
    icd: 'K21',
    symptoms: 'Burning sensation in chest/throat (heartburn), sour belching, regurgitation, worse after meals or lying down',
    diagnosis: 'Gastro-Esophageal Reflux Disease (GERD)',
    medicines: [
      { name: 'Pantoprazole', strength: '40mg', frequency: '1-0-0', duration: '14 days', instructions: '30 min before breakfast on empty stomach' },
      { name: 'Domperidone', strength: '10mg', frequency: '1-1-1', duration: '14 days', instructions: '30 min before meals' },
      { name: 'Sucralfate', strength: '1g', frequency: '1-1-1-1', duration: '14 days', instructions: '1 hour before each meal and at bedtime on empty stomach' },
    ],
    advice: 'Small frequent meals. Elevate head of bed 6-8 inches. Avoid trigger foods (spicy, oily, citrus, chocolate, coffee, alcohol). No lying down for 2-3 hrs after meals. Lose weight if overweight.',
    followUp: '14 days',
    labTests: ['Endoscopy (if symptoms > 4 weeks or alarm symptoms)'],
  },
  // ── CARDIOVASCULAR ───────────────────────────────────────────────
  {
    id: 'hypertension',
    name: 'Hypertension (Stage 1-2)',
    emoji: '❤️',
    category: 'Cardiovascular',
    icd: 'I10',
    symptoms: 'Headache (occipital), dizziness, BP > 140/90 mmHg on 2 readings',
    diagnosis: 'Essential Hypertension',
    medicines: [
      { name: 'Amlodipine', strength: '5mg', frequency: '1-0-0', duration: '30 days', instructions: 'Morning, with or without food. Long-term medication' },
      { name: 'Telmisartan', strength: '40mg', frequency: '1-0-0', duration: '30 days', instructions: 'Morning. Monitor renal function' },
      { name: 'Aspirin', strength: '75mg', frequency: '0-1-0', duration: '30 days', instructions: 'After lunch - only if CVD risk present' },
    ],
    advice: 'DASH diet (low salt < 5g/day, low fat, high fruits/vegetables). Regular walking 30 min daily. No smoking/alcohol. Monitor BP at home twice daily. Stress management.',
    followUp: '2 weeks (BP review)',
    labTests: ['ECG', 'Fundoscopy', 'Urine routine', 'Serum Creatinine', 'Blood Glucose', 'Lipid Profile'],
  },
  {
    id: 'diabetes-t2',
    name: 'Type 2 Diabetes',
    emoji: '🩺',
    category: 'Endocrine',
    icd: 'E11',
    symptoms: 'Excessive thirst, frequent urination, fatigue, blurred vision, slow healing wounds, FBS > 126 mg/dL',
    diagnosis: 'Type 2 Diabetes Mellitus',
    medicines: [
      { name: 'Metformin', strength: '500mg', frequency: '1-0-1', duration: '30 days', instructions: 'After meals. Increase to 1g if tolerated' },
      { name: 'Glimepiride', strength: '1mg', frequency: '1-0-0', duration: '30 days', instructions: 'Before breakfast - monitor for hypoglycemia' },
      { name: 'Aspirin', strength: '75mg', frequency: '0-1-0', duration: '30 days', instructions: 'After lunch' },
      { name: 'Vitamin B12', strength: '500mcg', frequency: '1-0-0', duration: '30 days', instructions: 'After breakfast (Metformin depletes B12)' },
    ],
    advice: 'Diabetic diet (no refined sugar, white rice, maida). Regular 30-45 min walking. Check feet daily. Monitor fasting glucose at home. Carry glucose/candy for hypoglycemia.',
    followUp: '4 weeks (HbA1c after 3 months)',
    labTests: ['FBS', 'PPBS', 'HbA1c', 'Urine microalbumin', 'Lipid Profile', 'Kidney function test', 'Fundoscopy'],
  },
  // ── MUSCULOSKELETAL ───────────────────────────────────────────────
  {
    id: 'backpain',
    name: 'Low Back Pain',
    emoji: '🔙',
    category: 'Musculoskeletal',
    icd: 'M54.5',
    symptoms: 'Lower back pain, stiffness, difficulty bending, radiating to leg (if nerve involvement)',
    diagnosis: 'Mechanical Low Back Pain',
    medicines: [
      { name: 'Aceclofenac + Paracetamol', strength: '100mg+325mg', frequency: '1-0-1', duration: '7 days', instructions: 'After meals' },
      { name: 'Muscle Relaxant (Thiocolchicoside)', strength: '4mg', frequency: '1-0-1', duration: '7 days', instructions: 'May cause drowsiness' },
      { name: 'Pantoprazole', strength: '40mg', frequency: '1-0-0', duration: '7 days', instructions: 'Before breakfast (with NSAIDs)' },
      { name: 'Vitamin D3', strength: '60,000 IU', frequency: 'Once weekly', duration: '8 weeks', instructions: 'With fatty food' },
    ],
    advice: 'Hot fomentation 2-3 times/day. Avoid heavy lifting. Sleep on firm mattress. Physiotherapy exercises after acute phase. Correct sitting posture.',
    followUp: '2 weeks',
    labTests: ['X-Ray Lumbosacral spine (AP & Lateral)', 'MRI Lumbar (if radiculopathy)'],
  },
  // ── SKIN ───────────────────────────────────────────────────────
  {
    id: 'allergic-rhinitis',
    name: 'Allergic Rhinitis',
    emoji: '🌸',
    category: 'ENT / Allergy',
    icd: 'J30',
    symptoms: 'Sneezing, running nose (clear discharge), nasal itching, watery eyes, worse in morning or with dust/pollen',
    diagnosis: 'Allergic Rhinitis',
    medicines: [
      { name: 'Levocetirizine', strength: '5mg', frequency: '0-0-1', duration: '10 days', instructions: 'At bedtime' },
      { name: 'Fluticasone Nasal Spray', strength: '50mcg/spray', frequency: '2 sprays each nostril - 1-0-0', duration: '14 days', instructions: 'Prime before first use. Sniff gently' },
      { name: 'Montelukast', strength: '10mg', frequency: '0-0-1', duration: '14 days', instructions: 'At bedtime' },
    ],
    advice: 'Avoid allergens (dust, pollen, pet dander). Use N95 mask outdoors. Air purifier at home if possible. Saline nasal rinse daily.',
    followUp: '2 weeks',
    labTests: ['IgE total', 'Absolute Eosinophil Count', 'Allergy skin prick test (if persistent)'],
  },
  {
    id: 'uti',
    name: 'UTI (Uncomplicated)',
    emoji: '🚽',
    category: 'Urology',
    icd: 'N39.0',
    symptoms: 'Burning/pain on urination, frequency, urgency, lower abdominal pain, cloudy/foul smelling urine',
    diagnosis: 'Acute Uncomplicated Urinary Tract Infection (UTI)',
    medicines: [
      { name: 'Nitrofurantoin', strength: '100mg', frequency: '1-0-1', duration: '5 days', instructions: 'After meals with plenty of water' },
      { name: 'Phenazopyridine', strength: '200mg', frequency: '1-1-1', duration: '2 days', instructions: 'Relieves burning — urine turns orange (normal)' },
      { name: 'Cranberry Extract', strength: '500mg', frequency: '1-0-0', duration: '30 days', instructions: 'Prevention' },
    ],
    advice: 'Drink 2-3 litres of water daily. Do not hold urine. Void after intercourse. Wipe front to back. Avoid bubble baths.',
    followUp: '1 week (urine culture result)',
    labTests: ['Urine Routine & Microscopy', 'Urine Culture & Sensitivity'],
  },
  {
    id: 'anemia',
    name: 'Iron Deficiency Anemia',
    emoji: '🩸',
    category: 'Hematology',
    icd: 'D50',
    symptoms: 'Fatigue, weakness, pallor, breathlessness on exertion, palpitations, headache, Hb < 11 g/dL',
    diagnosis: 'Iron Deficiency Anemia',
    medicines: [
      { name: 'Ferrous Sulfate', strength: '150mg SR', frequency: '0-0-1', duration: '90 days', instructions: 'Empty stomach or with Vitamin C juice' },
      { name: 'Vitamin C', strength: '500mg', frequency: '0-0-1', duration: '90 days', instructions: 'With iron tablet — enhances absorption' },
      { name: 'Folic Acid', strength: '5mg', frequency: '1-0-0', duration: '90 days', instructions: 'After breakfast' },
    ],
    advice: 'Iron-rich diet: green leafy vegetables, lentils, red meat, jaggery, dates. Avoid tea/coffee with meals (inhibits iron absorption). Recheck CBC after 6-8 weeks.',
    followUp: '6-8 weeks (CBC repeat)',
    labTests: ['CBC with PBF', 'Serum Ferritin', 'Serum Iron', 'TIBC', 'Stool occult blood'],
  },
  {
    id: 'migraine',
    name: 'Migraine',
    emoji: '🤕',
    category: 'Neurology',
    icd: 'G43',
    symptoms: 'Throbbing unilateral headache, nausea/vomiting, photophobia, phonophobia, may have aura',
    diagnosis: 'Migraine (With/Without Aura)',
    medicines: [
      { name: 'Sumatriptan', strength: '50mg', frequency: 'At onset - repeat after 2 hours if needed (max 2 doses/day)', duration: 'SOS', instructions: 'Take at first sign of migraine' },
      { name: 'Paracetamol', strength: '1g', frequency: 'At onset', duration: 'SOS', instructions: 'Alternative to Sumatriptan for mild attacks' },
      { name: 'Ondansetron', strength: '4mg', frequency: '1-0-1', duration: 'During attack', instructions: 'For nausea/vomiting' },
      { name: 'Propranolol', strength: '20mg', frequency: '1-0-1', duration: '30 days', instructions: 'Prophylaxis — if > 4 attacks/month' },
    ],
    advice: 'Maintain headache diary. Identify triggers (stress, sleep changes, menstruation, cheese, alcohol, chocolate). Regular sleep schedule. Avoid bright lights and noise during attack.',
    followUp: '4 weeks',
    labTests: ['MRI Brain (if first migraine or atypical features)'],
  },
  {
    id: 'vitamin-d-deficiency',
    name: 'Vitamin D Deficiency',
    emoji: '☀️',
    category: 'Nutrition',
    icd: 'E55',
    symptoms: 'Bone pain, muscle weakness, fatigue, low mood, frequent infections, Vitamin D level < 20 ng/mL',
    diagnosis: 'Vitamin D Deficiency',
    medicines: [
      { name: 'Vitamin D3', strength: '60,000 IU', frequency: 'Once weekly', duration: '8 weeks', instructions: 'With fatty food (milk, ghee). Then monthly maintenance' },
      { name: 'Calcium Carbonate + Vitamin D3', strength: '500mg+250 IU', frequency: '0-0-1', duration: '90 days', instructions: 'After dinner' },
    ],
    advice: 'Sun exposure 15-20 min daily (10am-2pm). Dietary sources: egg yolk, fatty fish, fortified milk. Recheck level after 3 months.',
    followUp: '3 months (Vitamin D level)',
    labTests: ['Serum 25-OH Vitamin D', 'Serum Calcium', 'Serum Phosphorus', 'Alkaline Phosphatase'],
  },
]

// ─── Category helper ──────────────────────────────────────────────
export const TEMPLATE_CATEGORIES = [...new Set(DIAGNOSIS_TEMPLATES.map(t => t.category))]

export function searchTemplates(query: string): DiagnosisTemplate[] {
  if (!query || query.length < 2) return DIAGNOSIS_TEMPLATES
  const q = query.toLowerCase()
  return DIAGNOSIS_TEMPLATES.filter(t =>
    t.name.toLowerCase().includes(q) ||
    t.diagnosis.toLowerCase().includes(q) ||
    t.category.toLowerCase().includes(q) ||
    t.symptoms.toLowerCase().includes(q)
  )
}
