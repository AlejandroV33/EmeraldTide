import { WORLD_W, WORLD_H, ISLAND_RECT, WEAPONS, state, getUpgradeLevel } from './state.js';
import { RetroAudio } from './audio.js';
import { onRoomCleared, spawnParticles } from './world.js';
import { spawnFloatingText, triggerGameOver } from './ui.js';

export function initCombat(scene) {
    scene.playerBulletsGroup = scene.physics.add.group();
    scene.enemyBulletsGroup = scene.physics.add.group();

    scene.playerShadow = scene.add.image(WORLD_W / 2, WORLD_H / 2 + 10, 'shadow').setDepth(9);
    scene.player = scene.physics.add.sprite(WORLD_W / 2, ISLAND_RECT.y + ISLAND_RECT.h - 55, 'player_0').setDepth(10);
    scene.player.setCollideWorldBounds(true);
    scene.player.body.setSize(14, 14).setOffset(5, 8);

    scene.heldWeapon = scene.add.image(scene.player.x + 8, scene.player.y + 2, 'held_sword').setDepth(11);
    scene.parryArc = scene.add.image(scene.player.x, scene.player.y, 'parry_arc').setDepth(13).setVisible(false);

    // Teclas de Movimiento (WASD / Flechas), Apuntado (IJKL), Disparo (SPACE) y Parry (SHIFT)
    scene.cursors = scene.input.keyboard.createCursorKeys();
    scene.keys = scene.input.keyboard.addKeys({
        W: Phaser.Input.Keyboard.KeyCodes.W,
        A: Phaser.Input.Keyboard.KeyCodes.A,
        S: Phaser.Input.Keyboard.KeyCodes.S,
        D: Phaser.Input.Keyboard.KeyCodes.D,
        I: Phaser.Input.Keyboard.KeyCodes.I,
        J: Phaser.Input.Keyboard.KeyCodes.J,
        K: Phaser.Input.Keyboard.KeyCodes.K,
        L: Phaser.Input.Keyboard.KeyCodes.L,
        SPACE: Phaser.Input.Keyboard.KeyCodes.SPACE,
        SHIFT: Phaser.Input.Keyboard.KeyCodes.SHIFT,
        Q: Phaser.Input.Keyboard.KeyCodes.Q,
        ONE: Phaser.Input.Keyboard.KeyCodes.ONE,
        TWO: Phaser.Input.Keyboard.KeyCodes.TWO,
        THREE: Phaser.Input.Keyboard.KeyCodes.THREE,
        ESC: Phaser.Input.Keyboard.KeyCodes.ESC,
        R: Phaser.Input.Keyboard.KeyCodes.R
    });

    scene.pointer = scene.input.activePointer;
    scene.input.setDefaultCursor('none');
    scene.crosshair = scene.add.image(scene.player.x, scene.player.y - 40, 'crosshair').setDepth(200);

    // Parry con Clic Derecho o con tecla SHIFT
    scene.input.on('pointerdown', (ptr) => {
        if (ptr.rightButtonDown()) triggerParry(scene);
    });
    scene.keys.SHIFT.on('down', () => triggerParry(scene));

    // Cambiar de arma con Q
    scene.keys.Q.on('down', () => {
        if (!state.choosingUpgrade && !state.gameOver) {
            state.weaponIndex = (state.weaponIndex + 1) % WEAPONS.length;
            RetroAudio.play('powerup');
            spawnFloatingText(scene, scene.player.x, scene.player.y - 16, WEAPONS[state.weaponIndex].name, '#ffe858');
        }
    });

    // Colisiones físicas
    scene.physics.add.collider(scene.player, scene.obstaclesGroup);
    scene.physics.add.collider(scene.enemiesGroup, scene.obstaclesGroup);
    scene.physics.add.collider(scene.enemiesGroup, scene.enemiesGroup);

    scene.physics.add.collider(scene.playerBulletsGroup, scene.obstaclesGroup, (bullet, obs) => {
        if (obs.texture.key === 'palm_tree') {
            scene.tweens.add({ targets: obs, angle: { from: -4, to: 4 }, duration: 55, yoyo: true });
            spawnParticles(scene, obs.x, obs.y - 8, 0x60c038, 5);
        } else {
            spawnParticles(scene, bullet.x, bullet.y, 0xa8b8c8, 4);
        }

        if (bullet.bouncesLeft > 0) {
            bullet.bouncesLeft--;
            RetroAudio.play('hit');
        } else {
            bullet.destroy();
        }
    });

    scene.physics.add.overlap(scene.playerBulletsGroup, scene.enemiesGroup, (bullet, enemy) => {
        damageEnemy(scene, enemy, bullet.damage, bullet.isParriedBullet);
        if (bullet.isParriedBullet) {
            createWaterExplosion(scene, bullet.x, bullet.y, 52, bullet.damage * 0.6);
        }
        bullet.destroy();
    });

    scene.physics.add.collider(scene.enemyBulletsGroup, scene.obstaclesGroup, (bullet) => {
        spawnParticles(scene, bullet.x, bullet.y, 0xff98d0, 3);
        bullet.destroy();
    });

    scene.physics.add.overlap(scene.player, scene.enemyBulletsGroup, (plr, bullet) => {
        if (state.isParrying && bullet.canParry) {
            executeSuccessfulParry(scene, bullet, null);
        } else {
            damagePlayer(scene, 15);
            bullet.destroy();
        }
    });

    scene.physics.add.overlap(scene.player, scene.enemiesGroup, (plr, enemy) => {
        if (state.isParrying) {
            executeSuccessfulParry(scene, null, enemy);
        } else {
            damagePlayer(scene, 18);
            const ang = Phaser.Math.Angle.Between(enemy.x, enemy.y, plr.x, plr.y);
            plr.setVelocity(Math.cos(ang) * 240, Math.sin(ang) * 240);
        }
    });
}

