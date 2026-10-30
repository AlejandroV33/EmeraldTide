import { WORLD_W, WORLD_H, ISLAND_RECT, WEAPONS, state, getUpgradeLevel } from './state.js';
import { RetroAudio } from './audio.js';
import { onRoomCleared, spawnParticles, trySpawnReinforcement, spawnNutInArena } from './world.js';
import { spawnFloatingText, triggerGameOver } from './ui.js';

export function initCombat(scene) {
    scene.playerBulletsGroup = scene.physics.add.group();
    scene.enemyBulletsGroup = scene.physics.add.group();
    scene.activeTurret = null;

    scene.playerShadow = scene.add.image(WORLD_W / 2, WORLD_H / 2 + 10, 'shadow').setDepth(9);
    scene.player = scene.physics.add.sprite(WORLD_W / 2, ISLAND_RECT.y + ISLAND_RECT.h - 55, 'player_0').setDepth(10);
    scene.player.setCollideWorldBounds(true);
    scene.player.body.setSize(14, 14).setOffset(5, 8);

    scene.heldWeapon = scene.add.image(scene.player.x + 8, scene.player.y + 2, 'held_sword').setDepth(11);

    // El arco azul del Parry ahora es un Sprite Físico con su propia área de colisión
    scene.parryArc = scene.physics.add.sprite(scene.player.x, scene.player.y, 'parry_arc')
        .setDepth(13)
        .setVisible(false);
    scene.parryArc.body.setCircle(20, 2, 2);
    scene.parryArc.body.enable = false;

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

    // Parry con Clic Derecho o con SHIFT
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

    // Colisiones con obstáculos
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

    // 1. NUEVO PARRY: Rebota SOLO proyectiles cuando tocan el arco azul (parryArc)
    scene.physics.add.overlap(scene.parryArc, scene.enemyBulletsGroup, (arc, bullet) => {
        if (state.isParrying && bullet.canParry) {
            executeSuccessfulProjectileParry(scene, bullet);
        }
    });

    // 2. Si el proyectil llega a tocar al jugador directamente, el jugador recibe daño
    scene.physics.add.overlap(scene.player, scene.enemyBulletsGroup, (plr, bullet) => {
        damagePlayer(scene, 15);
        bullet.destroy();
    });

    // 3. Los ataques cuerpo a cuerpo / contacto con enemigos YA NO tienen Parry
    scene.physics.add.overlap(scene.player, scene.enemiesGroup, (plr, enemy) => {
        damagePlayer(scene, 18);
        const ang = Phaser.Math.Angle.Between(enemy.x, enemy.y, plr.x, plr.y);
        plr.setVelocity(Math.cos(ang) * 240, Math.sin(ang) * 240);
    });

    // 4. Recolección de Tuercas en la arena
    scene.physics.add.overlap(scene.player, scene.nutsGroup, (plr, nut) => {
        collectNut(scene, nut);
    });
}

export function updateCombat(scene, time, delta) {
    if (time > state.animTimer) {
        state.animTimer = time + 180;
        state.animFrame = 1 - state.animFrame;
    }

    updateAimingSystem(scene);
    updatePlayerMovement(scene, time);

    // Control de la ventana activa de la animación azul del Parry
    if (state.isParrying && time > state.parryWindowEnd) {
        state.isParrying = false;
        scene.parryArc.setVisible(false);
        scene.parryArc.body.enable = false;
    }
    if (state.isParrying) {
        // Posicionar la animación azul justo delante del jugador en dirección a la mira
        const arcDist = 20;
        scene.parryArc.setPosition(
            scene.player.x + Math.cos(state.aimAngle) * arcDist,
            scene.player.y + Math.sin(state.aimAngle) * arcDist
        );
        scene.parryArc.setRotation(state.aimAngle);
    }

    // Disparo con Clic Izquierdo o Espacio
    if ((scene.pointer.leftButtonDown() || scene.keys.SPACE.isDown) && !state.isParrying) {
        tryShootWeapon(scene, time);
    }

    updateEnemiesAI(scene, time, delta);
    updateTurretSystem(scene, time, delta);

    // Spawneo periódico de tuercas desde el Nivel 3
    if (state.room >= 3 && !state.roomCleared) {
        state.nutSpawnTimer -= delta;
        if (state.nutSpawnTimer <= 0) {
            state.nutSpawnTimer = 6000; // 1 tuerca nueva cada 6 segundos
            spawnNutInArena(scene);
        }
    }

    // La sala solo termina cuando no quedan enemigos activos NI refuerzos por aparecer
    if (!state.roomCleared && scene.enemiesGroup.countActive(true) === 0 && state.remainingReinforcements === 0) {
        onRoomCleared(scene);
    }
}

