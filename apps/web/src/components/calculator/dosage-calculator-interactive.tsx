'use client'

import { useState, useMemo } from 'react'
import { Scale, Search, ChevronRight, AlertTriangle, Info, X, ArrowRight, Pill } from 'lucide-react'
import Link from 'next/link'
import { DOSAGE_DB, calculatePediatricDose, type DosageEntry } from '@/lib/dosage-db'

export function DosageCalculatorInteractive() {
  const [patientType, setPatientType] = useState<'pediatric' | 'adult'>('pediatric')
  const [weight, setWeight] = useState('12')
  const [search, setSearch] = useState('Paracetamol')
  const [selectedMed, setSelectedMed] = useState<DosageEntry | null>(
    () => DOSAGE_DB.find((m) => m.name === 'Paracetamol') ?? DOSAGE_DB[0]
  )
  const [showSuggestions, setShowSuggestions] = useState(false)

  const weightKg = parseFloat(weight) || 0

  const filtered = useMemo(() => {
    if (!search || search.length < 1) return []
    const q = search.toLowerCase()
    return DOSAGE_DB.filter(
      (m) => m.name.toLowerCase().includes(q) || m.category.toLowerCase().includes(q)
    ).slice(0, 8)
  }, [search])

  const pediatricResult =
    selectedMed && patientType === 'pediatric' && weightKg > 0
      ? calculatePediatricDose(selectedMed, weightKg)
      : null

  const showResult = selectedMed && (patientType === 'adult' || weightKg > 0)

  return (
    <div className="rounded-2xl border border-border bg-white shadow-soft-lg overflow-hidden p-6 sm:p-8">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left Inputs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Patient Type Toggle */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
              Patient Category
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setPatientType('pediatric')}
                className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                  patientType === 'pediatric'
                    ? 'bg-primary text-white shadow-teal'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                👶 Pediatric (Child)
              </button>
              <button
                type="button"
                onClick={() => setPatientType('adult')}
                className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                  patientType === 'adult'
                    ? 'bg-primary text-white shadow-teal'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                🧑 Adult
              </button>
            </div>
          </div>

          {/* Child Weight */}
          {patientType === 'pediatric' && (
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                Child Weight (kg)
              </label>
              <div className="flex items-center gap-3 rounded-xl border-2 border-primary/30 bg-teal-50/30 px-4 py-2">
                <input
                  type="number"
                  placeholder="e.g. 12"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="flex-1 text-2xl font-black text-slate-900 bg-transparent outline-none"
                  min="1"
                  max="100"
                />
                <span className="text-base font-bold text-slate-500">kg</span>
              </div>
              <div className="mt-2 text-xs font-semibold text-teal-700">
                {weightKg < 3
                  ? '🍼 Neonate (< 3 kg)'
                  : weightKg < 10
                  ? '👶 Infant (3 - 10 kg)'
                  : weightKg < 20
                  ? '🧒 Toddler / Young Child (10 - 20 kg)'
                  : weightKg < 40
                  ? '🧑 Older Child (20 - 40 kg)'
                  : '🧑‍⚕️ Adolescent / Adult Range (> 40 kg)'}
              </div>
            </div>
          )}

          {/* Search Medicine */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
              Search Clinical Molecule
            </label>
            <div className="relative">
              <div className="flex items-center gap-2 rounded-xl border border-border bg-slate-50 px-3.5 py-2.5">
                <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <input
                  type="text"
                  placeholder="e.g. Paracetamol, Amoxicillin, Cefixime..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setShowSuggestions(true)
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  className="flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch('')
                      setSelectedMed(null)
                    }}
                  >
                    <X className="h-4 w-4 text-muted-foreground hover:text-slate-700" />
                  </button>
                )}
              </div>

              {showSuggestions && filtered.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1.5 z-20 overflow-hidden rounded-xl border border-border bg-white shadow-xl max-h-64 overflow-y-auto">
                  {filtered.map((med) => (
                    <button
                      type="button"
                      key={med.name}
                      onMouseDown={() => {
                        setSelectedMed(med)
                        setSearch(med.name)
                        setShowSuggestions(false)
                      }}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-none"
                    >
                      <Pill className="h-4 w-4 text-teal-600 flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-900 truncate">{med.name}</div>
                        <div className="text-xs text-muted-foreground">{med.category}</div>
                      </div>
                      <ChevronRight className="ml-auto h-4 w-4 text-slate-400" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Suggestions */}
            <div className="mt-3">
              <span className="text-[11px] font-semibold text-muted-foreground block mb-1.5">
                Popular OPD Choices:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {['Paracetamol', 'Amoxicillin', 'Cetirizine', 'Azithromycin', 'Ibuprofen', 'Cefixime'].map(
                  (name) => {
                    const med = DOSAGE_DB.find((m) => m.name === name)
                    if (!med) return null
                    return (
                      <button
                        type="button"
                        key={name}
                        onClick={() => {
                          setSelectedMed(med)
                          setSearch(name)
                          setShowSuggestions(false)
                        }}
                        className="rounded-full border border-border bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:border-primary/40 hover:bg-teal-50 hover:text-primary transition-all"
                      >
                        {name}
                      </button>
                    )
                  }
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Dosage Results */}
        <div className="lg:col-span-3">
          {showResult && selectedMed ? (
            <div className="rounded-xl border border-border bg-white shadow-soft overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-teal-700 px-6 py-4 bg-gradient-to-r from-teal-700 to-slate-900 text-white">
                <div>
                  <h3 className="text-xl font-bold">{selectedMed.name}</h3>
                  <p className="text-xs text-teal-200">
                    Category: {selectedMed.category} • Route: {selectedMed.route}
                  </p>
                </div>
                <div className="text-xs font-semibold bg-white/10 border border-white/20 rounded-full px-3 py-1">
                  {patientType === 'pediatric' ? `Child (${weightKg} kg)` : 'Adult Dosing'}
                </div>
              </div>

              {/* Calculation Box */}
              <div className="p-6 space-y-5">
                <div className="rounded-xl bg-teal-50 border border-teal-100 p-5">
                  {patientType === 'pediatric' && pediatricResult ? (
                    <div className="space-y-3">
                      <div className="flex justify-between items-baseline">
                        <span className="text-xs font-bold uppercase tracking-wider text-teal-800">
                          Recommended Dose
                        </span>
                        <span className="text-2xl font-black text-teal-900">
                          {pediatricResult.calculatedMg} mg
                        </span>
                      </div>
                      <div className="text-xs text-teal-700 font-mono">
                        Formula: {selectedMed.pediatricDose?.mgPerKg} mg/kg × {weightKg} kg ={' '}
                        {Math.round(selectedMed.pediatricDose!.mgPerKg * weightKg)} mg/dose
                      </div>
                      <div className="pt-2 border-t border-teal-200/80 flex justify-between text-xs">
                        <span className="font-semibold text-slate-700">Recommended Indian Strength:</span>
                        <span className="font-bold text-teal-800">{pediatricResult.recommendedStrength}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-slate-700">Administration Frequency:</span>
                        <span className="font-semibold text-slate-900">{pediatricResult.frequency}</span>
                      </div>
                      {pediatricResult.warning && (
                        <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 p-3 mt-2 text-xs text-amber-800">
                          <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                          <span>{pediatricResult.warning}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex justify-between items-baseline">
                        <span className="text-xs font-bold uppercase tracking-wider text-teal-800">
                          Standard Adult Dose
                        </span>
                        <span className="text-2xl font-black text-teal-900">
                          {selectedMed.adultDose?.dose}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs pt-2 border-t border-teal-200/80">
                        <span className="font-semibold text-slate-700">Frequency:</span>
                        <span className="font-semibold text-slate-900">{selectedMed.adultDose?.frequency}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Instructions */}
                <div className="flex items-start gap-3 rounded-xl bg-blue-50/70 border border-blue-200 p-4">
                  <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                      Meal & Patient Timing Instructions
                    </div>
                    <p className="text-xs sm:text-sm text-blue-950 mt-0.5">{selectedMed.instructions}</p>
                  </div>
                </div>

                {/* Warnings */}
                {selectedMed.warnings.length > 0 && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4">
                    <div className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-700" />
                      Prescribing Cautions & Contraindications
                    </div>
                    <ul className="space-y-1">
                      {selectedMed.warnings.map((w, i) => (
                        <li key={i} className="text-xs text-amber-800 flex items-start gap-2">
                          <span>•</span>
                          <span>{w}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Available Formulations */}
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Common Available Strengths in India
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedMed.strengths.map((s) => (
                      <span
                        key={s}
                        className="rounded-lg border border-border bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Direct Prescription CTA */}
                <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
                  <Link
                    href={`/editor`}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-teal hover:bg-primary/90 transition-all"
                  >
                    Insert Into Prescription Editor
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-slate-50 py-24 text-center">
              <Scale className="h-12 w-12 text-slate-400 mb-3" />
              <h3 className="text-base font-semibold text-slate-900">Search a Medicine Above</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">
                Select an Indian pharmaceutical molecule to calculate pediatric ml/mg doses or adult regimens.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
