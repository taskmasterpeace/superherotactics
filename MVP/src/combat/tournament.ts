/**
 * Tournament System - Combat Learning Lab
 *
 * Creates tournaments with corner teams (medics, engineers)
 * to discover what's actually working in the combat system.
 *
 * Run: npx tsx src/combat/tournament.ts
 */

import { SimUnit, SimWeapon, StatusEffectInstance, HitResult, OriginType } from './types';
import { runBattle, AttackLog, BattleResult } from './battleRunner';

// ============ FIGHTER CREATION ============

interface Fighter {
  unit: SimUnit;
  name: string;
  nickname: string;
  wins: number;
  losses: number;
  knockouts: number;  // Times they KO'd someone
  timesKOd: number;   // Times they got KO'd
  totalDamageDealt: number;
  totalDamageTaken: number;
  injuries: string[];
  statusHistory: string[];
}

interface CornerTeam {
  medic: { name: string; skill: number };  // 0-100 healing effectiveness
  cutman: { name: string; skill: number }; // Stops bleeding
  coach: { name: string; skill: number };  // Morale boost
}

interface TournamentFighter {
  fighter: Fighter;
  corner: CornerTeam;
}

// Create a weak human fighter
function createFighter(name: string, nickname: string, weaponOverride?: SimWeapon): Fighter {
  // Weak human baseline (15 in everything)
  const stats = {
    MEL: 15 + Math.floor(Math.random() * 6) - 3,  // 12-17
    RNG: 15 + Math.floor(Math.random() * 6) - 3,
    AGL: 15 + Math.floor(Math.random() * 6) - 3,
    CON: 15 + Math.floor(Math.random() * 6) - 3,
    INS: 15 + Math.floor(Math.random() * 6) - 3,
    WIL: 15 + Math.floor(Math.random() * 6) - 3,
    INT: 15 + Math.floor(Math.random() * 6) - 3,
  };

  // Calculate HP from CON (50 base + CON * 2)
  const hp = 50 + stats.CON * 2;

  const fistWeapon: SimWeapon = {
    name: 'Fist',
    damage: 8 + Math.floor(stats.MEL / 5),  // 8-11 damage based on MEL
    accuracy: 80 + Math.floor(stats.MEL / 3),  // 80-85 based on MEL
    damageType: 'BLUNT_IMPACT',
    range: 1,
    apCost: 2,
    isLightAttack: true,
  };

  // Belt level correlates loosely with MEL (higher MEL = more trained)
  // Weak humans: belt 1-4, trained: 5-7, elite: 8-10
  const beltLevel = Math.max(1, Math.min(10, Math.floor((stats.MEL - 10) / 2) + 1 + Math.floor(Math.random() * 2)));

  const unit: SimUnit = {
    id: `fighter-${name.toLowerCase().replace(/\s/g, '-')}`,
    name,
    team: 'blue',  // Will be set per match
    hp,
    maxHp: hp,
    shieldHp: 0,
    maxShieldHp: 0,
    dr: 0,  // No armor - weak humans
    stoppingPower: 0,
    origin: 'biological' as OriginType,
    stats,
    stance: 'normal',
    cover: 'none',
    statusEffects: [],
    accuracyPenalty: 0,
    weapon: weaponOverride || fistWeapon,
    ap: 4,
    maxAp: 4,
    position: { x: 0, y: 0 },
    alive: true,
    disarmed: false,
    beltLevel,  // 1-10 martial arts belt level for accuracy bonus
  };

  return {
    unit,
    name,
    nickname,
    wins: 0,
    losses: 0,
    knockouts: 0,
    timesKOd: 0,
    totalDamageDealt: 0,
    totalDamageTaken: 0,
    injuries: [],
    statusHistory: [],
  };
}

// Create a corner team
function createCornerTeam(): CornerTeam {
  const names = {
    medics: ['Doc Williams', 'Dr. Chen', 'Nurse Rodriguez', 'Medic Johnson', 'Doc Smith'],
    cutmen: ['Mickey', 'Old Pete', 'Steady Eddie', 'Quick Hands', 'Red'],
    coaches: ['Coach Thompson', 'Trainer Mike', 'The Professor', 'Iron Mike', 'Pop'],
  };

  return {
    medic: {
      name: names.medics[Math.floor(Math.random() * names.medics.length)],
      skill: 50 + Math.floor(Math.random() * 30),  // 50-80
    },
    cutman: {
      name: names.cutmen[Math.floor(Math.random() * names.cutmen.length)],
      skill: 50 + Math.floor(Math.random() * 30),
    },
    coach: {
      name: names.coaches[Math.floor(Math.random() * names.coaches.length)],
      skill: 50 + Math.floor(Math.random() * 30),
    },
  };
}

// ============ HEALING BETWEEN ROUNDS ============

interface HealingReport {
  fighterName: string;
  startHp: number;
  endHp: number;
  healed: number;
  bleedingStopped: boolean;
  statusesCleared: string[];
  medicComment: string;
}

function healBetweenRounds(
  fighter: Fighter,
  corner: CornerTeam,
  restMinutes: number
): HealingReport {
  const startHp = fighter.unit.hp;
  const statusesCleared: string[] = [];
  let bleedingStopped = false;

  // Natural recovery (rest time)
  const naturalHeal = Math.floor(restMinutes / 10);  // 1 HP per 10 minutes

  // Medic healing (skill-based)
  const medicHeal = Math.floor((corner.medic.skill / 100) * 15);  // Up to 15 HP

  // Total healing (capped at maxHp)
  const totalHeal = Math.min(naturalHeal + medicHeal, fighter.unit.maxHp - fighter.unit.hp);
  fighter.unit.hp += totalHeal;

  // Cutman stops bleeding
  const bleedingEffects = fighter.unit.statusEffects.filter(e => e.id === 'bleeding');
  if (bleedingEffects.length > 0) {
    const cutmanSuccess = Math.random() * 100 < corner.cutman.skill;
    if (cutmanSuccess) {
      fighter.unit.statusEffects = fighter.unit.statusEffects.filter(e => e.id !== 'bleeding');
      bleedingStopped = true;
      statusesCleared.push('bleeding');
    }
  }

  // Clear other status effects (chance based on duration)
  fighter.unit.statusEffects = fighter.unit.statusEffects.filter(effect => {
    // 80% chance to clear effects between rounds
    if (Math.random() < 0.8) {
      statusesCleared.push(effect.id);
      return false;
    }
    return true;
  });

  // Coach morale boost (reset accuracy penalty from injuries)
  if (corner.coach.skill > 70 && fighter.unit.accuracyPenalty < 0) {
    const recovery = Math.min(-fighter.unit.accuracyPenalty, Math.floor(corner.coach.skill / 10));
    fighter.unit.accuracyPenalty += recovery;
  }

  // Generate medic comment
  const comments = {
    good: ["Looking good champ, you got this!", "Just a scratch, you're fine.", "Keep your guard up, you got him!"],
    bad: ["We need to stop this fight...", "I don't like what I'm seeing...", "One more round, max."],
    bleeding: ["Hold still, gotta stop this bleeding!", "Pressure, pressure! There we go.", "Cut's nasty but you'll live."],
    ko: ["Wake up! Can you hear me?", "How many fingers am I holding up?", "You went down hard..."],
  };

  let commentType: 'good' | 'bad' | 'bleeding' | 'ko' = 'good';
  if (fighter.unit.hp < fighter.unit.maxHp * 0.3) commentType = 'bad';
  if (bleedingStopped) commentType = 'bleeding';
  if (fighter.timesKOd > 0) commentType = 'ko';

  return {
    fighterName: fighter.name,
    startHp,
    endHp: fighter.unit.hp,
    healed: totalHeal,
    bleedingStopped,
    statusesCleared,
    medicComment: comments[commentType][Math.floor(Math.random() * comments[commentType].length)],
  };
}

// ============ MATCH EXECUTION ============

interface MatchResult {
  fighter1: string;
  fighter2: string;
  winner: string;
  loser: string;
  method: 'KO' | 'TKO' | 'Decision';
  rounds: number;
  fighter1Damage: number;
  fighter2Damage: number;
  fighter1FinalHp: number;
  fighter2FinalHp: number;
  statusEffectsApplied: string[];
  log: string[];
}

