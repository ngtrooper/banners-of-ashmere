import Phaser from 'phaser';
import './style.css';
import { Battle, W, H } from './battle.js';
import { initUI } from './ui.js';
new Phaser.Game({ type: Phaser.AUTO, width: W, height: H, parent: 'game', backgroundColor: '#0d0a12', scene: Battle, pixelArt: true, roundPixels: true,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_HORIZONTALLY }, fps: { target: 60 } });
initUI();
