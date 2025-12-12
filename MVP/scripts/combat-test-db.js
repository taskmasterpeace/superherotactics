/**
 * SuperHero Tactics - Comprehensive Combat Test
 * Tests combat using characters and data from the database
 *
 * Run: node scripts/combat-test-db.js
 */

const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 54322,
  database: 'superhero_tactics',
  user: 'postgres',
  password: 'postgres',
});

// ============== COMBAT SYSTEM ==============

class Fighter {
  constructor(data) {
    // Identity
    this.id = data.id;
    this.name = data.alias || data.name;
    this.realName = data.real_name;

    // Primary stats
    this.mel = data.mel || 50;
    this.agl = data.agl || 50;
    this.str = data.str || 50;
    this.sta = data.sta || 50;
    this.int = data.int || 50;
    this.ins = data.ins || 50;
    this.con = data.con || 50;

    // Derived stats
    this.maxHealth = (this.sta * 2) + this.str;
    this.health = this.maxHealth;
    this.initiative = Math.floor((this.agl + this.ins) / 2);
    this.movement = 6 + Math.floor(this.agl / 10);

    // Combat
    this.powers = data.powers || [];
    this.martialArts = data.martial_arts || [];
    this.weapon = data.weapon || null;
    this.statusEffects = [];

    // Meta
    this.threatLevel = data.threat_level || 'THREAT_1';
    this.originType = data.origin_type || 'Skilled';
  }

  isAlive() {
    return this.health > 0;
  }

  takeDamage(amount) {
    const actualDamage = Math.max(0, amount);
    this.health -= actualDamage;
    return actualDamage;
  }

  heal(amount) {
    this.health = Math.min(this.maxHealth, this.health + amount);
  }

  getBestAttack() {
    let best = { name: 'Basic Attack', damage: 5 + Math.floor(this.str / 10), type: 'melee' };

    // Check powers
    for (const power of this.powers) {
      if (power.damage && power.damage > best.damage) {
        best = { name: power.name, damage: power.damage, type: 'power', power };
      }
    }

    // Check martial arts
    for (const tech of this.martialArts) {
      if (tech.damage && tech.damage > best.damage) {
        best = { name: tech.name, damage: tech.damage, type: 'martial_arts', tech };
      }
    }

    // Check weapon
    if (this.weapon && this.weapon.base_damage > best.damage) {
      best = { name: this.weapon.name, damage: this.weapon.base_damage, type: 'weapon', weapon: this.weapon };
    }

    return best;
  }

  getRandomAttack() {
    const attacks = [];

    // Basic attack always available
    attacks.push({ name: 'Basic Attack', damage: 5 + Math.floor(this.str / 10), type: 'melee' });

    // Add powers
    for (const power of this.powers) {
      if (power.damage > 0) {
        attacks.push({ name: power.name, damage: power.damage, type: 'power' });
      }
    }

    // Add martial arts
    for (const tech of this.martialArts) {
      if (tech.damage > 0) {
        attacks.push({ name: tech.name, damage: tech.damage, type: 'martial_arts' });
      }
    }

    // Weapon
    if (this.weapon && this.weapon.base_damage > 0) {
      attacks.push({ name: this.weapon.name, damage: this.weapon.base_damage, type: 'weapon' });
    }

    return attacks[Math.floor(Math.random() * attacks.length)];
  }
}

class CombatSimulator {
  constructor() {
    this.log = [];
    this.turn = 0;
    this.maxTurns = 50;
  }

  rollD100() {
    return Math.floor(Math.random() * 100) + 1;
  }

  calculateHitChance(attacker, defender, attack) {
    // Base hit chance from attacker's MEL or AGL (depending on attack type)
    let hitStat = attack.type === 'melee' || attack.type === 'martial_arts' ? attacker.mel : attacker.agl;

    // Defender's AGL reduces hit chance
    let dodgeChance = defender.agl / 3;

    // Calculate final hit chance (capped at 95%)
    return Math.min(95, Math.max(5, hitStat - dodgeChance + 30));
  }

  calculateDamage(attacker, attack) {
    let baseDamage = attack.damage;

    // Add STR bonus for melee attacks
    if (attack.type === 'melee' || attack.type === 'martial_arts') {
      baseDamage += Math.floor(attacker.str / 10);
    }

    // Add variance (+/- 20%)
    const variance = 0.8 + (Math.random() * 0.4);
    return Math.floor(baseDamage * variance);
  }