function runMatch(
  tf1: TournamentFighter,
  tf2: TournamentFighter,
  maxRounds: number = 3
): MatchResult {
  const f1 = tf1.fighter;
  const f2 = tf2.fighter;
  const log: string[] = [];
  const statusEffectsApplied: string[] = [];

  // Reset fighters for match
  f1.unit.hp = f1.unit.maxHp;
  f2.unit.hp = f2.unit.maxHp;
  f1.unit.team = 'blue';
  f2.unit.team = 'red';
  f1.unit.alive = true;
  f2.unit.alive = true;
  f1.unit.statusEffects = [];
  f2.unit.statusEffects = [];
  // Position fighters adjacent (1 tile apart) for melee range
  f1.unit.position = { x: 5, y: 5 };
  f2.unit.position = { x: 6, y: 5 };

  log.push(`\n=== ${f1.nickname} "${f1.name}" vs ${f2.nickname} "${f2.name}" ===`);
  log.push(`${f1.name}: HP ${f1.unit.hp}, MEL ${f1.unit.stats.MEL}, Weapon: ${f1.unit.weapon.name}`);
  log.push(`${f2.name}: HP ${f2.unit.hp}, MEL ${f2.unit.stats.MEL}, Weapon: ${f2.unit.weapon.name}`);

  let totalF1Damage = 0;
  let totalF2Damage = 0;
  let roundsPlayed = 0;
  let ko = false;

  for (let round = 1; round <= maxRounds && !ko; round++) {
    roundsPlayed = round;
    log.push(`\n--- Round ${round} ---`);

    // Run the combat round
    const result = runBattle([f1.unit], [f2.unit], {
      maxRounds: 5,  // Sub-rounds within the tournament round
      distance: 1,   // Adjacent for melee combat
    });

    // Process attack log
    for (const attack of result.log) {
      const attacker = attack.attacker === f1.unit.id ? f1.name : f2.name;
      const defender = attack.target === f1.unit.id ? f1.name : f2.name;

      if (attack.hitResult === 'miss') {
        log.push(`  ${attacker} misses!`);
      } else {
        const resultText = attack.hitResult === 'crit' ? 'CRITICAL!' : attack.hitResult === 'graze' ? 'grazes' : 'hits';
        log.push(`  ${attacker} ${resultText} ${defender} for ${attack.finalDamage} damage`);

        if (attack.attacker === f1.unit.id) {
          totalF1Damage += attack.finalDamage;
        } else {
          totalF2Damage += attack.finalDamage;
        }
      }
    }

    // Track status effects from attack log (not from units - runBattle clones them)
    for (const attack of result.log) {
      if (attack.effectsApplied && attack.effectsApplied.length > 0) {
        const targetName = attack.target === f1.unit.id ? f1.name : f2.name;
        for (const effectId of attack.effectsApplied) {
          if (!statusEffectsApplied.includes(effectId)) {
            statusEffectsApplied.push(effectId);
            log.push(`  !! ${targetName} is now ${effectId}!`);
          }
        }
      }
    }

    // Update HP from battle result (runBattle clones units, need to sync HP back)
    const blueUnitsAfter = result.blueDeaths.length > 0 ? [] : [f1.unit];
    const redUnitsAfter = result.redDeaths.length > 0 ? [] : [f2.unit];

    // The battle result contains final HP info - use it
    if (result.blueDeaths.length > 0) {
      f1.unit.hp = 0;
      f1.unit.alive = false;
    }
    if (result.redDeaths.length > 0) {
      f2.unit.hp = 0;
      f2.unit.alive = false;
    }

    // Check for KO
    if (!f1.unit.alive || f1.unit.hp <= 0) {
      ko = true;
      f2.knockouts++;
      f1.timesKOd++;
      log.push(`\n  *** ${f1.name} IS DOWN! KO by ${f2.name}! ***`);
    } else if (!f2.unit.alive || f2.unit.hp <= 0) {
      ko = true;
      f1.knockouts++;
      f2.timesKOd++;
      log.push(`\n  *** ${f2.name} IS DOWN! KO by ${f1.name}! ***`);
    }

    // Between round healing (if not KO and not last round)
    if (!ko && round < maxRounds) {
      const heal1 = healBetweenRounds(f1, tf1.corner, 60);  // 60 second rest
      const heal2 = healBetweenRounds(f2, tf2.corner, 60);
      log.push(`  [Corner] ${heal1.medicComment}`);
      log.push(`  [Corner] ${heal2.medicComment}`);
      if (heal1.healed > 0) log.push(`  ${f1.name} healed ${heal1.healed} HP`);
      if (heal2.healed > 0) log.push(`  ${f2.name} healed ${heal2.healed} HP`);
    }
  }

  // Determine winner
  let winner: string;
  let loser: string;
  let method: 'KO' | 'TKO' | 'Decision';

  if (!f1.unit.alive || f1.unit.hp <= 0) {
    winner = f2.name;
    loser = f1.name;
    method = 'KO';
    f2.wins++;
    f1.losses++;
  } else if (!f2.unit.alive || f2.unit.hp <= 0) {
    winner = f1.name;
    loser = f2.name;
    method = 'KO';
    f1.wins++;
    f2.losses++;
  } else if (f1.unit.hp < f1.unit.maxHp * 0.25) {
    winner = f2.name;
    loser = f1.name;
    method = 'TKO';
    f2.wins++;
    f1.losses++;
  } else if (f2.unit.hp < f2.unit.maxHp * 0.25) {
    winner = f1.name;
    loser = f2.name;
    method = 'TKO';
    f1.wins++;
    f2.losses++;
  } else {
    // Decision based on damage dealt
    if (totalF1Damage > totalF2Damage) {
      winner = f1.name;
      loser = f2.name;
      f1.wins++;
      f2.losses++;
    } else {
      winner = f2.name;
      loser = f1.name;
      f2.wins++;
      f1.losses++;
    }
    method = 'Decision';
  }

  // Update damage stats
  f1.totalDamageDealt += totalF1Damage;
  f1.totalDamageTaken += totalF2Damage;
  f2.totalDamageDealt += totalF2Damage;
  f2.totalDamageTaken += totalF1Damage;

  log.push(`\n=== WINNER: ${winner} by ${method} ===`);

  return {
    fighter1: f1.name,
    fighter2: f2.name,
    winner,
    loser,
    method,
    rounds: roundsPlayed,
    fighter1Damage: totalF1Damage,
    fighter2Damage: totalF2Damage,
    fighter1FinalHp: f1.unit.hp,
    fighter2FinalHp: f2.unit.hp,
    statusEffectsApplied,
    log,
  };
}

// ============ TOURNAMENT BRACKET ============

function runTournament(
  fighters: TournamentFighter[],
  tournamentName: string
): void {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  ${tournamentName.toUpperCase()}`);
  console.log(`${'='.repeat(60)}`);
  console.log(`\nFighters:`);
  fighters.forEach((tf, i) => {
    console.log(`  ${i + 1}. ${tf.fighter.nickname} "${tf.fighter.name}" - MEL:${tf.fighter.unit.stats.MEL} CON:${tf.fighter.unit.stats.CON} HP:${tf.fighter.unit.maxHp}`);
    console.log(`     Corner: ${tf.corner.medic.name} (Medic), ${tf.corner.cutman.name} (Cutman)`);
  });

  // Quarterfinals
  console.log(`\n${'─'.repeat(40)}`);
  console.log('  QUARTERFINALS');
  console.log(`${'─'.repeat(40)}`);

  const qfResults: MatchResult[] = [];
  const qfWinners: TournamentFighter[] = [];

  for (let i = 0; i < 4; i++) {
    const result = runMatch(fighters[i * 2], fighters[i * 2 + 1]);
    qfResults.push(result);
    result.log.forEach(l => console.log(l));

    // Find winner TournamentFighter
    const winnerTf = result.winner === fighters[i * 2].fighter.name
      ? fighters[i * 2]
      : fighters[i * 2 + 1];
    qfWinners.push(winnerTf);
  }

  // Healing break between rounds
  console.log(`\n${'─'.repeat(40)}`);
  console.log('  30 MINUTE BREAK - CORNER WORK');
  console.log(`${'─'.repeat(40)}`);
  qfWinners.forEach(tf => {
    const healReport = healBetweenRounds(tf.fighter, tf.corner, 30);
    console.log(`\n${tf.fighter.name}:`);
    console.log(`  HP: ${healReport.startHp} -> ${healReport.endHp} (+${healReport.healed})`);
    console.log(`  ${tf.corner.medic.name}: "${healReport.medicComment}"`);
    if (healReport.bleedingStopped) console.log(`  ${tf.corner.cutman.name} stopped the bleeding!`);
  });

  // Semifinals
  console.log(`\n${'─'.repeat(40)}`);
  console.log('  SEMIFINALS');
  console.log(`${'─'.repeat(40)}`);

  const sfResults: MatchResult[] = [];
  const sfWinners: TournamentFighter[] = [];

  for (let i = 0; i < 2; i++) {
    const result = runMatch(qfWinners[i * 2], qfWinners[i * 2 + 1]);
    sfResults.push(result);
    result.log.forEach(l => console.log(l));

    const winnerTf = result.winner === qfWinners[i * 2].fighter.name
      ? qfWinners[i * 2]
      : qfWinners[i * 2 + 1];
    sfWinners.push(winnerTf);
  }

  // Another healing break
  console.log(`\n${'─'.repeat(40)}`);
  console.log('  60 MINUTE BREAK - FINAL PREP');
  console.log(`${'─'.repeat(40)}`);
  sfWinners.forEach(tf => {
    const healReport = healBetweenRounds(tf.fighter, tf.corner, 60);
    console.log(`\n${tf.fighter.name}:`);
    console.log(`  HP: ${healReport.startHp} -> ${healReport.endHp} (+${healReport.healed})`);
    console.log(`  ${tf.corner.medic.name}: "${healReport.medicComment}"`);
  });

  // Finals
  console.log(`\n${'─'.repeat(40)}`);
  console.log('  CHAMPIONSHIP FINAL');
  console.log(`${'─'.repeat(40)}`);

  const finalResult = runMatch(sfWinners[0], sfWinners[1], 5);  // 5 round final
  finalResult.log.forEach(l => console.log(l));

  // Tournament Summary
  console.log(`\n${'='.repeat(60)}`);
  console.log('  TOURNAMENT SUMMARY');
  console.log(`${'='.repeat(60)}`);

  console.log(`\nCHAMPION: ${finalResult.winner}`);
  console.log(`Method: ${finalResult.method}`);

  console.log(`\nFighter Stats:`);
  fighters.forEach(tf => {
    const f = tf.fighter;
    console.log(`\n${f.name}:`);
    console.log(`  Record: ${f.wins}-${f.losses}`);
    console.log(`  KOs: ${f.knockouts} | Times KO'd: ${f.timesKOd}`);
    console.log(`  Damage Dealt: ${f.totalDamageDealt} | Damage Taken: ${f.totalDamageTaken}`);
  });

  // Effects Report
  const allEffects = [...qfResults, ...sfResults, finalResult].flatMap(r => r.statusEffectsApplied);
  const uniqueEffects = [...new Set(allEffects)];
  console.log(`\nStatus Effects Observed: ${uniqueEffects.length > 0 ? uniqueEffects.join(', ') : 'NONE'}`);
  console.log(`\nNOTE: If no status effects were observed, the damage types may not be triggering them!`);
}

