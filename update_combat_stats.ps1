# PowerShell script to update CombatScene.ts with stat-based calculations

$filePath = "C:\git\sht\MVP\src\game\scenes\CombatScene.ts"
$content = Get-Content $filePath -Raw

# 1. Update calculateHitChance to use MEL for melee, AGL for ranged
$oldPattern1 = @"
    // AGL bonus for attacker \(every 10 AGL above 50 = \+2%\)
    hitChance \+= Math\.floor\(\(attacker\.agl - 50\) / 5\);
"@

$newPattern1 = @"
    // Stat-based accuracy modifier
    // Melee weapons use MEL, ranged weapons use AGL
    const isMelee = attacker.weapon === 'fist' || attacker.weapon === 'super_punch';
    const accuracyStat = isMelee ? attacker.mel : attacker.agl;

    // Formula: (stat - 50) / 5 gives +/-10% at extremes (stat 0 or 100)
    // Examples: stat 50 = 0%, stat 75 = +5%, stat 25 = -5%
    hitChance += Math.floor((accuracyStat - 50) / 5);
"@

$content = $content -replace [regex]::Escape($oldPattern1), $newPattern1

# 2. Update damage calculation to use STR more effectively for melee
$oldPattern2 = @"
      let baseDamage = weapon\.damage \+ Math\.floor\(attacker\.str / 10\);

      if \(hitResult === 'crit'\) \{
"@

$newPattern2 = @"
      // Melee weapons scale better with STR
      const isMelee = attacker.weapon === 'fist' || attacker.weapon === 'super_punch';
      let baseDamage = weapon.damage;

      if (isMelee) {
        // Melee: STR bonus is (STR - 50) / 100 * baseDamage
        // Examples: STR 50 = 0%, STR 75 = +25%, STR 100 = +50%
        baseDamage = Math.floor(baseDamage * (1 + (attacker.str - 50) / 100));
      } else {
        // Ranged: Small STR bonus for recoil control
        baseDamage += Math.floor((attacker.str - 50) / 20);
      }

      if (hitResult === 'crit') {
"@

$content = $content -replace [regex]::Escape($oldPattern2), $newPattern2

# Write the updated content
Set-Content -Path $filePath -Value $content -NoNewline

Write-Host "Combat stats updated successfully!"
