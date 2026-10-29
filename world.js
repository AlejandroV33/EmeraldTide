import { WORLD_W, WORLD_H, ISLAND_RECT, GRASS_RECT, state } from './state.js';
import { RetroAudio } from './audio.js';
import { openUpgradeMenu, spawnFloatingText } from './ui.js';

export function initWorld(scene) {
    scene.waterTile = scene.add.tileSprite(0, 0, WORLD_W, WORLD_H, 'water_tile').setOrigin(0).setDepth(0);
    scene.foamGraphics = scene.add.graphics().setDepth(1);

    scene.add.tileSprite(ISLAND_RECT.x, ISLAND_RECT.y, ISLAND_RECT.w, ISLAND_RECT.h, 'sand_tile').setOrigin(0).setDepth(2);
    scene.add.tileSprite(GRASS_RECT.x, GRASS_RECT.y, GRASS_RECT.w, GRASS_RECT.h, 'grass_tile').setOrigin(0).setDepth(2);

    // Muro de acantilado alrededor de la isla
    for (let x = ISLAND_RECT.x; x < ISLAND_RECT.x + ISLAND_RECT.w; x += 16) {
        scene.add.image(x + 8, ISLAND_RECT.y + 4, 'cliff_tile').setDepth(3);
        scene.add.image(x + 8, ISLAND_RECT.y + ISLAND_RECT.h - 4, 'cliff_tile').setDepth(3);
    }
    for (let y = ISLAND_RECT.y; y < ISLAND_RECT.y + ISLAND_RECT.h; y += 16) {
        scene.add.image(ISLAND_RECT.x + 4, y + 8, 'cliff_tile').setDepth(3);
        scene.add.image(ISLAND_RECT.x + ISLAND_RECT.w - 4, y + 8, 'cliff_tile').setDepth(3);
    }

    // Rayos de sol diagonales
    scene.sunRaysGraphics = scene.add.graphics().setDepth(35);
    scene.sunRaysGraphics.fillStyle(0xe8ff78, 0.08);
    [[180, 0, 90], [420, 0, 120], [680, 0, 80]].forEach(([sx, sy, w]) => {
        scene.sunRaysGraphics.beginPath();
        scene.sunRaysGraphics.moveTo(sx, sy);
        scene.sunRaysGraphics.lineTo(sx + w, sy);
        scene.sunRaysGraphics.lineTo(sx + w + 280, WORLD_H);
        scene.sunRaysGraphics.lineTo(sx + 280, WORLD_H);
        scene.sunRaysGraphics.closePath();
        scene.sunRaysGraphics.fillPath();
    });

    scene.tidePoolsGroup = scene.add.group();
    scene.obstaclesGroup = scene.physics.add.staticGroup();
    scene.enemiesGroup = scene.physics.add.group();
    scene.roomDecos = scene.add.group();
    scene.butterflies = [];
    scene.sunMotes = [];
    scene.altarSprite = null;
    scene.bridgeZone = null;
}

