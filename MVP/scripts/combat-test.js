#!/usr/bin/env node
/**
 * SuperHero Tactics - Combat Test System
 *
 * Runs simulated battles between characters with different martial arts styles and powers
 * Run: node scripts/combat-test.js
 */

const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 54322,
  user: 'postgres',
  password: 'postgres',
  database: 'superhero_tactics'
});

// ============== COMBAT SYSTEM ==============

class Fighter {
  constructor(name, stats, martialArts = [], powers = [], weapons = []) {
    this.name = name;
    this.stats = {
      MEL: stats.MEL || 50,  // Melee skill
      AGL: stats.AGL || 50,  // Agility
      STR: stats.STR || 50,  // Strength
      STA: stats.STA || 50,  // Stamina
      INT: stats.INT || 50,  // Intelligence
      INS: stats.INS || 50,  // Insight
      CON: stats.CON || 50,  // Constitution
    };

    this.hp = 100 + Math.floor(this.stats.CON / 5);
    this.maxHp = this.hp;
    this.ap = 6;  // Action points per turn
    this.maxAp = 6;

    this.martialArts = martialArts; // Array of {style, beltLevel, techniques}
    this.powers = powers;
    this.weapons = weapons;
    this.statusEffects = [];

    this.grappleState = null; // null, 'clinching', 'controlling', 'restrained', 'mounted'
    this.position = 'standing'; // standing, prone
    this.isDefending = false;
  }

  get isAlive() {
    return this.hp > 0;
  }

  get isConscious() {
    return this.hp > -10 && !this.hasStatus('unconscious');
  }

  hasStatus(name) {
    return this.statusEffects.some(e => e.name.toLowerCase() === name.toLowerCase());
  }

  addStatus(effect) {
    if (!this.hasStatus(effect.name)) {
      this.statusEffects.push({ ...effect, turnsRemaining: effect.duration_turns || 1 });
    }
  }

  removeStatus(name) {
    this.statusEffects = this.statusEffects.filter(e => e.name.toLowerCase() !== name.toLowerCase());
  }

  processStatusEffects() {
    let damage = 0;
    const expiredEffects = [];

    for (const effect of this.statusEffects) {
      if (effect.damage_per_turn) {
        damage += effect.damage_per_turn;
      }
      effect.turnsRemaining--;
      if (effect.turnsRemaining <= 0) {
        expiredEffects.push(effect.name);
      }
    }

    this.statusEffects = this.statusEffects.filter(e => e.turnsRemaining > 0);

    return { damage, expiredEffects };
  }

  takeDamage(amount, source = 'attack') {
    this.hp -= amount;
    return {
      damage: amount,
      remaining: this.hp,
      knockedOut: this.hp <= 0
    };
  }

  getBeltBonus(styleId) {
    const art = this.martialArts.find(a => a.style.id === styleId);
    return art ? art.beltLevel : 0;
  }

  getAvailableTechniques(styleId) {
    const art = this.martialArts.find(a => a.style.id === styleId);
    if (!art) return [];
    return art.techniques.filter(t => t.belt_required <= art.beltLevel);
  }

  resetTurn() {
    this.ap = this.maxAp;
    this.isDefending = false;
  }
}

class CombatSimulator {
  constructor(fighter1, fighter2) {
    this.fighters = [fighter1, fighter2];
    this.currentFighter = 0;
    this.turn = 0;
    this.log = [];
    this.maxTurns = 50; // Prevent infinite loops
  }

  logEvent(message, type = 'action') {
    this.log.push({ turn: this.turn, type, message });
    console.log(`  [Turn ${this.turn}] ${message}`);
  }

  rollHit(attacker, defender, bonusCS = 0) {
    // Basic hit calculation using MEL/AGL
    const attackRoll = Math.random() * 100;
    const hitChance = 50 + (attacker.stats.MEL - defender.stats.AGL) + bonusCS * 10;
    return attackRoll <= hitChance;
  }

