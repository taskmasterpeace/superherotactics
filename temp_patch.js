const fs = require('fs');
const path = 'C:/git/sht/MVP/src/components/PhaserGame.tsx';
let content = fs.readFileSync(path, 'utf8');

// Check if already patched
if (content.includes('combat-log')) {
  console.log('combat-log listener already exists');
  process.exit(0);
}

// Find and replace
const oldCode = `    unsubscribers.push(
      EventBridge.on('log-entry', (entry: LogEntry) => {
        setLogEntries((prev) => [...prev.slice(-99), entry]);
      })
    );

    return () => {`;

const newCode = `    unsubscribers.push(
      EventBridge.on('log-entry', (entry: LogEntry) => {
        setLogEntries((prev) => [...prev.slice(-99), entry]);
      })
    );

    // Also listen to combat-log events from CombatScene
    unsubscribers.push(
      EventBridge.on('combat-log', (entry: { message: string; type?: string }) => {
        const logEntry: LogEntry = {
          id: Date.now().toString(),
          message: entry.message,
          type: entry.type || 'info',
          timestamp: new Date().toLocaleTimeString(),
        };
        setLogEntries((prev) => [...prev.slice(-99), logEntry]);
      })
    );

    return () => {`;

if (content.includes(oldCode)) {
  content = content.replace(oldCode, newCode);
  fs.writeFileSync(path, content);
  console.log('Successfully added combat-log listener');
} else {
  console.log('Could not find target code block');
}
