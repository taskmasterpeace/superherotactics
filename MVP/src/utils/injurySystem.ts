// Injury and Medical System from your CSV data
export interface Injury {
  type: string
  severity: 'minor' | 'major' | 'critical'
  description: string
  healingTime: string
  medicalCost: number
  gameEffect: string
  recoveryDays: number
}

export const injuryTypes: Record<string, Injury> = {
  'ARM_BLOW': {
    type: 'ARM_BLOW',
    severity: 'major',
    description: 'Weapon arm injured - reduced combat effectiveness',
    healingTime: '6-8 weeks',
    medicalCost: 15000,
    gameEffect: '-1CS weapon attacks until healed',
    recoveryDays: 45
  },
  'LEG_WOUND': {
    type: 'LEG_WOUND', 
    severity: 'major',
    description: 'Leg injury reduces movement speed',
    healingTime: '4-6 weeks',
    medicalCost: 12000,
    gameEffect: 'Movement reduced by 50% until healed',
    recoveryDays: 35
  },
  'HEAD_TRAUMA': {
    type: 'HEAD_TRAUMA',
    severity: 'critical',
    description: 'Head injury affects mental capabilities',
    healingTime: '8-12 weeks', 
    medicalCost: 25000,
    gameEffect: '-2 INT and -1 INS until healed',
    recoveryDays: 70
  },
  'BROKEN_RIBS': {
    type: 'BROKEN_RIBS',
    severity: 'major',
    description: 'Broken ribs cause pain and reduced stamina',
    healingTime: '6-8 weeks',
    medicalCost: 18000,
    gameEffect: '-1CS all physical actions until healed',
    recoveryDays: 50
  },
  'CONCUSSION': {
    type: 'CONCUSSION',
    severity: 'minor',
    description: 'Head concussion causes temporary confusion',
    healingTime: '2-3 weeks',
    medicalCost: 8000,
    gameEffect: 'Stunned for 1d4 rounds',
    recoveryDays: 18
  }
}

export function rollForInjury(bodyPart: 'head' | 'arm' | 'leg' | 'torso'): Injury | null {
  const roll = Math.floor(Math.random() * 6) + 1
  
  switch(bodyPart) {
    case 'head':
      if (roll <= 2) return injuryTypes.CONCUSSION
      if (roll <= 4) return null // No injury
      return injuryTypes.HEAD_TRAUMA
      
    case 'arm':
      if (roll <= 3) return injuryTypes.ARM_BLOW
      return null
      
    case 'leg':
      if (roll <= 3) return injuryTypes.LEG_WOUND
      return null
      
    case 'torso':
      if (roll <= 2) return injuryTypes.BROKEN_RIBS
      return null
      
    default:
      return null
  }
}

export function calculateMedicalCosts(injuries: Injury[]): number {
  return injuries.reduce((total, injury) => total + injury.medicalCost, 0)
}

export function calculateRecoveryTime(injuries: Injury[]): number {
  return Math.max(...injuries.map(injury => injury.recoveryDays), 0)
}

export function getLegalConsequences(propertyDamage: number, injuries: Injury[]): string[] {
  const consequences = []
  
  if (propertyDamage > 0) {
    if (propertyDamage < 5000) {
      consequences.push('Minor property damage - Civil lawsuit likely')
    } else if (propertyDamage < 50000) {
      consequences.push('Significant property damage - Civil + criminal charges')
    } else if (propertyDamage < 500000) {
      consequences.push('Major destruction - Federal investigation required')
    } else {
      consequences.push('Mass destruction - Federal charges + International attention')
    }
  }
  
  if (injuries.length > 0) {
    const criticalInjuries = injuries.filter(inj => inj.severity === 'critical').length
    const totalMedical = calculateMedicalCosts(injuries)
    
    if (criticalInjuries > 0) {
      consequences.push(`${criticalInjuries} critical injury lawsuit(s) - Attempted murder charges`)
    } else {
      consequences.push(`${injuries.length} injury lawsuit(s) - Assault charges`)
    }
    
    consequences.push(`Medical liability: $${totalMedical.toLocaleString()}`)
  }
  
  return consequences
}