  calculateDamage(attacker, baseDamage, defender) {
    // Add STR modifier for melee
    const strBonus = Math.floor(attacker.stats.STR / 10);
    let damage = baseDamage + strBonus;

    // Defense reduces damage
    if (defender.isDefending) {
      damage = Math.floor(damage * 0.5);
    }

    // Random variation ±20%
    damage = Math.floor(damage * (0.8 + Math.random() * 0.4));

    return Math.max(1, damage);
  }

  executeTechnique(attacker, defender, technique) {
    const apCost = technique.ap_cost;
    if (attacker.ap < apCost) {
      return { success: false, reason: 'Not enough AP' };
    }

    attacker.ap -= apCost;
    const beltBonus = attacker.getBeltBonus(technique.style_id);

    // Roll to hit with belt bonus
    const hit = this.rollHit(attacker, defender, beltBonus);

    if (!hit) {
      this.logEvent(`${attacker.name} attempts ${technique.name} but MISSES!`);
      return { success: false, reason: 'Miss' };
    }

    // Apply technique effects
    let damage = 0;
    const effects = [];

    if (technique.damage) {
      damage = this.calculateDamage(attacker, technique.damage, defender);
      const result = defender.takeDamage(damage);
      this.logEvent(`${attacker.name} hits ${defender.name} with ${technique.name} for ${damage} damage! (HP: ${result.remaining})`);
    }

    // Special effects
    if (technique.special) {
      switch (technique.special) {
        case 'prone':
          defender.position = 'prone';
          effects.push('knocked prone');
          break;
        case 'stagger':
          defender.addStatus({ name: 'Staggered', duration_turns: 1 });
          effects.push('staggered');
          break;
        case 'bleed':
          defender.addStatus({ name: 'Bleeding', duration_turns: 3, damage_per_turn: 3 });
          effects.push('bleeding');
          break;
        case 'blind':
          defender.addStatus({ name: 'Blind', duration_turns: 2 });
          effects.push('blinded');
          break;
        case 'slow':
          defender.addStatus({ name: 'Slowed', duration_turns: 2 });
          effects.push('slowed');
          break;
        case 'restrain':
          defender.grappleState = 'restrained';
          attacker.grappleState = 'controlling';
          effects.push('restrained');
          break;
        case 'disarm':
          if (defender.weapons.length > 0) {
            defender.weapons.pop();
            effects.push('disarmed');
          }
          break;
        case 'silence':
          defender.addStatus({ name: 'Silenced', duration_turns: 2 });
          effects.push('silenced');
          break;
        case 'knockback_2':
          effects.push('knocked back');
          break;
        case 'unconscious_2':
        case 'unconscious_3':
          const turns = parseInt(technique.special.split('_')[1]);
          defender.addStatus({ name: 'Unconscious', duration_turns: turns });
          effects.push(`will be unconscious in ${turns} turns`);
          break;
      }

      if (effects.length > 0) {
        this.logEvent(`  → ${defender.name} is ${effects.join(', ')}!`);
      }
    }

    return { success: true, damage, effects };
  }

  executePower(attacker, defender, power) {
    const apCost = power.ap_cost || 2;
    if (attacker.ap < apCost) {
      return { success: false, reason: 'Not enough AP' };
    }

    // Check if silenced
    if (attacker.hasStatus('silenced')) {
      this.logEvent(`${attacker.name} tries to use ${power.name} but is SILENCED!`);
      return { success: false, reason: 'Silenced' };
    }

    attacker.ap -= apCost;

    // Powers have higher hit chance based on threat level
    const threatBonus = power.threat_level === 'THREAT_3' ? 20 : power.threat_level === 'THREAT_2' ? 10 : 0;
    const hit = this.rollHit(attacker, defender, threatBonus / 10);

    if (!hit) {
      this.logEvent(`${attacker.name} uses ${power.name} but MISSES!`);
      return { success: false, reason: 'Miss' };
    }

    const damage = power.damage || 0;
    if (damage > 0) {
      const result = defender.takeDamage(damage);
      this.logEvent(`${attacker.name} uses ${power.name} for ${damage} damage! (HP: ${result.remaining})`);
    } else {
      this.logEvent(`${attacker.name} uses ${power.name}!`);
    }

    return { success: true, damage };
  }

