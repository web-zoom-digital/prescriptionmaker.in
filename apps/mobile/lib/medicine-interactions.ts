export type Severity = 'high' | 'moderate' | 'low'

export interface Interaction {
  drug1: string // generic name or class
  drug2: string // generic name or class
  severity: Severity
  description: string
  recommendation: string
}

export const COMMON_INTERACTIONS: Interaction[] = [
  {
    drug1: 'Azithromycin',
    drug2: 'Antacid',
    severity: 'moderate',
    description: 'Antacids containing aluminum or magnesium can reduce the absorption of Azithromycin.',
    recommendation: 'Administer Azithromycin at least 1 hour before or 2 hours after antacids.'
  },
  {
    drug1: 'Ibuprofen',
    drug2: 'Aspirin',
    severity: 'moderate',
    description: 'Ibuprofen may interfere with the cardioprotective effect of low-dose aspirin.',
    recommendation: 'Administer ibuprofen at least 8 hours before or 30 minutes after taking low-dose aspirin.'
  },
  {
    drug1: 'Sildenafil',
    drug2: 'Nitrate',
    severity: 'high',
    description: 'Concomitant use can cause a severe, life-threatening drop in blood pressure.',
    recommendation: 'CONTRAINDICATED. Do not prescribe together.'
  },
  {
    drug1: 'Metronidazole',
    drug2: 'Alcohol',
    severity: 'high',
    description: 'May cause a disulfiram-like reaction (severe nausea, vomiting, flushing, tachycardia).',
    recommendation: 'Advise patient to strictly avoid alcohol during therapy and for 3 days after the last dose.'
  },
  {
    drug1: 'Ciprofloxacin',
    drug2: 'Calcium',
    severity: 'moderate',
    description: 'Calcium supplements or dairy products can significantly reduce the absorption of Ciprofloxacin.',
    recommendation: 'Take Ciprofloxacin at least 2 hours before or 6 hours after calcium-rich foods/supplements.'
  },
  {
    drug1: 'Warfarin',
    drug2: 'NSAID',
    severity: 'high',
    description: 'NSAIDs increase the risk of GI bleeding and can enhance the anticoagulant effect of Warfarin.',
    recommendation: 'Avoid combination if possible. Monitor INR closely if concomitant use is necessary.'
  },
  {
    drug1: 'Omeprazole',
    drug2: 'Clopidogrel',
    severity: 'moderate',
    description: 'Omeprazole may reduce the antiplatelet effect of Clopidogrel.',
    recommendation: 'Consider an alternative PPI like Pantoprazole or Rabeprazole.'
  },
  {
    drug1: 'Atorvastatin',
    drug2: 'Clarithromycin',
    severity: 'high',
    description: 'Clarithromycin strongly inhibits the metabolism of Atorvastatin, increasing the risk of myopathy and rhabdomyolysis.',
    recommendation: 'Temporarily suspend Atorvastatin or use a different antibiotic.'
  },
  {
    drug1: 'ACE Inhibitor',
    drug2: 'Potassium',
    severity: 'high',
    description: 'Concurrent use increases the risk of severe hyperkalemia.',
    recommendation: 'Monitor serum potassium frequently.'
  },
  {
    drug1: 'Levothyroxine',
    drug2: 'Iron',
    severity: 'moderate',
    description: 'Iron supplements decrease the absorption of Levothyroxine.',
    recommendation: 'Separate doses by at least 4 hours.'
  },
  {
    drug1: 'Amoxicillin',
    drug2: 'Allopurinol',
    severity: 'low',
    description: 'Increased risk of skin rash when taken together.',
    recommendation: 'Monitor for rash; discontinue amoxicillin if rash occurs.'
  },
  {
    drug1: 'Paracetamol',
    drug2: 'Warfarin',
    severity: 'moderate',
    description: 'Prolonged use of high doses of paracetamol may increase the anticoagulant effect of Warfarin.',
    recommendation: 'Limit paracetamol dose; monitor INR if used for more than a few days.'
  }
]

export interface ActiveAlert {
  interaction: Interaction
  foundDrugs: [string, string]
}

export function checkInteractions(medicines: { name: string }[]): ActiveAlert[] {
  const alerts: ActiveAlert[] = []
  if (!medicines || medicines.length < 2) return alerts

  // Extract just the names in lowercase for easier searching
  const medNames = medicines.map(m => m.name.toLowerCase().trim()).filter(Boolean)

  for (const interaction of COMMON_INTERACTIONS) {
    const d1 = interaction.drug1.toLowerCase()
    const d2 = interaction.drug2.toLowerCase()

    // Find if any of the prescribed medicines match or contain the drug names
    const match1 = medNames.find(m => m.includes(d1) || d1.includes(m))
    const match2 = medNames.find(m => m.includes(d2) || d2.includes(m))

    if (match1 && match2 && match1 !== match2) {
      alerts.push({
        interaction,
        foundDrugs: [match1, match2]
      })
    }
  }

  return alerts
}
