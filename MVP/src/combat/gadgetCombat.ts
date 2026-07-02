/**
 * Gadget Combat Mapping
 *
 * Maps all 89 gadgets from data/gadgets.ts to combat behaviors.
 * Each gadget is assigned a GadgetBehavior and effect configuration.
 *
 * Run: npx tsx src/combat/gadgetCombat.ts
 */

import {
  CombatGadget,
  GadgetBehavior,
  GadgetEffect,
  DRONE_CONFIGS,
} from './gadgetTypes';

import {
  GROUND_VEHICLES,
  AIRCRAFT,
  WATERCRAFT,
  DRONES,
  HACKING_TOOLS,
  SENSORS,
  COMMUNICATIONS,
  FIELD_GEAR,
  MEDICAL_TECH,
  UTILITY_EQUIPMENT,
  SURVEILLANCE,
} from '../data/gadgets';

// ============ COMBAT GADGET MAPPINGS ============

/**
 * Maps a gadget ID to its combat configuration.
 * This is the main lookup for the battle system.
 */
export const COMBAT_GADGETS: Record<string, CombatGadget> = {};

// ============ VEHICLES (24 total) → EXTRACT behavior ============
// Vehicles allow extraction from combat

function mapVehicle(vehicle: any): CombatGadget {
  return {
    id: vehicle.id,
    name: vehicle.name,
    category: 'Vehicle',
    behavior: 'extract',
    apCost: 4,
    cooldownTurns: 0,
    uses: -1, // Unlimited
    effect: {
      type: 'extract',
      targetType: 'all_allies',
    },
    description: vehicle.description,
  };
}

// Map all vehicles
[...GROUND_VEHICLES, ...AIRCRAFT, ...WATERCRAFT].forEach(v => {
  COMBAT_GADGETS[v.id] = mapVehicle(v);
});

// ============ DRONES (10 total) → SPAWN_UNIT behavior ============

function mapDrone(drone: any): CombatGadget {
  // Determine drone config based on drone type
  let droneConfigKey = 'recon_small';

  if (drone.name.includes('Combat') && drone.name.includes('Heavy')) {
    droneConfigKey = 'combat_heavy';
  } else if (drone.name.includes('Combat') && drone.name.includes('Light')) {
    droneConfigKey = 'combat_light';
  } else if (drone.name.includes('Military')) {
    droneConfigKey = 'recon_military';
  } else if (drone.name.includes('Medical')) {
    droneConfigKey = 'medical';
  } else if (drone.name.includes('Cargo')) {
    droneConfigKey = 'cargo';
  } else if (drone.name.includes('Swarm')) {
    droneConfigKey = 'swarm';
  } else if (drone.name.includes('Stealth')) {
    droneConfigKey = 'stealth';
  } else if (drone.name.includes('Assault')) {
    droneConfigKey = 'assault';
  } else if (drone.name.includes('EMP')) {
    droneConfigKey = 'emp';
  }

  return {
    id: drone.id,
    name: drone.name,
    category: 'Drone',
    behavior: 'spawn_unit',
    apCost: drone.apCost || 3,
    cooldownTurns: 0,
    uses: 1, // Single use
    effect: {
      type: 'spawn_unit',
      spawnDrone: DRONE_CONFIGS[droneConfigKey],
    },
    description: drone.description,
  };
}

// Map all drones
DRONES.forEach(d => {
  COMBAT_GADGETS[d.id] = mapDrone(d);
});

// ============ HACKING TOOLS (10 total) → DISABLE behavior ============

function mapHackingTool(gadget: any): CombatGadget {
  return {
    id: gadget.id,
    name: gadget.name,
    category: 'Hacking',
    behavior: 'disable',
    apCost: gadget.apCost || 4,
    cooldownTurns: gadget.cooldownTurns || 2,
    uses: gadget.uses === 'Reusable' ? -1 : (typeof gadget.uses === 'number' ? gadget.uses : 3),
    effect: {
      type: 'disable',
      radius: 3,
      targetType: 'enemy',
    },
    description: gadget.description,
  };
}

HACKING_TOOLS.forEach(g => {
  COMBAT_GADGETS[g.id] = mapHackingTool(g);
});

// ============ SENSORS (8 total) → REVEAL behavior ============

function mapSensor(gadget: any): CombatGadget {
  // Determine reveal radius based on sensor type
  let radius = 5;
  if (gadget.name.includes('Motion')) radius = 4;
  if (gadget.name.includes('Thermal')) radius = 6;
  if (gadget.name.includes('Radar')) radius = 8;
  if (gadget.name.includes('Life Sign')) radius = 10;

  return {
    id: gadget.id,
    name: gadget.name,
    category: 'Sensor',
    behavior: 'reveal',
    apCost: gadget.apCost || 2,
    cooldownTurns: gadget.cooldownTurns || 0,
    uses: gadget.uses === 'Reusable' ? -1 : (typeof gadget.uses === 'number' ? gadget.uses : -1),
    effect: {
      type: 'reveal',
      radius,
      duration: 3,
    },
    description: gadget.description,
  };
}

