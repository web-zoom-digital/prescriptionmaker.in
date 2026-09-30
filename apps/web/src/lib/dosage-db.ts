// ─── Dosage Database for Smart Calculator ───────────────────────────
// Sources: standard Indian pediatric/adult dosing guidelines
// All doses in mg/kg/day (pediatric) or flat dose (adult)

export type DosageRoute = 'Oral' | 'IV' | 'IM' | 'Topical' | 'Inhaled'

export type DosageEntry = {
  name: string
  category: string
  // Pediatric: mg per kg per day
  pediatricDose: { mgPerKg: number; maxDoseMg: number; frequency: string } | null
  // Adult flat dose
  adultDose: { dose: string; frequency: string } | null
  // Available strengths in India
  strengths: string[]
  route: DosageRoute
  ageLimit: string        // e.g. "Not for <3 months"
  warnings: string[]
  instructions: string    // "After meals", "Empty stomach" etc.
}

export const DOSAGE_DB: DosageEntry[] = [
  // ── ANALGESICS / ANTIPYRETICS ──────────────────────────────────
  {
    name: 'Paracetamol',
    category: 'Analgesic / Antipyretic',
    pediatricDose: { mgPerKg: 15, maxDoseMg: 1000, frequency: 'Every 4-6 hours (max 4 doses/day)' },
    adultDose: { dose: '500mg – 1g', frequency: 'Every 4-6 hours (max 4g/day)' },
    strengths: ['125mg/5ml syrup', '250mg/5ml syrup', '500mg', '650mg', '1g'],
    route: 'Oral',
    ageLimit: 'Safe from birth',
    warnings: ['Do not exceed 4g/day in adults', 'Avoid in liver disease'],
    instructions: 'Can be taken with or without food',
  },
  {
    name: 'Ibuprofen',
    category: 'NSAID',
    pediatricDose: { mgPerKg: 10, maxDoseMg: 400, frequency: 'Every 6-8 hours' },
    adultDose: { dose: '400mg', frequency: 'Every 6-8 hours after meals' },
    strengths: ['100mg/5ml syrup', '200mg', '400mg', '600mg'],
    route: 'Oral',
    ageLimit: 'Not for < 3 months',
    warnings: ['Avoid in asthma', 'Avoid on empty stomach', 'Avoid if kidney disease'],
    instructions: 'Always take after meals',
  },
  {
    name: 'Nimesulide',
    category: 'NSAID',
    pediatricDose: { mgPerKg: 5, maxDoseMg: 100, frequency: 'Twice daily (max 2 doses/day)' },
    adultDose: { dose: '100mg', frequency: 'Twice daily after meals' },
    strengths: ['50mg/5ml suspension', '100mg'],
    route: 'Oral',
    ageLimit: 'Not for < 2 years',
    warnings: ['Not for more than 15 days', 'Hepatotoxic — avoid in liver disease', 'Banned in some countries for children'],
    instructions: 'Take after meals',
  },
  {
    name: 'Diclofenac',
    category: 'NSAID',
    pediatricDose: { mgPerKg: 1, maxDoseMg: 50, frequency: 'Twice to three times daily' },
    adultDose: { dose: '50mg', frequency: '2-3 times daily after meals' },
    strengths: ['50mg', '75mg', '100mg SR'],
    route: 'Oral',
    ageLimit: 'Not recommended < 6 years',
    warnings: ['Avoid in heart disease', 'Avoid in renal impairment'],
    instructions: 'Take after meals',
  },

  // ── ANTIBIOTICS ────────────────────────────────────────────────
  {
    name: 'Amoxicillin',
    category: 'Antibiotic (Penicillin)',
    pediatricDose: { mgPerKg: 40, maxDoseMg: 500, frequency: 'Three times daily for 7 days' },
    adultDose: { dose: '500mg', frequency: 'Three times daily for 7 days' },
    strengths: ['125mg/5ml syrup', '250mg/5ml syrup', '250mg', '500mg'],
    route: 'Oral',
    ageLimit: 'Safe from birth',
    warnings: ['Check for Penicillin allergy before prescribing', 'Complete the full course'],
    instructions: 'Can be taken with or without food',
  },
  {
    name: 'Azithromycin',
    category: 'Antibiotic (Macrolide)',
    pediatricDose: { mgPerKg: 10, maxDoseMg: 500, frequency: 'Once daily for 3-5 days' },
    adultDose: { dose: '500mg', frequency: 'Once daily for 3-5 days' },
    strengths: ['100mg/5ml syrup', '200mg/5ml syrup', '250mg', '500mg'],
    route: 'Oral',
    ageLimit: 'Not for < 6 months',
    warnings: ['Can prolong QT interval — avoid in cardiac patients', 'May interact with antacids'],
    instructions: 'Take 1 hour before or 2 hours after meals',
  },
  {
    name: 'Cefixime',
    category: 'Antibiotic (Cephalosporin)',
    pediatricDose: { mgPerKg: 8, maxDoseMg: 200, frequency: 'Twice daily for 7-10 days' },
    adultDose: { dose: '200mg', frequency: 'Twice daily for 7-10 days' },
    strengths: ['50mg/5ml syrup', '100mg/5ml syrup', '100mg', '200mg'],
    route: 'Oral',
    ageLimit: 'Not for < 6 months',
    warnings: ['Check cephalosporin allergy', 'Complete full course'],
    instructions: 'Can be taken with or without food',
  },
  {
    name: 'Amoxicillin + Clavulanate',
    category: 'Antibiotic (Beta-lactam)',
    pediatricDose: { mgPerKg: 45, maxDoseMg: 625, frequency: 'Twice daily for 7 days' },
    adultDose: { dose: '625mg', frequency: 'Twice daily for 7 days' },
    strengths: ['228.5mg/5ml', '312.5mg/5ml', '375mg', '625mg'],
    route: 'Oral',
    ageLimit: 'Not for < 3 months',
    warnings: ['Hepatotoxic in rare cases', 'Check Penicillin allergy'],
    instructions: 'Take at the start of a meal to reduce GI side effects',
  },
  {
    name: 'Ciprofloxacin',
    category: 'Antibiotic (Fluoroquinolone)',
    pediatricDose: { mgPerKg: 15, maxDoseMg: 500, frequency: 'Twice daily for 7 days' },
    adultDose: { dose: '500mg', frequency: 'Twice daily for 7-14 days' },
    strengths: ['250mg', '500mg', '750mg'],
    route: 'Oral',
    ageLimit: 'Avoid in < 18 years unless no alternative (affects cartilage)',
    warnings: ['Avoid in children < 18 years', 'Avoid with antacids/iron/zinc', 'Risk of tendinopathy'],
    instructions: 'Take 2 hours apart from antacids',
  },
  {
    name: 'Metronidazole',
    category: 'Antibiotic / Antiparasitic',
    pediatricDose: { mgPerKg: 30, maxDoseMg: 400, frequency: 'Three times daily for 5-7 days' },
    adultDose: { dose: '400mg', frequency: 'Three times daily for 5-7 days' },
    strengths: ['100mg/5ml syrup', '200mg', '400mg'],
    route: 'Oral',
    ageLimit: 'Safe from birth',
    warnings: ['Avoid alcohol completely during treatment', 'Metallic taste is common side effect'],
    instructions: 'Take after meals to reduce nausea',
  },

  // ── ANTIHISTAMINES ──────────────────────────────────────────────
  {
    name: 'Cetirizine',
    category: 'Antihistamine',
    pediatricDose: { mgPerKg: 0.25, maxDoseMg: 10, frequency: 'Once daily at night' },
    adultDose: { dose: '10mg', frequency: 'Once daily at night' },
    strengths: ['5mg/5ml syrup', '5mg', '10mg'],
    route: 'Oral',
    ageLimit: 'Not for < 6 months',
    warnings: ['May cause drowsiness', 'Avoid driving after taking'],
    instructions: 'Take at night before sleep',
  },
  {
    name: 'Levocetirizine',
    category: 'Antihistamine',
    pediatricDose: { mgPerKg: 0.125, maxDoseMg: 5, frequency: 'Once daily at night' },
    adultDose: { dose: '5mg', frequency: 'Once daily at night' },
    strengths: ['2.5mg/5ml syrup', '2.5mg', '5mg'],
    route: 'Oral',
    ageLimit: 'Not for < 6 months',
    warnings: ['May cause drowsiness'],
    instructions: 'Take at night before sleep',
  },

  // ── GI MEDICATIONS ─────────────────────────────────────────────
  {
    name: 'Pantoprazole',
    category: 'Proton Pump Inhibitor',
    pediatricDose: { mgPerKg: 1, maxDoseMg: 40, frequency: 'Once daily on empty stomach' },
    adultDose: { dose: '40mg', frequency: 'Once daily 30 min before breakfast' },
    strengths: ['20mg', '40mg'],
    route: 'Oral',
    ageLimit: 'Not for < 5 years',
    warnings: ['Long-term use may cause B12 deficiency', 'Avoid abrupt discontinuation'],
    instructions: 'Take 30 minutes before breakfast',
  },
  {
    name: 'Ondansetron',
    category: 'Antiemetic',
    pediatricDose: { mgPerKg: 0.15, maxDoseMg: 8, frequency: 'Every 8 hours' },
    adultDose: { dose: '4mg', frequency: 'Every 8 hours' },
    strengths: ['2mg/5ml syrup', '4mg', '8mg'],
    route: 'Oral',
    ageLimit: 'Not for < 1 month',
    warnings: ['May prolong QT interval', 'Headache is common side effect'],
    instructions: 'Can be taken with or without food',
  },
  {
    name: 'ORS (Oral Rehydration Salts)',
    category: 'Rehydration',
    pediatricDose: { mgPerKg: 0, maxDoseMg: 0, frequency: '5-10 ml/kg after each loose stool' },
    adultDose: { dose: '200-400ml', frequency: 'After each loose stool' },
    strengths: ['WHO-ORS sachet (1L)'],
    route: 'Oral',
    ageLimit: 'Safe from birth',
    warnings: [],
    instructions: 'Mix 1 sachet in 1 litre of clean water',
  },

  // ── RESPIRATORY ─────────────────────────────────────────────────
  {
    name: 'Salbutamol (Albuterol)',
    category: 'Bronchodilator',
    pediatricDose: { mgPerKg: 0.1, maxDoseMg: 2.5, frequency: 'Every 4-6 hours as needed' },
    adultDose: { dose: '2mg', frequency: '3 times daily; or 2 puffs inhaler as needed' },
    strengths: ['2mg/5ml syrup', '2mg', '4mg', 'Inhaler 100mcg/dose'],
    route: 'Oral',
    ageLimit: 'Safe from 2 years',
    warnings: ['May cause tremors and tachycardia', 'Overuse can worsen asthma'],
    instructions: 'Shake inhaler well before use',
  },
  {
    name: 'Montelukast',
    category: 'Leukotriene Antagonist',
    pediatricDose: { mgPerKg: 0, maxDoseMg: 5, frequency: 'Once daily at night' },
    adultDose: { dose: '10mg', frequency: 'Once daily at night' },
    strengths: ['4mg (chewable)', '5mg (chewable)', '10mg'],
    route: 'Oral',
    ageLimit: 'Not for < 6 months',
    warnings: ['Rare: mood/behavioral changes', 'FDA warning for neuropsychiatric events'],
    instructions: 'Take at night',
  },

  // ── VITAMINS & SUPPLEMENTS ──────────────────────────────────────
  {
    name: 'Zinc Sulfate',
    category: 'Mineral Supplement',
    pediatricDose: { mgPerKg: 0, maxDoseMg: 20, frequency: 'Once daily for 14 days (in diarrhea)' },
    adultDose: { dose: '50mg', frequency: 'Once daily' },
    strengths: ['10mg/5ml syrup', '20mg dispersible', '50mg'],
    route: 'Oral',
    ageLimit: 'Not for < 2 months',
    warnings: ['High doses cause nausea', 'Avoid with iron supplements at same time'],
    instructions: 'Take with food if causes nausea',
  },
  {
    name: 'Vitamin D3',
    category: 'Vitamin Supplement',
    pediatricDose: { mgPerKg: 0, maxDoseMg: 0, frequency: '400 IU/day (infant); 600 IU/day (child)' },
    adultDose: { dose: '60,000 IU', frequency: 'Once weekly for 8 weeks (loading); then monthly' },
    strengths: ['400 IU drops', '1000 IU', '60,000 IU sachet/capsule'],
    route: 'Oral',
    ageLimit: 'Safe from birth',
    warnings: ['Toxicity possible with excessive use', 'Check serum levels before loading dose'],
    instructions: 'Take with fatty food for better absorption',
  },
  {
    name: 'Iron (Ferrous Sulfate)',
    category: 'Mineral Supplement',
    pediatricDose: { mgPerKg: 3, maxDoseMg: 60, frequency: 'Once daily on empty stomach' },
    adultDose: { dose: '100mg elemental iron', frequency: 'Once daily' },
    strengths: ['25mg/ml drops', '100mg/5ml syrup', '60mg', '100mg', '150mg SR'],
    route: 'Oral',
    ageLimit: 'Safe from 4 months',
    warnings: ['Causes black stools (normal)', 'Avoid with tea/milk/calcium', 'Overdose is dangerous in children'],
    instructions: 'Take on empty stomach with Vitamin C for better absorption',
  },
]