export function updateCombat(scene, time, delta) {
    if (time > state.animTimer) {
        state.animTimer = time + 180;
        state.animFrame = 1 - state.animFrame;
    }

    updateAimingSystem(scene);
    updatePlayerMovement(scene, time);

    if (state.isParrying && time > state.parryWindowEnd) {
        state.isParrying = false;
        scene.parryArc.setVisible(false);
    }
    if (state.isParrying) {
        scene.parryArc.setPosition(
            scene.player.x + Math.cos(state.aimAngle) * 15,
            scene.player.y + Math.sin(state.aimAngle) * 15
        );
        scene.parryArc.setRotation(state.aimAngle);
    }

    // Disparo con Clic Izquierdo O con Barra Espaciadora
    if ((scene.pointer.leftButtonDown() || scene.keys.SPACE.isDown) && !state.isParrying) {
        tryShootWeapon(scene, time);
    }

    updateEnemiesAI(scene, time, delta);

    if (!state.roomCleared && scene.enemiesGroup.countActive(true) === 0) {
        onRoomCleared(scene);
    }
}

// Sistema de Apuntado Dual: Mouse + Teclado (I, J, K, L en 8 direcciones)
function updateAimingSystem(scene) {
    scene.pointer.updateWorldPoint(scene.cameras.main);

    // 1. Comprobar teclas I, J, K, L (incluyendo diagonales al presionar 2 teclas)
    let ax = 0;
    let ay = 0;
    if (scene.keys.J.isDown) ax -= 1;
    if (scene.keys.L.isDown) ax += 1;
    if (scene.keys.I.isDown) ay -= 1;
    if (scene.keys.K.isDown) ay += 1;

    if (ax !== 0 || ay !== 0) {
        state.aimMode = 'keyboard';
        state.aimAngle = Math.atan2(ay, ax);
    } else {
        // Si el mouse se mueve, cambiar automáticamente a modo ratón
        const mouseMoved = Math.hypot(scene.pointer.x - state.lastMouseX, scene.pointer.y - state.lastMouseY) > 2;
        if (mouseMoved) {
            state.aimMode = 'mouse';
            state.lastMouseX = scene.pointer.x;
            state.lastMouseY = scene.pointer.y;
        }
    }

    if (state.aimMode === 'mouse') {
        state.aimAngle = Phaser.Math.Angle.Between(
            scene.player.x,
            scene.player.y,
            scene.pointer.worldX,
            scene.pointer.worldY
        );
        scene.crosshair.setPosition(scene.pointer.worldX, scene.pointer.worldY);
    } else {
        // En modo teclado (IJKL), colocar la mira a 52px del jugador en la dirección apuntada
        scene.crosshair.setPosition(
            scene.player.x + Math.cos(state.aimAngle) * 52,
            scene.player.y + Math.sin(state.aimAngle) * 52
        );
    }
}