export function buildProceduralRoom(scene) {
    state.roomCleared = false;
    state.upgradeChosen = false;
    state.choosingUpgrade = false;
    state.transitioning = false;

    scene.obstaclesGroup.clear(true, true);
    scene.tidePoolsGroup.clear(true, true);
    scene.enemiesGroup.clear(true, true);
    scene.playerBulletsGroup.clear(true, true);
    scene.enemyBulletsGroup.clear(true, true);
    scene.roomDecos.clear(true, true);

    scene.butterflies.forEach(b => b.sprite.destroy());
    scene.butterflies = [];
    scene.sunMotes.forEach(m => m.rect.destroy());
    scene.sunMotes = [];

    if (scene.altarSprite) { scene.altarSprite.destroy(); scene.altarSprite = null; }
    if (scene.bridgeZone) { scene.bridgeZone.destroy(); scene.bridgeZone = null; }

    scene.player.setPosition(WORLD_W / 2, ISLAND_RECT.y + ISLAND_RECT.h - 48);

    // Flores y arbustos
    const flowerTypes = ['flower_pink', 'flower_yellow', 'flower_blue'];
    for (let i = 0; i < 26; i++) {
        const fx = Phaser.Math.Between(GRASS_RECT.x + 16, GRASS_RECT.x + GRASS_RECT.w - 16);
        const fy = Phaser.Math.Between(GRASS_RECT.y + 16, GRASS_RECT.y + GRASS_RECT.h - 16);
        scene.roomDecos.add(scene.add.image(fx, fy, flowerTypes[i % 3]).setDepth(2));
    }
    for (let i = 0; i < 7; i++) {
        const bx = Phaser.Math.Between(GRASS_RECT.x + 24, GRASS_RECT.x + GRASS_RECT.w - 24);
        const by = Phaser.Math.Between(GRASS_RECT.y + 24, GRASS_RECT.y + GRASS_RECT.h - 24);
        scene.roomDecos.add(scene.add.image(bx, by, 'spiral_bush').setDepth(3));
    }

    // Estanques
    const numPools = Phaser.Math.Between(2, 4);
    for (let i = 0; i < numPools; i++) {
        const px = Phaser.Math.Between(GRASS_RECT.x + 60, GRASS_RECT.x + GRASS_RECT.w - 60);
        const py = Phaser.Math.Between(GRASS_RECT.y + 60, GRASS_RECT.y + GRASS_RECT.h - 80);
        scene.tidePoolsGroup.add(scene.add.image(px, py, 'tide_pool').setDepth(2));
    }

    // Árboles y Rocas
    const numObstacles = Phaser.Math.Between(7, 11);
    for (let i = 0; i < numObstacles; i++) {
        const ox = Phaser.Math.Between(GRASS_RECT.x + 45, GRASS_RECT.x + GRASS_RECT.w - 45);
        const oy = Phaser.Math.Between(GRASS_RECT.y + 45, GRASS_RECT.y + GRASS_RECT.h - 85);
        if (Phaser.Math.Distance.Between(ox, oy, scene.player.x, scene.player.y) < 95) continue;

        const isTree = Math.random() > 0.38;
        const obs = scene.obstaclesGroup.create(ox, oy, isTree ? 'palm_tree' : 'coral_rock');
        obs.setDepth(isTree ? 14 : 8);
        if (isTree) obs.body.setSize(18, 16).setOffset(15, 34);
        else obs.body.setSize(24, 18).setOffset(4, 8);
    }

    // Mariposas y motas solares
    const bflyKeys = ['bfly_pink', 'bfly_purple', 'bfly_yellow'];
    for (let i = 0; i < 8; i++) {
        const bx = Phaser.Math.Between(GRASS_RECT.x + 20, GRASS_RECT.x + GRASS_RECT.w - 20);
        const by = Phaser.Math.Between(GRASS_RECT.y + 20, GRASS_RECT.y + GRASS_RECT.h - 20);
        const baseKey = bflyKeys[i % 3];
        const spr = scene.add.image(bx, by, baseKey + '_0').setDepth(30);
        scene.butterflies.push({
            sprite: spr,
            baseKey,
            angle: Math.random() * Math.PI * 2,
            speed: Phaser.Math.Between(18, 32),
            flapOffset: Math.random() * 1000
        });
    }
    for (let i = 0; i < 20; i++) {
        const mx = Phaser.Math.Between(ISLAND_RECT.x, ISLAND_RECT.x + ISLAND_RECT.w);
        const my = Phaser.Math.Between(ISLAND_RECT.y, ISLAND_RECT.y + ISLAND_RECT.h);
        const rect = scene.add.rectangle(mx, my, 2, 2, 0xfff8a8, 0.75).setDepth(34);
        scene.sunMotes.push({ rect, phase: Math.random() * Math.PI * 2 });
    }

    spawnRoomWave(scene);
    spawnFloatingText(scene, scene.player.x, scene.player.y - 22, `ISLA SECTOR ${state.room}`, '#ffe858');
}

function spawnRoomWave(scene) {
    const budget = 3 + Math.floor(state.room * 1.5);
    if (state.room % 5 === 0) {
        spawnEnemy(scene, WORLD_W / 2, GRASS_RECT.y + 80, 'golem', false);
    }
    for (let i = 0; i < budget; i++) {
        let ex, ey;
        do {
            ex = Phaser.Math.Between(GRASS_RECT.x + 30, GRASS_RECT.x + GRASS_RECT.w - 30);
            ey = Phaser.Math.Between(GRASS_RECT.y + 30, GRASS_RECT.y + GRASS_RECT.h - 110);
        } while (Phaser.Math.Distance.Between(ex, ey, scene.player.x, scene.player.y) < 145);

        const roll = Math.random();
        let type = 'crab';
        if (state.room >= 2 && roll > 0.48) type = 'boar';
        if (state.room >= 3 && roll > 0.76) type = 'totem';

        const shinyChance = Math.min(0.35, 0.07 + state.room * 0.025);
        spawnEnemy(scene, ex, ey, type, Math.random() < shinyChance);
    }
}

function spawnEnemy(scene, x, y, type, isShiny) {
    let baseKey = `enemy_${type}`;
    if (isShiny && type !== 'golem') baseKey += '_shiny';

    const enemy = scene.enemiesGroup.create(x, y, `${baseKey}_0`);
    enemy.baseKey = baseKey;
    enemy.setCollideWorldBounds(true);
    enemy.setBounce(0.6);
    enemy.setDepth(9);
    enemy.shadow = scene.add.image(x, y + 10, 'shadow').setDepth(8);

    const scaleMult = 1 + (state.room - 1) * 0.14;
    const shinyMult = isShiny ? 1.6 : 1;

    enemy.enemyType = type;
    enemy.isShiny = isShiny;
    enemy.stunnedUntil = 0;
    enemy.actionTimer = Phaser.Math.Between(500, 1300);
    enemy.spiralAngle = 0;
    enemy.charging = false;

    if (type === 'crab') {
        enemy.hp = 45 * scaleMult * shinyMult;
        enemy.speed = 72 * (isShiny ? 1.25 : 1);
    } else if (type === 'boar') {
        enemy.hp = 65 * scaleMult * shinyMult;
        enemy.speed = 95 * (isShiny ? 1.25 : 1);
    } else if (type === 'totem') {
        enemy.hp = 80 * scaleMult * shinyMult;
        enemy.speed = 32;
    } else if (type === 'golem') {
        enemy.hp = 320 * scaleMult;
        enemy.speed = 48;
    }

    if (isShiny) {
        RetroAudio.play('shiny');
        spawnParticles(scene, x, y, 0xffe858, 10);
        spawnFloatingText(scene, x, y - 16, '★ SHINY ★', '#ffe858');
    }
}

