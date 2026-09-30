'use client'
import { useState, useMemo } from 'react'
import { Scale, Search, ChevronRight, AlertTriangle, Info, X } from 'lucide-react'
import Link from 'next/link'
import { DOSAGE_DB, calculatePediatricDose, type DosageEntry } from '@/lib/dosage-db'

export default function DosageCalculatorPage() {
  const [patientType, setPatientType] = useState<'pediatric' | 'adult'>('pediatric')
  const [weight, setWeight] = useState('')
  const [search, setSearch] = useState('')
  const [selectedMed, setSelectedMed] = useState<DosageEntry | null>(null)
  const [showSuggestions, setShowSuggestions] = useState(false)

  const weightKg = parseFloat(weight) || 0

  const filtered = useMemo(() => {
    if (!search || search.length < 1) return []
    const q = search.toLowerCase()
    return DOSAGE_DB.filter(m =>
      m.name.toLowerCase().includes(q) || m.category.toLowerCase().includes(q)
    ).slice(0, 8)
  }, [search])

  const pediatricResult = selectedMed && patientType === 'pediatric' && weightKg > 0
    ? calculatePediatricDose(selectedMed, weightKg)
    : null

  const showResult = selectedMed && (patientType === 'adult' || weightKg > 0)

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-slate-900 transition-colors">Dashboard</Link>
          <span className="text-muted-foreground">/</span>
          <span className="text-sm font-medium text-slate-900">Dosage Calculator</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">⚖️ Smart Dosage Calculator</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pediatric &amp; adult drug reference — {DOSAGE_DB.length} medicines with clinical dosing data
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left panel — inputs */}
        <div className="lg:col-span-2 space-y-5">
          {/* Patient type */}
          <div className="rounded-xl border border-border bg-white p-5 shadow-soft">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3">Patient Type</p>
            <div className="flex gap-3">
              <button
                onClick={() => setPatientType('pediatric')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-all ${
                  patientType === 'pediatric'
                    ? 'bg-primary text-white shadow-teal'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                👶 Pediatric
              </button>
              <button
                onClick={() => setPatientType('adult')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-all ${
                  patientType === 'adult'
                    ? 'bg-primary text-white shadow-teal'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                🧑 Adult
              </button>
            </div>
          </div>

          {/* Weight (pediatric) */}
          {patientType === 'pediatric' && (
            <div className="rounded-xl border border-border bg-white p-5 shadow-soft">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3">Patient Weight</p>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  placeholder="e.g. 12"
                  value={weight}
                  onChange={e => setWeight(e.target.value)}
                  className="flex-1 text-3xl font-black text-slate-900 border-b-2 border-primary bg-transparent outline-none pb-2 placeholder:text-slate-300"
                />
                <span className="text-lg font-bold text-muted-foreground">kg</span>
              </div>
              {weightKg > 0 && (
                <p className="mt-2 text-sm font-semibold text-primary">
                  {weightKg < 3 ? '🍼 Neonate' :
                    weightKg < 10 ? '👶 Infant' :
                    weightKg < 20 ? '🧒 Young child' :
                    weightKg < 40 ? '🧑 Older child' : '🧑‍⚕️ Adolescent range'}
                </p>
              )}
            </div>
          )}

          {/* Medicine search */}
          <div className="rounded-xl border border-border bg-white p-5 shadow-soft">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3">Search Medicine</p>
            <div className="relative">
              <div className="flex items-center gap-2 rounded-lg border border-border bg-slate-50 px-3">
                <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Type medicine name..."
                  value={search}
                  onChange={e => { setSearch(e.target.value); setShowSuggestions(true); if (!e.target.value) setSelectedMed(null) }}
                  onFocus={() => setShowSuggestions(true)}
                  className="flex-1 bg-transparent py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                />
                {search && (
                  <button onClick={() => { setSearch(''); setSelectedMed(null) }}>
                    <X className="h-4 w-4 text-muted-foreground hover:text-slate-700" />
                  </button>
                )}
              </div>

              {showSuggestions && filtered.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 z-20 overflow-hidden rounded-lg border border-border bg-white shadow-lg">
                  {filtered.map(med => (
                    <button
                      key={med.name}
                      onMouseDown={() => { setSelectedMed(med); setSearch(med.name); setShowSuggestions(false) }}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-teal-50 text-primary text-xs">💊</div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-900 truncate">{med.name}</div>
                        <div className="text-xs text-muted-foreground">{med.category}</div>
                      </div>
                      <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground/40 flex-shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quick picks */}
            {!selectedMed && (
              <div className="mt-4">
                <p className="text-xs text-muted-foreground mb-2">Common medicines:</p>
                <div className="flex flex-wrap gap-2">
                  {['Paracetamol', 'Amoxicillin', 'Cetirizine', 'Azithromycin', 'Ibuprofen', 'Ondansetron', 'Cefixime'].map(name => {
                    const med = DOSAGE_DB.find(m => m.name === name)
                    if (!med) return null
                    return (
                      <button
                        key={name}
                        onClick={() => { setSelectedMed(med); setSearch(name); setShowSuggestions(false) }}
                        className="rounded-full border border-border bg-white px-3 py-1 text-xs font-semibold text-primary hover:border-primary/30 hover:bg-teal-50 transition-colors"
                      >
                        {name.split(' ')[0]}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right panel — results */}
        <div className="lg:col-span-3">
          {!selectedMed && (
            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-white py-20 text-center">
              <Scale className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <h3 className="text-sm font-semibold text-slate-900">Select a Medicine</h3>
              <p className="mt-1 text-sm text-muted-foreground">Search for a medicine to see dosage information</p>
            </div>
          )}

          {selectedMed && patientType === 'pediatric' && !weightKg && (
            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-primary/20 bg-teal-50/50 py-16 text-center">
              <Scale className="h-10 w-10 text-primary/40 mb-3" />
              <p className="text-sm font-semibold text-primary">Enter patient weight to calculate pediatric dose</p>
            </div>
          )}

          {showResult && selectedMed && (
            <div className="rounded-xl border border-border bg-white shadow-soft overflow-hidden">
              {/* Medicine header */}
              <div className="flex items-center gap-4 border-b border-border px-6 py-4 bg-gradient-to-r from-teal-600 to-teal-700">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 text-2xl">💊</div>
                <div>
                  <h2 className="text-lg font-bold text-white">{selectedMed.name}</h2>
                  <p className="text-sm text-teal-100">{selectedMed.category} · {selectedMed.route}</p>
                </div>
              </div>

              {/* Dose result */}
              <div className="p-6 space-y-4">
                <div className="rounded-xl bg-teal-50 border border-teal-100 p-5">
                  {patientType === 'pediatric' && pediatricResult ? (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-teal-700">Calculated Dose</span>
                        <span className="text-2xl font-black text-teal-700">{pediatricResult.calculatedMg} mg</span>
                      </div>
                      <div className="text-xs text-teal-600">
                        {selectedMed.pediatricDose?.mgPerKg} mg/kg × {weightKg} kg = {Math.round(selectedMed.pediatricDose!.mgPerKg * weightKg)} mg
                        {pediatricResult.calculatedMg !== Math.round(selectedMed.pediatricDose!.mgPerKg * weightKg) && ` → rounded to ${pediatricResult.calculatedMg} mg`}
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-teal-200">
                        <span className="text-sm font-semibold text-teal-700">Nearest Strength</span>
                        <span className="font-bold text-blue-700">{pediatricResult.recommendedStrength}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-teal-700">Frequency</span>
                        <span className="text-sm text-slate-700">{pediatricResult.frequency}</span>
                      </div>
                      {pediatricResult.warning && (
                        <div className="flex gap-2 items-start rounded-lg bg-amber-50 border border-amber-200 p-3">
                          <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-amber-700">{pediatricResult.warning}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-teal-700">Adult Dose</span>
                        <span className="text-xl font-black text-teal-700">{selectedMed.adultDose?.dose}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-teal-700">Frequency</span>
                        <span className="text-sm text-slate-700">{selectedMed.adultDose?.frequency}</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-teal-200">
                        <span className="text-sm font-semibold text-teal-700">Available As</span>
                        <span className="text-sm text-slate-700">{selectedMed.strengths.slice(0, 3).join(', ')}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Instructions */}
                <div className="flex gap-3 rounded-lg bg-blue-50 border border-blue-100 p-4">
                  <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-700 font-medium">{selectedMed.instructions}</p>
                </div>

                {/* Age limit */}
                {selectedMed.ageLimit && (
                  <div className="text-xs text-muted-foreground">
                    📅 Age Limit: {selectedMed.ageLimit}
                  </div>
                )}

                {/* Warnings */}
                {selectedMed.warnings.length > 0 && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <p className="text-xs font-bold text-amber-800 mb-2 flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5" /> Warnings
                    </p>
                    <ul className="space-y-1">
                      {selectedMed.warnings.map((w, i) => (
                        <li key={i} className="text-xs text-amber-700">• {w}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* All strengths */}
                <div>
                  <p className="text-xs font-bold text-muted-foreground mb-2">AVAILABLE STRENGTHS IN INDIA</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedMed.strengths.map(s => (
                      <span key={s} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{s}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <div className="mt-4 flex gap-2 rounded-lg bg-slate-50 border border-border p-3">
            <Info className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              For reference only. Always verify doses clinically and adjust for renal/hepatic function, comorbidities, and individual patient factors.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
