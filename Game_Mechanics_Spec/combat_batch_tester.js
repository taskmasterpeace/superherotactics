/**
 * SHT Combat Batch Tester
 * Runs statistical combat simulations to validate game balance
 * Run with: node combat_batch_tester.js
 */

// ============ DATA ============
// BALANCE v1.2 - Further adjustments after batch testing
const WEAPONS = {
    pistol: { name: 'Pistol', damage: 20, range: 25, accuracy: 0, type: 'bullet', drPen: 0, ap: 2 },
    rifle: { name: 'Assault Rifle', damage: 25, range: 60, accuracy: 0, type: 'bullet', drPen: 2, ap: 2 }, // Was 28
    sniper: { name: 'Sniper Rifle', damage: 45, range: 100, accuracy: 2, type: 'bullet', drPen: 5, ap: 3 },
    shotgun: { name: 'Shotgun', damage: 35, range: 10, accuracy: 0, type: 'shotgun', drPen: 0, ap: 2, closeBonus: 2 },
    smg: { name: 'SMG', damage: 15, range: 20, accuracy: 0, type: 'bullet', drPen: 0, ap: 1 }, // Restore AP 1, lower dmg, fix acc
    knife: { name: 'Knife', damage: 10, range: 1, accuracy: 1, type: 'melee', drPen: 0, ap: 1 },
    energy: { name: 'Energy Rifle', damage: 30, range: 40, accuracy: 0, type: 'energy', drPen: 0, ap: 2, ignoresArmor: 0.4 },
    fists: { name: 'Fists', damage: 8, range: 1, accuracy: 0, type: 'melee', drPen: 0, ap: 1, strBonus: true }, // Was 5
    heavy_pistol: { name: 'Heavy Pistol', damage: 25, range: 20, accuracy: 0, type: 'bullet', drPen: 2, ap: 2 },
    plasma: { name: 'Plasma Rifle', damage: 40, range: 35, accuracy: -1, type: 'energy', drPen: 0, ap: 3, ignoresArmor: 0.5 },
    super_punch: { name: 'Super Punch', damage: 25, range: 2, accuracy: 1, type: 'melee', drPen: 10, ap: 2, strBonus: true }
};

// BALANCE v1.2 - Further armor reductions
const ARMORS = {
    none: { name: 'None', dr: 0, energyDR: 0 },
    leather: { name: 'Leather Jacket', dr: 2, energyDR: 1 },
    kevlar: { name: 'Kevlar Vest', dr: 6, energyDR: 3 }, // Was 8
    tactical: { name: 'Tactical Vest', dr: 8, energyDR: 4 }, // Was 10
    combat: { name: 'Combat Armor', dr: 12, energyDR: 6 }, // Was 15
    power: { name: 'Power Armor', dr: 18, energyDR: 12, strBonus: 10 } // Was 22
};

const GRAPPLE_DAMAGE = { 'Clinch': 5, 'Front Mount': 10, 'Back Mount': 15, 'Side Control': 8, 'Guard': 3 };

// ============ SIMULATION ENGINE ============
class CombatSimulator {
    constructor() {
        this.units = [];
        this.turn = 1;
        this.maxTurns = 100;
        this.log = [];
        this.verbose = false;
    }

    reset() {
        this.units = [];
        this.turn = 1;
        this.log = [];
    }

    createUnit(name, team, opts = {}) {
        const u = {
            id: this.units.length + 1,
            name, team,
            x: opts.x || 0,
            y: opts.y || 0,
            hp: opts.hp || 100,
            maxHp: opts.hp || 100,
            ap: opts.ap || 6,
            maxAp: opts.ap || 6,
            str: opts.str || 30,
            agl: opts.agl || 30,
            weapon: opts.weapon || 'pistol',
            armor: opts.armor || 'none',
            grappling: null,
            grappledBy: null,
            grapplePosition: 'Standing',
            inCover: opts.inCover || 0 // 0 = none, 1 = low, 2 = high
        };
        this.units.push(u);
        return u;
    }