// ============ WEAPON DEFINITIONS FOR MELEE TOURNAMENT ============

const TOURNAMENT_WEAPONS: Record<string, SimWeapon> = {
  knife: {
    name: 'Combat Knife',
    damage: 15,
    accuracy: 85,
    damageType: 'EDGED_SLASHING',  // Should cause bleeding
    range: 1,
    apCost: 2,
    isLightAttack: true,
  },
  club: {
    name: 'Club',
    damage: 12,
    accuracy: 80,
    damageType: 'BLUNT_IMPACT',
    range: 1,
    apCost: 3,
    knockbackForce: 30,
  },
  machete: {
    name: 'Machete',
    damage: 18,
    accuracy: 75,
    damageType: 'EDGED_SLASHING',
    range: 1,
    apCost: 3,
  },
  staff: {
    name: 'Bo Staff',
    damage: 10,
    accuracy: 85,
    damageType: 'BLUNT_IMPACT',
    range: 2,  // Reach advantage
    apCost: 3,
    knockbackForce: 40,
    special: { knockdownChance: 30 },
  },
  nunchucks: {
    name: 'Nunchucks',
    damage: 12,
    accuracy: 70,
    damageType: 'BLUNT_IMPACT',
    range: 1,
    apCost: 2,
    isLightAttack: true,
    special: { disarmBonus: 25 },
  },
  torch: {
    name: 'Flaming Torch',
    damage: 8,
    accuracy: 75,
    damageType: 'ENERGY_THERMAL',  // Should cause burning
    range: 1,
    apCost: 3,
  },
  taser: {
    name: 'Stun Baton',
    damage: 6,
    accuracy: 85,
    damageType: 'ELECTROMAGNETIC_BOLT',  // Should cause stun
    range: 1,
    apCost: 2,
  },
  poisonDagger: {
    name: 'Poisoned Dagger',
    damage: 10,
    accuracy: 85,
    damageType: 'TOXIN_POISON',  // Should cause poison
    range: 1,
    apCost: 2,
    isLightAttack: true,
  },
};

// ============ MARTIAL ARTS & WRESTLING ATTACKS ============

const MARTIAL_ARTS_ATTACKS: Record<string, SimWeapon> = {
  // Karate - Balanced striking
  karateStrike: {
    name: 'Karate Strike',
    damage: 12,
    accuracy: 88,
    damageType: 'BLUNT_IMPACT',
    range: 1,
    apCost: 2,
    isLightAttack: true,
  },
  // Muay Thai - Devastating kicks and elbows
  muayThaiElbow: {
    name: 'Muay Thai Elbow',
    damage: 16,
    accuracy: 82,
    damageType: 'BLUNT_IMPACT',
    range: 1,
    apCost: 3,
    knockbackForce: 20,
  },
  // Taekwondo - High kicks
  tkdKick: {
    name: 'TKD Spinning Kick',
    damage: 18,
    accuracy: 75,  // Harder to land
    damageType: 'BLUNT_IMPACT',
    range: 1,
    apCost: 3,
    knockbackForce: 35,
  },
  // Boxing - Fast combos
  boxingCombo: {
    name: 'Boxing Combo',
    damage: 10,
    accuracy: 90,  // Very accurate
    damageType: 'BLUNT_IMPACT',
    range: 1,
    apCost: 2,
    isLightAttack: true,
  },
  // Wrestling - Grappling attacks
  wrestlingSlam: {
    name: 'Wrestling Slam',
    damage: 20,
    accuracy: 78,
    damageType: 'BLUNT_IMPACT',
    range: 1,
    apCost: 4,
    knockbackForce: 50,
    special: { knockdownChance: 60 },
  },
  // BJJ - Submission holds (damage over time simulation)
  bjjChoke: {
    name: 'BJJ Choke',
    damage: 8,
    accuracy: 85,
    damageType: 'ASPHYXIATION',  // Should cause different effect
    range: 1,
    apCost: 3,
  },
  // Judo - Throws
  judoThrow: {
    name: 'Judo Throw',
    damage: 14,
    accuracy: 80,
    damageType: 'BLUNT_IMPACT',
    range: 1,
    apCost: 3,
    knockbackForce: 40,
    special: { knockdownChance: 80 },
  },
  // Capoeira - Acrobatic kicks
  capoeiraKick: {
    name: 'Capoeira Kick',
    damage: 14,
    accuracy: 72,  // Flashy but less accurate
    damageType: 'BLUNT_IMPACT',
    range: 2,  // Longer range from acrobatics
    apCost: 3,
  },
};

// Create a martial artist with boosted MEL and trained attacks
function createMartialArtist(name: string, nickname: string, style: string, weapon: SimWeapon): Fighter {
  // Higher MEL than regular fighters (trained)
  const stats = {
    MEL: 22 + Math.floor(Math.random() * 6) - 3,  // 19-24 (trained)
    RNG: 12 + Math.floor(Math.random() * 6) - 3,
    AGL: 20 + Math.floor(Math.random() * 6) - 3,  // 17-22 (agile)
    CON: 16 + Math.floor(Math.random() * 6) - 3,  // 13-18
    INS: 15 + Math.floor(Math.random() * 6) - 3,
    WIL: 18 + Math.floor(Math.random() * 6) - 3,  // 15-20 (disciplined)
    INT: 15 + Math.floor(Math.random() * 6) - 3,
  };

  const hp = 50 + stats.CON * 2;

  const unit: SimUnit = {
    id: `fighter-${name.toLowerCase().replace(/\s/g, '-')}`,
    name,
    team: 'blue',
    hp,
    maxHp: hp,
    shieldHp: 0,
    maxShieldHp: 0,
    dr: 0,
    stoppingPower: 0,
    origin: 'biological' as OriginType,
    stats,
    stance: 'normal',
    cover: 'none',
    statusEffects: [],
    accuracyPenalty: 0,
    weapon,
    ap: 4,
    maxAp: 4,
    position: { x: 0, y: 0 },
    alive: true,
  };

  return {
    unit,
    name,
    nickname,
    wins: 0,
    losses: 0,
    knockouts: 0,
    timesKOd: 0,
    totalDamageDealt: 0,
    totalDamageTaken: 0,
    injuries: [],
    statusHistory: [],
  };
}

// Create a wrestler with boosted STR/CON
function createWrestler(name: string, nickname: string, weapon: SimWeapon): Fighter {
  // High STR/CON, moderate MEL
  const stats = {
    MEL: 18 + Math.floor(Math.random() * 6) - 3,  // 15-20
    RNG: 10 + Math.floor(Math.random() * 6) - 3,
    AGL: 14 + Math.floor(Math.random() * 6) - 3,  // 11-16 (less agile)
    CON: 22 + Math.floor(Math.random() * 6) - 3,  // 19-24 (tough)
    INS: 14 + Math.floor(Math.random() * 6) - 3,
    WIL: 20 + Math.floor(Math.random() * 6) - 3,  // 17-22 (grit)
    INT: 13 + Math.floor(Math.random() * 6) - 3,
  };

  const hp = 50 + stats.CON * 2;  // Higher HP from CON

  const unit: SimUnit = {
    id: `fighter-${name.toLowerCase().replace(/\s/g, '-')}`,
    name,
    team: 'blue',
    hp,
    maxHp: hp,
    shieldHp: 0,
    maxShieldHp: 0,
    dr: 2,  // Wrestlers are tough - natural DR
    stoppingPower: 0,
    origin: 'biological' as OriginType,
    stats,
    stance: 'normal',
    cover: 'none',
    statusEffects: [],
    accuracyPenalty: 0,
    weapon,
    ap: 4,
    maxAp: 4,
    position: { x: 0, y: 0 },
    alive: true,
  };

  return {
    unit,
    name,
    nickname,
    wins: 0,
    losses: 0,
    knockouts: 0,
    timesKOd: 0,
    totalDamageDealt: 0,
    totalDamageTaken: 0,
    injuries: [],
    statusHistory: [],
  };
}

// ============ EXPANDED WEAPON CATEGORIES ============

const RANGED_WEAPONS: Record<string, SimWeapon> = {
  pistol: {
    name: '9mm Pistol',
    damage: 22,
    accuracy: 78,
    damageType: 'GUNFIRE_BULLET',
    range: 15,  // Long range
    apCost: 2,
  },
  revolver: {
    name: '.357 Magnum',
    damage: 32,
    accuracy: 70,
    damageType: 'GUNFIRE_BULLET',
    range: 12,
    apCost: 3,
    knockbackForce: 25,
  },
  shotgun: {
    name: 'Sawed-Off Shotgun',
    damage: 45,
    accuracy: 65,
    damageType: 'GUNFIRE_BUCKSHOT',
    range: 4,  // Short range only
    apCost: 3,
    knockbackForce: 60,
  },
  smg: {
    name: 'MP5 SMG',
    damage: 18,
    accuracy: 72,
    damageType: 'GUNFIRE_BULLET',
    range: 10,
    apCost: 2,
    isLightAttack: true,  // Fast fire
  },
};

