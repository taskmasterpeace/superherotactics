/**
 * PreloadScene - Asset loading for SHT Combat Lab
 */

import Phaser from 'phaser';
import { EventBridge } from '../EventBridge';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload(): void {
    // Create loading bar
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x4a4a6a, 0.8);
    progressBox.fillRect(
      this.cameras.main.width / 2 - 160,
      this.cameras.main.height / 2 - 25,
      320,
      50
    );

    const loadingText = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2 - 50,
      'Loading Combat Lab...',
      {
        font: '20px monospace',
        color: '#ffffff',
      }
    );
    loadingText.setOrigin(0.5, 0.5);

    const percentText = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      '0%',
      {
        font: '18px monospace',
        color: '#ffffff',
      }
    );
    percentText.setOrigin(0.5, 0.5);

    // Loading events
    this.load.on('progress', (value: number) => {
      percentText.setText(`${Math.round(value * 100)}%`);
      progressBar.clear();
      progressBar.fillStyle(0x4a90d9, 1);
      progressBar.fillRect(
        this.cameras.main.width / 2 - 150,
        this.cameras.main.height / 2 - 15,
        300 * value,
        30
      );
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
      percentText.destroy();
    });

    // Generate placeholder graphics instead of loading external files
    this.generatePlaceholderAssets();

    // Load soldier sprites
    this.loadSoldierSprites();
  }

  private loadSoldierSprites(): void {
    // Load all 32 soldier sprites
    for (let i = 1; i <= 32; i++) {
      const id = i.toString().padStart(2, '0');
      this.load.image(`soldier_${id}`, `assets/character_token/sprite_${id}.png`);
    }
  }

  private generatePlaceholderAssets(): void {
    // Generate tile textures
    this.generateTileTexture('tile_floor', 0x555555);
    this.generateTileTexture('tile_grass', 0x2d5a27);
    this.generateTileTexture('tile_wall', 0x333333);
    this.generateTileTexture('tile_water', 0x2a4a6a);
    this.generateTileTexture('tile_lowwall', 0x444444);

    // Generate unit textures
    this.generateUnitTexture('unit_blue', 0x4a90d9);
    this.generateUnitTexture('unit_red', 0xd94a4a);
    this.generateUnitTexture('unit_green', 0x4ad94a);

    // Generate UI textures
    this.generateCircleTexture('selection_ring', 0xffffff, 28, 2);
    this.generateCircleTexture('movement_marker', 0x4a90d9, 10, 0);
    this.generateCircleTexture('attack_marker', 0xd94a4a, 10, 0);
  }

  private generateTileTexture(key: string, color: number): void {
    const graphics = this.make.graphics({ x: 0, y: 0 });
    graphics.fillStyle(color, 1);
    graphics.fillRect(0, 0, 64, 64);
    graphics.lineStyle(1, 0x4a4a6a, 0.5);
    graphics.strokeRect(0, 0, 64, 64);
    graphics.generateTexture(key, 64, 64);
    graphics.destroy();
  }

  private generateUnitTexture(key: string, color: number): void {
    const graphics = this.make.graphics({ x: 0, y: 0 });

    // Base circle
    graphics.fillStyle(color, 1);
    graphics.fillCircle(24, 24, 20);

    // Border
    graphics.lineStyle(2, 0xffffff, 1);
    graphics.strokeCircle(24, 24, 20);

    // Direction indicator (triangle pointing up)
    graphics.fillStyle(0xffffff, 1);
    graphics.fillTriangle(24, 8, 18, 18, 30, 18);

    graphics.generateTexture(key, 48, 48);
    graphics.destroy();
  }

  private generateCircleTexture(
    key: string,
    color: number,
    radius: number,
    strokeWidth: number
  ): void {
    const graphics = this.make.graphics({ x: 0, y: 0 });
    const size = radius * 2 + 4;

    if (strokeWidth > 0) {
      graphics.lineStyle(strokeWidth, color, 1);
      graphics.strokeCircle(size / 2, size / 2, radius);
    } else {
      graphics.fillStyle(color, 0.5);
      graphics.fillCircle(size / 2, size / 2, radius);
    }

    graphics.generateTexture(key, size, size);
    graphics.destroy();
  }

  create(): void {
    // Notify React that assets are loaded
    EventBridge.emit('assets-loaded');

    // Start combat scene
    this.scene.start('CombatScene');
  }
}

export default PreloadScene;