    getDistance(u1, u2) {
        return Math.sqrt(Math.pow(u2.x - u1.x, 2) + Math.pow(u2.y - u1.y, 2));
    }

    resolveAttack(attacker, defender) {
        const w = WEAPONS[attacker.weapon];
        const a = ARMORS[defender.armor];

        const dist = this.getDistance(attacker, defender);
        if (dist > w.range) return { hit: false, damage: 0, result: 'OUT_OF_RANGE' };

        // Roll d100
        const roll = Math.floor(Math.random() * 100) + 1;

        // Calculate bonus
        let bonus = Math.floor((attacker.agl - 30) / 10) * 5;
        bonus += w.accuracy * 5;

        // Shotgun close range bonus
        if (w.closeBonus && dist <= 3) {
            bonus += w.closeBonus * 5; // +15 at close range
        }

        // Range penalty for long distance
        if (dist > w.range * 0.7) {
            bonus -= 10; // Long range penalty
        }

        // Cover penalty - BALANCE v1.1: Low=8, High=15 (was *10)
        const coverPen = defender.inCover === 2 ? 15 : (defender.inCover === 1 ? 8 : 0);

        const finalRoll = roll + bonus - coverPen;

        let result, mult;
        if (finalRoll < 40) { result = 'MISS'; mult = 0; }
        else if (finalRoll < 70) { result = 'GRAZE'; mult = 0.5; }
        else if (finalRoll < 95) { result = 'HIT'; mult = 1.0; }
        else { result = 'CRITICAL'; mult = 1.5; }

        if (mult === 0) {
            return { hit: false, damage: 0, result, roll: finalRoll };
        }

        let dmg = w.damage;
        if (w.strBonus) dmg += Math.floor(attacker.str / 10);
        dmg = Math.floor(dmg * mult);

        // Apply armor DR with new balance mechanics
        let effectiveDR = a.dr;

        // Energy weapons use energyDR instead and can ignore some armor
        if (w.type === 'energy') {
            effectiveDR = a.energyDR || Math.floor(a.dr * 0.5);
            if (w.ignoresArmor) {
                effectiveDR = Math.floor(effectiveDR * (1 - w.ignoresArmor));
            }
        } else {
            // Apply drPen (DR penetration) for physical weapons
            effectiveDR = Math.max(0, effectiveDR - (w.drPen || 0));
        }

        const netDmg = Math.max(0, dmg - effectiveDR);

        return { hit: true, damage: netDmg, rawDamage: dmg, dr: effectiveDR, result, roll: finalRoll };
    }

    resolveGrapple(attacker, defender) {
        const aRoll = Math.floor(Math.random() * 100) + attacker.str;
        const dRoll = Math.floor(Math.random() * 100) + Math.max(defender.str, defender.agl);

        if (aRoll > dRoll) {
            attacker.grappling = defender;
            defender.grappledBy = attacker;
            attacker.grapplePosition = 'Clinch';
            defender.grapplePosition = 'Clinch';
            return { success: true, aRoll, dRoll };
        }
        return { success: false, aRoll, dRoll };
    }

    resolveGrappleHold(controller) {
        const target = controller.grappling;
        if (!target) return { damage: 0 };

        const positionDmg = GRAPPLE_DAMAGE[controller.grapplePosition] || 5;
        const dmg = positionDmg + Math.floor(controller.str / 10);
        target.hp -= dmg;

        return { damage: dmg, position: controller.grapplePosition };
    }

    resolveEscape(escapee) {
        const controller = escapee.grappledBy;
        if (!controller) return { success: false };

        const escRoll = Math.floor(Math.random() * 100) + Math.max(escapee.str, escapee.agl);
        const ctrlRoll = Math.floor(Math.random() * 100) + controller.str + 20;

        if (escRoll > ctrlRoll) {
            controller.grappling = null;
            escapee.grappledBy = null;
            controller.grapplePosition = 'Standing';
            escapee.grapplePosition = 'Standing';
            return { success: true, escRoll, ctrlRoll };
        }
        return { success: false, escRoll, ctrlRoll };
    }