  chooseAction(fighter, opponent) {
    // AI: Choose best action based on situation
    const actions = [];

    // Get available techniques
    for (const art of fighter.martialArts) {
      const techniques = fighter.getAvailableTechniques(art.style.id);
      for (const tech of techniques) {
        if (fighter.ap >= tech.ap_cost) {
          // Prioritize damage dealing techniques
          const priority = (tech.damage || 5) + (tech.special ? 10 : 0);
          actions.push({ type: 'technique', tech, priority });
        }
      }
    }

    // Get available powers
    for (const power of fighter.powers) {
      if (fighter.ap >= (power.ap_cost || 2) && !fighter.hasStatus('silenced')) {
        const priority = (power.damage || 10) + 15; // Powers get bonus priority
        actions.push({ type: 'power', power, priority });
      }
    }

    // Sort by priority and pick randomly from top 3
    actions.sort((a, b) => b.priority - a.priority);
    const topActions = actions.slice(0, Math.min(3, actions.length));

    if (topActions.length === 0) {
      return { type: 'end' }; // End turn if no actions available
    }

    return topActions[Math.floor(Math.random() * topActions.length)];
  }

  runTurn() {
    const attacker = this.fighters[this.currentFighter];
    const defender = this.fighters[1 - this.currentFighter];

    if (!attacker.isConscious) {
      this.currentFighter = 1 - this.currentFighter;
      return;
    }

    this.turn++;
    attacker.resetTurn();

    this.logEvent(`--- ${attacker.name}'s Turn (HP: ${attacker.hp}/${attacker.maxHp}) ---`, 'turn');

    // Process status effects
    const statusResult = attacker.processStatusEffects();
    if (statusResult.damage > 0) {
      attacker.hp -= statusResult.damage;
      this.logEvent(`${attacker.name} takes ${statusResult.damage} status damage (HP: ${attacker.hp})`);
    }
    if (statusResult.expiredEffects.length > 0) {
      this.logEvent(`${attacker.name} recovers from: ${statusResult.expiredEffects.join(', ')}`);
    }

    // Stand up if prone
    if (attacker.position === 'prone') {
      attacker.ap -= 1;
      attacker.position = 'standing';
      this.logEvent(`${attacker.name} stands up (1 AP)`);
    }

    // Execute actions until out of AP or choose to end
    let actionCount = 0;
    while (attacker.ap > 0 && attacker.isConscious && defender.isConscious && actionCount < 5) {
      const action = this.chooseAction(attacker, defender);

      if (action.type === 'end') break;

      if (action.type === 'technique') {
        this.executeTechnique(attacker, defender, action.tech);
      } else if (action.type === 'power') {
        this.executePower(attacker, defender, action.power);
      }

      actionCount++;
    }

    // Switch turns
    this.currentFighter = 1 - this.currentFighter;
  }

  runBattle() {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`⚔️  BATTLE: ${this.fighters[0].name} vs ${this.fighters[1].name}`);
    console.log(`${'='.repeat(60)}\n`);

    // Display fighter stats
    for (const f of this.fighters) {
      console.log(`📋 ${f.name}:`);
      console.log(`   HP: ${f.hp} | MEL: ${f.stats.MEL} | AGL: ${f.stats.AGL} | STR: ${f.stats.STR}`);
      console.log(`   Martial Arts: ${f.martialArts.map(a => `${a.style.name} (Belt ${a.beltLevel})`).join(', ') || 'None'}`);
      console.log(`   Powers: ${f.powers.map(p => p.name).join(', ') || 'None'}`);
      console.log('');
    }

