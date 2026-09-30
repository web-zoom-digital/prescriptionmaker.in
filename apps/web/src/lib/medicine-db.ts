// Common Indian medicines database with category + typical usage
export type MedicineEntry = {
  name: string
  category: string
  commonStrengths: string[]
  commonFrequency: string
  commonDuration: string
}

export const MEDICINE_DB: MedicineEntry[] = [
  // Analgesics / Antipyretics
  { name: 'Paracetamol', category: 'Analgesic', commonStrengths: ['500mg', '650mg', '1g'], commonFrequency: '1-1-1', commonDuration: '5 days' },
  { name: 'Ibuprofen', category: 'NSAID', commonStrengths: ['200mg', '400mg', '600mg'], commonFrequency: '1-0-1', commonDuration: '5 days' },
  { name: 'Diclofenac', category: 'NSAID', commonStrengths: ['50mg', '75mg', '100mg'], commonFrequency: '0-0-1', commonDuration: '7 days' },
  { name: 'Aspirin', category: 'NSAID', commonStrengths: ['75mg', '150mg', '325mg'], commonFrequency: '0-1-0', commonDuration: '30 days' },
  { name: 'Mefenamic Acid', category: 'NSAID', commonStrengths: ['250mg', '500mg'], commonFrequency: '1-1-1', commonDuration: '5 days' },
  { name: 'Nimesulide', category: 'NSAID', commonStrengths: ['100mg'], commonFrequency: '1-0-1', commonDuration: '5 days' },
  { name: 'Aceclofenac', category: 'NSAID', commonStrengths: ['100mg'], commonFrequency: '1-0-1', commonDuration: '7 days' },
  
  // Antibiotics
  { name: 'Amoxicillin', category: 'Antibiotic', commonStrengths: ['250mg', '500mg'], commonFrequency: '1-1-1', commonDuration: '7 days' },
  { name: 'Azithromycin', category: 'Antibiotic', commonStrengths: ['250mg', '500mg'], commonFrequency: '1-0-0', commonDuration: '5 days' },
  { name: 'Ciprofloxacin', category: 'Antibiotic', commonStrengths: ['250mg', '500mg', '750mg'], commonFrequency: '1-0-1', commonDuration: '7 days' },
  { name: 'Doxycycline', category: 'Antibiotic', commonStrengths: ['100mg'], commonFrequency: '1-0-1', commonDuration: '7 days' },
  { name: 'Metronidazole', category: 'Antibiotic', commonStrengths: ['200mg', '400mg'], commonFrequency: '1-1-1', commonDuration: '7 days' },
  { name: 'Cefixime', category: 'Antibiotic', commonStrengths: ['100mg', '200mg'], commonFrequency: '1-0-1', commonDuration: '7 days' },
  { name: 'Amoxicillin + Clavulanate', category: 'Antibiotic', commonStrengths: ['375mg', '625mg'], commonFrequency: '1-1-1', commonDuration: '7 days' },
  { name: 'Levofloxacin', category: 'Antibiotic', commonStrengths: ['250mg', '500mg', '750mg'], commonFrequency: '0-0-1', commonDuration: '7 days' },
  { name: 'Clarithromycin', category: 'Antibiotic', commonStrengths: ['250mg', '500mg'], commonFrequency: '1-0-1', commonDuration: '7 days' },
  { name: 'Clindamycin', category: 'Antibiotic', commonStrengths: ['150mg', '300mg'], commonFrequency: '1-0-1', commonDuration: '7 days' },
  
  // Antihistamines
  { name: 'Cetirizine', category: 'Antihistamine', commonStrengths: ['10mg'], commonFrequency: '0-0-1', commonDuration: '5 days' },
  { name: 'Levocetrizine', category: 'Antihistamine', commonStrengths: ['5mg'], commonFrequency: '0-0-1', commonDuration: '5 days' },
  { name: 'Fexofenadine', category: 'Antihistamine', commonStrengths: ['120mg', '180mg'], commonFrequency: '0-0-1', commonDuration: '5 days' },
  { name: 'Loratadine', category: 'Antihistamine', commonStrengths: ['10mg'], commonFrequency: '1-0-0', commonDuration: '7 days' },
  { name: 'Chlorpheniramine', category: 'Antihistamine', commonStrengths: ['4mg'], commonFrequency: '1-1-1', commonDuration: '5 days' },
  
  // GI / Antacids
  { name: 'Pantoprazole', category: 'PPI', commonStrengths: ['20mg', '40mg'], commonFrequency: '1-0-0', commonDuration: '14 days' },
  { name: 'Omeprazole', category: 'PPI', commonStrengths: ['20mg', '40mg'], commonFrequency: '1-0-0', commonDuration: '14 days' },
  { name: 'Ranitidine', category: 'H2 Blocker', commonStrengths: ['150mg'], commonFrequency: '1-0-1', commonDuration: '14 days' },
  { name: 'Domperidone', category: 'Antiemetic', commonStrengths: ['10mg'], commonFrequency: '1-1-1', commonDuration: '5 days' },
  { name: 'Ondansetron', category: 'Antiemetic', commonStrengths: ['4mg', '8mg'], commonFrequency: '1-1-1', commonDuration: '3 days' },
  { name: 'Metoclopramide', category: 'Antiemetic', commonStrengths: ['10mg'], commonFrequency: '1-1-1', commonDuration: '5 days' },
  { name: 'Dicyclomine', category: 'Antispasmodic', commonStrengths: ['10mg', '20mg'], commonFrequency: '1-1-1', commonDuration: '5 days' },
  { name: 'Lactulose', category: 'Laxative', commonStrengths: ['10g/15ml'], commonFrequency: '0-0-1', commonDuration: '7 days' },
  
  // Vitamins & Minerals
  { name: 'Vitamin C', category: 'Vitamin', commonStrengths: ['500mg', '1000mg'], commonFrequency: '1-0-0', commonDuration: '30 days' },
  { name: 'Vitamin D3', category: 'Vitamin', commonStrengths: ['60000 IU', '1000 IU'], commonFrequency: '1-0-0 weekly', commonDuration: '12 weeks' },
  { name: 'Vitamin B12', category: 'Vitamin', commonStrengths: ['500mcg', '1500mcg'], commonFrequency: '1-0-0', commonDuration: '30 days' },
  { name: 'Folic Acid', category: 'Vitamin', commonStrengths: ['5mg'], commonFrequency: '1-0-0', commonDuration: '90 days' },
  { name: 'Iron + Folic Acid', category: 'Supplement', commonStrengths: ['100mg+0.5mg'], commonFrequency: '0-0-1', commonDuration: '90 days' },
  { name: 'Calcium + Vitamin D3', category: 'Supplement', commonStrengths: ['500mg+250IU'], commonFrequency: '1-0-1', commonDuration: '90 days' },
  { name: 'Zinc', category: 'Mineral', commonStrengths: ['20mg', '50mg'], commonFrequency: '1-0-0', commonDuration: '14 days' },
  
  // Antidiabetics
  { name: 'Metformin', category: 'Antidiabetic', commonStrengths: ['500mg', '850mg', '1g'], commonFrequency: '1-1-1', commonDuration: '30 days' },
  { name: 'Glimepiride', category: 'Antidiabetic', commonStrengths: ['1mg', '2mg', '4mg'], commonFrequency: '1-0-0', commonDuration: '30 days' },
  { name: 'Sitagliptin', category: 'Antidiabetic', commonStrengths: ['50mg', '100mg'], commonFrequency: '1-0-0', commonDuration: '30 days' },
  
  // Antihypertensives
  { name: 'Amlodipine', category: 'Antihypertensive', commonStrengths: ['2.5mg', '5mg', '10mg'], commonFrequency: '1-0-0', commonDuration: '30 days' },
  { name: 'Telmisartan', category: 'Antihypertensive', commonStrengths: ['20mg', '40mg', '80mg'], commonFrequency: '1-0-0', commonDuration: '30 days' },
  { name: 'Atenolol', category: 'Beta Blocker', commonStrengths: ['25mg', '50mg'], commonFrequency: '1-0-0', commonDuration: '30 days' },
  { name: 'Enalapril', category: 'ACE Inhibitor', commonStrengths: ['5mg', '10mg'], commonFrequency: '1-0-0', commonDuration: '30 days' },
  
  // Respiratory
  { name: 'Salbutamol', category: 'Bronchodilator', commonStrengths: ['2mg', '4mg'], commonFrequency: '1-1-1', commonDuration: '7 days' },
  { name: 'Montelukast', category: 'Leukotriene', commonStrengths: ['4mg', '5mg', '10mg'], commonFrequency: '0-0-1', commonDuration: '30 days' },
  { name: 'Prednisolone', category: 'Corticosteroid', commonStrengths: ['5mg', '10mg', '20mg'], commonFrequency: '1-0-0', commonDuration: '7 days' },
  { name: 'Dextromethorphan', category: 'Cough suppressant', commonStrengths: ['10mg/5ml'], commonFrequency: '1-1-1', commonDuration: '5 days' },
  { name: 'Ambroxol', category: 'Expectorant', commonStrengths: ['30mg'], commonFrequency: '1-1-1', commonDuration: '7 days' },
  
  // Thyroid
  { name: 'Levothyroxine', category: 'Thyroid', commonStrengths: ['25mcg', '50mcg', '75mcg', '100mcg'], commonFrequency: '1-0-0', commonDuration: '30 days' },
  
  // Cholesterol
  { name: 'Atorvastatin', category: 'Statin', commonStrengths: ['10mg', '20mg', '40mg', '80mg'], commonFrequency: '0-0-1', commonDuration: '30 days' },
  { name: 'Rosuvastatin', category: 'Statin', commonStrengths: ['5mg', '10mg', '20mg'], commonFrequency: '0-0-1', commonDuration: '30 days' },
  
  // Antifungals
  { name: 'Fluconazole', category: 'Antifungal', commonStrengths: ['50mg', '150mg'], commonFrequency: '1-0-0 weekly', commonDuration: '2 weeks' },
  { name: 'Clotrimazole', category: 'Antifungal', commonStrengths: ['1% cream'], commonFrequency: 'Apply twice daily', commonDuration: '14 days' },
]

export function searchMedicines(query: string): MedicineEntry[] {
  if (!query || query.length < 2) return []
  const q = query.toLowerCase()
  return MEDICINE_DB
    .filter(m => m.name.toLowerCase().includes(q) || m.category.toLowerCase().includes(q))
    .slice(0, 8)
}
