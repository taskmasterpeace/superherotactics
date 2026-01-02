// ADD THIS CODE after line: this.reducePowerCooldowns(this.currentTeam);

    // Regenerate shields for current team
    const teamUnits = Array.from(this.units.values()).filter(u => u.team === this.currentTeam && u.hp > 0);
    for (const unit of teamUnits) {
      if (unit.shieldRegen > 0 && unit.shield < unit.maxShield) {
        const oldShield = unit.shield;
        unit.shield = Math.min(unit.maxShield, unit.shield + unit.shieldRegen);
        const regenAmount = unit.shield - oldShield;

        if (regenAmount > 0) {
          this.updateHealthBar(unit);
          this.emitToUI('combat-log', {
            message: `🛡️ ${unit.name}'s shield regenerates +${regenAmount} (${unit.shield}/${unit.maxShield})`,
            type: 'status'
          });
        }
      }
    }