function updatePlayerMovement(scene, time) {
    let vx = 0, vy = 0;
    if (scene.cursors.left.isDown || scene.keys.A.isDown) vx = -1;
    else if (scene.cursors.right.isDown || scene.keys.D.isDown) vx = 1;
    if (scene.cursors.up.isDown || scene.keys.W.isDown) vy = -1;
    else if (scene.cursors.down.isDown || scene.keys.S.isDown) vy = 1;

    let inTidePool = false;
    scene.tidePoolsGroup.getChildren().forEach((pool) => {
        if (Phaser.Math.Distance.Between(scene.player.x, scene.player.y, pool.x, pool.y) < 22) {
            inTidePool = true;
        }
    });

    const lightFeetLv = getUpgradeLevel('lightFeet');
    let baseSpeed = 165 * (1 + lightFeetLv * 0.15);
    if (inTidePool && lightFeetLv === 0) baseSpeed *= 0.65;

    if (vx !== 0 || vy !== 0) {
        const len = Math.hypot(vx, vy);
        scene.player.setVelocity((vx / len) * baseSpeed, (vy / len) * baseSpeed);
        scene.player.setTexture(`player_${state.animFrame}`);

        if (time > state.footstepTimer) {
            state.footstepTimer = time + 140;
            const fp = scene.add.rectangle(scene.player.x, scene.player.y + 9, 3, 3, inTidePool ? 0x88e0f8 : 0x388018, 0.65).setDepth(3);
            scene.tweens.add({ targets: fp, alpha: 0, duration: 1400, onComplete: () => fp.destroy() });
        }
    } else {
        scene.player.setVelocity(0, 0);
        scene.player.setTexture('player_0');
    }

    scene.playerShadow.setPosition(scene.player.x, scene.player.y + 10);
    scene.player.setFlipX(Math.cos(state.aimAngle) < 0);

    scene.heldWeapon.setPosition(
        scene.player.x + Math.cos(state.aimAngle) * 9,
        scene.player.y + 2 + Math.sin(state.aimAngle) * 9
    );
    scene.heldWeapon.setRotation(state.aimAngle);
}

function tryShootWeapon(scene, time) {
    const weapon = WEAPONS[state.weaponIndex];
    let fireDelay = weapon.fireRate;
    const furyLv = getUpgradeLevel('tropicalFury');
    if (time < state.furyEnd && furyLv > 0) {
        fireDelay *= Math.max(0.38, 1 - furyLv * 0.25);
    }

    if (time < state.lastFired + fireDelay) return;
    state.lastFired = time;

    RetroAudio.play('shoot');
    scene.cameras.main.shake(35, 0.0018);

    const dmgLv = getUpgradeLevel('damageUp');
    const dmg = weapon.damage * (1 + dmgLv * 0.25);

    for (let i = 0; i < weapon.count; i++) {
        const spreadOffset = (Math.random() - 0.5) * weapon.spread;
        spawnPlayerBullet(scene, scene.player.x, scene.player.y, state.aimAngle + spreadOffset, weapon.speed, dmg, false);
    }
}

function spawnPlayerBullet(scene, x, y, angle, speed, damage, isParried) {
    const b = scene.playerBulletsGroup.create(x, y, 'bullet_player');
    b.setDepth(12);
    b.setBounce(1);
    b.damage = damage;
    b.isParriedBullet = isParried;
    b.bouncesLeft = getUpgradeLevel('bounce') + (isParried ? 1 : 0);

    if (isParried) {
        b.setScale(1.4);
        b.setTint(0xff58c8);
    } else {
        b.setTint(WEAPONS[state.weaponIndex].color);
    }

    b.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
    scene.time.delayedCall(1600, () => { if (b && b.active) b.destroy(); });
}