  fight(fighter1, fighter2, verbose = false) {
    this.log = [];
    this.turn = 0;

    // Determine initiative order
    const first = fighter1.initiative >= fighter2.initiative ? fighter1 : fighter2;
    const second = first === fighter1 ? fighter2 : fighter1;

    this.log.push(`\n${'='.repeat(60)}`);
    this.log.push(`⚔️  ${fighter1.name} (${fighter1.threatLevel}) vs ${fighter2.name} (${fighter2.threatLevel})`);
    this.log.push(`${'='.repeat(60)}`);
    this.log.push(`${fighter1.name}: HP ${fighter1.health}, MEL ${fighter1.mel}, STR ${fighter1.str}`);
    this.log.push(`${fighter2.name}: HP ${fighter2.health}, MEL ${fighter2.mel}, STR ${fighter2.str}`);
    this.log.push(`Initiative: ${first.name} goes first (${first.initiative} vs ${second.initiative})`);
    this.log.push(`${'─'.repeat(60)}`);

    while (fighter1.isAlive() && fighter2.isAlive() && this.turn < this.maxTurns) {
      this.turn++;

      // First fighter attacks
      if (first.isAlive() && second.isAlive()) {
        this.performAttack(first, second);
      }

      // Second fighter attacks
      if (first.isAlive() && second.isAlive()) {
        this.performAttack(second, first);
      }
    }

    // Determine winner
    let winner = null;
    let result = '';

    if (!fighter1.isAlive() && !fighter2.isAlive()) {
      result = 'DRAW (mutual destruction)';
    } else if (!fighter1.isAlive()) {
      winner = fighter2;
      result = `${fighter2.name} WINS!`;
    } else if (!fighter2.isAlive()) {
      winner = fighter1;
      result = `${fighter1.name} WINS!`;
    } else {
      // Timeout - whoever has more HP wins
      winner = fighter1.health >= fighter2.health ? fighter1 : fighter2;
      result = `${winner.name} WINS (timeout - more HP)`;
    }

    this.log.push(`${'─'.repeat(60)}`);
    this.log.push(`🏆 Result: ${result}`);
    this.log.push(`   Turns: ${this.turn}`);
    this.log.push(`   ${fighter1.name} Final HP: ${fighter1.health}/${fighter1.maxHealth}`);
    this.log.push(`   ${fighter2.name} Final HP: ${fighter2.health}/${fighter2.maxHealth}`);

    if (verbose) {
      console.log(this.log.join('\n'));
    }

    return {
      winner,
      turns: this.turn,
      fighter1FinalHP: fighter1.health,
      fighter2FinalHP: fighter2.health,
      log: this.log
    };
  }

  performAttack(attacker, defender) {
    const attack = attacker.getRandomAttack();
    const hitChance = this.calculateHitChance(attacker, defender, attack);
    const roll = this.rollD100();

    if (roll <= hitChance) {
      const damage = this.calculateDamage(attacker, attack);
      defender.takeDamage(damage);

      this.log.push(`T${this.turn}: ${attacker.name} uses ${attack.name} → HIT! ${damage} damage (${defender.name} HP: ${defender.health})`);
    } else {
      this.log.push(`T${this.turn}: ${attacker.name} uses ${attack.name} → MISS (rolled ${roll} vs ${hitChance}%)`);
    }
  }
}

// ============== DATABASE QUERIES ==============

async function loadCharacters() {
  const result = await client.query(`
    SELECT * FROM characters ORDER BY threat_level DESC, name
  `);
  return result.rows;
}

async function loadCharacterPowers(characterId) {
  const result = await client.query(`
    SELECT p.*, cp.power_rank
    FROM character_powers cp
    JOIN powers p ON p.id = cp.power_id
    WHERE cp.character_id = $1
  `, [characterId]);
  return result.rows;
}

async function loadMartialArtsTechniques(styleId) {
  const result = await client.query(`
    SELECT * FROM martial_arts_techniques WHERE style_id = $1 ORDER BY belt_required
  `, [styleId]);
  return result.rows;
}

async function loadAllMartialArts() {
  const result = await client.query(`
    SELECT * FROM martial_arts_techniques ORDER BY style_id, belt_required
  `);
  return result.rows;
}

async function loadWeapon(weaponId) {
  const result = await client.query(`SELECT * FROM weapons WHERE id = $1`, [weaponId]);
  return result.rows[0];
}

async function createFighter(characterData) {
  // Load powers
  const powers = await loadCharacterPowers(characterData.id);

  // For testing, give high-level martial arts techniques based on origin
  let martialArts = [];
  if (characterData.origin_type === 'Skilled' || characterData.mel >= 100) {
    // Give some martial arts
    const techniques = await loadAllMartialArts();
    martialArts = techniques.filter(t => t.belt_required <= 6 && t.damage > 0);
  }

  return new Fighter({
    ...characterData,
    powers: powers.map(p => ({ name: p.name, damage: p.damage || 0 })),
    martial_arts: martialArts.map(t => ({ name: t.name, damage: t.damage || 0 }))
  });
}

// ============== TEST SCENARIOS ==============

