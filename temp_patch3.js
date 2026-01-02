const fs = require('fs');
const path = 'C:/git/sht/MVP/src/components/CombatLab.tsx';
let content = fs.readFileSync(path, 'utf8');

// Find and update BottomBar usage
const oldUsage = `<BottomBar
          selectedUnit={selectedUnit}
          weaponInfo={weaponInfo}
          unitData={selectedWeapon}
          actions={actions}
          onGadgetClick={() => setShowGadgetPanel(true)}
          onInventoryClick={() => setShowInventory(true)}
          showGadgetPanel={showGadgetPanel}
          setShowGrenadeMenu={setShowGrenadeMenu}
        />`;

const newUsage = `<BottomBar
          selectedUnit={selectedUnit}
          weaponInfo={weaponInfo}
          unitData={selectedWeapon}
          actions={actions}
          onGadgetClick={() => setShowGadgetPanel(true)}
          onInventoryClick={() => setShowInventory(true)}
          onFlee={() => {
            if (confirm('Flee from combat? Your team will retreat to safety.')) {
              setCurrentView('world-map');
            }
          }}
          showGadgetPanel={showGadgetPanel}
          setShowGrenadeMenu={setShowGrenadeMenu}
        />`;

if (content.includes(oldUsage)) {
  content = content.replace(oldUsage, newUsage);
  console.log('Wired up onFlee handler');
} else {
  console.log('Could not find BottomBar usage');
}

fs.writeFileSync(path, content);
console.log('Done!');