// ─── Utility: Calculate pediatric dose ──────────────────────────────
export function calculatePediatricDose(
  medicine: DosageEntry,
  weightKg: number
): { calculatedMg: number; recommendedStrength: string; frequency: string; warning: string } | null {
  if (!medicine.pediatricDose || medicine.pediatricDose.mgPerKg === 0) return null

  const raw = medicine.pediatricDose.mgPerKg * weightKg
  const capped = Math.min(raw, medicine.pediatricDose.maxDoseMg)
  const rounded = Math.round(capped / 2.5) * 2.5 // round to nearest 2.5mg

  // Find nearest available strength
  const strengthNums = medicine.strengths
    .map(s => parseFloat(s))
    .filter(n => !isNaN(n) && n > 0)
    .sort((a, b) => a - b)

  let bestStrength = medicine.strengths[0]
  if (strengthNums.length > 0) {
    const nearest = strengthNums.reduce((prev, curr) =>
      Math.abs(curr - rounded) < Math.abs(prev - rounded) ? curr : prev
    )
    bestStrength = medicine.strengths.find(s => s.startsWith(String(nearest))) ?? medicine.strengths[0]
  }

  const cappedNote = raw > medicine.pediatricDose.maxDoseMg
    ? ` (capped at max ${medicine.pediatricDose.maxDoseMg}mg)`
    : ''

  return {
    calculatedMg: rounded,
    recommendedStrength: bestStrength,
    frequency: medicine.pediatricDose.frequency,
    warning: cappedNote ? `Calculated ${Math.round(raw)}mg → capped to ${medicine.pediatricDose.maxDoseMg}mg (adult max)` : '',
  }
}