    runAI(unit) {
        const alive = this.units.filter(u => u.hp > 0);

        // If grappled, try to escape
        if (unit.grappledBy) {
            unit.ap -= 2;
            const result = this.resolveEscape(unit);
            if (this.verbose) {
                this.log.push(`${unit.name} attempts escape: ${result.success ? 'SUCCESS' : 'FAILED'}`);
            }
            return;
        }

        // If grappling, apply hold
        if (unit.grappling) {
            unit.ap -= 2;
            const result = this.resolveGrappleHold(unit);
            if (this.verbose) {
                this.log.push(`${unit.name} applies ${unit.grapplePosition} hold for ${result.damage} damage`);
            }
            if (unit.grappling.hp <= 0) {
                unit.grappling.grappledBy = null;
                unit.grappling = null;
                unit.grapplePosition = 'Standing';
            }
            return;
        }

        // Find nearest enemy
        const enemies = alive.filter(u => u.team !== unit.team);
        if (enemies.length === 0) return;

        enemies.sort((a, b) => this.getDistance(unit, a) - this.getDistance(unit, b));
        const target = enemies[0];

        const w = WEAPONS[unit.weapon];
        const dist = this.getDistance(unit, target);

        // Attack if in range
        while (unit.ap >= w.ap && dist <= w.range && target.hp > 0) {
            unit.ap -= w.ap;
            const result = this.resolveAttack(unit, target);

            if (result.hit) {
                target.hp -= result.damage;
                if (this.verbose) {
                    this.log.push(`${unit.name} ${result.result}s ${target.name} for ${result.damage} damage`);
                }
            } else if (this.verbose) {
                this.log.push(`${unit.name} misses ${target.name}`);
            }
        }

        // Move toward target if needed
        if (unit.ap > 0 && dist > w.range) {
            const moveSpeed = 2 * unit.ap;
            const dx = target.x - unit.x;
            const dy = target.y - unit.y;
            const moveDist = Math.min(moveSpeed, dist - w.range + 1);
            const angle = Math.atan2(dy, dx);
            unit.x += Math.cos(angle) * moveDist;
            unit.y += Math.sin(angle) * moveDist;
            unit.ap = 0;
        }
    }

    runTurn() {
        const alive = this.units.filter(u => u.hp > 0);
        if (alive.length === 0) return null;

        const teams = new Set(alive.map(u => u.team));
        if (teams.size === 1) return [...teams][0];

        for (const unit of alive) {
            if (unit.hp > 0) {
                unit.ap = unit.maxAp;
                this.runAI(unit);
            }
        }

        this.turn++;
        return null;
    }

    runSimulation() {
        while (this.turn <= this.maxTurns) {
            const winner = this.runTurn();
            if (winner) {
                return { winner, turns: this.turn };
            }
        }

        // Timeout - determine winner by remaining HP
        const teamHp = {};
        this.units.forEach(u => {
            if (u.hp > 0) {
                teamHp[u.team] = (teamHp[u.team] || 0) + u.hp;
            }
        });

        let maxHp = 0, winner = 'draw';
        for (const [team, hp] of Object.entries(teamHp)) {
            if (hp > maxHp) {
                maxHp = hp;
                winner = team;
            }
        }

        return { winner, turns: this.maxTurns, timeout: true };
    }
}