const EXOTIC_MELEE: Record<string, SimWeapon> = {
  katana: {
    name: 'Katana',
    damage: 28,
    accuracy: 75,
    damageType: 'EDGED_SLASHING',
    range: 2,
    apCost: 3,
    special: { bleedChance: 40 },
  },
  battleAxe: {
    name: 'Battle Axe',
    damage: 35,
    accuracy: 65,
    damageType: 'EDGED_SLASHING',
    range: 1,
    apCost: 4,
    knockbackForce: 45,
  },
  spear: {
    name: 'Combat Spear',
    damage: 20,
    accuracy: 80,
    damageType: 'EDGED_PIERCING',
    range: 3,  // Reach advantage
    apCost: 3,
  },
  chainWhip: {
    name: 'Spiked Chain',
    damage: 14,
    accuracy: 70,
    damageType: 'EDGED_SLASHING',
    range: 3,
    apCost: 3,
    special: { disarmBonus: 30 },
  },
  warHammer: {
    name: 'War Hammer',
    damage: 30,
    accuracy: 68,
    damageType: 'BLUNT_IMPACT',
    range: 1,
    apCost: 4,
    knockbackForce: 55,
    special: { armorPiercing: 8 },  // Ignores some DR
  },
  electrifiedBlade: {
    name: 'Shock Blade',
    damage: 22,
    accuracy: 78,
    damageType: 'ELECTROMAGNETIC_BOLT',
    range: 1,
    apCost: 3,
  },
};

const IMPROVISED_WEAPONS: Record<string, SimWeapon> = {
  brokenBottle: {
    name: 'Broken Bottle',
    damage: 12,
    accuracy: 75,
    damageType: 'EDGED_PIERCING',
    range: 1,
    apCost: 2,
    isLightAttack: true,
    special: { bleedChance: 30 },
  },
  leadPipe: {
    name: 'Lead Pipe',
    damage: 16,
    accuracy: 80,
    damageType: 'BLUNT_IMPACT',
    range: 1,
    apCost: 3,
    knockbackForce: 30,
  },
  chair: {
    name: 'Folding Chair',
    damage: 10,
    accuracy: 85,
    damageType: 'BLUNT_IMPACT',
    range: 1,
    apCost: 2,
    knockbackForce: 40,
    special: { breakChance: 25 },
  },
  brassKnuckles: {
    name: 'Brass Knuckles',
    damage: 14,
    accuracy: 88,
    damageType: 'BLUNT_IMPACT',
    range: 1,
    apCost: 2,
    isLightAttack: true,
  },
  poolCue: {
    name: 'Pool Cue',
    damage: 8,
    accuracy: 82,
    damageType: 'BLUNT_IMPACT',
    range: 2,
    apCost: 2,
    special: { disarmBonus: 15 },
  },
};

const EXPANDED_MARTIAL_ARTS: Record<string, SimWeapon> = {
  // From original
  ...MARTIAL_ARTS_ATTACKS,
  // New styles
  wingChunChain: {
    name: 'Wing Chun Chain Punch',
    damage: 8,
    accuracy: 92,  // Very fast and accurate
    damageType: 'BLUNT_IMPACT',
    range: 1,
    apCost: 1,  // Very fast
    isLightAttack: true,
  },
  kravMaga: {
    name: 'Krav Maga Strike',
    damage: 18,
    accuracy: 85,
    damageType: 'BLUNT_IMPACT',
    range: 1,
    apCost: 2,
    special: { disarmBonus: 20 },
  },
  samboTakedown: {
    name: 'Sambo Takedown',
    damage: 16,
    accuracy: 82,
    damageType: 'BLUNT_IMPACT',
    range: 1,
    apCost: 3,
    knockbackForce: 30,
    special: { knockdownChance: 70 },
  },
  aikidoRedirect: {
    name: 'Aikido Redirect',
    damage: 6,  // Low damage
    accuracy: 90,  // Very accurate
    damageType: 'BLUNT_IMPACT',
    range: 1,
    apCost: 2,
    special: { counterBonus: 40 },  // Better at countering
  },
  savaGougeStrike: {
    name: 'Savage Gouge',
    damage: 15,
    accuracy: 80,
    damageType: 'EDGED_PIERCING',  // Like a claw attack
    range: 1,
    apCost: 2,
    special: { bleedChance: 25 },
  },
};

// ============ CHARACTER ARCHETYPES ============

// Tank: High HP, High DR, Slow
function createTank(name: string, nickname: string, weapon: SimWeapon): Fighter {
  const stats = {
    MEL: 18 + Math.floor(Math.random() * 4),  // 18-21
    RNG: 12 + Math.floor(Math.random() * 4),
    AGL: 10 + Math.floor(Math.random() * 4),  // 10-13 (slow)
    CON: 26 + Math.floor(Math.random() * 4),  // 26-29 (very tough)
    INS: 14 + Math.floor(Math.random() * 4),
    WIL: 22 + Math.floor(Math.random() * 4),  // High willpower
    INT: 14 + Math.floor(Math.random() * 4),
  };

  const hp = 50 + stats.CON * 2;  // 102-108 HP!

  const unit: SimUnit = {
    id: `tank-${name.toLowerCase().replace(/\s/g, '-')}`,
    name,
    team: 'blue',
    hp,
    maxHp: hp,
    shieldHp: 0,
    maxShieldHp: 0,
    dr: 3,  // Reduced from 5 to 3 - was causing 87% win rate imbalance
    stoppingPower: 5,
    origin: 'biological' as OriginType,
    stats,
    stance: 'normal',
    cover: 'none',
    statusEffects: [],
    accuracyPenalty: 0,
    weapon,
    ap: 3,  // Slow - only 3 AP
    maxAp: 3,
    position: { x: 0, y: 0 },
    alive: true,
    disarmed: false,
    beltLevel: 5 + Math.floor(Math.random() * 3),  // 5-7: Trained but not elite
  };

  return {
    unit,
    name,
    nickname,
    wins: 0,
    losses: 0,
    knockouts: 0,
    timesKOd: 0,
    totalDamageDealt: 0,
    totalDamageTaken: 0,
    injuries: [],
    statusHistory: [],
  };
}

// Speedster: High AGL, Fast attacks, Low HP
function createSpeedster(name: string, nickname: string, weapon: SimWeapon): Fighter {
  const stats = {
    MEL: 20 + Math.floor(Math.random() * 4),  // 20-23
    RNG: 16 + Math.floor(Math.random() * 4),
    AGL: 26 + Math.floor(Math.random() * 4),  // 26-29 (very fast)
    CON: 12 + Math.floor(Math.random() * 4),  // 12-15 (fragile)
    INS: 20 + Math.floor(Math.random() * 4),  // Good reflexes
    WIL: 14 + Math.floor(Math.random() * 4),
    INT: 16 + Math.floor(Math.random() * 4),
  };

  const hp = 50 + stats.CON * 2;  // 74-80 HP (low)

  const unit: SimUnit = {
    id: `speedster-${name.toLowerCase().replace(/\s/g, '-')}`,
    name,
    team: 'blue',
    hp,
    maxHp: hp,
    shieldHp: 0,
    maxShieldHp: 0,
    dr: 0,  // No armor
    stoppingPower: 0,
    origin: 'biological' as OriginType,
    stats,
    stance: 'normal',
    cover: 'none',
    statusEffects: [],
    accuracyPenalty: 0,
    weapon,
    ap: 6,  // Fast - 6 AP!
    maxAp: 6,
    position: { x: 0, y: 0 },
    alive: true,
    disarmed: false,
    beltLevel: 6 + Math.floor(Math.random() * 3),  // 6-8: Good reflexes = better training
  };

  return {
    unit,
    name,
    nickname,
    wins: 0,
    losses: 0,
    knockouts: 0,
    timesKOd: 0,
    totalDamageDealt: 0,
    totalDamageTaken: 0,
    injuries: [],
    statusHistory: [],
  };
}

// Glass Cannon: High damage weapon, Low defense
function createGlassCannon(name: string, nickname: string, weapon: SimWeapon): Fighter {
  const stats = {
    MEL: 24 + Math.floor(Math.random() * 4),  // 24-27 (very skilled)
    RNG: 20 + Math.floor(Math.random() * 4),
    AGL: 18 + Math.floor(Math.random() * 4),
    CON: 10 + Math.floor(Math.random() * 4),  // 10-13 (very fragile)
    INS: 16 + Math.floor(Math.random() * 4),
    WIL: 12 + Math.floor(Math.random() * 4),
    INT: 18 + Math.floor(Math.random() * 4),
  };

  const hp = 50 + stats.CON * 2;  // 70-76 HP (very low)

  const unit: SimUnit = {
    id: `glasscannon-${name.toLowerCase().replace(/\s/g, '-')}`,
    name,
    team: 'blue',
    hp,
    maxHp: hp,
    shieldHp: 0,
    maxShieldHp: 0,
    dr: 0,
    stoppingPower: 0,
    origin: 'biological' as OriginType,
    stats,
    stance: 'normal',
    cover: 'none',
    statusEffects: [],
    accuracyPenalty: 0,
    weapon,
    ap: 4,
    maxAp: 4,
    position: { x: 0, y: 0 },
    alive: true,
    disarmed: false,
    beltLevel: 7 + Math.floor(Math.random() * 3),  // 7-9: Skilled striker
  };

  return {
    unit,
    name,
    nickname,
    wins: 0,
    losses: 0,
    knockouts: 0,
    timesKOd: 0,
    totalDamageDealt: 0,
    totalDamageTaken: 0,
    injuries: [],
    statusHistory: [],
  };
}