SENSORS.forEach(g => {
  COMBAT_GADGETS[g.id] = mapSensor(g);
});

// ============ COMMUNICATIONS (8 total) → BUFF behavior ============

function mapComms(gadget: any): CombatGadget {
  return {
    id: gadget.id,
    name: gadget.name,
    category: 'Communications',
    behavior: 'buff',
    apCost: gadget.apCost || 2,
    cooldownTurns: gadget.cooldownTurns || 3,
    uses: -1, // Usually reusable
    effect: {
      type: 'buff',
      duration: 2,
      targetType: 'all_allies',
      statBoost: { RNG: 5, INS: 5 }, // Coordination bonus
      statusEffect: 'coordinated',
    },
    description: gadget.description,
  };
}

COMMUNICATIONS.forEach(g => {
  COMBAT_GADGETS[g.id] = mapComms(g);
});

// ============ FIELD GEAR (15 total) → Mixed behaviors ============

function mapFieldGear(gadget: any): CombatGadget {
  // Determine behavior based on item type
  let behavior: GadgetBehavior = 'passive';
  let effect: GadgetEffect = { type: 'passive' };

  const name = gadget.name.toLowerCase();

  if (name.includes('breach') || name.includes('c4') || name.includes('explosive')) {
    behavior = 'explosive';
    effect = {
      type: 'explosive',
      value: name.includes('c4') ? 60 : 40,
      radius: 2,
    };
  } else if (name.includes('flashbang') || name.includes('smoke')) {
    behavior = 'buff'; // Smoke provides cover
    effect = {
      type: 'buff',
      radius: 3,
      duration: 2,
      targetType: 'all_allies',
    };
  } else if (name.includes('grappling') || name.includes('zipline')) {
    behavior = 'buff'; // Movement utility
    effect = {
      type: 'buff',
      duration: 1,
      targetType: 'self',
    };
  } else if (name.includes('lockpick') || name.includes('multi')) {
    behavior = 'passive'; // Non-combat utility
    effect = { type: 'passive' };
  }

  return {
    id: gadget.id,
    name: gadget.name,
    category: 'FieldGear',
    behavior,
    apCost: gadget.apCost || 3,
    cooldownTurns: gadget.cooldownTurns || 0,
    uses: typeof gadget.uses === 'number' ? gadget.uses : 1,
    effect,
    description: gadget.description,
  };
}

FIELD_GEAR.forEach(g => {
  COMBAT_GADGETS[g.id] = mapFieldGear(g);
});

// ============ MEDICAL TECH (8 total) → HEAL/REVIVE/CURE/BUFF ============

function mapMedical(gadget: any): CombatGadget {
  const name = gadget.name.toLowerCase();
  let behavior: GadgetBehavior = 'heal';
  let effect: GadgetEffect = { type: 'heal', value: 25, targetType: 'ally' };

  if (name.includes('defibrillator')) {
    behavior = 'revive';
    effect = {
      type: 'revive',
      value: 20, // HP on revive
      radius: 1, // Must be adjacent
    };
  } else if (name.includes('antidote')) {
    behavior = 'cure_status';
    effect = {
      type: 'cure_status',
      statusEffect: 'poisoned',
      targetType: 'ally',
    };
  } else if (name.includes('coagulant')) {
    behavior = 'cure_status';
    effect = {
      type: 'cure_status',
      statusEffect: 'bleeding',
      targetType: 'ally',
    };
  } else if (name.includes('stim') || name.includes('painkiller')) {
    behavior = 'buff';
    effect = {
      type: 'buff',
      duration: 3,
      targetType: 'self',
      statBoost: { AGL: 10, MEL: 5, RNG: 5 },
      statusEffect: 'stimmed',
    };
  } else if (name.includes('trauma')) {
    effect = { type: 'heal', value: 50, targetType: 'ally' };
  } else if (name.includes('surgical')) {
    effect = { type: 'heal', value: 75, targetType: 'ally' };
  } else {
    // First aid kit - base heal
    effect = { type: 'heal', value: 25, targetType: 'ally' };
  }

  return {
    id: gadget.id,
    name: gadget.name,
    category: 'Medical',
    behavior,
    apCost: gadget.apCost || 3,
    cooldownTurns: gadget.cooldownTurns || 0,
    uses: gadget.uses === 'Reusable' ? -1 : (typeof gadget.uses === 'number' ? gadget.uses : 5),
    effect,
    description: gadget.description,
  };
}

MEDICAL_TECH.forEach(g => {
  COMBAT_GADGETS[g.id] = mapMedical(g);
});

// ============ UTILITY EQUIPMENT (8 total) → REVEAL/PASSIVE ============

