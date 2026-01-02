# System Integration Rules for Ralph Wiggum Loops

## Overview

This document defines how Claude should work within Ralph Wiggum autonomous loops to complete SuperHero Tactics game systems.

## File Locations

- **Todo List**: `.claude/ralph-wiggum/todo-list.json`
- **System Links**: `.claude/ralph-wiggum/system-links.json`
- **Loop Runner**: `.claude/ralph-wiggum/ralph-loop-v2.bat`
- **Completion Check**: `.claude/ralph-wiggum/completion-check.js`

## Working Within a Loop

### At Start of Each Iteration

1. Read `todo-list.json` to find your current system
2. Check which tasks are pending vs completed
3. Review `system-links.json` for dependencies
4. Check git log for changes from previous iterations

### Task Completion Protocol

1. **Before starting a task**:
   - Mark task status as `"in_progress"` in todo-list.json
   - Announce what you're working on

2. **While working**:
   - Make incremental progress
   - Commit after completing meaningful chunks
   - Use descriptive commit messages

3. **After completing a task**:
   - Mark task status as `"completed"` in todo-list.json
   - Increment `statistics.completedTasks`
   - Move to next pending task

### System Completion Protocol

When ALL tasks in a system are complete:

1. Mark system status as `"completed"` in todo-list.json
2. Set `completedAt` to current ISO timestamp
3. Add system ID to `completedSystems` array
4. Increment `statistics.completedSystems`
5. Commit all changes with message: `feat(<system-name>): Complete <system-name> integration`
6. Output exactly: `SYSTEM_COMPLETE`

## System Dependency Chain

```
HOOK-INFRA (Phase 0)
    ↓
EVENT-GEN (Phase 1) ─────────────────────────┐
    ↓                                        │
├── WEAPON-DB → ARMOR-DB → STAT-INT         │
│       ↓                                    │
│   COMBAT-RESULTS → HOSPITAL               │
│                                            │
├── NEWS-GEN ────────────────────────────────┤
├── MISSION-GEN → INVESTIGATION ─────────────┤
├── TIME-EVENTS → ECONOMY                   │
│                                            │
├── VEHICLE-INT → TERRITORY                 │
├── EMAIL-SYS                               │
│                                            ↓
└────────────────→ LAPTOP-UI → TRAINING-UI → BASE-UI
                                            ↓
                                        GAME-LOOP
```

## Critical Path Systems

These systems are on the critical path and block multiple downstream systems:

1. **EVENT-GEN** - Blocks NEWS, MISSIONS, INVESTIGATION
2. **WEAPON-DB** - Blocks ARMOR-DB, STAT-INT
3. **COMBAT-RESULTS** - Blocks HOSPITAL
4. **LAPTOP-UI** - Blocks TRAINING-UI, BASE-UI, GAME-LOOP

## Code Quality Rules

### Before Marking a Task Complete

- [ ] Code compiles without TypeScript errors
- [ ] No console errors in browser
- [ ] Related functionality works in UI
- [ ] Changes are committed to git

### Before Marking a System Complete

- [ ] All tasks marked complete
- [ ] Integration with triggered systems verified
- [ ] No regressions in existing functionality
- [ ] Changes committed with descriptive message

## JSON Update Examples

### Marking a Task In Progress

```json
{
  "id": "EG-001",
  "task": "Create EventBus class with pub/sub",
  "status": "in_progress"  // Changed from "pending"
}
```

### Marking a Task Complete

```json
{
  "id": "EG-001",
  "task": "Create EventBus class with pub/sub",
  "status": "completed"  // Changed from "in_progress"
}
```

### Marking a System Complete

```json
{
  "id": "EVENT-GEN",
  "name": "Event Generation System",
  "status": "completed",  // Changed from "in_progress"
  "completedAt": "2024-12-30T12:00:00.000Z",  // Added
  // ... tasks ...
}
```

## Commit Message Format

```
type(scope): description

Types:
- feat: New feature or system
- fix: Bug fix
- wire: Connecting systems together
- refactor: Code restructuring
- test: Adding tests

Examples:
- feat(event-gen): Create EventBus class with pub/sub
- wire(combat): Connect weapon database to CombatScene
- fix(news): Correct template variable substitution
```

## Emergency Recovery

If you get stuck or encounter errors:

1. Check git status for uncommitted changes
2. Review recent commits for context
3. Read todo-list.json to understand current state
4. If stuck, mark current task as blocked and describe issue
5. Move to next unblocked task if possible

## Loop Termination

The loop terminates when:

1. All systems marked complete (success)
2. Max iterations reached (needs manual review)
3. User cancels with Ctrl+C

## Monitoring Progress

```bash
# Check overall progress
node .claude/ralph-wiggum/completion-check.js status

# Check specific system
node .claude/ralph-wiggum/completion-check.js status EVENT-GEN

# Find next pending system
node .claude/ralph-wiggum/completion-check.js next
```