// ============ TEST SCENARIOS ============
const SCENARIOS = {
    // 1. Basic pistol duel - should be ~50/50
    pistol_duel: {
        name: "1v1 Pistol Duel (Equal)",
        setup: (sim) => {
            sim.createUnit('Alpha', 'a', { x: 0, y: 0, weapon: 'pistol', armor: 'kevlar' });
            sim.createUnit('Beta', 'b', { x: 10, y: 0, weapon: 'pistol', armor: 'kevlar' });
        },
        expected: { teamAWinRate: [45, 55], avgTurns: [4, 10] }
    },

    // 2. Rifle vs Pistol - rifle should have slight advantage
    rifle_vs_pistol: {
        name: "Rifle vs Pistol",
        setup: (sim) => {
            sim.createUnit('Rifleman', 'a', { x: 0, y: 0, weapon: 'rifle', armor: 'tactical' });
            sim.createUnit('Pistoleer', 'b', { x: 15, y: 0, weapon: 'pistol', armor: 'tactical' });
        },
        expected: { teamAWinRate: [55, 70], avgTurns: [3, 8] }
    },

    // 3. Shotgun at close range - shotgun should dominate
    shotgun_close: {
        name: "Shotgun Close Range",
        setup: (sim) => {
            sim.createUnit('Shotgunner', 'a', { x: 0, y: 0, weapon: 'shotgun', armor: 'kevlar' });
            sim.createUnit('Pistoleer', 'b', { x: 2, y: 0, weapon: 'pistol', armor: 'kevlar' });
        },
        expected: { teamAWinRate: [65, 85], avgTurns: [2, 6] }
    },

    // 4. Shotgun vs Rifle at range - rifle should win
    shotgun_vs_rifle_range: {
        name: "Shotgun vs Rifle (Long Range)",
        setup: (sim) => {
            sim.createUnit('Shotgunner', 'a', { x: 0, y: 0, weapon: 'shotgun', armor: 'combat' });
            sim.createUnit('Rifleman', 'b', { x: 20, y: 0, weapon: 'rifle', armor: 'tactical' });
        },
        expected: { teamAWinRate: [25, 45], avgTurns: [5, 12] }
    },

    // 5. Sniper duel - should be quick and even
    sniper_duel: {
        name: "Sniper Duel",
        setup: (sim) => {
            sim.createUnit('Sniper1', 'a', { x: 0, y: 0, weapon: 'sniper', armor: 'kevlar' });
            sim.createUnit('Sniper2', 'b', { x: 50, y: 0, weapon: 'sniper', armor: 'kevlar' });
        },
        expected: { teamAWinRate: [45, 55], avgTurns: [2, 5] }
    },

    // 6. Super vs Normal - super should dominate
    super_vs_normal: {
        name: "Super vs Normal (1v1)",
        setup: (sim) => {
            sim.createUnit('Super', 'a', { x: 0, y: 0, hp: 200, str: 80, agl: 50, weapon: 'super_punch', armor: 'power' });
            sim.createUnit('Soldier', 'b', { x: 5, y: 0, hp: 100, weapon: 'rifle', armor: 'tactical' });
        },
        expected: { teamAWinRate: [70, 90], avgTurns: [3, 10] }
    },

    // 7. Super vs Squad (1v4) - super with high HP/DR should survive, closer start
    super_vs_squad: {
        name: "Super vs Squad (1v4)",
        setup: (sim) => {
            sim.createUnit('TITAN', 'a', { x: 10, y: 10, hp: 300, str: 80, agl: 50, weapon: 'super_punch', armor: 'power' });
            sim.createUnit('S1', 'b', { x: 5, y: 5, hp: 80, weapon: 'rifle', armor: 'tactical' });
            sim.createUnit('S2', 'b', { x: 15, y: 5, hp: 80, weapon: 'rifle', armor: 'tactical' });
            sim.createUnit('S3', 'b', { x: 5, y: 15, hp: 80, weapon: 'rifle', armor: 'tactical' });
            sim.createUnit('S4', 'b', { x: 15, y: 15, hp: 80, weapon: 'smg', armor: 'kevlar' });
        },
        expected: { teamAWinRate: [50, 75], avgTurns: [8, 25] }
    },

    // 8. Squad vs Squad (4v4)
    squad_battle: {
        name: "Squad Battle (4v4)",
        setup: (sim) => {
            sim.createUnit('A1', 'a', { x: 0, y: 0, weapon: 'rifle', armor: 'tactical' });
            sim.createUnit('A2', 'a', { x: 0, y: 2, weapon: 'rifle', armor: 'tactical' });
            sim.createUnit('A3', 'a', { x: 2, y: 0, weapon: 'smg', armor: 'kevlar' });
            sim.createUnit('A4', 'a', { x: 2, y: 2, weapon: 'sniper', armor: 'kevlar' });
            sim.createUnit('B1', 'b', { x: 20, y: 20, weapon: 'rifle', armor: 'tactical' });
            sim.createUnit('B2', 'b', { x: 20, y: 22, weapon: 'rifle', armor: 'tactical' });
            sim.createUnit('B3', 'b', { x: 22, y: 20, weapon: 'smg', armor: 'kevlar' });
            sim.createUnit('B4', 'b', { x: 22, y: 22, weapon: 'shotgun', armor: 'combat' });
        },
        expected: { teamAWinRate: [40, 60], avgTurns: [10, 30] }
    },

    // 9. Armor test - heavy armor vs light
    armor_test: {
        name: "Combat Armor vs Kevlar",
        setup: (sim) => {
            sim.createUnit('Heavy', 'a', { x: 0, y: 0, weapon: 'pistol', armor: 'combat' });
            sim.createUnit('Light', 'b', { x: 10, y: 0, weapon: 'pistol', armor: 'kevlar' });
        },
        expected: { teamAWinRate: [60, 80], avgTurns: [5, 15] }
    },

    // 10. Energy weapons vs armor
    energy_vs_armor: {
        name: "Energy Rifle vs Combat Armor",
        setup: (sim) => {
            sim.createUnit('Energy', 'a', { x: 0, y: 0, weapon: 'energy', armor: 'tactical' });
            sim.createUnit('Tank', 'b', { x: 15, y: 0, weapon: 'rifle', armor: 'combat' });
        },
        expected: { teamAWinRate: [40, 60], avgTurns: [4, 10] }
    },

    // 11. Cover effectiveness
    cover_test: {
        name: "Cover Advantage Test",
        setup: (sim) => {
            sim.createUnit('InCover', 'a', { x: 0, y: 0, weapon: 'rifle', armor: 'tactical', inCover: 2 });
            sim.createUnit('Exposed', 'b', { x: 15, y: 0, weapon: 'rifle', armor: 'tactical', inCover: 0 });
        },
        expected: { teamAWinRate: [60, 80], avgTurns: [4, 12] }
    },

    // 12. Grappling match
    grapple_match: {
        name: "Grappling Match (STR vs AGL)",
        setup: (sim) => {
            // Strong grappler vs agile grappler
            sim.createUnit('Strong', 'a', { x: 0, y: 0, hp: 100, str: 50, agl: 30, weapon: 'fists' });
            sim.createUnit('Agile', 'b', { x: 1, y: 0, hp: 100, str: 35, agl: 50, weapon: 'fists' });
            // Start them in grapple
            sim.units[0].grappling = sim.units[1];
            sim.units[1].grappledBy = sim.units[0];
            sim.units[0].grapplePosition = 'Clinch';
            sim.units[1].grapplePosition = 'Clinch';
        },
        expected: { teamAWinRate: [55, 75], avgTurns: [8, 25] }
    },

    // 13. SMG burst vs single shot
    smg_vs_pistol: {
        name: "SMG (fast) vs Pistol",
        setup: (sim) => {
            sim.createUnit('SMG', 'a', { x: 0, y: 0, weapon: 'smg', armor: 'kevlar' });
            sim.createUnit('Pistol', 'b', { x: 8, y: 0, weapon: 'pistol', armor: 'kevlar' });
        },
        expected: { teamAWinRate: [45, 60], avgTurns: [4, 10] }
    },

    // 14. Knife fight
    knife_fight: {
        name: "Knife Fight (melee only)",
        setup: (sim) => {
            sim.createUnit('K1', 'a', { x: 0, y: 0, str: 40, agl: 40, weapon: 'knife' });
            sim.createUnit('K2', 'b', { x: 1, y: 0, str: 40, agl: 40, weapon: 'knife' });
        },
        expected: { teamAWinRate: [45, 55], avgTurns: [5, 15] }
    },

    // 15. Plasma rifle power test
    plasma_test: {
        name: "Plasma Rifle vs Combat Armor",
        setup: (sim) => {
            sim.createUnit('Plasma', 'a', { x: 0, y: 0, weapon: 'plasma', armor: 'tactical' });
            sim.createUnit('Tank', 'b', { x: 20, y: 0, weapon: 'rifle', armor: 'combat' });
        },
        expected: { teamAWinRate: [50, 70], avgTurns: [3, 8] }
    }
};

