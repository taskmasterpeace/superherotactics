import React from 'react'
import { X } from 'lucide-react'
import { RetroButton } from './ui'
import { type Country } from '../data/allCountries'
import { CountryFlag } from './ui'

interface CountryCompareTableProps {
  countries: Country[]
  onUnpin: (id: number) => void
  onSelect: (name: string) => void
}

type CompareRow =
  | { kind: 'section'; label: string }
  | { kind: 'num'; label: string; get: (c: Country) => number; invert?: boolean; format?: (n: number) => string }
  | { kind: 'text'; label: string; get: (c: Country) => string }

const fmtPop = (n: number) =>
  n >= 1e9 ? `${(n / 1e9).toFixed(2)}B` : n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(0)}K` : String(n)

const ROWS: CompareRow[] = [
  { kind: 'section', label: 'General' },
  { kind: 'num', label: 'Population', get: c => c.population, format: fmtPop },
  { kind: 'text', label: 'Government', get: c => c.governmentType },
  { kind: 'text', label: 'Perception', get: c => c.governmentPerception },
  { kind: 'num', label: 'Corruption', get: c => c.governmentCorruption, invert: true },
  { kind: 'text', label: 'Capital Punishment', get: c => c.capitalPunishment || 'Unknown' },
  { kind: 'section', label: 'Economy' },
  { kind: 'num', label: 'National GDP', get: c => c.gdpNational },
  { kind: 'num', label: 'GDP Per Capita', get: c => c.gdpPerCapita },
  { kind: 'num', label: 'Social Development', get: c => c.socialDevelopment },
  { kind: 'num', label: 'Lifestyle', get: c => c.lifestyle },
  { kind: 'section', label: 'Forces' },
  { kind: 'num', label: 'Military Budget', get: c => c.militaryBudget },
  { kind: 'num', label: 'Military Services', get: c => c.militaryServices },
  { kind: 'num', label: 'Intel Budget', get: c => c.intelligenceBudget },
  { kind: 'num', label: 'Intel Services', get: c => c.intelligenceServices },
  { kind: 'num', label: 'Law Enforcement', get: c => c.lawEnforcement },
  { kind: 'num', label: 'Law Budget', get: c => c.lawEnforcementBudget },
  { kind: 'section', label: 'Tech & Media' },
  { kind: 'num', label: 'Science', get: c => c.science },
  { kind: 'num', label: 'Cyber', get: c => c.cyberCapabilities },
  { kind: 'num', label: 'Digital Dev', get: c => c.digitalDevelopment },
  { kind: 'num', label: 'Media Freedom', get: c => c.mediaFreedom },
  { kind: 'num', label: 'Higher Education', get: c => c.higherEducation },
  { kind: 'num', label: 'Healthcare', get: c => c.healthcare },
  { kind: 'section', label: 'Superhuman' },
  { kind: 'num', label: 'LSW Activity', get: c => c.lswActivity },
  { kind: 'text', label: 'LSW Regulations', get: c => c.lswRegulations },
  { kind: 'text', label: 'Vigilantism', get: c => c.vigilantism },
  { kind: 'text', label: 'Cloning', get: c => c.cloning },
  { kind: 'text', label: 'Terrorism', get: c => c.terrorismActivity },
]

/**
 * Side-by-side stat table for up to 3 pinned countries.
 * Best value per numeric row is highlighted (corruption inverted: lowest wins).
 */
export default function CountryCompareTable({ countries, onUnpin, onSelect }: CountryCompareTableProps) {
  if (countries.length === 0) return null

  const bestFor = (row: Extract<CompareRow, { kind: 'num' }>): number => {
    const values = countries.map(row.get)
    return row.invert ? Math.min(...values) : Math.max(...values)
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="p-2 text-left align-bottom" />
            {countries.map(c => (
              <th key={c.id} className="p-2 text-center align-bottom min-w-[9rem]">
                <div className="flex flex-col items-center gap-1.5">
                  <button
                    onClick={() => onUnpin(c.id)}
                    title={`Unpin ${c.name}`}
                    className="self-end -mb-1 p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-surface-light transition-colors duration-200"
                  >
                    <X size={14} />
                  </button>
                  <CountryFlag code={c.code} name={c.name} size="lg" />
                  <span className="font-bold text-foreground text-sm leading-tight">{c.name}</span>
                  <RetroButton
                    variant="primary"
                    size="sm"
                    shadow="sm"
                    className="mt-1 text-xs tracking-wide"
                    onClick={() => onSelect(c.name)}
                  >
                    SELECT
                  </RetroButton>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row, i) => {
            if (row.kind === 'section') {
              return (
                <tr key={`s-${i}`}>
                  <td
                    colSpan={countries.length + 1}
                    className="pt-4 pb-1 px-2 text-[11px] font-bold uppercase tracking-widest text-primary border-b-2 border-black/40"
                  >
                    {row.label}
                  </td>
                </tr>
              )
            }
            if (row.kind === 'text') {
              return (
                <tr key={`t-${i}`} className="hover:bg-surface-light/40 transition-colors duration-200">
                  <td className="px-2 py-1.5 text-xs font-semibold text-muted-foreground whitespace-nowrap border-b border-black/20">
                    {row.label}
                  </td>
                  {countries.map(c => (
                    <td key={c.id} className="px-3 py-1.5 text-center text-sm text-foreground border-b border-black/20">
                      {row.get(c)}
                    </td>
                  ))}
                </tr>
              )
            }
            const best = countries.length >= 2 ? bestFor(row) : NaN
            return (
              <tr key={`n-${i}`} className="hover:bg-surface-light/40 transition-colors duration-200">
                <td className="px-2 py-1.5 text-xs font-semibold text-muted-foreground whitespace-nowrap border-b border-black/20">
                  {row.label}
                  {row.invert && <span className="ml-1 opacity-60 normal-case">(low is best)</span>}
                </td>
                {countries.map(c => {
                  const v = row.get(c)
                  const isBest = countries.length >= 2 && v === best
                  return (
                    <td
                      key={c.id}
                      className={`px-3 py-1.5 text-center font-tactical text-sm border-b border-black/20 transition-colors duration-200 ${
                        isBest ? 'bg-success/15 text-success font-bold' : 'text-foreground'
                      }`}
                    >
                      {row.format ? row.format(v) : v}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
