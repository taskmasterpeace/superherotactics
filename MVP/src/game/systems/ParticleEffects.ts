/**
 * Particle Effects System
 * Maps damage types and materials to visual effects
 */

export interface ParticleConfig {
  texture: string;
  color: number;
  count: number;
  speed: { min: number; max: number };
  lifespan: number;
  scale: { start: number; end: number };
  alpha: { start: number; end: number };
  gravity?: number;
  spread?: number;
}

// Material to particle effect mapping
export const MATERIAL_EFFECTS: Record<string, ParticleConfig> = {
  // Metals - sparks
  steel: {
    texture: 'particle_spark',
    color: 0xffaa00,
    count: 15,
    speed: { min: 100, max: 200 },
    lifespan: 400,
    scale: { start: 0.5, end: 0 },
    alpha: { start: 1, end: 0 },
    gravity: 200,
    spread: 360
  },
  iron: {
    texture: 'particle_spark',
    color: 0xff6600,
    count: 20,
    speed: { min: 80, max: 180 },
    lifespan: 500,
    scale: { start: 0.6, end: 0 },
    alpha: { start: 1, end: 0 },
    gravity: 200,
    spread: 360
  },
  titanium: {
    texture: 'particle_spark',
    color: 0xffffff,
    count: 12,
    speed: { min: 120, max: 220 },
    lifespan: 300,
    scale: { start: 0.4, end: 0 },
    alpha: { start: 1, end: 0 },
    gravity: 150,
    spread: 360
  },
  copper: {
    texture: 'particle_spark',
    color: 0xff8844,
    count: 18,
    speed: { min: 90, max: 190 },
    lifespan: 450,
    scale: { start: 0.5, end: 0 },
    alpha: { start: 1, end: 0 },
    gravity: 180,
    spread: 360
  },
  indestructium: {
    texture: 'particle_spark',
    color: 0x4488ff,
    count: 25,
    speed: { min: 150, max: 250 },
    lifespan: 350,
    scale: { start: 0.4, end: 0 },
    alpha: { start: 1, end: 0 },
    gravity: 100,
    spread: 360
  },

  // Organic - blood
  organic: {
    texture: 'particle_blood',
    color: 0xcc0000,
    count: 8,
    speed: { min: 50, max: 120 },
    lifespan: 600,
    scale: { start: 0.8, end: 0.2 },
    alpha: { start: 1, end: 0.5 },
    gravity: 300,
    spread: 180
  },

  // Wood - splinters
  wood: {
    texture: 'particle_splinter',
    color: 0x8b4513,
    count: 10,
    speed: { min: 60, max: 140 },
    lifespan: 500,
    scale: { start: 0.6, end: 0.2 },
    alpha: { start: 1, end: 0.3 },
    gravity: 250,
    spread: 270
  },

  // Glass - shatter
  glass: {
    texture: 'particle_shard',
    color: 0xaaddff,
    count: 20,
    speed: { min: 80, max: 180 },
    lifespan: 400,
    scale: { start: 0.4, end: 0.1 },
    alpha: { start: 0.8, end: 0 },
    gravity: 200,
    spread: 360
  },

  // Energy - plasma
  energy: {
    texture: 'particle_energy',
    color: 0x00ffff,
    count: 30,
    speed: { min: 40, max: 100 },
    lifespan: 300,
    scale: { start: 1, end: 0 },
    alpha: { start: 0.9, end: 0 },
    gravity: 0,
    spread: 360
  },

  // Absorbium - absorb ripple
  vibranium: {
    texture: 'particle_ripple',
    color: 0x9966ff,
    count: 3,
    speed: { min: 200, max: 300 },
    lifespan: 600,
    scale: { start: 0.2, end: 2 },
    alpha: { start: 0.8, end: 0 },
    gravity: 0,
    spread: 360
  }
};