// ============ RUN TESTS ============
function runBatchTest(scenario, iterations = 100) {
    const results = {
        aWins: 0,
        bWins: 0,
        draws: 0,
        totalTurns: 0,
        turnsArray: [],
        timeouts: 0
    };

    for (let i = 0; i < iterations; i++) {
        const sim = new CombatSimulator();
        scenario.setup(sim);
        const result = sim.runSimulation();

        if (result.winner === 'a') results.aWins++;
        else if (result.winner === 'b') results.bWins++;
        else results.draws++;

        if (result.timeout) results.timeouts++;

        results.totalTurns += result.turns;
        results.turnsArray.push(result.turns);
    }

    results.avgTurns = results.totalTurns / iterations;
    results.turnsArray.sort((a, b) => a - b);
    results.minTurns = results.turnsArray[0];
    results.maxTurns = results.turnsArray[results.turnsArray.length - 1];
    results.medianTurns = results.turnsArray[Math.floor(iterations / 2)];

    return results;
}

function formatPercent(val, total) {
    return ((val / total) * 100).toFixed(1) + '%';
}

function checkExpectation(actual, expected) {
    if (!expected) return '?';
    const [min, max] = expected;
    if (actual >= min && actual <= max) return '✓';
    return '✗';
}

// ============ MAIN ============
console.log('═══════════════════════════════════════════════════════════════');
console.log('           SHT COMBAT BATCH TEST RESULTS');
console.log('           Running 100 simulations per scenario');
console.log('═══════════════════════════════════════════════════════════════\n');