function mapUtility(gadget: any): CombatGadget {
  const name = gadget.name.toLowerCase();
  let behavior: GadgetBehavior = 'passive';
  let effect: GadgetEffect = { type: 'passive' };

  if (name.includes('nvg') || name.includes('night') || name.includes('thermal') || name.includes('goggle')) {
    behavior = 'reveal';
    effect = {
      type: 'reveal',
      radius: 8,
      duration: -1, // Permanent while equipped
    };
  } else if (name.includes('gas mask')) {
    behavior = 'passive'; // Immunity to gas
    effect = { type: 'passive' };
  } else if (name.includes('flashlight')) {
    behavior = 'reveal';
    effect = {
      type: 'reveal',
      radius: 6,
      duration: -1,
    };
  } else if (name.includes('extinguisher')) {
    behavior = 'cure_status';
    effect = {
      type: 'cure_status',
      statusEffect: 'burning',
      radius: 2,
    };
  }

  return {
    id: gadget.id,
    name: gadget.name,
    category: 'Utility',
    behavior,
    apCost: gadget.apCost || 2,
    cooldownTurns: gadget.cooldownTurns || 0,
    uses: -1,
    effect,
    description: gadget.description,
  };
}

UTILITY_EQUIPMENT.forEach(g => {
  COMBAT_GADGETS[g.id] = mapUtility(g);
});

// ============ SURVEILLANCE (8 total) → REVEAL/PASSIVE ============

function mapSurveillance(gadget: any): CombatGadget {
  const name = gadget.name.toLowerCase();

  // Most surveillance is non-combat (strategic layer)
  return {
    id: gadget.id,
    name: gadget.name,
    category: 'Surveillance',
    behavior: 'reveal',
    apCost: gadget.apCost || 2,
    cooldownTurns: gadget.cooldownTurns || 0,
    uses: -1,
    effect: {
      type: 'reveal',
      radius: name.includes('parabolic') ? 12 : 6,
      duration: 5,
    },
    description: gadget.description,
  };
}

SURVEILLANCE.forEach(g => {
  COMBAT_GADGETS[g.id] = mapSurveillance(g);
});

// ============ HELPER FUNCTIONS ============

/**
 * Get combat gadget by ID.
 */
export function getCombatGadget(id: string): CombatGadget | undefined {
  return COMBAT_GADGETS[id];
}

/**
 * Get all combat gadgets of a specific behavior type.
 */
export function getCombatGadgetsByBehavior(behavior: GadgetBehavior): CombatGadget[] {
  return Object.values(COMBAT_GADGETS).filter(g => g.behavior === behavior);
}

/**
 * Get all combat gadgets of a specific category.
 */
export function getCombatGadgetsByCategory(category: string): CombatGadget[] {
  return Object.values(COMBAT_GADGETS).filter(g => g.category === category);
}

/**
 * Get gadget count summary.
 */
export function getGadgetSummary(): Record<string, number> {
  const summary: Record<string, number> = {};

  for (const gadget of Object.values(COMBAT_GADGETS)) {
    summary[gadget.behavior] = (summary[gadget.behavior] || 0) + 1;
  }

  return summary;
}

// ============ TEST OUTPUT ============

if (typeof require !== 'undefined' && typeof module !== 'undefined' && require.main === module) {
  console.log('='.repeat(60));
  console.log('       GADGET COMBAT MAPPING REPORT');
  console.log('='.repeat(60));

  console.log('\n=== GADGET COUNT BY BEHAVIOR ===\n');
  const summary = getGadgetSummary();
  let total = 0;
  for (const [behavior, count] of Object.entries(summary)) {
    console.log(`  ${behavior.padEnd(15)}: ${count}`);
    total += count;
  }
  console.log(`  ${'─'.repeat(20)}`);
  console.log(`  ${'TOTAL'.padEnd(15)}: ${total}`);

  console.log('\n=== SAMPLE GADGETS BY BEHAVIOR ===\n');

  const behaviors: GadgetBehavior[] = [
    'spawn_unit', 'heal', 'explosive', 'reveal', 'buff',
    'disable', 'extract', 'cure_status', 'revive', 'passive'
  ];

  for (const behavior of behaviors) {
    const gadgets = getCombatGadgetsByBehavior(behavior);
    if (gadgets.length > 0) {
      console.log(`${behavior.toUpperCase()}:`);
      gadgets.slice(0, 2).forEach(g => {
        console.log(`  - ${g.name} (${g.id}): AP ${g.apCost}, Uses ${g.uses}`);
      });
      if (gadgets.length > 2) {
        console.log(`  ... and ${gadgets.length - 2} more`);
      }
    }
  }

  console.log('\n=== DRONES DETAIL ===\n');
  const drones = getCombatGadgetsByCategory('Drone');
  for (const drone of drones) {
    const config = drone.effect.spawnDrone;
    if (config) {
      console.log(`  ${drone.name}:`);
      console.log(`    Type: ${config.type}, HP: ${config.hp}, Duration: ${config.duration}t`);
      console.log(`    AI: ${config.ai}, Speed: ${config.moveSpeed}, Sight: ${config.sightRange}`);
    }
  }

  console.log('\n=== MEDICAL DETAIL ===\n');
  const medical = getCombatGadgetsByCategory('Medical');
  for (const med of medical) {
    console.log(`  ${med.name}: ${med.behavior}`);
    if (med.effect.value) console.log(`    Value: ${med.effect.value}`);
    if (med.effect.statusEffect) console.log(`    Status: ${med.effect.statusEffect}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('       ALL GADGETS MAPPED TO COMBAT');
  console.log('='.repeat(60));
}