export function triggerParry(scene) {
    if (state.gameOver || state.choosingUpgrade) return;
    const now = scene.time.now;
    if (now < state.parryCooldownEnd) return;

    state.isParrying = true;
    state.parryWindowEnd = now + 260;
    state.parryCooldownEnd = now + 1150;

    RetroAudio.play('parry_swing');
    scene.parryArc.setVisible(true);
    scene.parryArc.setScale(1.15);
    scene.tweens.add({ targets: scene.parryArc, scale: 1, duration: 170 });
}

function executeSuccessfulParry(scene, bullet, meleeEnemy) {
    const now = scene.time.now;
    state.parryCooldownEnd = now;
    state.invulnEnd = now + 380;

    if (getUpgradeLevel('tropicalFury') > 0) state.furyEnd = now + 3000;

    const tideLv = getUpgradeLevel('tideWave');
    if (tideLv > 0) {
        state.hp = Math.min(state.maxHp, state.hp + 6 * tideLv);
        createWaterExplosion(scene, scene.player.x, scene.player.y, 75, 28 * tideLv);
    }

    RetroAudio.play('parry_hit');
    scene.physics.world.pause();
    scene.cameras.main.flash(80, 220, 255, 255);
    setTimeout(() => {
        if (scene && scene.physics && scene.physics.world) scene.physics.world.resume();
    }, 75);

    scene.cameras.main.shake(120, 0.008);
    spawnFloatingText(scene, scene.player.x, scene.player.y - 20, '¡PARRY!', '#68ffff');
    spawnParticles(scene, scene.player.x, scene.player.y, 0x68ffff, 12);

    if (bullet) {
        const total = 1 + getUpgradeLevel('mirror') * 2;
        for (let i = 0; i < total; i++) {
            const off = (i - Math.floor(total / 2)) * 0.22;
            spawnPlayerBullet(scene, scene.player.x, scene.player.y, state.aimAngle + off, 620, 65, true);
        }
        bullet.destroy();
    }

    if (meleeEnemy) {
        meleeEnemy.stunnedUntil = now + 2000;
        meleeEnemy.charging = false;
        const knock = Phaser.Math.Angle.Between(scene.player.x, scene.player.y, meleeEnemy.x, meleeEnemy.y);
        meleeEnemy.setVelocity(Math.cos(knock) * 340, Math.sin(knock) * 340);
        damageEnemy(scene, meleeEnemy, 45, true);
        createWaterExplosion(scene, meleeEnemy.x, meleeEnemy.y, 65, 30);
    }
}