const allResults = [];
const ITERATIONS = 100;

for (const [key, scenario] of Object.entries(SCENARIOS)) {
    console.log(`Testing: ${scenario.name}...`);
    const results = runBatchTest(scenario, ITERATIONS);

    const aWinRate = (results.aWins / ITERATIONS) * 100;
    const expectedCheck = checkExpectation(aWinRate, scenario.expected?.teamAWinRate);
    const turnsCheck = checkExpectation(results.avgTurns, scenario.expected?.avgTurns);

    allResults.push({
        name: scenario.name,
        key,
        ...results,
        aWinRate,
        expectedCheck,
        turnsCheck,
        expected: scenario.expected
    });
}

// Print detailed results
console.log('\n═══════════════════════════════════════════════════════════════');
console.log('                    DETAILED RESULTS');
console.log('═══════════════════════════════════════════════════════════════\n');

for (const r of allResults) {
    console.log(`┌─────────────────────────────────────────────────────────────┐`);
    console.log(`│ ${r.name.padEnd(59)} │`);
    console.log(`├─────────────────────────────────────────────────────────────┤`);
    console.log(`│ Team A Wins: ${String(r.aWins).padStart(3)} (${formatPercent(r.aWins, ITERATIONS).padStart(6)})  Team B Wins: ${String(r.bWins).padStart(3)} (${formatPercent(r.bWins, ITERATIONS).padStart(6)}) │`);
    console.log(`│ Avg Turns: ${r.avgTurns.toFixed(1).padStart(5)}  Min: ${String(r.minTurns).padStart(3)}  Max: ${String(r.maxTurns).padStart(3)}  Timeouts: ${String(r.timeouts).padStart(2)} │`);

    if (r.expected) {
        const expA = r.expected.teamAWinRate ? `${r.expected.teamAWinRate[0]}-${r.expected.teamAWinRate[1]}%` : 'N/A';
        const expT = r.expected.avgTurns ? `${r.expected.avgTurns[0]}-${r.expected.avgTurns[1]}` : 'N/A';
        console.log(`│ Expected A Win: ${expA.padEnd(10)} ${r.expectedCheck}   Turns: ${expT.padEnd(8)} ${r.turnsCheck}        │`);
    }
    console.log(`└─────────────────────────────────────────────────────────────┘\n`);
}

