/**
 * PhaserGame - React component wrapper for Phaser 3 game
 *
 * Usage:
 * <PhaserGame width={800} height={600} />
 */

import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { createGameConfig } from '../game/config';
import { EventBridge, UnitData, LogEntry } from '../game/EventBridge';

interface PhaserGameProps {
  className?: string;
}

export const PhaserGame: React.FC<PhaserGameProps> = ({
  className = '',
}) => {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Delay game creation to ensure container has final dimensions
    const initGame = () => {
      if (!containerRef.current || gameRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const width = Math.max(rect.width, 100);
      const height = Math.max(rect.height, 100);

      console.log('[PhaserGame] Initializing with dimensions:', width, height);

      const config = createGameConfig(containerRef.current, width, height);
      gameRef.current = new Phaser.Game(config);

      // Force a resize after game is created to ensure proper sizing
      requestAnimationFrame(() => {
        if (gameRef.current && containerRef.current) {
          const finalRect = containerRef.current.getBoundingClientRect();
          console.log('[PhaserGame] Post-init resize:', finalRect.width, finalRect.height);
          gameRef.current.scale.resize(finalRect.width, finalRect.height);
        }
      });
    };

    // Wait for next frame to ensure layout is complete
    const timerId = requestAnimationFrame(() => {
      setTimeout(initGame, 50);
    });

    // Handle resize
    const handleResize = () => {
      if (gameRef.current && containerRef.current) {
        const newRect = containerRef.current.getBoundingClientRect();
        gameRef.current.scale.resize(newRect.width, newRect.height);
      }
    };

    window.addEventListener('resize', handleResize);

    // Cleanup on unmount
    return () => {
      cancelAnimationFrame(timerId);
      window.removeEventListener('resize', handleResize);
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`phaser-game-container ${className}`}
      style={{ width: '100%', height: '100%' }}
    />
  );
};

/**
 * useCombatState - React hook for combat state from Phaser
 */
export const useCombatState = () => {
  const [selectedUnit, setSelectedUnit] = useState<UnitData | null>(null);
  const [currentTeam, setCurrentTeam] = useState<string>('blue');
  const [roundNumber, setRoundNumber] = useState<number>(1);
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const unsubscribers: (() => void)[] = [];

    unsubscribers.push(
      EventBridge.on('assets-loaded', () => {
        setIsLoaded(true);
      })
    );

    unsubscribers.push(
      EventBridge.on('unit-selected', (data: UnitData) => {
        setSelectedUnit(data);
      })
    );

    unsubscribers.push(
      EventBridge.on('turn-changed', (data: { team: string; round: number }) => {
        setCurrentTeam(data.team);
        setRoundNumber(data.round);
      })
    );

    unsubscribers.push(
      EventBridge.on('log-entry', (entry: LogEntry) => {
        setLogEntries((prev) => [...prev.slice(-99), entry]);
      })
    );

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, []);

  return {
    selectedUnit,
    currentTeam,
    roundNumber,
    logEntries,
    isLoaded,
  };
};

/**
 * useCombatActions - React hook for sending actions to Phaser
 */
export const useCombatActions = () => {
  const selectUnit = (unitId: string) => {
    EventBridge.emit('select-unit', { unitId });
  };

  const startMoveMode = () => {
    EventBridge.emit('start-move-mode', {});
  };

  const startAttackMode = () => {
    EventBridge.emit('start-attack-mode', {});
  };

  const startThrowMode = () => {
    EventBridge.emit('start-throw-mode', {});
  };

  const cancelAction = () => {
    EventBridge.emit('cancel-action');
  };

  const endTurn = () => {
    EventBridge.emit('end-turn');
  };

  const toggleGadget = (gadgetId: string, state: boolean) => {
    EventBridge.emit('toggle-gadget', { gadgetId, state });
  };

  const setGadgetIntensity = (gadgetId: string, value: number) => {
    EventBridge.emit('set-gadget-intensity', { gadgetId, value });
  };

  const setGadgetMode = (gadgetId: string, mode: string) => {
    EventBridge.emit('set-gadget-mode', { gadgetId, mode });
  };

  return {
    selectUnit,
    startMoveMode,
    startAttackMode,
    startThrowMode,
    cancelAction,
    endTurn,
    toggleGadget,
    setGadgetIntensity,
    setGadgetMode,
  };
};

export default PhaserGame;