// Shielded Fighter: Has energy shield that absorbs damage first
function createShieldedFighter(name: string, nickname: string, weapon: SimWeapon): Fighter {
  const stats = {
    MEL: 18 + Math.floor(Math.random() * 4),
    RNG: 18 + Math.floor(Math.random() * 4),
    AGL: 16 + Math.floor(Math.random() * 4),
    CON: 16 + Math.floor(Math.random() * 4),
    INS: 16 + Math.floor(Math.random() * 4),
    WIL: 18 + Math.floor(Math.random() * 4),
    INT: 18 + Math.floor(Math.random() * 4),
  };

  const hp = 50 + stats.CON * 2;  // 82-88 HP

  const unit: SimUnit = {
    id: `shielded-${name.toLowerCase().replace(/\s/g, '-')}`,
    name,
    team: 'blue',
    hp,
    maxHp: hp,
    shieldHp: 40,   // 40 shield HP!
    maxShieldHp: 40,
    dr: 2,
    stoppingPower: 2,
    origin: 'mutant' as OriginType,  // Mutant with energy powers
    stats,
    stance: 'normal',
    cover: 'none',
    statusEffects: [],
    accuracyPenalty: 0,
    weapon,
    ap: 4,
    maxAp: 4,
    position: { x: 0, y: 0 },
    alive: true,
    disarmed: false,
    beltLevel: 5 + Math.floor(Math.random() * 3),  // 5-7: Balanced fighter
  };

  return {
    unit,
    name,
    nickname,
    wins: 0,
    losses: 0,
    knockouts: 0,
    timesKOd: 0,
    totalDamageDealt: 0,
    totalDamageTaken: 0,
    injuries: [],
    statusHistory: [],
  };
}

// Gunslinger: Ranged specialist
function createGunslinger(name: string, nickname: string, weapon: SimWeapon): Fighter {
  const stats = {
    MEL: 12 + Math.floor(Math.random() * 4),  // 12-15 (weak melee)
    RNG: 26 + Math.floor(Math.random() * 4),  // 26-29 (excellent shot)
    AGL: 20 + Math.floor(Math.random() * 4),
    CON: 14 + Math.floor(Math.random() * 4),
    INS: 22 + Math.floor(Math.random() * 4),  // Good awareness
    WIL: 16 + Math.floor(Math.random() * 4),
    INT: 16 + Math.floor(Math.random() * 4),
  };

  const hp = 50 + stats.CON * 2;  // 78-84 HP

  const unit: SimUnit = {
    id: `gunslinger-${name.toLowerCase().replace(/\s/g, '-')}`,
    name,
    team: 'blue',
    hp,
    maxHp: hp,
    shieldHp: 0,
    maxShieldHp: 0,
    dr: 1,  // Light armor
    stoppingPower: 1,
    origin: 'biological' as OriginType,
    stats,
    stance: 'normal',
    cover: 'none',
    statusEffects: [],
    accuracyPenalty: 0,
    weapon,
    ap: 4,
    maxAp: 4,
    position: { x: 0, y: 0 },
    alive: true,
    disarmed: false,
    beltLevel: 3 + Math.floor(Math.random() * 3),  // 3-5: Ranged specialist, weak in melee
  };

  return {
    unit,
    name,
    nickname,
    wins: 0,
    losses: 0,
    knockouts: 0,
    timesKOd: 0,
    totalDamageDealt: 0,
    totalDamageTaken: 0,
    injuries: [],
    statusHistory: [],
  };
}

// ============ MAIN EXECUTION ============