function updateEnemiesAI(scene, time, delta) {
    scene.enemiesGroup.getChildren().forEach((enemy) => {
        if (!enemy.active) return;
        enemy.shadow.setPosition(enemy.x, enemy.y + 10);
        enemy.setTexture(`${enemy.baseKey}_${state.animFrame}`);

        if (time < enemy.stunnedUntil) {
            enemy.setTint(0x68ffff);
            return;
        } else if (!enemy.charging) {
            enemy.clearTint();
        }

        const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, scene.player.x, scene.player.y);
        const angleToPlayer = Phaser.Math.Angle.Between(enemy.x, enemy.y, scene.player.x, scene.player.y);
        enemy.actionTimer -= delta;

        if (enemy.enemyType === 'crab') {
            const strafe = angleToPlayer + Math.sin(time * 0.003) * 1.1;
            enemy.setVelocity(Math.cos(strafe) * enemy.speed, Math.sin(strafe) * enemy.speed);
            if (enemy.actionTimer <= 0) {
                enemy.actionTimer = enemy.isShiny ? 1150 : 1700;
                spawnEnemyBullet(scene, enemy.x, enemy.y, angleToPlayer, 185, true);
                if (enemy.isShiny) {
                    spawnEnemyBullet(scene, enemy.x, enemy.y, angleToPlayer + 0.25, 185, true);
                    spawnEnemyBullet(scene, enemy.x, enemy.y, angleToPlayer - 0.25, 185, true);
                }
            }
        } else if (enemy.enemyType === 'boar') {
            if (!enemy.charging) {
                enemy.setVelocity(Math.cos(angleToPlayer) * enemy.speed, Math.sin(angleToPlayer) * enemy.speed);
                if (dist < 175 && enemy.actionTimer <= 0) {
                    enemy.charging = true;
                    enemy.actionTimer = 1900;
                    enemy.setVelocity(0, 0);
                    enemy.setTint(0xffe848);

                    scene.time.delayedCall(400, () => {
                        if (!enemy.active || time < enemy.stunnedUntil) return;
                        const cAng = Phaser.Math.Angle.Between(enemy.x, enemy.y, scene.player.x, scene.player.y);
                        enemy.setVelocity(Math.cos(cAng) * 310, Math.sin(cAng) * 310);
                        scene.time.delayedCall(500, () => { if (enemy.active) enemy.charging = false; });
                    });
                }
            }
        } else if (enemy.enemyType === 'totem') {
            enemy.setVelocity(Math.cos(angleToPlayer) * enemy.speed, Math.sin(angleToPlayer) * enemy.speed);
            if (enemy.actionTimer <= 0) {
                enemy.actionTimer = enemy.isShiny ? 950 : 1350;
                enemy.spiralAngle += 0.45;
                const count = enemy.isShiny ? 8 : 6;
                for (let i = 0; i < count; i++) {
                    const ang = enemy.spiralAngle + (Math.PI * 2 * i) / count;
                    spawnEnemyBullet(scene, enemy.x, enemy.y, ang, 155, i % 2 === 0);
                }
            }
        } else if (enemy.enemyType === 'golem') {
            enemy.setVelocity(Math.cos(angleToPlayer) * enemy.speed, Math.sin(angleToPlayer) * enemy.speed);
            if (enemy.actionTimer <= 0) {
                enemy.actionTimer = 1450;
                for (let i = -2; i <= 2; i++) {
                    spawnEnemyBullet(scene, enemy.x, enemy.y, angleToPlayer + i * 0.25, 200, i % 2 === 0);
                }
            }
        }
    });
}

function spawnEnemyBullet(scene, x, y, angle, speed, canParry) {
    const b = scene.enemyBulletsGroup.create(x, y, canParry ? 'bullet_parry' : 'bullet_dark');
    b.setDepth(11);
    b.canParry = canParry;
    b.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
    scene.time.delayedCall(3200, () => { if (b && b.active) b.destroy(); });
}

export function damageEnemy(scene, enemy, amount, isCritical) {
    if (!enemy.active) return;
    enemy.hp -= amount;
    RetroAudio.play('hit');

    enemy.setTintFill(0xffffff);
    scene.time.delayedCall(60, () => { if (enemy.active) enemy.clearTint(); });
    spawnParticles(scene, enemy.x, enemy.y, isCritical ? 0x68ffff : 0xffe858, isCritical ? 8 : 4);

    if (enemy.hp <= 0) {
        state.score += enemy.isShiny ? 250 : 100;
        spawnParticles(scene, enemy.x, enemy.y, 0xff5858, 12);
        if (enemy.shadow) enemy.shadow.destroy();
        enemy.destroy();
    }
}

function damagePlayer(scene, amount) {
    const now = scene.time.now;
    if (now < state.invulnEnd || state.gameOver) return;

    state.hp = Math.max(0, state.hp - amount);
    state.invulnEnd = now + 750;
    RetroAudio.play('hit');
    scene.cameras.main.shake(140, 0.01);
    scene.player.setTint(0xff4848);
    scene.time.delayedCall(220, () => { if (scene.player.active) scene.player.clearTint(); });

    if (state.hp <= 0) triggerGameOver(scene);
}

function createWaterExplosion(scene, x, y, radius, damage) {
    const circle = scene.add.circle(x, y, 8, 0x68ffff, 0.65).setDepth(12);
    scene.tweens.add({
        targets: circle,
        radius: radius,
        alpha: 0,
        duration: 220,
        onComplete: () => circle.destroy()
    });

    scene.enemiesGroup.getChildren().forEach((enemy) => {
        if (enemy.active && Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y) <= radius) {
            damageEnemy(scene, enemy, damage, true);
        }
    });
}