async function runPowerVsPower() {
  console.log('\n' + '═'.repeat(70));
  console.log('  TEST 1: POWER VS POWER - Super-Dude vs Thunder God');
  console.log('═'.repeat(70));

  const characters = await loadCharacters();
  const superdude = characters.find(c => c.alias === 'Super-Dude');
  const thunderGod = characters.find(c => c.alias === 'Thunder God');

  if (!superdude || !thunderGod) {
    console.log('Characters not found!');
    return;
  }

  const fighter1 = await createFighter(superdude);
  const fighter2 = await createFighter(thunderGod);

  const sim = new CombatSimulator();
  const result = sim.fight(fighter1, fighter2, true);

  console.log('\nPowers used:');
  console.log(`  ${fighter1.name}: ${fighter1.powers.map(p => p.name).join(', ') || 'None'}`);
  console.log(`  ${fighter2.name}: ${fighter2.powers.map(p => p.name).join(', ') || 'None'}`);
}

async function runSkilledVsPowered() {
  console.log('\n' + '═'.repeat(70));
  console.log('  TEST 2: SKILLED VS POWERED - Bat-Dude vs Spider-Guy');
  console.log('═'.repeat(70));

  const characters = await loadCharacters();
  const batDude = characters.find(c => c.alias === 'Bat-Dude');
  const spiderGuy = characters.find(c => c.alias === 'Spider-Guy');

  if (!batDude || !spiderGuy) {
    console.log('Characters not found!');
    return;
  }

  const fighter1 = await createFighter(batDude);
  const fighter2 = await createFighter(spiderGuy);

  const sim = new CombatSimulator();
  sim.fight(fighter1, fighter2, true);
}

async function runVillainShowdown() {
  console.log('\n' + '═'.repeat(70));
  console.log('  TEST 3: VILLAIN SHOWDOWN - Joking Man vs Magnos');
  console.log('═'.repeat(70));

  const characters = await loadCharacters();
  const joker = characters.find(c => c.alias === 'The Joking Man');
  const magnos = characters.find(c => c.alias === 'Magnos');

  if (!joker || !magnos) {
    console.log('Characters not found!');
    return;
  }

  const fighter1 = await createFighter(joker);
  const fighter2 = await createFighter(magnos);

  const sim = new CombatSimulator();
  sim.fight(fighter1, fighter2, true);
}

async function runMartialArtsVsMartialArts() {
  console.log('\n' + '═'.repeat(70));
  console.log('  TEST 4: MARTIAL ARTS - Bat-Dude vs Dark Widow');
  console.log('═'.repeat(70));

  const characters = await loadCharacters();
  const batDude = characters.find(c => c.alias === 'Bat-Dude');
  const darkWidow = characters.find(c => c.alias === 'Dark Widow');

  if (!batDude || !darkWidow) {
    console.log('Characters not found!');
    return;
  }

  const fighter1 = await createFighter(batDude);
  const fighter2 = await createFighter(darkWidow);

  const sim = new CombatSimulator();
  sim.fight(fighter1, fighter2, true);
}

async function runTournament() {
  console.log('\n' + '═'.repeat(70));
  console.log('  TEST 5: HERO TOURNAMENT (100 matches)');
  console.log('═'.repeat(70));

  const characters = await loadCharacters();
  const heroes = characters.filter(c => c.faction_id !== 'syndicate' && c.faction_id !== 'hydra');

  const stats = {};
  const sim = new CombatSimulator();

  for (const char of heroes) {
    stats[char.alias || char.name] = { wins: 0, losses: 0, draws: 0 };
  }

  let matchCount = 0;
  for (let i = 0; i < 100; i++) {
    // Pick two random heroes
    const idx1 = Math.floor(Math.random() * heroes.length);
    let idx2 = Math.floor(Math.random() * heroes.length);
    while (idx2 === idx1) {
      idx2 = Math.floor(Math.random() * heroes.length);
    }

    const fighter1 = await createFighter(heroes[idx1]);
    const fighter2 = await createFighter(heroes[idx2]);

    const result = sim.fight(fighter1, fighter2, false);
    matchCount++;

    const name1 = heroes[idx1].alias || heroes[idx1].name;
    const name2 = heroes[idx2].alias || heroes[idx2].name;

    if (result.winner === fighter1) {
      stats[name1].wins++;
      stats[name2].losses++;
    } else if (result.winner === fighter2) {
      stats[name2].wins++;
      stats[name1].losses++;
    } else {
      stats[name1].draws++;
      stats[name2].draws++;
    }
  }

  // Sort by win rate
  const sorted = Object.entries(stats)
    .map(([name, s]) => ({
      name,
      wins: s.wins,
      losses: s.losses,
      draws: s.draws,
      total: s.wins + s.losses + s.draws,
      winRate: s.wins + s.losses > 0 ? (s.wins / (s.wins + s.losses) * 100).toFixed(1) : 0
    }))
    .filter(s => s.total > 0)
    .sort((a, b) => parseFloat(b.winRate) - parseFloat(a.winRate));

  console.log('\n🏆 TOURNAMENT RESULTS (100 matches):');
  console.log('─'.repeat(50));
  console.log('Rank  Hero                    W    L    D   Win%');
  console.log('─'.repeat(50));

  sorted.forEach((s, i) => {
    console.log(`${(i + 1).toString().padStart(3)}   ${s.name.padEnd(20)} ${s.wins.toString().padStart(3)}  ${s.losses.toString().padStart(3)}  ${s.draws.toString().padStart(3)}  ${s.winRate}%`);
  });
}