function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║       MEGA COMBAT TOURNAMENT - EXPANDED EDITION            ║');
  console.log('║                                                            ║');
  console.log('║  Testing: DR, Shields, Archetypes, Weapons, Status FX      ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  // ============ 64-FIGHTER NFL-STYLE SEASON ============

  console.log('\n\n');
  console.log('╔══════════════════════════════════════════════════════════════════════╗');
  console.log('║                COMBAT LEAGUE SEASON 1                                 ║');
  console.log('║                                                                       ║');
  console.log('║  64 Fighters • 2 Conferences • 8 Divisions • Full Season + Playoffs   ║');
  console.log('╚══════════════════════════════════════════════════════════════════════╝');

  // ========== MELEE CONFERENCE ==========
  // Division 1: STRIKERS (Pure martial arts striking)
  const strikersDiv: TournamentFighter[] = [
    { fighter: createMartialArtist('Floyd Mayweather', 'Money', 'Boxing', EXPANDED_MARTIAL_ARTS.boxingCombo), corner: createCornerTeam() },
    { fighter: createMartialArtist('Buakaw Banchamek', 'White Lotus', 'Muay Thai', EXPANDED_MARTIAL_ARTS.muayThaiElbow), corner: createCornerTeam() },
    { fighter: createMartialArtist('Lyoto Machida', 'Dragon', 'Karate', EXPANDED_MARTIAL_ARTS.karateStrike), corner: createCornerTeam() },
    { fighter: createMartialArtist('Anthony Pettis', 'Showtime', 'TKD', EXPANDED_MARTIAL_ARTS.tkdKick), corner: createCornerTeam() },
  ];

  // Division 2: GRAPPLERS (Wrestling & submission)
  const grapplersDiv: TournamentFighter[] = [
    { fighter: createWrestler('Brock Lesnar', 'Beast', EXPANDED_MARTIAL_ARTS.wrestlingSlam), corner: createCornerTeam() },
    { fighter: createWrestler('Royce Gracie', 'BJJ Legend', EXPANDED_MARTIAL_ARTS.bjjChoke), corner: createCornerTeam() },
    { fighter: createWrestler('Ronda Rousey', 'Rowdy', EXPANDED_MARTIAL_ARTS.judoThrow), corner: createCornerTeam() },
    { fighter: createWrestler('Khabib Nurmagomedov', 'Eagle', EXPANDED_MARTIAL_ARTS.samboTakedown), corner: createCornerTeam() },
  ];

  // Division 3: BLADE MASTERS (Edged weapons)
  const bladeMastersDiv: TournamentFighter[] = [
    { fighter: createMartialArtist('Hattori Hanzo', 'Shogun', 'Iaido', EXOTIC_MELEE.katana), corner: createCornerTeam() },
    { fighter: createFighter('Blade Runner', 'Blade', TOURNAMENT_WEAPONS.knife), corner: createCornerTeam() },
    { fighter: createFighter('Machete Cortez', 'Machete', TOURNAMENT_WEAPONS.machete), corner: createCornerTeam() },
    { fighter: createMartialArtist('Spartacus Rex', 'Gladiator', 'Roman', EXOTIC_MELEE.spear), corner: createCornerTeam() },
  ];

  // Division 4: BRAWLERS (Blunt weapons & street)
  const brawlersDiv: TournamentFighter[] = [
    { fighter: createFighter('Iron Mike Thompson', 'Iron Mike', IMPROVISED_WEAPONS.brassKnuckles), corner: createCornerTeam() },
    { fighter: createFighter('Bar Room Billy', 'Barfly', IMPROVISED_WEAPONS.brokenBottle), corner: createCornerTeam() },
    { fighter: createFighter('Pipeline Pete', 'Plumber', IMPROVISED_WEAPONS.leadPipe), corner: createCornerTeam() },
    { fighter: createFighter('Sabu the Maniac', 'Sabu', IMPROVISED_WEAPONS.chair), corner: createCornerTeam() },
  ];

  // ========== RANGED CONFERENCE ==========
  // Division 5: GUNSLINGERS (Pistols & revolvers)
  const gunslingersDiv: TournamentFighter[] = [
    { fighter: createGunslinger('John Wick', 'Baba Yaga', RANGED_WEAPONS.pistol), corner: createCornerTeam() },
    { fighter: createGunslinger('Dirty Harry', 'Callahan', RANGED_WEAPONS.revolver), corner: createCornerTeam() },
    { fighter: createGunslinger('Vincent Vega', 'Pulp', RANGED_WEAPONS.pistol), corner: createCornerTeam() },
    { fighter: createGunslinger('Trinity Neo', 'Matrix', RANGED_WEAPONS.pistol), corner: createCornerTeam() },
  ];

  // Division 6: HEAVY HITTERS (Shotguns & SMGs)
  const heavyHittersDiv: TournamentFighter[] = [
    { fighter: createGunslinger('Terminator T-800', 'Terminator', RANGED_WEAPONS.shotgun), corner: createCornerTeam() },
    { fighter: createGunslinger('Tony Montana', 'Scarface', RANGED_WEAPONS.smg), corner: createCornerTeam() },
    { fighter: createGunslinger('Mad Max', 'Road Warrior', RANGED_WEAPONS.shotgun), corner: createCornerTeam() },
    { fighter: createGunslinger('Dutch Schaefer', 'Predator', RANGED_WEAPONS.smg), corner: createCornerTeam() },
  ];

  // Division 7: EXOTIC (Status effect weapons)
  const exoticDiv: TournamentFighter[] = [
    { fighter: createFighter('Static Shock', 'Shocker', EXOTIC_MELEE.electrifiedBlade), corner: createCornerTeam() },
    { fighter: createFighter('The Viper', 'Venom', TOURNAMENT_WEAPONS.poisonDagger), corner: createCornerTeam() },
    { fighter: createFighter('Fire Starter', 'Pyro', TOURNAMENT_WEAPONS.torch), corner: createCornerTeam() },
    { fighter: createFighter('Shock Trooper', 'Tesla', TOURNAMENT_WEAPONS.taser), corner: createCornerTeam() },
  ];

  // Division 8: ELITE (Special archetypes)
  const eliteDiv: TournamentFighter[] = [
    { fighter: createTank('The Mountain', 'Goliath', EXOTIC_MELEE.warHammer), corner: createCornerTeam() },
    { fighter: createSpeedster('The Flash', 'Speedster', EXPANDED_MARTIAL_ARTS.wingChunChain), corner: createCornerTeam() },
    { fighter: createShieldedFighter('Captain Shield', 'Defender', EXPANDED_MARTIAL_ARTS.kravMaga), corner: createCornerTeam() },
    { fighter: createGlassCannon('Assassin One', 'Blade', EXOTIC_MELEE.katana), corner: createCornerTeam() },
  ];

  // Now let's add 32 MORE fighters to reach 64!

  // ========== MELEE CONFERENCE (SOUTH) ==========
  // Division 9: MARTIAL ARTS MASTERS
  const mastersDiv: TournamentFighter[] = [
    { fighter: createMartialArtist('Ip Man', 'Grandmaster', 'Wing Chun', EXPANDED_MARTIAL_ARTS.wingChunChain), corner: createCornerTeam() },
    { fighter: createMartialArtist('Steven Seagal', 'Sensei', 'Aikido', EXPANDED_MARTIAL_ARTS.aikidoRedirect), corner: createCornerTeam() },
    { fighter: createMartialArtist('Mossad Agent', 'Krav Master', 'Krav Maga', EXPANDED_MARTIAL_ARTS.kravMaga), corner: createCornerTeam() },
    { fighter: createMartialArtist('Fedor Emelianenko', 'Last Emperor', 'Sambo', EXPANDED_MARTIAL_ARTS.samboTakedown), corner: createCornerTeam() },
  ];

  // Division 10: STREET FIGHTERS
  const streetFightersDiv: TournamentFighter[] = [
    { fighter: createFighter('Cody Travers', 'Metro City', EXPANDED_MARTIAL_ARTS.boxingCombo), corner: createCornerTeam() },
    { fighter: createFighter('Guy Hado', 'Ninja', EXPANDED_MARTIAL_ARTS.karateStrike), corner: createCornerTeam() },
    { fighter: createFighter('Poison Pink', 'Punk', IMPROVISED_WEAPONS.poolCue), corner: createCornerTeam() },
    { fighter: createFighter('Hugo Andore', 'Giant', EXPANDED_MARTIAL_ARTS.wrestlingSlam), corner: createCornerTeam() },
  ];

  // Division 11: HEAVY WEAPONS
  const heavyWeaponsDiv: TournamentFighter[] = [
    { fighter: createTank('Viking Ragnar', 'Berserker', EXOTIC_MELEE.battleAxe), corner: createCornerTeam() },
    { fighter: createTank('Thor Odinson', 'Thunder', EXOTIC_MELEE.warHammer), corner: createCornerTeam() },
    { fighter: createMartialArtist('Bo Staff Master', 'Monk', 'Shaolin', TOURNAMENT_WEAPONS.staff), corner: createCornerTeam() },
    { fighter: createFighter('Chain Gang', 'Prisoner', EXOTIC_MELEE.chainWhip), corner: createCornerTeam() },
  ];

  // Division 12: ASSASSINS
  const assassinsDiv: TournamentFighter[] = [
    { fighter: createSpeedster('Agent 47', 'Hitman', TOURNAMENT_WEAPONS.knife), corner: createCornerTeam() },
    { fighter: createGlassCannon('Ezio Auditore', 'Assassin', TOURNAMENT_WEAPONS.knife), corner: createCornerTeam() },
    { fighter: createSpeedster('Naruto Uzumaki', 'Shinobi', EXPANDED_MARTIAL_ARTS.karateStrike), corner: createCornerTeam() },
    { fighter: createGlassCannon('Scorpion MK', 'Specter', EXOTIC_MELEE.chainWhip), corner: createCornerTeam() },
  ];

  // ========== RANGED CONFERENCE (SOUTH) ==========
  // Division 13: SNIPERS (Precision)
  const snipersDiv: TournamentFighter[] = [
    { fighter: createGunslinger('Chris Kyle', 'Legend', RANGED_WEAPONS.pistol), corner: createCornerTeam() },
    { fighter: createGunslinger('Vasily Zaytsev', 'Stalingrad', RANGED_WEAPONS.revolver), corner: createCornerTeam() },
    { fighter: createGunslinger('Black Widow', 'Natasha', RANGED_WEAPONS.pistol), corner: createCornerTeam() },
    { fighter: createGunslinger('Deadshot', 'Never Miss', RANGED_WEAPONS.pistol), corner: createCornerTeam() },
  ];

  // Division 14: MERCENARIES
  const mercsDiv: TournamentFighter[] = [
    { fighter: createTank('Heavy Weapons Guy', 'Sasha', RANGED_WEAPONS.smg), corner: createCornerTeam() },
    { fighter: createGunslinger('Deadpool', 'Merc', RANGED_WEAPONS.pistol), corner: createCornerTeam() },
    { fighter: createGunslinger('Cable', 'Soldier', RANGED_WEAPONS.smg), corner: createCornerTeam() },
    { fighter: createShieldedFighter('War Machine', 'Iron Patriot', RANGED_WEAPONS.smg), corner: createCornerTeam() },
  ];

  // Division 15: BERSERKERS (High damage, no defense)
  const berserkersDiv: TournamentFighter[] = [
    { fighter: createGlassCannon('Wolverine', 'Logan', EXPANDED_MARTIAL_ARTS.savaGougeStrike), corner: createCornerTeam() },
    { fighter: createGlassCannon('Sabretooth', 'Creed', EXPANDED_MARTIAL_ARTS.savaGougeStrike), corner: createCornerTeam() },
    { fighter: createSpeedster('X-23', 'Laura', TOURNAMENT_WEAPONS.knife), corner: createCornerTeam() },
    { fighter: createGlassCannon('Daken', 'Dark Wolverine', EXPANDED_MARTIAL_ARTS.savaGougeStrike), corner: createCornerTeam() },
  ];

  // Division 16: SUPER SOLDIERS
  const superSoldiersDiv: TournamentFighter[] = [
    { fighter: createShieldedFighter('Captain America', 'Cap', EXPANDED_MARTIAL_ARTS.boxingCombo), corner: createCornerTeam() },
    { fighter: createTank('Colossus', 'Peter', EXPANDED_MARTIAL_ARTS.wrestlingSlam), corner: createCornerTeam() },
    { fighter: createShieldedFighter('Luke Cage', 'Power Man', EXPANDED_MARTIAL_ARTS.boxingCombo), corner: createCornerTeam() },
    { fighter: createSpeedster('Winter Soldier', 'Bucky', RANGED_WEAPONS.pistol), corner: createCornerTeam() },
  ];

  // Organize into conferences
  const meleeConferenceNorth = [strikersDiv, grapplersDiv, bladeMastersDiv, brawlersDiv];
  const meleeConferenceSouth = [mastersDiv, streetFightersDiv, heavyWeaponsDiv, assassinsDiv];
  const rangedConferenceNorth = [gunslingersDiv, heavyHittersDiv, exoticDiv, eliteDiv];
  const rangedConferenceSouth = [snipersDiv, mercsDiv, berserkersDiv, superSoldiersDiv];

  const divisionNames = {
    strikersDiv: '🥊 Strikers',
    grapplersDiv: '🤼 Grapplers',
    bladeMastersDiv: '⚔️ Blade Masters',
    brawlersDiv: '🍺 Brawlers',
    mastersDiv: '🥋 Masters',
    streetFightersDiv: '🏙️ Street Fighters',
    heavyWeaponsDiv: '🪓 Heavy Weapons',
    assassinsDiv: '🗡️ Assassins',
    gunslingersDiv: '🔫 Gunslingers',
    heavyHittersDiv: '💥 Heavy Hitters',
    exoticDiv: '⚡ Exotic',
    eliteDiv: '👑 Elite',
    snipersDiv: '🎯 Snipers',
    mercsDiv: '💰 Mercenaries',
    berserkersDiv: '😤 Berserkers',
    superSoldiersDiv: '🦸 Super Soldiers',
  };

  // Run regular season for each division
  console.log('\n');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('                        REGULAR SEASON');
  console.log('═══════════════════════════════════════════════════════════════');

  interface SeasonRecord {
    fighter: TournamentFighter;
    wins: number;
    losses: number;
    damageDealt: number;
    damageTaken: number;
    kos: number;
    division: string;
    conference: string;
  }

  const seasonRecords: SeasonRecord[] = [];
  const divisionWinners: TournamentFighter[] = [];

  function runDivisionSeason(division: TournamentFighter[], divName: string, confName: string): TournamentFighter {
    console.log(`\n┌─────────────────────────────────────────────────────────────┐`);
    console.log(`│  ${divName.padEnd(20)} - ${confName.padEnd(30)} │`);
    console.log(`└─────────────────────────────────────────────────────────────┘`);

    // Reset fighter records
    division.forEach(tf => {
      tf.fighter.wins = 0;
      tf.fighter.losses = 0;
      tf.fighter.totalDamageDealt = 0;
      tf.fighter.totalDamageTaken = 0;
      tf.fighter.knockouts = 0;
    });

    // Round-robin: each fighter plays every other fighter
    for (let i = 0; i < division.length; i++) {
      for (let j = i + 1; j < division.length; j++) {
        const result = runMatch(division[i], division[j], 3);
        console.log(`  ${result.fighter1.substring(0, 15).padEnd(15)} vs ${result.fighter2.substring(0, 15).padEnd(15)} -> ${result.winner.substring(0, 15)} by ${result.method}`);
      }
    }

    // Sort by wins, then by damage differential
    division.sort((a, b) => {
      if (b.fighter.wins !== a.fighter.wins) return b.fighter.wins - a.fighter.wins;
      const aDiff = a.fighter.totalDamageDealt - a.fighter.totalDamageTaken;
      const bDiff = b.fighter.totalDamageDealt - b.fighter.totalDamageTaken;
      return bDiff - aDiff;
    });

    console.log(`\n  Division Standings:`);
    division.forEach((tf, idx) => {
      const record = `${tf.fighter.wins}-${tf.fighter.losses}`;
      const dmgDiff = tf.fighter.totalDamageDealt - tf.fighter.totalDamageTaken;
      const dmgStr = dmgDiff >= 0 ? `+${dmgDiff}` : `${dmgDiff}`;
      console.log(`    ${idx + 1}. ${tf.fighter.name.substring(0, 20).padEnd(20)} ${record.padEnd(5)} (${dmgStr} dmg)`);

      seasonRecords.push({
        fighter: tf,
        wins: tf.fighter.wins,
        losses: tf.fighter.losses,
        damageDealt: tf.fighter.totalDamageDealt,
        damageTaken: tf.fighter.totalDamageTaken,
        kos: tf.fighter.knockouts,
        division: divName,
        conference: confName,
      });
    });

    console.log(`  🏆 Division Winner: ${division[0].fighter.name}`);
    return division[0];
  }

  // Run all divisions
  console.log('\n\n═══ MELEE CONFERENCE - NORTH ═══');
  divisionWinners.push(runDivisionSeason(strikersDiv, 'Strikers', 'Melee North'));
  divisionWinners.push(runDivisionSeason(grapplersDiv, 'Grapplers', 'Melee North'));
  divisionWinners.push(runDivisionSeason(bladeMastersDiv, 'Blade Masters', 'Melee North'));
  divisionWinners.push(runDivisionSeason(brawlersDiv, 'Brawlers', 'Melee North'));

  console.log('\n\n═══ MELEE CONFERENCE - SOUTH ═══');
  divisionWinners.push(runDivisionSeason(mastersDiv, 'Masters', 'Melee South'));
  divisionWinners.push(runDivisionSeason(streetFightersDiv, 'Street Fighters', 'Melee South'));
  divisionWinners.push(runDivisionSeason(heavyWeaponsDiv, 'Heavy Weapons', 'Melee South'));
  divisionWinners.push(runDivisionSeason(assassinsDiv, 'Assassins', 'Melee South'));

  console.log('\n\n═══ RANGED CONFERENCE - NORTH ═══');
  divisionWinners.push(runDivisionSeason(gunslingersDiv, 'Gunslingers', 'Ranged North'));
  divisionWinners.push(runDivisionSeason(heavyHittersDiv, 'Heavy Hitters', 'Ranged North'));
  divisionWinners.push(runDivisionSeason(exoticDiv, 'Exotic', 'Ranged North'));
  divisionWinners.push(runDivisionSeason(eliteDiv, 'Elite', 'Ranged North'));

  console.log('\n\n═══ RANGED CONFERENCE - SOUTH ═══');
  divisionWinners.push(runDivisionSeason(snipersDiv, 'Snipers', 'Ranged South'));
  divisionWinners.push(runDivisionSeason(mercsDiv, 'Mercenaries', 'Ranged South'));
  divisionWinners.push(runDivisionSeason(berserkersDiv, 'Berserkers', 'Ranged South'));
  divisionWinners.push(runDivisionSeason(superSoldiersDiv, 'Super Soldiers', 'Ranged South'));

  // ========== PLAYOFFS ==========
  console.log('\n\n');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('                         PLAYOFFS');
  console.log('═══════════════════════════════════════════════════════════════');

  // Reset all fighters for playoffs
  divisionWinners.forEach(tf => {
    tf.fighter.wins = 0;
    tf.fighter.losses = 0;
    tf.fighter.unit.hp = tf.fighter.unit.maxHp;
    tf.fighter.unit.alive = true;
  });

  // Conference Championships (8 -> 4)
  console.log('\n┌─────────────────────────────────────────────────────────────┐');
  console.log('│                   CONFERENCE QUARTERFINALS                   │');
  console.log('└─────────────────────────────────────────────────────────────┘');

  const quarterWinners: TournamentFighter[] = [];

  // Melee Conference Quarters
  console.log('\n  === MELEE CONFERENCE ===');
  for (let i = 0; i < 4; i++) {
    const result = runMatch(divisionWinners[i], divisionWinners[7 - i], 5);
    console.log(`  ${result.fighter1.substring(0, 18).padEnd(18)} vs ${result.fighter2.substring(0, 18).padEnd(18)} -> ${result.winner} by ${result.method}`);
    const winner = result.winner === divisionWinners[i].fighter.name ? divisionWinners[i] : divisionWinners[7 - i];
    quarterWinners.push(winner);
  }

  // Ranged Conference Quarters
  console.log('\n  === RANGED CONFERENCE ===');
  for (let i = 8; i < 12; i++) {
    const result = runMatch(divisionWinners[i], divisionWinners[23 - i], 5);
    console.log(`  ${result.fighter1.substring(0, 18).padEnd(18)} vs ${result.fighter2.substring(0, 18).padEnd(18)} -> ${result.winner} by ${result.method}`);
    const winner = result.winner === divisionWinners[i].fighter.name ? divisionWinners[i] : divisionWinners[23 - i];
    quarterWinners.push(winner);
  }

  // Conference Semifinals (4 -> 2)
  console.log('\n┌─────────────────────────────────────────────────────────────┐');
  console.log('│                   CONFERENCE SEMIFINALS                      │');
  console.log('└─────────────────────────────────────────────────────────────┘');

  const semiWinners: TournamentFighter[] = [];

  console.log('\n  === MELEE CONFERENCE ===');
  for (let i = 0; i < 2; i++) {
    const result = runMatch(quarterWinners[i], quarterWinners[3 - i], 5);
    result.log.forEach(l => console.log(l));
    const winner = result.winner === quarterWinners[i].fighter.name ? quarterWinners[i] : quarterWinners[3 - i];
    semiWinners.push(winner);
  }

  console.log('\n  === RANGED CONFERENCE ===');
  for (let i = 4; i < 6; i++) {
    const result = runMatch(quarterWinners[i], quarterWinners[11 - i], 5);
    result.log.forEach(l => console.log(l));
    const winner = result.winner === quarterWinners[i].fighter.name ? quarterWinners[i] : quarterWinners[11 - i];
    semiWinners.push(winner);
  }

  // Conference Finals
  console.log('\n┌─────────────────────────────────────────────────────────────┐');
  console.log('│                   CONFERENCE FINALS                          │');
  console.log('└─────────────────────────────────────────────────────────────┘');

  console.log('\n  === MELEE CONFERENCE CHAMPIONSHIP ===');
  const meleeChampResult = runMatch(semiWinners[0], semiWinners[1], 5);
  meleeChampResult.log.forEach(l => console.log(l));
  const meleeChampion = meleeChampResult.winner === semiWinners[0].fighter.name ? semiWinners[0] : semiWinners[1];
  console.log(`\n  🏆 MELEE CONFERENCE CHAMPION: ${meleeChampion.fighter.name}`);

  console.log('\n  === RANGED CONFERENCE CHAMPIONSHIP ===');
  const rangedChampResult = runMatch(semiWinners[2], semiWinners[3], 5);
  rangedChampResult.log.forEach(l => console.log(l));
  const rangedChampion = rangedChampResult.winner === semiWinners[2].fighter.name ? semiWinners[2] : semiWinners[3];
  console.log(`\n  🏆 RANGED CONFERENCE CHAMPION: ${rangedChampion.fighter.name}`);

  // GRAND CHAMPIONSHIP
  console.log('\n\n');
  console.log('╔══════════════════════════════════════════════════════════════════════╗');
  console.log('║                     🏆 GRAND CHAMPIONSHIP 🏆                          ║');
  console.log('╠══════════════════════════════════════════════════════════════════════╣');
  console.log(`║  ${meleeChampion.fighter.name.padEnd(30)} vs ${rangedChampion.fighter.name.padEnd(30)} ║`);
  console.log('╚══════════════════════════════════════════════════════════════════════╝');

  const grandFinalResult = runMatch(meleeChampion, rangedChampion, 7);  // Best of 7 for finals
  grandFinalResult.log.forEach(l => console.log(l));

  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════════════════════╗');
  console.log(`║       👑 SEASON 1 GRAND CHAMPION: ${grandFinalResult.winner.padEnd(30)}  ║`);
  console.log(`║       Method: ${grandFinalResult.method.padEnd(55)}║`);
  console.log('╚══════════════════════════════════════════════════════════════════════╝');

  // ========== SEASON STATISTICS ==========
  console.log('\n\n');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('                     SEASON STATISTICS');
  console.log('═══════════════════════════════════════════════════════════════');

  // Sort all fighters by wins
  seasonRecords.sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    return (b.damageDealt - b.damageTaken) - (a.damageDealt - a.damageTaken);
  });

  console.log('\n  TOP 10 FIGHTERS (Regular Season):');
  console.log('  ────────────────────────────────────────────────────────────');
  for (let i = 0; i < Math.min(10, seasonRecords.length); i++) {
    const r = seasonRecords[i];
    const record = `${r.wins}-${r.losses}`;
    const dmgDiff = r.damageDealt - r.damageTaken;
    console.log(`    ${(i + 1).toString().padStart(2)}. ${r.fighter.fighter.name.substring(0, 22).padEnd(22)} ${record.padEnd(5)} KOs: ${r.kos.toString().padStart(2)} Dmg: ${(dmgDiff >= 0 ? '+' : '') + dmgDiff}`);
  }

  // Best KO ratio
  const byKOs = [...seasonRecords].sort((a, b) => b.kos - a.kos);
  console.log('\n  TOP 5 KO ARTISTS:');
  console.log('  ────────────────────────────────────────────────────────────');
  for (let i = 0; i < Math.min(5, byKOs.length); i++) {
    const r = byKOs[i];
    console.log(`    ${(i + 1)}. ${r.fighter.fighter.name.substring(0, 22).padEnd(22)} - ${r.kos} KOs`);
  }

  // Best damage differential
  const byDamage = [...seasonRecords].sort((a, b) => (b.damageDealt - b.damageTaken) - (a.damageDealt - a.damageTaken));
  console.log('\n  TOP 5 DAMAGE DEALERS:');
  console.log('  ────────────────────────────────────────────────────────────');
  for (let i = 0; i < Math.min(5, byDamage.length); i++) {
    const r = byDamage[i];
    const diff = r.damageDealt - r.damageTaken;
    console.log(`    ${(i + 1)}. ${r.fighter.fighter.name.substring(0, 22).padEnd(22)} - +${diff} damage diff`);
  }

  // Division champion weapons analysis
  console.log('\n  DIVISION CHAMPIONS BY WEAPON:');
  console.log('  ────────────────────────────────────────────────────────────');
  const weaponCounts: Record<string, number> = {};
  divisionWinners.forEach(winner => {
    const weapon = winner.fighter.unit.weapon.name;
    weaponCounts[weapon] = (weaponCounts[weapon] || 0) + 1;
  });
  Object.entries(weaponCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([weapon, count]) => {
      console.log(`    ${weapon.padEnd(25)} - ${count} division win${count > 1 ? 's' : ''}`);
    });

  // Archetype analysis
  console.log('\n  PERFORMANCE BY ARCHETYPE:');
  console.log('  ────────────────────────────────────────────────────────────');
  const archetypeStats: Record<string, { wins: number; losses: number; fighters: number }> = {};
  seasonRecords.forEach(r => {
    let archetype = 'Standard';
    const unit = r.fighter.fighter.unit;
    if (unit.dr >= 5) archetype = 'Tank';
    else if (unit.ap >= 6) archetype = 'Speedster';
    else if (unit.shieldHp > 0) archetype = 'Shielded';
    else if (unit.maxHp <= 76) archetype = 'Glass Cannon';
    else if ((unit.stats.RNG || 0) >= 25) archetype = 'Gunslinger';
    else if ((unit.stats.MEL || 0) >= 22) archetype = 'Martial Artist';
    else if (unit.dr >= 2) archetype = 'Wrestler';

    if (!archetypeStats[archetype]) {
      archetypeStats[archetype] = { wins: 0, losses: 0, fighters: 0 };
    }
    archetypeStats[archetype].wins += r.wins;
    archetypeStats[archetype].losses += r.losses;
    archetypeStats[archetype].fighters++;
  });

  Object.entries(archetypeStats)
    .sort((a, b) => (b[1].wins / (b[1].wins + b[1].losses)) - (a[1].wins / (a[1].wins + a[1].losses)))
    .forEach(([arch, stats]) => {
      const winRate = Math.round((stats.wins / (stats.wins + stats.losses)) * 100);
      console.log(`    ${arch.padEnd(15)} - ${stats.wins}W/${stats.losses}L (${winRate}% win rate, ${stats.fighters} fighters)`);
    });

  // FINAL ANALYSIS
  console.log('\n\n');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                    SEASON ANALYSIS                         ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  // DR Analysis - did tanks survive better?
  console.log('\n  DR (DAMAGE REDUCTION) ANALYSIS:');
  console.log('  ────────────────────────────────────────────────────────────');
  const tankRecords = seasonRecords.filter(r => r.fighter.fighter.unit.dr >= 5);
  const nonTankRecords = seasonRecords.filter(r => r.fighter.fighter.unit.dr === 0);
  if (tankRecords.length > 0) {
    const tankAvgDmgTaken = Math.round(tankRecords.reduce((a, r) => a + r.damageTaken, 0) / tankRecords.length);
    const nonTankAvgDmgTaken = nonTankRecords.length > 0
      ? Math.round(nonTankRecords.reduce((a, r) => a + r.damageTaken, 0) / nonTankRecords.length)
      : 0;
    console.log(`    Tanks (DR 5+): ${tankRecords.length} fighters, avg ${tankAvgDmgTaken} damage taken`);
    console.log(`    No Armor (DR 0): ${nonTankRecords.length} fighters, avg ${nonTankAvgDmgTaken} damage taken`);
    console.log(`    DR Reduction: ${nonTankAvgDmgTaken - tankAvgDmgTaken} damage saved per fight`);
    if (tankAvgDmgTaken >= nonTankAvgDmgTaken * 0.9) {
      console.log(`    ⚠️  DR may not be working - tanks took similar damage!`);
    }
  }

  // Shield Analysis
  console.log('\n  SHIELD ABSORPTION ANALYSIS:');
  console.log('  ────────────────────────────────────────────────────────────');
  const shieldedRecords = seasonRecords.filter(r => r.fighter.fighter.unit.maxShieldHp > 0);
  if (shieldedRecords.length > 0) {
    const shieldedWinRate = Math.round((shieldedRecords.reduce((a, r) => a + r.wins, 0) /
                                        shieldedRecords.reduce((a, r) => a + r.wins + r.losses, 0)) * 100);
    console.log(`    Shielded fighters: ${shieldedRecords.length}`);
    console.log(`    Shield win rate: ${shieldedWinRate}%`);
    shieldedRecords.forEach(r => {
      const shieldRemaining = r.fighter.fighter.unit.shieldHp;
      console.log(`      ${r.fighter.fighter.name}: ${shieldRemaining}/${r.fighter.fighter.unit.maxShieldHp} shield remaining`);
    });
  }

  // Status Effects Summary
  console.log('\n  STATUS EFFECTS OBSERVED:');
  console.log('  ────────────────────────────────────────────────────────────');
  const allStatusEffects = seasonRecords.flatMap(r => r.fighter.fighter.statusHistory);
  const uniqueEffects = [...new Set(allStatusEffects)];
  if (uniqueEffects.length > 0) {
    console.log(`    Effects seen: ${uniqueEffects.join(', ')}`);
  } else {
    console.log(`    ⚠️  No status effects recorded - check if damage types trigger effects!`);
  }

  // Speed vs Power
  console.log('\n  SPEED vs POWER ANALYSIS:');
  console.log('  ────────────────────────────────────────────────────────────');
  const speedsters = seasonRecords.filter(r => r.fighter.fighter.unit.ap >= 6);
  const tanks = seasonRecords.filter(r => r.fighter.fighter.unit.ap <= 3);
  if (speedsters.length > 0 && tanks.length > 0) {
    const speedWinRate = Math.round((speedsters.reduce((a, r) => a + r.wins, 0) /
                                     speedsters.reduce((a, r) => a + r.wins + r.losses, 0)) * 100);
    const tankWinRate = Math.round((tanks.reduce((a, r) => a + r.wins, 0) /
                                    tanks.reduce((a, r) => a + r.wins + r.losses, 0)) * 100);
    console.log(`    Speedsters (6 AP): ${speedWinRate}% win rate`);
    console.log(`    Tanks (3 AP): ${tankWinRate}% win rate`);
    if (speedWinRate > tankWinRate + 20) {
      console.log(`    ⚠️  Speed dominates - consider buffing slow fighters`);
    } else if (tankWinRate > speedWinRate + 20) {
      console.log(`    ⚠️  Tanks dominate - speed advantage not enough`);
    } else {
      console.log(`    ✓ Speed vs Power seems balanced`);
    }
  }

  console.log(`
═══════════════════════════════════════════════════════════════
                    COMBAT SYSTEM LEARNINGS
═══════════════════════════════════════════════════════════════

WHAT WE TESTED:
---------------
✓ 64 Fighters across 16 divisions
✓ Multiple archetypes: Tanks (DR 5), Speedsters (6 AP), Shielded, Glass Cannons
✓ Weapon categories: Martial Arts, Blades, Blunt, Improvised, Ranged, Exotic
✓ Status effect weapons: Knife (bleeding), Torch (burning), Taser (stun), Poison dagger

KEY QUESTIONS ANSWERED:
-----------------------
1. Does DR reduce damage?     -> Check tank damage taken vs unarmored
2. Do shields absorb first?   -> Check shield HP after fights
3. Does speed beat power?     -> Compare speedster vs tank win rates
4. Which weapons dominate?    -> Check division champion weapons
5. Do status effects trigger? -> Check status effects observed

BALANCE ISSUES TO INVESTIGATE:
------------------------------
- If one archetype dominates (>70% win rate), it needs adjustment
- If status effects never appear, damage type → effect wiring is broken
- If tanks take same damage as unarmored, DR isn't being applied
- If shields are always at max after fights, they're never getting hit
`);
}

// Run if executed directly
main();
