# Ralph Wiggum Autonomous Loops for SHT

> "I'm helping!" - Ralph Wiggum

An autonomous loop system where Claude works continuously until completion criteria are met.

## Version 2.0 - JSON-Driven System Integration

The v2 system uses JSON todo lists and automatic system chaining to build the complete SHT game ecosystem.

## Quick Start

### Run Full Ecosystem Build
```cmd
ralph-loop-v2.bat "" 500 true
```
This will:
1. Find the first pending system in todo-list.json
2. Complete all tasks in that system
3. Automatically continue to triggered systems
4. Repeat until all systems are complete

### Run Specific System
```cmd
ralph-loop-v2.bat EVENT-GEN 50 true
```

### Check Progress
```cmd
node completion-check.js status
node completion-check.js next
```

## File Structure

```
.claude/ralph-wiggum/
├── todo-list.json        # Master task list (20 systems, 105 tasks)
├── system-links.json     # Dependency graph for auto-continuation
├── ralph-loop-v2.bat     # Enhanced loop runner
├── completion-check.js   # Progress validation
├── prompts/              # Generated prompts per session
└── logs/                 # Iteration logs
```

## Usage

```
ralph-loop-v2.bat [system-id] [max-iterations] [auto-continue]
```

- **system-id**: Specific system to work on (optional, finds next pending if empty)
- **max-iterations**: Safety limit per system (default: 50)
- **auto-continue**: Chain to triggered systems when complete (default: true)

---

## Legacy v1 (Simple Prompt Loop)

```
ralph-loop.bat "<task description>" [max-iterations] [completion-text]
```

- **task description**: What you want Claude to accomplish
- **max-iterations**: Safety limit (default: 10)
- **completion-text**: Text that signals completion (default: "TASK_COMPLETE")

## Example Tasks for SHT

### 1. Wire Full Weapon Database
```cmd
ralph-loop.bat "Wire all 70+ weapons from data/weapons.ts into CombatScene.ts. Each weapon needs proper range brackets, damage, and sound effects. Commit after each weapon type is complete." 50
```

### 2. Implement News System
```cmd
ralph-loop.bat "Implement the news system from NEWS_SYSTEM_SUMMARY.md. Create NewsBrowser component, add news store, hook mission completion to news generation. Commit after each major component." 30
```

### 3. Add DR/Armor System
```cmd
ralph-loop.bat "Wire DR (damage resistance) from data/armor.ts into CombatScene combat resolution. Each armor piece should reduce damage based on stopping power vs weapon penetration." 25
```

### 4. Test Coverage
```cmd
ralph-loop.bat "Add unit tests for all combat system functions. Each iteration should add tests for one module and ensure they pass." 40
```

## Best Practices

1. **Clear completion criteria**: Define exactly what "done" looks like
2. **Conservative iterations**: Start with 10-20, increase if needed
3. **Atomic commits**: Ask Claude to commit after each sub-task
4. **Cost awareness**: Each iteration uses tokens - budget accordingly

## When to Use

**Good:**
- Large-scale refactoring
- Wiring data files to systems
- Test coverage expansion
- Documentation generation
- Batch operations (70 weapons, 50 armors, etc.)

**Avoid:**
- Ambiguous requirements
- Architectural decisions
- Security-sensitive code
- Exploratory work

## How It Works

1. Your prompt loads from PROMPT.md (or inline)
2. Claude attempts the task
3. On exit, the loop checks for completion text
4. If not complete, the prompt re-injects with file state preserved
5. Claude sees git history and modified files
6. Repeat until complete or max iterations reached

## Files

- `ralph-loop.bat` - Windows runner
- `ralph-loop.sh` - Unix runner
- `prompts/` - Saved prompt templates
- `logs/` - Iteration logs