// Damage type to particle effect mapping
export const DAMAGE_TYPE_EFFECTS: Record<string, ParticleConfig> = {
  // Physical melee
  EDGED_MELEE: {
    texture: 'particle_slash',
    color: 0xff0000,
    count: 5,
    speed: { min: 30, max: 80 },
    lifespan: 200,
    scale: { start: 1.2, end: 0.3 },
    alpha: { start: 0.8, end: 0 },
    spread: 45
  },
  SMASHING_MELEE: {
    texture: 'particle_dust',
    color: 0x888888,
    count: 15,
    speed: { min: 40, max: 100 },
    lifespan: 400,
    scale: { start: 0.8, end: 0.2 },
    alpha: { start: 0.6, end: 0 },
    gravity: 100,
    spread: 180
  },
  PIERCING_MELEE: {
    texture: 'particle_blood',
    color: 0x880000,
    count: 6,
    speed: { min: 60, max: 120 },
    lifespan: 350,
    scale: { start: 0.5, end: 0.1 },
    alpha: { start: 1, end: 0.4 },
    gravity: 250,
    spread: 90
  },

  // Gunfire
  GUNFIRE: {
    texture: 'particle_blood',
    color: 0xcc0000,
    count: 8,
    speed: { min: 80, max: 150 },
    lifespan: 400,
    scale: { start: 0.6, end: 0.1 },
    alpha: { start: 1, end: 0.3 },
    gravity: 200,
    spread: 120
  },
  BUCKSHOT: {
    texture: 'particle_fragment',
    color: 0xaaaaaa,
    count: 25,
    speed: { min: 100, max: 200 },
    lifespan: 300,
    scale: { start: 0.3, end: 0 },
    alpha: { start: 0.8, end: 0 },
    gravity: 150,
    spread: 60
  },

  // Energy weapons
  LASER: {
    texture: 'particle_energy',
    color: 0xff0000,
    count: 20,
    speed: { min: 50, max: 120 },
    lifespan: 250,
    scale: { start: 0.8, end: 0 },
    alpha: { start: 1, end: 0 },
    gravity: 0,
    spread: 360
  },
  PLASMA: {
    texture: 'particle_plasma',
    color: 0xff00ff,
    count: 25,
    speed: { min: 60, max: 140 },
    lifespan: 350,
    scale: { start: 1, end: 0 },
    alpha: { start: 0.9, end: 0 },
    gravity: -50,
    spread: 360
  },
  ELECTRIC: {
    texture: 'particle_lightning',
    color: 0x00ccff,
    count: 15,
    speed: { min: 80, max: 200 },
    lifespan: 200,
    scale: { start: 1.2, end: 0.2 },
    alpha: { start: 1, end: 0 },
    gravity: 0,
    spread: 360
  },

  // Elemental
  FIRE: {
    texture: 'particle_fire',
    color: 0xff6600,
    count: 20,
    speed: { min: 30, max: 80 },
    lifespan: 500,
    scale: { start: 1, end: 0 },
    alpha: { start: 0.9, end: 0 },
    gravity: -100,
    spread: 60
  },
  COLD: {
    texture: 'particle_ice',
    color: 0x88ddff,
    count: 15,
    speed: { min: 20, max: 60 },
    lifespan: 600,
    scale: { start: 0.6, end: 0.1 },
    alpha: { start: 0.8, end: 0.2 },
    gravity: 50,
    spread: 360
  },
  ACID: {
    texture: 'particle_acid',
    color: 0x00ff00,
    count: 12,
    speed: { min: 30, max: 70 },
    lifespan: 700,
    scale: { start: 0.8, end: 0.3 },
    alpha: { start: 0.9, end: 0.4 },
    gravity: 100,
    spread: 180
  },

  // Explosive
  EXPLOSIVE: {
    texture: 'particle_explosion',
    color: 0xff8800,
    count: 40,
    speed: { min: 150, max: 300 },
    lifespan: 400,
    scale: { start: 1.5, end: 0 },
    alpha: { start: 1, end: 0 },
    gravity: 50,
    spread: 360
  },

  // Sonic
  SONIC: {
    texture: 'particle_ripple',
    color: 0xffffff,
    count: 5,
    speed: { min: 100, max: 200 },
    lifespan: 500,
    scale: { start: 0.3, end: 3 },
    alpha: { start: 0.6, end: 0 },
    gravity: 0,
    spread: 360
  }
};

// Power-specific effects
export const POWER_EFFECTS: Record<string, ParticleConfig> = {
  heat_vision: {
    texture: 'particle_beam',
    color: 0xff0000,
    count: 30,
    speed: { min: 300, max: 400 },
    lifespan: 150,
    scale: { start: 0.5, end: 0.1 },
    alpha: { start: 1, end: 0.5 },
    spread: 5
  },
  lightning_control: {
    texture: 'particle_lightning',
    color: 0x00aaff,
    count: 40,
    speed: { min: 200, max: 400 },
    lifespan: 100,
    scale: { start: 1.5, end: 0.2 },
    alpha: { start: 1, end: 0 },
    spread: 30
  },
  magnetism: {
    texture: 'particle_magnetic',
    color: 0x8800ff,
    count: 20,
    speed: { min: 50, max: 150 },
    lifespan: 400,
    scale: { start: 0.8, end: 0.2 },
    alpha: { start: 0.7, end: 0 },
    spread: 360
  },
  repulsor_blast: {
    texture: 'particle_energy',
    color: 0x00ffff,
    count: 25,
    speed: { min: 150, max: 250 },
    lifespan: 200,
    scale: { start: 1, end: 0 },
    alpha: { start: 1, end: 0 },
    spread: 30
  },
  super_strength: {
    texture: 'particle_impact',
    color: 0xffff00,
    count: 15,
    speed: { min: 80, max: 160 },
    lifespan: 300,
    scale: { start: 1.2, end: 0.3 },
    alpha: { start: 0.8, end: 0 },
    gravity: 100,
    spread: 180
  },
  regeneration: {
    texture: 'particle_heal',
    color: 0x00ff44,
    count: 10,
    speed: { min: 20, max: 50 },
    lifespan: 800,
    scale: { start: 0.3, end: 0.8 },
    alpha: { start: 0.6, end: 0 },
    gravity: -30,
    spread: 360
  },
  mind_control: {
    texture: 'particle_psionic',
    color: 0xff00ff,
    count: 15,
    speed: { min: 30, max: 80 },
    lifespan: 600,
    scale: { start: 0.5, end: 1.5 },
    alpha: { start: 0.8, end: 0 },
    gravity: -20,
    spread: 360
  }
};

/**
 * Get the appropriate particle effect for an impact
 */
export function getImpactEffect(
  damageType: string,
  material?: string
): ParticleConfig {
  // Check material first (takes priority for physical impacts)
  if (material && MATERIAL_EFFECTS[material]) {
    return MATERIAL_EFFECTS[material];
  }

  // Fall back to damage type
  if (DAMAGE_TYPE_EFFECTS[damageType]) {
    return DAMAGE_TYPE_EFFECTS[damageType];
  }

  // Default effect
  return {
    texture: 'particle_default',
    color: 0xffffff,
    count: 10,
    speed: { min: 50, max: 100 },
    lifespan: 300,
    scale: { start: 0.5, end: 0 },
    alpha: { start: 0.8, end: 0 },
    spread: 360
  };
}

/**
 * Get effect for a specific power
 */
export function getPowerEffect(powerId: string): ParticleConfig | null {
  const key = powerId.replace('pwr_', '');
  return POWER_EFFECTS[key] || null;
}