function updateAimingSystem(scene) {
    scene.pointer.updateWorldPoint(scene.cameras.main);

    let ax = 0, ay = 0;
    if (scene.keys.J.isDown) ax -= 1;
    if (scene.keys.L.isDown) ax += 1;
    if (scene.keys.I.isDown) ay -= 1;
    if (scene.keys.K.isDown) ay += 1;

    if (ax !== 0 || ay !== 0) {
        state.aimMode = 'keyboard';
        state.aimAngle = Math.atan2(ay, ax);
    } else {
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

// ==========================================
// PARRY REDISEÑADO: COLISIÓN EN ARCO AZUL
// ==========================================
export function triggerParry(scene) {
    if (state.gameOver || state.choosingUpgrade) return;
    const now = scene.time.now;
    if (now < state.parryCooldownEnd) return;

    state.isParrying = true;
    // Ventana corta pero justa (320 ms) para interceptar proyectiles con el arco azul
    state.parryWindowEnd = now + 320;
    state.parryCooldownEnd = now + 980;

    RetroAudio.play('parry_swing');
    scene.parryArc.setPosition(
        scene.player.x + Math.cos(state.aimAngle) * 20,
        scene.player.y + Math.sin(state.aimAngle) * 20
    );
    scene.parryArc.setRotation(state.aimAngle);
    scene.parryArc.setVisible(true);
    scene.parryArc.body.enable = true;
    scene.parryArc.setScale(1.2);
    scene.tweens.add({ targets: scene.parryArc, scale: 1, duration: 200 });
}

function executeSuccessfulProjectileParry(scene, bullet) {
    const now = scene.time.now;
    state.parryCooldownEnd = now; // Reinicia el enfriamiento al instante si rebotas el proyectil
    state.invulnEnd = now + 260;

    if (getUpgradeLevel('tropicalFury') > 0) state.furyEnd = now + 3000;

    const tideLv = getUpgradeLevel('tideWave');
    if (tideLv > 0) {
        state.hp = Math.min(state.maxHp, state.hp + 6 * tideLv);
        createWaterExplosion(scene, bullet.x, bullet.y, 75, 28 * tideLv);
    }

    RetroAudio.play('parry_hit');
    scene.physics.world.pause();
    scene.cameras.main.flash(75, 200, 255, 255);
    setTimeout(() => {
        if (scene && scene.physics && scene.physics.world) scene.physics.world.resume();
    }, 65);

    scene.cameras.main.shake(110, 0.008);
    spawnFloatingText(scene, bullet.x, bullet.y - 16, '¡PARRY!', '#68ffff');
    spawnParticles(scene, bullet.x, bullet.y, 0x68ffff, 12);

    // Rebota desde la posición del arco azul hacia donde apunta el jugador
    const total = 1 + getUpgradeLevel('mirror') * 2;
    for (let i = 0; i < total; i++) {
        const off = (i - Math.floor(total / 2)) * 0.22;
        spawnPlayerBullet(scene, bullet.x, bullet.y, state.aimAngle + off, 640, 68, true);
    }
    bullet.destroy();
}

// ==========================================
// SISTEMA DE TUERCAS Y TORRETA ALIADA
// ==========================================
function collectNut(scene, nut) {
    const nx = nut.x;
    const ny = nut.y;
    nut.destroy();
    RetroAudio.play('powerup');
    spawnParticles(scene, nx, ny, 0xd8f0ff, 7);

    // Si la torreta ya está activa y estamos cerca de ella, repararla directamente
    if (scene.activeTurret && Phaser.Math.Distance.Between(scene.player.x, scene.player.y, scene.activeTurret.x, scene.activeTurret.y) < 55) {
        repairActiveTurret(scene, 1);
        return;
    }

    state.nuts++;

    // Si aún no hay torreta y llegamos a 5 tuercas, se construye automáticamente
    if (!scene.activeTurret && state.nuts >= 5) {
        state.nuts -= 5;
        deployHelperTurret(scene, scene.player.x, scene.player.y);
    } else {
        spawnFloatingText(scene, nx, ny - 12, `+1 Tuerca (${state.nuts}/5)`, '#d8f0ff');
    }
}

function deployHelperTurret(scene, x, y) {
    RetroAudio.play('shiny');
    spawnParticles(scene, x, y, 0x68ffff, 14);
    spawnFloatingText(scene, x, y - 24, '¡TORRETA DESPLEGADA!', '#68ffff');

    const range = 145; // Rango moderado de disparo
    const rangeCircle = scene.add.circle(x, y, range, 0x58e8ff, 0.07)
        .setStrokeStyle(1, 0x58e8ff, 0.35)
        .setDepth(4);
    const base = scene.add.image(x, y, 'turret_base').setDepth(8);
    const gun = scene.add.image(x, y, 'turret_gun').setDepth(9);
    const hpBg = scene.add.rectangle(x, y - 18, 26, 4, 0x141013).setDepth(15);
    const hpFill = scene.add.rectangle(x - 12, y - 18, 24, 2, 0x58ff78).setOrigin(0, 0.5).setDepth(16);

    scene.activeTurret = {
        x,
        y,
        hp: 100,
        maxHp: 100,
        range,
        fireTimer: 0,
        rangeCircle,
        base,
        gun,
        hpBg,
        hpFill
    };
}

function repairActiveTurret(scene, nutsUsed) {
    const t = scene.activeTurret;
    if (!t) return;
    t.hp = Math.min(t.maxHp, t.hp + nutsUsed * 28);
    RetroAudio.play('powerup');
    spawnParticles(scene, t.x, t.y, 0x78ff68, 10);
    spawnFloatingText(scene, t.x, t.y - 24, `¡TORRETA +${nutsUsed * 28}% VIDA!`, '#78ff68');
}

function updateTurretSystem(scene, time, delta) {
    const t = scene.activeTurret;
    if (!t) {
        // Si no hay torreta pero ya teníamos 5 tuercas guardadas, desplegarla
        if (state.nuts >= 5) {
            state.nuts -= 5;
            deployHelperTurret(scene, scene.player.x, scene.player.y);
        }
        return;
    }

    // 1. Si el jugador trae tuercas en el inventario y se acerca a la torreta herida, la repara automáticamente
    if (state.nuts > 0 && t.hp < t.maxHp - 5) {
        const distToPlayer = Phaser.Math.Distance.Between(scene.player.x, scene.player.y, t.x, t.y);
        if (distToPlayer < 38) {
            const needed = Math.min(state.nuts, Math.ceil((t.maxHp - t.hp) / 28));
            if (needed > 0) {
                state.nuts -= needed;
                repairActiveTurret(scene, needed);
            }
        }
    }

    // 2. Desgaste natural de la vida de la torreta con el tiempo (6.2 de vida por segundo)
    if (!state.roomCleared) {
        t.hp -= 6.2 * (delta * 0.001);
    }
    const ratio = Math.max(0, t.hp / t.maxHp);
    t.hpFill.width = Math.floor(24 * ratio);
    t.hpFill.fillColor = ratio > 0.4 ? 0x58ff78 : 0xff6848;

    if (t.hp <= 0) {
        spawnParticles(scene, t.x, t.y, 0xff6848, 12);
        spawnFloatingText(scene, t.x, t.y - 18, 'TORRETA DESGASTADA', '#ff7878');
        destroyActiveTurret(scene);
        return;
    }

    // 3. Buscar al enemigo más cercano dentro de su rango moderado (145px) y disparar automático
    t.fireTimer -= delta;
    let closestEnemy = null;
    let minDist = t.range;

    scene.enemiesGroup.getChildren().forEach((en) => {
        if (!en.active) return;
        const d = Phaser.Math.Distance.Between(t.x, t.y, en.x, en.y);
        if (d <= minDist) {
            minDist = d;
            closestEnemy = en;
        }
    });

    if (closestEnemy) {
        const ang = Phaser.Math.Angle.Between(t.x, t.y, closestEnemy.x, closestEnemy.y);
        t.gun.setRotation(ang);

        if (t.fireTimer <= 0) {
            t.fireTimer = 420;
            RetroAudio.play('shoot');
            const b = scene.playerBulletsGroup.create(
                t.x + Math.cos(ang) * 12,
                t.y + Math.sin(ang) * 12,
                'bullet_player'
            );
            b.setDepth(12);
            b.damage = 18;
            b.isParriedBullet = false;
            b.bouncesLeft = 0;
            b.setTint(0x68ffff);
            b.setVelocity(Math.cos(ang) * 460, Math.sin(ang) * 460);
            scene.time.delayedCall(900, () => { if (b && b.active) b.destroy(); });
        }
    }
}

export function destroyActiveTurret(scene) {
    if (!scene.activeTurret) return;
    scene.activeTurret.rangeCircle.destroy();
    scene.activeTurret.base.destroy();
    scene.activeTurret.gun.destroy();
    scene.activeTurret.hpBg.destroy();
    scene.activeTurret.hpFill.destroy();
    scene.activeTurret = null;
}

// ==========================================
// IA DE ENEMIGOS (INCLUYE NUEVO BRUTO TIKI)
// ==========================================
function updateEnemiesAI(scene, time, delta) {
    scene.enemiesGroup.getChildren().forEach((enemy) => {
        if (!enemy.active) return;
        enemy.shadow.setPosition(enemy.x, enemy.y + (enemy.enemyType === 'brute' ? 14 : 10));
        enemy.setTexture(`${enemy.baseKey}_${state.animFrame}`);

        if (time < enemy.stunnedUntil) {
            enemy.setTint(0x68ffff);
            return;
        } else if (!enemy.charging && !enemy.windingUp) {
            enemy.clearTint();
        }

        const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, scene.player.x, scene.player.y);
        const angleToPlayer = Phaser.Math.Angle.Between(enemy.x, enemy.y, scene.player.x, scene.player.y);
        enemy.actionTimer -= delta;

        // 1. Cangrejo
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
        }
        // 2. Jabalí
        else if (enemy.enemyType === 'boar') {
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
        }
        // 3. Tótem
        else if (enemy.enemyType === 'totem') {
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
        }
        // 4. NUEVO MOB (NIVEL 3+): BRUTO / COLOSO TIKI (Ataque a distancia + Golpe cercano lento de alto daño)
        else if (enemy.enemyType === 'brute') {
            if (enemy.windingUp) {
                enemy.setVelocity(0, 0);
                return;
            }

            enemy.setVelocity(Math.cos(angleToPlayer) * enemy.speed, Math.sin(angleToPlayer) * enemy.speed);

            // Si el jugador está cerca (<= 75px), prepara su Golpe Sísmico pesado con 650ms de aviso
            if (dist <= 75 && enemy.actionTimer <= 400) {
                enemy.windingUp = true;
                enemy.actionTimer = 2100;
                enemy.setVelocity(0, 0);
                enemy.setTint(0xff6830);

                const slamRadius = 64;
                const telegraph = scene.add.circle(enemy.x, enemy.y, 12, 0xff3838, 0.28)
                    .setStrokeStyle(2, 0xff3838, 0.9)
                    .setDepth(5);
                enemy.telegraphCircle = telegraph;

                // Crece hasta el radio de impacto en 650ms dando tiempo justo para salir
                scene.tweens.add({
                    targets: telegraph,
                    radius: slamRadius,
                    duration: 650,
                    onComplete: () => {
                        if (telegraph) telegraph.destroy();
                        if (!enemy.active) return;

                        enemy.windingUp = false;
                        enemy.clearTint();
                        RetroAudio.play('hit');
                        scene.cameras.main.shake(170, 0.014);
                        spawnParticles(scene, enemy.x, enemy.y, 0xff8848, 16);

                        // Verificar si el jugador no logró salir del radio de golpe
                        const dNow = Phaser.Math.Distance.Between(enemy.x, enemy.y, scene.player.x, scene.player.y);
                        if (dNow <= slamRadius) {
                            damagePlayer(scene, 38); // Mucho daño cuerpo a cuerpo
                            const push = Phaser.Math.Angle.Between(enemy.x, enemy.y, scene.player.x, scene.player.y);
                            scene.player.setVelocity(Math.cos(push) * 320, Math.sin(push) * 320);
                        }
                    }
                });
            }
            // Si el jugador está a distancia (> 75px), lanza un abanico pesado de proyectiles
            else if (dist > 75 && enemy.actionTimer <= 0) {
                enemy.actionTimer = enemy.isShiny ? 1400 : 1850;
                for (let i = -1; i <= 1; i++) {
                    spawnEnemyBullet(scene, enemy.x, enemy.y, angleToPlayer + i * 0.28, 175, i !== 0);
                }
            }
        }
        // 5. Gólem (Mini-Jefe)
        else if (enemy.enemyType === 'golem') {
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
        state.score += enemy.isShiny ? 250 : (enemy.enemyType === 'brute' ? 180 : 100);
        spawnParticles(scene, enemy.x, enemy.y, 0xff5858, 12);
        if (enemy.telegraphCircle) enemy.telegraphCircle.destroy();
        if (enemy.shadow) enemy.shadow.destroy();
        enemy.destroy();

        // Al derrotar un enemigo en Nivel 3+, hacer aparecer refuerzos de la reserva
        trySpawnReinforcement(scene);
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