const fs = require('fs');
const path = 'C:/git/sht/MVP/src/components/CombatLab.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add onFlee to BottomBarProps interface
const oldProps = `interface BottomBarProps {
  selectedUnit: any;
  weaponInfo: { name: string; emoji: string; damage: number; range: number } | null;
  unitData: CombatUnit | undefined;
  actions: ReturnType<typeof useCombatActions>;
  onGadgetClick: () => void;
  onInventoryClick: () => void;
  showGadgetPanel: boolean;
  setShowGrenadeMenu: (show: boolean) => void;
}`;

const newProps = `interface BottomBarProps {
  selectedUnit: any;
  weaponInfo: { name: string; emoji: string; damage: number; range: number } | null;
  unitData: CombatUnit | undefined;
  actions: ReturnType<typeof useCombatActions>;
  onGadgetClick: () => void;
  onInventoryClick: () => void;
  onFlee: () => void;
  showGadgetPanel: boolean;
  setShowGrenadeMenu: (show: boolean) => void;
}`;

if (content.includes(oldProps)) {
  content = content.replace(oldProps, newProps);
  console.log('Added onFlee to BottomBarProps');
} else {
  console.log('Could not find BottomBarProps');
}

// 2. Add onFlee to destructuring
const oldDestructure = `const BottomBar: React.FC<BottomBarProps> = ({
  selectedUnit,
  weaponInfo,
  unitData,
  actions,
  onGadgetClick,
  onInventoryClick,
  showGadgetPanel,
  setShowGrenadeMenu,
}) => {`;

const newDestructure = `const BottomBar: React.FC<BottomBarProps> = ({
  selectedUnit,
  weaponInfo,
  unitData,
  actions,
  onGadgetClick,
  onInventoryClick,
  onFlee,
  showGadgetPanel,
  setShowGrenadeMenu,
}) => {`;

if (content.includes(oldDestructure)) {
  content = content.replace(oldDestructure, newDestructure);
  console.log('Added onFlee to destructuring');
} else {
  console.log('Could not find destructuring');
}

// 3. Add Flee button before End Turn
const oldEndTurn = `        <div className="flex-1" />
        {/* End Turn */}
        <ActionButton
          icon={<Check className="w-5 h-5" />}
          label="END TURN"
          hotkey="E"
          onClick={actions.endTurn}
          variant="primary"
        />`;

const newEndTurn = `        <div className="flex-1" />
        {/* Flee/Retreat */}
        <ActionButton
          icon={<LogOut className="w-5 h-5" />}
          label="FLEE"
          hotkey="F"
          onClick={onFlee}
          color="yellow"
        />
        {/* End Turn */}
        <ActionButton
          icon={<Check className="w-5 h-5" />}
          label="END TURN"
          hotkey="E"
          onClick={actions.endTurn}
          variant="primary"
        />`;

if (content.includes(oldEndTurn)) {
  content = content.replace(oldEndTurn, newEndTurn);
  console.log('Added Flee button');
} else {
  console.log('Could not find End Turn button');
}

fs.writeFileSync(path, content);
console.log('Done!');