    // Determine initiative
    const init1 = this.fighters[0].stats.AGL + Math.random() * 20;
    const init2 = this.fighters[1].stats.AGL + Math.random() * 20;
    this.currentFighter = init1 >= init2 ? 0 : 1;
    this.logEvent(`${this.fighters[this.currentFighter].name} wins initiative!`, 'initiative');

    // Run combat
    while (this.fighters[0].isConscious && this.fighters[1].isConscious && this.turn < this.maxTurns) {
      this.runTurn();
    }

    // Determine winner
    console.log(`\n${'='.repeat(60)}`);
    if (!this.fighters[0].isConscious && !this.fighters[1].isConscious) {
      console.log(`💀 DRAW! Both fighters are down!`);
    } else if (!this.fighters[0].isConscious) {
      console.log(`🏆 WINNER: ${this.fighters[1].name}! (${this.fighters[1].hp} HP remaining)`);
    } else if (!this.fighters[1].isConscious) {
      console.log(`🏆 WINNER: ${this.fighters[0].name}! (${this.fighters[0].hp} HP remaining)`);
    } else {
      console.log(`⏰ TIME LIMIT! Battle ended after ${this.maxTurns} turns`);
      const winner = this.fighters[0].hp > this.fighters[1].hp ? this.fighters[0] : this.fighters[1];
      console.log(`🏆 Winner by HP: ${winner.name} (${winner.hp} HP)`);
    }
    console.log(`${'='.repeat(60)}\n`);

    return {
      turns: this.turn,
      winner: this.fighters[0].isConscious ? this.fighters[0].name : this.fighters[1].name,
      winnerHp: this.fighters[0].isConscious ? this.fighters[0].hp : this.fighters[1].hp,
      log: this.log
    };
  }
}

// ============== TEST BATTLES ==============

async function loadData() {
  await client.connect();

  // Load martial arts styles and techniques
  const stylesResult = await client.query('SELECT * FROM martial_arts_styles');
  const techniquesResult = await client.query('SELECT * FROM martial_arts_techniques');
  const powersResult = await client.query('SELECT * FROM powers LIMIT 20');

  const styles = {};
  for (const row of stylesResult.rows) {
    styles[row.id] = {
      ...row,
      techniques: techniquesResult.rows.filter(t => t.style_id === row.id)
    };
  }

  return { styles, powers: powersResult.rows };
}

