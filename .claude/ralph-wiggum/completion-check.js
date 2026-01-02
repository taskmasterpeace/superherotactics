#!/usr/bin/env node
/**
 * Ralph Wiggum Completion Checker
 * Validates system completion and manages task state
 */

const fs = require('fs');
const path = require('path');

const TODO_FILE = path.join(__dirname, 'todo-list.json');
const LINKS_FILE = path.join(__dirname, 'system-links.json');
const STATE_FILE = path.join(__dirname, 'iteration-state.json');

function loadJSON(file) {
    try {
        return JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (e) {
        console.error(`Error loading ${file}:`, e.message);
        return null;
    }
}

function saveJSON(file, data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function getSystemStatus(systemId) {
    const todos = loadJSON(TODO_FILE);
    if (!todos) return null;

    const system = todos.systems.find(s => s.id === systemId);
    if (!system) {
        console.error(`System ${systemId} not found`);
        return null;
    }

    const totalTasks = system.tasks.length;
    const completedTasks = system.tasks.filter(t => t.status === 'completed').length;
    const pendingTasks = system.tasks.filter(t => t.status === 'pending').length;
    const inProgressTasks = system.tasks.filter(t => t.status === 'in_progress').length;

    return {
        id: system.id,
        name: system.name,
        status: system.status,
        totalTasks,
        completedTasks,
        pendingTasks,
        inProgressTasks,
        progress: Math.round((completedTasks / totalTasks) * 100),
        isComplete: completedTasks === totalTasks,
        triggers: system.triggers || []
    };
}

function markSystemComplete(systemId) {
    const todos = loadJSON(TODO_FILE);
    if (!todos) return false;

    const system = todos.systems.find(s => s.id === systemId);
    if (!system) return false;

    // Check all tasks are complete
    const allComplete = system.tasks.every(t => t.status === 'completed');
    if (!allComplete) {
        console.error('Not all tasks are complete');
        return false;
    }

    system.status = 'completed';
    system.completedAt = new Date().toISOString();
    todos.completedSystems.push(systemId);
    todos.statistics.completedSystems++;

    saveJSON(TODO_FILE, todos);
    console.log(`System ${systemId} marked as complete`);
    return true;
}

function markTaskComplete(systemId, taskId) {
    const todos = loadJSON(TODO_FILE);
    if (!todos) return false;

    const system = todos.systems.find(s => s.id === systemId);
    if (!system) return false;

    const task = system.tasks.find(t => t.id === taskId);
    if (!task) return false;

    task.status = 'completed';
    todos.statistics.completedTasks++;

    saveJSON(TODO_FILE, todos);
    console.log(`Task ${taskId} marked as complete`);
    return true;
}

function getNextPendingSystem() {
    const todos = loadJSON(TODO_FILE);
    const links = loadJSON(LINKS_FILE);
    if (!todos || !links) return null;

    // Follow integration order
    for (const systemId of links.integrationOrder) {
        const system = todos.systems.find(s => s.id === systemId);
        if (system && system.status === 'pending') {
            // Check if blocked
            const linkInfo = links.systems[systemId];
            if (linkInfo && linkInfo.blockedBy) {
                const allBlockersComplete = linkInfo.blockedBy.every(blockerId => {
                    const blocker = todos.systems.find(s => s.id === blockerId);
                    return blocker && blocker.status === 'completed';
                });
                if (!allBlockersComplete) continue;
            }
            return systemId;
        }
    }
    return null;
}

function getProgress() {
    const todos = loadJSON(TODO_FILE);
    if (!todos) return null;

    const totalSystems = todos.systems.length;
    const completedSystems = todos.systems.filter(s => s.status === 'completed').length;
    const inProgressSystems = todos.systems.filter(s => s.status === 'in_progress').length;

    const totalTasks = todos.systems.reduce((sum, s) => sum + s.tasks.length, 0);
    const completedTasks = todos.systems.reduce((sum, s) =>
        sum + s.tasks.filter(t => t.status === 'completed').length, 0);

    return {
        systems: {
            total: totalSystems,
            completed: completedSystems,
            inProgress: inProgressSystems,
            pending: totalSystems - completedSystems - inProgressSystems,
            progress: Math.round((completedSystems / totalSystems) * 100)
        },
        tasks: {
            total: totalTasks,
            completed: completedTasks,
            progress: Math.round((completedTasks / totalTasks) * 100)
        }
    };
}

function printStatus() {
    const progress = getProgress();
    if (!progress) return;

    console.log('\n=== Ralph Wiggum Progress ===\n');
    console.log(`Systems: ${progress.systems.completed}/${progress.systems.total} (${progress.systems.progress}%)`);
    console.log(`Tasks: ${progress.tasks.completed}/${progress.tasks.total} (${progress.tasks.progress}%)`);
    console.log(`In Progress: ${progress.systems.inProgress}`);
    console.log(`Pending: ${progress.systems.pending}`);

    const next = getNextPendingSystem();
    if (next) {
        console.log(`\nNext System: ${next}`);
    } else if (progress.systems.completed === progress.systems.total) {
        console.log('\n*** ALL SYSTEMS COMPLETE! ***');
    }
    console.log('');
}

// CLI
const command = process.argv[2];
const arg1 = process.argv[3];
const arg2 = process.argv[4];

switch (command) {
    case 'status':
        if (arg1) {
            const status = getSystemStatus(arg1);
            console.log(JSON.stringify(status, null, 2));
        } else {
            printStatus();
        }
        break;
    case 'next':
        const next = getNextPendingSystem();
        console.log(next || 'No pending systems');
        break;
    case 'complete-task':
        if (arg1 && arg2) {
            markTaskComplete(arg1, arg2);
        } else {
            console.log('Usage: complete-task <systemId> <taskId>');
        }
        break;
    case 'complete-system':
        if (arg1) {
            markSystemComplete(arg1);
        } else {
            console.log('Usage: complete-system <systemId>');
        }
        break;
    case 'progress':
        const prog = getProgress();
        console.log(JSON.stringify(prog, null, 2));
        break;
    default:
        console.log('Ralph Wiggum Completion Checker');
        console.log('Usage:');
        console.log('  node completion-check.js status [systemId]');
        console.log('  node completion-check.js next');
        console.log('  node completion-check.js complete-task <systemId> <taskId>');
        console.log('  node completion-check.js complete-system <systemId>');
        console.log('  node completion-check.js progress');
}