async function runThreatLevelAnalysis() {
  console.log('\n' + '═'.repeat(70));
  console.log('  TEST 6: THREAT LEVEL ANALYSIS');
  console.log('═'.repeat(70));

  const characters = await loadCharacters();

  // Group by threat level
  const byThreat = {};
  for (const char of characters) {
    const level = char.threat_level || 'THREAT_1';
    if (!byThreat[level]) byThreat[level] = [];
    byThreat[level].push(char);
  }

  console.log('\nCharacters by Threat Level:');
  console.log('─'.repeat(50));

  for (const [level, chars] of Object.entries(byThreat).sort()) {
    console.log(`\n${level}:`);
    for (const char of chars) {
      const powers = await loadCharacterPowers(char.id);
      const powerNames = powers.map(p => p.name).join(', ') || 'None';
      console.log(`  ${char.alias || char.name} (${char.origin_type})`);
      console.log(`    Stats: MEL ${char.mel}, AGL ${char.agl}, STR ${char.str}, STA ${char.sta}`);
      console.log(`    Powers: ${powerNames}`);
    }
  }
}

async function runDatabaseStats() {
  console.log('\n' + '═'.repeat(70));
  console.log('  DATABASE STATISTICS');
  console.log('═'.repeat(70));

  const counts = await Promise.all([
    client.query('SELECT COUNT(*) as count FROM characters'),
    client.query('SELECT COUNT(*) as count FROM powers'),
    client.query('SELECT COUNT(*) as count FROM skills'),
    client.query('SELECT COUNT(*) as count FROM weapons'),
    client.query('SELECT COUNT(*) as count FROM cities'),
    client.query('SELECT COUNT(*) as count FROM countries'),
    client.query('SELECT COUNT(*) as count FROM factions'),
    client.query('SELECT COUNT(*) as count FROM materials'),
    client.query('SELECT COUNT(*) as count FROM status_effects'),
    client.query('SELECT COUNT(*) as count FROM martial_arts_styles'),
    client.query('SELECT COUNT(*) as count FROM martial_arts_techniques'),
  ]);

  console.log('\n📊 Database Contents:');
  console.log('─'.repeat(40));
  console.log(`  Characters:      ${counts[0].rows[0].count.toString().padStart(5)}`);
  console.log(`  Powers:          ${counts[1].rows[0].count.toString().padStart(5)}`);
  console.log(`  Skills:          ${counts[2].rows[0].count.toString().padStart(5)}`);
  console.log(`  Weapons:         ${counts[3].rows[0].count.toString().padStart(5)}`);
  console.log(`  Cities:          ${counts[4].rows[0].count.toString().padStart(5)}`);
  console.log(`  Countries:       ${counts[5].rows[0].count.toString().padStart(5)}`);
  console.log(`  Factions:        ${counts[6].rows[0].count.toString().padStart(5)}`);
  console.log(`  Materials:       ${counts[7].rows[0].count.toString().padStart(5)}`);
  console.log(`  Status Effects:  ${counts[8].rows[0].count.toString().padStart(5)}`);
  console.log(`  MA Styles:       ${counts[9].rows[0].count.toString().padStart(5)}`);
  console.log(`  MA Techniques:   ${counts[10].rows[0].count.toString().padStart(5)}`);
}

// ============== MAIN ==============

async function main() {
  console.log('╔════════════════════════════════════════════════════════════════════╗');
  console.log('║     SuperHero Tactics - Comprehensive Combat Testing               ║');
  console.log('║     Loading characters and data from PostgreSQL database           ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝');

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Run all tests
    await runDatabaseStats();
    await runThreatLevelAnalysis();
    await runPowerVsPower();
    await runSkilledVsPowered();
    await runVillainShowdown();
    await runMartialArtsVsMartialArts();
    await runTournament();

    console.log('\n' + '═'.repeat(70));
    console.log('  ALL TESTS COMPLETE');
    console.log('═'.repeat(70));

  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    await client.end();
  }
}

main();