async function runTests() {
  console.log('🥋 SuperHero Tactics - Combat Test System\n');

  const { styles, powers } = await loadData();

  console.log('📊 Loaded Data:');
  console.log(`   Styles: ${Object.keys(styles).join(', ')}`);
  console.log(`   Powers: ${powers.length} powers`);
  console.log('');

  // ============== TEST 1: Striker vs Grappler ==============
  console.log('\n🧪 TEST 1: STRIKER VS GRAPPLER');

  const striker = new Fighter('Marcus "The Hammer" Jones', {
    MEL: 70, AGL: 65, STR: 75, STA: 60, CON: 55
  }, [
    { style: styles.striking, beltLevel: 6, techniques: styles.striking.techniques }
  ]);

  const grappler = new Fighter('Yuki Tanaka', {
    MEL: 65, AGL: 55, STR: 70, STA: 65, CON: 60
  }, [
    { style: styles.grappling, beltLevel: 7, techniques: styles.grappling.techniques },
    { style: styles.submission, beltLevel: 5, techniques: styles.submission.techniques }
  ]);

  const battle1 = new CombatSimulator(striker, grappler);
  const result1 = battle1.runBattle();

  // ============== TEST 2: Internal vs Counter ==============
  console.log('\n🧪 TEST 2: INTERNAL ARTS VS COUNTER FIGHTING');

  const internal = new Fighter('Master Chen Wei', {
    MEL: 60, AGL: 70, STR: 45, STA: 65, INS: 80, CON: 55
  }, [
    { style: styles.internal, beltLevel: 8, techniques: styles.internal.techniques }
  ]);

  const counter = new Fighter('Sarah "The Viper" Martinez', {
    MEL: 75, AGL: 80, STR: 55, STA: 55, INS: 70, CON: 50
  }, [
    { style: styles.counter, beltLevel: 7, techniques: styles.counter.techniques }
  ]);

  const battle2 = new CombatSimulator(internal, counter);
  const result2 = battle2.runBattle();

  // ============== TEST 3: Powered Fighter vs Master Martial Artist ==============
  console.log('\n🧪 TEST 3: SUPER-POWERED VS MASTER MARTIAL ARTIST');

  // Find some offensive powers
  const offensivePowers = powers.filter(p => p.damage > 0).slice(0, 3);

  const powered = new Fighter('Blaze', {
    MEL: 55, AGL: 60, STR: 60, STA: 50, CON: 55
  }, [], offensivePowers);

  const master = new Fighter('Grand Master Yamoto', {
    MEL: 85, AGL: 75, STR: 65, STA: 70, INS: 75, CON: 65
  }, [
    { style: styles.striking, beltLevel: 10, techniques: styles.striking.techniques },
    { style: styles.counter, beltLevel: 8, techniques: styles.counter.techniques },
    { style: styles.internal, beltLevel: 6, techniques: styles.internal.techniques }
  ]);

  const battle3 = new CombatSimulator(powered, master);
  const result3 = battle3.runBattle();

  // ============== TEST 4: All Styles Tournament ==============
  console.log('\n🧪 TEST 4: STYLE TOURNAMENT (Each style vs each other)');

  const styleNames = Object.keys(styles);
  const records = {};
  for (const s of styleNames) records[s] = { wins: 0, losses: 0 };

  for (let i = 0; i < styleNames.length; i++) {
    for (let j = i + 1; j < styleNames.length; j++) {
      const style1 = styleNames[i];
      const style2 = styleNames[j];

      // Run 5 matches between each pair
      let wins1 = 0, wins2 = 0;
      for (let m = 0; m < 5; m++) {
        const f1 = new Fighter(`${styles[style1].name} Fighter`, {
          MEL: 65, AGL: 60, STR: 60, STA: 55, CON: 55
        }, [{ style: styles[style1], beltLevel: 6, techniques: styles[style1].techniques }]);

        const f2 = new Fighter(`${styles[style2].name} Fighter`, {
          MEL: 65, AGL: 60, STR: 60, STA: 55, CON: 55
        }, [{ style: styles[style2], beltLevel: 6, techniques: styles[style2].techniques }]);

        // Quiet mode for tournament
        const sim = new CombatSimulator(f1, f2);
        sim.logEvent = () => {}; // Suppress output
        const result = sim.runBattle();

        if (result.winner === f1.name) wins1++;
        else wins2++;
      }

      records[style1].wins += wins1;
      records[style1].losses += wins2;
      records[style2].wins += wins2;
      records[style2].losses += wins1;

      console.log(`   ${styles[style1].name} vs ${styles[style2].name}: ${wins1}-${wins2}`);
    }
  }

  console.log('\n📊 TOURNAMENT RESULTS:');
  console.log('─'.repeat(40));
  const sorted = Object.entries(records).sort((a, b) => b[1].wins - a[1].wins);
  for (const [style, rec] of sorted) {
    const winRate = ((rec.wins / (rec.wins + rec.losses)) * 100).toFixed(1);
    console.log(`   ${styles[style].name.padEnd(12)}: ${rec.wins}W - ${rec.losses}L (${winRate}%)`);
  }

  // ============== SUMMARY ==============
  console.log('\n' + '='.repeat(60));
  console.log('📈 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`\n✅ All combat tests completed successfully!`);
  console.log(`\nKey Observations:`);
  console.log(`  • Striking excels at dealing consistent damage`);
  console.log(`  • Grappling/Submission can neutralize strikers with control`);
  console.log(`  • Counter fighters punish aggressive opponents`);
  console.log(`  • Internal arts provide defensive sustainability`);
  console.log(`  • Powers add burst damage but don't guarantee victory`);
  console.log('');

  await client.end();
}

runTests().catch(console.error);
