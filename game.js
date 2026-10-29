import { resetGameState, WORLD_W, WORLD_H, ISLAND_RECT, CAMERA_ZOOM, state } from './state.js';
import { generateDetailedPixelArt } from './assets.js';
import { initWorld, buildProceduralRoom, drawAnimatedShoreline, updateAmbientLife } from './world.js';
import { initCombat, updateCombat } from './combat.js';
import { createHudUI, updateHudUI, handleUpgradeKeyboardInput } from './ui.js';

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    pixelArt: true,
    roundPixels: true,
    physics: {
        default: 'arcade',
        arcade: { debug: false }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

new Phaser.Game(config);

function preload() {
    generateDetailedPixelArt(this);
}

function create() {
    resetGameState();

    this.physics.world.setBounds(
        ISLAND_RECT.x + 16,
        ISLAND_RECT.y + 16,
        ISLAND_RECT.w - 32,
        ISLAND_RECT.h - 32
    );

    // 1. Inicializar Mundo, Combate e Interfaz
    initWorld(this);
    initCombat(this);
    createHudUI(this);

    // 2. Configurar Cámara Cercana (2.0x)
    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);
    this.cameras.main.setZoom(CAMERA_ZOOM);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);

    // 3. Generar la primera isla procedural
    buildProceduralRoom(this);
}

function update(time, delta) {
    drawAnimatedShoreline(this, time);
    updateAmbientLife(this, time, delta);

    if (state.gameOver) {
        if (Phaser.Input.Keyboard.JustDown(this.keys.R)) {
            this.scene.restart();
        }
        return;
    }

    if (state.choosingUpgrade) {
        handleUpgradeKeyboardInput(this);
        return;
    }

    updateCombat(this, time, delta);
    updateHudUI(this, time);
}