// Summary table
console.log('═══════════════════════════════════════════════════════════════');
console.log('                    SUMMARY TABLE');
console.log('═══════════════════════════════════════════════════════════════\n');

console.log('Scenario                          | A Win% | B Win% | Avg Turns | Pass');
console.log('----------------------------------|--------|--------|-----------|------');
for (const r of allResults) {
    const pass = (r.expectedCheck === '✓' || r.expectedCheck === '?') &&
                 (r.turnsCheck === '✓' || r.turnsCheck === '?') ? '✓' : '✗';
    console.log(`${r.name.substring(0, 33).padEnd(33)} | ${formatPercent(r.aWins, ITERATIONS).padStart(6)} | ${formatPercent(r.bWins, ITERATIONS).padStart(6)} | ${r.avgTurns.toFixed(1).padStart(9)} | ${pass}`);
}

// Balance analysis
console.log('\n═══════════════════════════════════════════════════════════════');
console.log('                    BALANCE ANALYSIS');
console.log('═══════════════════════════════════════════════════════════════\n');

const passed = allResults.filter(r => r.expectedCheck === '✓' || r.expectedCheck === '?').length;
const failed = allResults.filter(r => r.expectedCheck === '✗').length;

console.log(`Tests Passed: ${passed}/${allResults.length}`);
console.log(`Tests Failed: ${failed}/${allResults.length}`);

if (failed > 0) {
    console.log('\nFailed Tests:');
    for (const r of allResults.filter(r => r.expectedCheck === '✗')) {
        console.log(`  - ${r.name}: Got ${r.aWinRate.toFixed(1)}%, expected ${r.expected?.teamAWinRate?.join('-')}%`);
    }
}

// Key findings
console.log('\n─────────────────────────────────────────────────────────────────');
console.log('KEY FINDINGS:');
console.log('─────────────────────────────────────────────────────────────────');

// Check shotgun close range
const shotgunClose = allResults.find(r => r.key === 'shotgun_close');
if (shotgunClose) {
    if (shotgunClose.aWinRate >= 65) {
        console.log('✓ Shotgun close range bonus is working effectively');
    } else {
        console.log('✗ Shotgun close range bonus may need adjustment');
    }
}

// Check super balance
const superVsSquad = allResults.find(r => r.key === 'super_vs_squad');
if (superVsSquad) {
    if (superVsSquad.aWinRate >= 50 && superVsSquad.aWinRate <= 75) {
        console.log('✓ Super vs Squad is reasonably balanced');
    } else if (superVsSquad.aWinRate > 75) {
        console.log('⚠ Super may be too strong vs squads');
    } else {
        console.log('⚠ Super may be too weak vs squads');
    }
}

// Check cover
const coverTest = allResults.find(r => r.key === 'cover_test');
if (coverTest) {
    if (coverTest.aWinRate >= 60) {
        console.log('✓ Cover provides meaningful advantage');
    } else {
        console.log('✗ Cover bonus may be too weak');
    }
}

// Check armor
const armorTest = allResults.find(r => r.key === 'armor_test');
if (armorTest) {
    if (armorTest.aWinRate >= 60 && armorTest.aWinRate <= 80) {
        console.log('✓ Armor differences are meaningful but not overwhelming');
    } else if (armorTest.aWinRate > 80) {
        console.log('⚠ Heavy armor may be too strong');
    } else {
        console.log('⚠ Armor differences may not be impactful enough');
    }
}

// Check grappling
const grappleMatch = allResults.find(r => r.key === 'grapple_match');
if (grappleMatch) {
    if (grappleMatch.avgTurns >= 8) {
        console.log('✓ Grappling creates extended tactical encounters');
    } else {
        console.log('⚠ Grappling resolves too quickly');
    }
}

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('                    TEST COMPLETE');
console.log('═══════════════════════════════════════════════════════════════\n');