export function onRoomCleared(scene) {
    state.roomCleared = true;
    RetroAudio.play('powerup');
    spawnFloatingText(scene, scene.player.x, scene.player.y - 24, '¡ISLA DESPEJADA!', '#78ff68');

    scene.altarSprite = scene.physics.add.staticSprite(WORLD_W / 2, WORLD_H / 2, 'tiki_altar').setDepth(9);
    spawnParticles(scene, scene.altarSprite.x, scene.altarSprite.y, 0xffe858, 14);

    scene.physics.add.overlap(scene.player, scene.altarSprite, () => {
        if (!state.upgradeChosen && !state.choosingUpgrade) {
            openUpgradeMenu(scene);
        }
    });
}

export function spawnSandBridge(scene) {
    const bx = WORLD_W / 2;
    const bridgeVisual = scene.add.tileSprite(bx - 32, 0, 64, ISLAND_RECT.y + 24, 'sand_tile').setOrigin(0).setDepth(4);
    scene.roomDecos.add(bridgeVisual);

    scene.bridgeZone = scene.add.zone(bx, ISLAND_RECT.y + 18, 64, 32);
    scene.physics.world.enable(scene.bridgeZone);

    spawnFloatingText(scene, bx, ISLAND_RECT.y + 36, '▲ AVANZA AL NORTE ▲', '#68ffff');

    scene.physics.add.overlap(scene.player, scene.bridgeZone, () => {
        if (!state.transitioning) {
            state.transitioning = true;
            state.room++;
            scene.cameras.main.fadeOut(200, 0, 0, 0);
            scene.time.delayedCall(210, () => {
                buildProceduralRoom(scene);
                scene.cameras.main.fadeIn(200, 0, 0, 0);
            });
        }
    });
}

export function drawAnimatedShoreline(scene, time) {
    scene.waterTile.tilePositionX += 0.2;
    scene.waterTile.tilePositionY += 0.12;

    scene.foamGraphics.clear();
    const wave = Math.sin(time * 0.004) * 4;
    scene.foamGraphics.fillStyle(0xd8f8ff, 0.85);
    scene.foamGraphics.fillRect(
        ISLAND_RECT.x - 8 - wave,
        ISLAND_RECT.y - 8 - wave,
        ISLAND_RECT.w + 16 + wave * 2,
        ISLAND_RECT.h + 16 + wave * 2
    );
    scene.foamGraphics.fillStyle(0x58b8f8, 1);
    scene.foamGraphics.fillRect(
        ISLAND_RECT.x - 4 - wave * 0.5,
        ISLAND_RECT.y - 4 - wave * 0.5,
        ISLAND_RECT.w + 8 + wave,
        ISLAND_RECT.h + 8 + wave
    );
}

export function updateAmbientLife(scene, time, delta) {
    scene.butterflies.forEach((b) => {
        b.angle += (Math.random() - 0.5) * 0.18;
        b.sprite.x += Math.cos(b.angle) * b.speed * (delta * 0.001);
        b.sprite.y += Math.sin(b.angle) * b.speed * (delta * 0.001);
        const f = Math.floor((time + b.flapOffset) / 110) % 2;
        b.sprite.setTexture(`${b.baseKey}_${f}`);
    });

    scene.sunMotes.forEach((m) => {
        m.rect.y -= 0.15;
        m.rect.x += Math.sin(time * 0.003 + m.phase) * 0.12;
        if (m.rect.y < ISLAND_RECT.y) m.rect.y = ISLAND_RECT.y + ISLAND_RECT.h;
    });
}

export function spawnParticles(scene, x, y, color, count) {
    for (let i = 0; i < count; i++) {
        const p = scene.add.image(x, y, 'pixel_part').setTint(color).setDepth(20);
        const ang = Math.random() * Math.PI * 2;
        const dist = Phaser.Math.Between(10, 32);
        scene.tweens.add({
            targets: p,
            x: x + Math.cos(ang) * dist,
            y: y + Math.sin(ang) * dist,
            alpha: 0,
            scale: 0.3,
            duration: Phaser.Math.Between(180, 340),
            onComplete: () => p.destroy()
        });
    }
}