import { VIEW_LEFT, VIEW_TOP, VIEW_W, VIEW_H, WEAPONS, UPGRADE_POOL, state, getUpgradeLevel } from './state.js';
import { RetroAudio } from './audio.js';
import { spawnSandBridge } from './world.js';

export let ui = {};

export function createHudUI(scene) {
    ui = {};

    // 1. Arriba-Izquierda: Corazones y Barra de Parry
    ui.hearts = [];
    for (let i = 0; i < 6; i++) {
        const h = scene.add.image(VIEW_LEFT + 12 + i * 13, VIEW_TOP + 12, 'heart_full')
            .setScrollFactor(0).setDepth(100);
        ui.hearts.push(h);
    }

    ui.barBg = scene.add.rectangle(VIEW_LEFT + 6, VIEW_TOP + 21, 78, 9, 0x141013)
        .setOrigin(0).setScrollFactor(0).setDepth(100);
    ui.barFill = scene.add.rectangle(VIEW_LEFT + 8, VIEW_TOP + 23, 74, 5, 0x58d838)
        .setOrigin(0).setScrollFactor(0).setDepth(101);

    ui.roomLabel = scene.add.text(VIEW_LEFT + 6, VIEW_TOP + 33, '', {
        fontFamily: 'Courier New',
        fontSize: '9px',
        fontStyle: 'bold',
        color: '#fff8b8',
        stroke: '#141013',
        strokeThickness: 3
    }).setScrollFactor(0).setDepth(101);

    // 2. Arriba-Derecha: 3 Ranuras Octogonales para las MEJORAS EQUIPADAS (Máx 3)
    ui.upgradeSlots = [];
    for (let i = 0; i < 3; i++) {
        const sx = VIEW_LEFT + VIEW_W - 82 + i * 31;
        const sy = VIEW_TOP + 18;
        const frame = scene.add.image(sx, sy, 'hud_slot').setScrollFactor(0).setDepth(100);
        const icon = scene.add.image(sx, sy - 1, 'icon_upg_mirror')
            .setScrollFactor(0).setDepth(101).setVisible(false);
        const badge = scene.add.text(sx, sy + 11, '--', {
            fontFamily: 'Courier New',
            fontSize: '8px',
            fontStyle: 'bold',
            color: '#ffe868',
            stroke: '#141013',
            strokeThickness: 3
        }).setOrigin(0.5).setScrollFactor(0).setDepth(102);

        ui.upgradeSlots.push({ frame, icon, badge });
    }

    // Indicador compacto del arma activa debajo de las 3 ranuras de mejora
    ui.weaponLabel = scene.add.text(VIEW_LEFT + VIEW_W - 6, VIEW_TOP + 37, '', {
        fontFamily: 'Courier New',
        fontSize: '8px',
        fontStyle: 'bold',
        color: '#88f0ff',
        stroke: '#141013',
        strokeThickness: 3
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(101);

    // 3. Guía inferior con controles de Mouse + Teclado (IJKL / Espacio / Shift)
    ui.helpText = scene.add.text(
        VIEW_LEFT + VIEW_W / 2,
        VIEW_TOP + VIEW_H - 7,
        'WASD:Mover | IJKL/Mouse:Apuntar | ESPACIO/Clic:Disparar | SHIFT/ClicDer:Parry | Q:Arma',
        {
            fontFamily: 'Courier New',
            fontSize: '8px',
            fontStyle: 'bold',
            color: '#fff8c8',
            stroke: '#141013',
            strokeThickness: 3
        }
    ).setOrigin(0.5).setScrollFactor(0).setDepth(101);

    // 4. Interfaz Gráfica de Tarjetas para elegir o reemplazar Mejoras
    buildUpgradeCardsModal(scene);

    // 5. Ventana de Game Over
    ui.gameOverBox = scene.add.rectangle(400, 300, 290, 130, 0x141c18, 0.96)
        .setScrollFactor(0).setDepth(160).setStrokeStyle(3, 0xff5858).setVisible(false);
    ui.gameOverText = scene.add.text(400, 300, '', {
        fontFamily: 'Courier New',
        fontSize: '10px',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: '#141013',
        strokeThickness: 3,
        align: 'center'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(161).setVisible(false);
}

function buildUpgradeCardsModal(scene) {
    ui.modalGroup = scene.add.container(0, 0).setScrollFactor(0).setDepth(150).setVisible(false);

    // Fondo oscurecido y cabecera
    const dimBg = scene.add.rectangle(400, 300, 382, 225, 0x0e1814, 0.95)
        .setStrokeStyle(2, 0xffe048);
    ui.modalHeader = scene.add.text(400, 202, 'SANTUARIO TIKI: ELIGE UNA BENDICIÓN', {
        fontFamily: 'Courier New',
        fontSize: '10px',
        fontStyle: 'bold',
        color: '#ffe858',
        stroke: '#141013',
        strokeThickness: 3
    }).setOrigin(0.5);

    ui.modalSubHeader = scene.add.text(400, 215, 'Presiona [1], [2] o [3] en tu teclado', {
        fontFamily: 'Courier New',
        fontSize: '8px',
        fontStyle: 'bold',
        color: '#a8f0c8',
        stroke: '#141013',
        strokeThickness: 2
    }).setOrigin(0.5);

    ui.modalGroup.add([dimBg, ui.modalHeader, ui.modalSubHeader]);

    // 3 Tarjetas gráficas con icono, título, etiqueta de nivel y descripción
    ui.cards = [];
    for (let i = 0; i < 3; i++) {
        const cx = 282 + i * 118;
        const cy = 310;

        const cardBg = scene.add.rectangle(cx, cy, 108, 152, 0x1b3026, 1)
            .setStrokeStyle(2, 0x68d898);
        const slotFrame = scene.add.image(cx, cy - 42, 'hud_slot').setScale(1.15);
        const icon = scene.add.image(cx, cy - 43, 'icon_upg_mirror').setScale(1.3);

        const title = scene.add.text(cx, cy - 12, '', {
            fontFamily: 'Courier New',
            fontSize: '9px',
            fontStyle: 'bold',
            color: '#ffffff',
            stroke: '#141013',
            strokeThickness: 3,
            align: 'center',
            wordWrap: { width: 100 }
        }).setOrigin(0.5);

        const tag = scene.add.text(cx, cy + 4, '', {
            fontFamily: 'Courier New',
            fontSize: '8px',
            fontStyle: 'bold',
            color: '#ffe858',
            stroke: '#141013',
            strokeThickness: 2
        }).setOrigin(0.5);

        const desc = scene.add.text(cx, cy + 32, '', {
            fontFamily: 'Courier New',
            fontSize: '8px',
            color: '#d8f8e8',
            stroke: '#141013',
            strokeThickness: 2,
            align: 'center',
            wordWrap: { width: 96 }
        }).setOrigin(0.5);

        const keyBtn = scene.add.text(cx, cy + 62, `[ TECLA ${i + 1} ]`, {
            fontFamily: 'Courier New',
            fontSize: '9px',
            fontStyle: 'bold',
            color: '#68ffff',
            stroke: '#141013',
            strokeThickness: 3
        }).setOrigin(0.5);

        ui.modalGroup.add([cardBg, slotFrame, icon, title, tag, desc, keyBtn]);
        ui.cards.push({ cardBg, icon, title, tag, desc, keyBtn });
    }
}

export function updateHudUI(scene, time) {
    // 1. Corazones de vida
    const activeHearts = Math.ceil((state.hp / state.maxHp) * 6);
    for (let i = 0; i < 6; i++) {
        ui.hearts[i].setTexture(i < activeHearts ? 'heart_full' : 'heart_empty');
    }

    // 2. Barra de enfriamiento del Parry
    const cdRemaining = Math.max(0, state.parryCooldownEnd - time);
    const ratio = 1 - Math.min(1, cdRemaining / 1150);
    ui.barFill.width = Math.floor(74 * ratio);
    ui.barFill.fillColor = ratio >= 1 ? 0x58d838 : 0x48b8ff;

    // 3. Actualizar las 3 ranuras de MEJORAS arriba a la derecha
    for (let i = 0; i < 3; i++) {
        const upg = state.equippedUpgrades[i];
        const slot = ui.upgradeSlots[i];
        if (upg) {
            slot.icon.setTexture(upg.icon).setVisible(true);
            slot.badge.setText(`Nv.${upg.level}`);
            slot.frame.setTint(0xffe868);
        } else {
            slot.icon.setVisible(false);
            slot.badge.setText('--');
            slot.frame.clearTint();
        }
    }

    const weapon = WEAPONS[state.weaponIndex];
    ui.weaponLabel.setText(`[Q] ${weapon.name}`);
    ui.roomLabel.setText(`ISLA ${state.room} | PTS ${state.score}`);
}

export function openUpgradeMenu(scene) {
    state.choosingUpgrade = true;
    state.upgradeStep = 'pick';
    state.pendingUpgrade = null;
    scene.player.setVelocity(0, 0);
    RetroAudio.play('shiny');

    scene.currentChoices = Phaser.Utils.Array.Shuffle([...UPGRADE_POOL]).slice(0, 3);
    renderPickStepCards(scene);
    ui.modalGroup.setVisible(true);
}

function renderPickStepCards(scene) {
    const fullSlots = state.equippedUpgrades.every(u => u !== null);
    ui.modalHeader.setText('SANTUARIO TIKI: ELIGE UNA MEJORA');
    ui.modalHeader.setColor('#ffe858');
    ui.modalSubHeader.setText(
        fullSlots
            ? 'Tienes 3/3 mejoras: elegir una nueva reemplazará una actual'
            : 'Presiona [1], [2] o [3] para equipar en tus ranuras'
    );

    for (let i = 0; i < 3; i++) {
        const ch = scene.currentChoices[i];
        const curLv = getUpgradeLevel(ch.key);
        const card = ui.cards[i];

        card.cardBg.setStrokeStyle(2, curLv > 0 ? 0xffe858 : 0x68d898);
        card.icon.setTexture(ch.icon);
        card.title.setText(ch.title);

        if (curLv > 0) {
            card.tag.setText(`MEJORAR A NV.${curLv + 1}`).setColor('#78ff68');
        } else if (fullSlots) {
            card.tag.setText('NUEVA (REEMPLAZA)').setColor('#ff9868');
        } else {
            card.tag.setText('NUEVA MEJORA').setColor('#ffe858');
        }

        card.desc.setText(ch.desc);
        card.keyBtn.setText(`[ TECLA ${i + 1} ]`).setColor('#68ffff');
    }
}

function renderReplaceStepCards(scene) {
    const pending = state.pendingUpgrade;
    ui.modalHeader.setText(`¡3 RANURAS LLENAS! ¿CUÁL REEMPLAZAS POR ${pending.title.toUpperCase()}?`);
    ui.modalHeader.setColor('#ff7878');
    ui.modalSubHeader.setText('Presiona [1], [2] o [3] para sustituirla | [ESC] para volver atrás');

    for (let i = 0; i < 3; i++) {
        const eq = state.equippedUpgrades[i];
        const card = ui.cards[i];

        card.cardBg.setStrokeStyle(2, 0xff6868);
        card.icon.setTexture(eq.icon);
        card.title.setText(eq.title);
        card.tag.setText(`EQUIPADA (NV.${eq.level})`).setColor('#ff9898');
        card.desc.setText(eq.desc);
        card.keyBtn.setText(`REEMPLAZAR [${i + 1}]`).setColor('#ffe858');
    }
}

export function handleUpgradeKeyboardInput(scene) {
    // Permitir volver atrás con ESC si está en el paso de reemplazo
    if (state.upgradeStep === 'replace' && Phaser.Input.Keyboard.JustDown(scene.keys.ESC)) {
        state.upgradeStep = 'pick';
        state.pendingUpgrade = null;
        RetroAudio.play('parry_swing');
        renderPickStepCards(scene);
        return;
    }

    let idx = -1;
    if (Phaser.Input.Keyboard.JustDown(scene.keys.ONE)) idx = 0;
    else if (Phaser.Input.Keyboard.JustDown(scene.keys.TWO)) idx = 1;
    else if (Phaser.Input.Keyboard.JustDown(scene.keys.THREE)) idx = 2;

    if (idx === -1) return;

    if (state.upgradeStep === 'pick') {
        const picked = scene.currentChoices[idx];

        // 1. ¿Ya tiene equipada esta mejora? Subirla de nivel
        const existingSlot = state.equippedUpgrades.findIndex(u => u && u.key === picked.key);
        if (existingSlot !== -1) {
            state.equippedUpgrades[existingSlot].level++;
            finalizeUpgradeSelection(scene, `${picked.title} Nv.${state.equippedUpgrades[existingSlot].level}`);
            return;
        }

        // 2. ¿Hay alguna ranura libre de las 3? Agregarla directamente
        const emptySlot = state.equippedUpgrades.findIndex(u => u === null);
        if (emptySlot !== -1) {
            state.equippedUpgrades[emptySlot] = { ...picked, level: 1 };
            finalizeUpgradeSelection(scene, `+${picked.title}`);
            return;
        }

        // 3. Las 3 ranuras están llenas: pasar a la pantalla de reemplazo
        state.upgradeStep = 'replace';
        state.pendingUpgrade = picked;
        RetroAudio.play('parry_swing');
        renderReplaceStepCards(scene);

    } else if (state.upgradeStep === 'replace') {
        // Reemplazar la mejora de la ranura elegida (0, 1 o 2) por la nueva
        const oldTitle = state.equippedUpgrades[idx].title;
        state.equippedUpgrades[idx] = { ...state.pendingUpgrade, level: 1 };
        finalizeUpgradeSelection(scene, `${oldTitle} ➔ ${state.pendingUpgrade.title}`);
    }
}

function finalizeUpgradeSelection(scene, bannerMessage) {
    state.upgradeChosen = true;
    state.choosingUpgrade = false;
    state.upgradeStep = 'pick';
    state.pendingUpgrade = null;

    ui.modalGroup.setVisible(false);
    if (scene.altarSprite) scene.altarSprite.setTint(0x888888);

    RetroAudio.play('powerup');
    spawnFloatingText(scene, scene.player.x, scene.player.y - 20, bannerMessage, '#ffe858');
    spawnSandBridge(scene);
}

export function spawnFloatingText(scene, x, y, message, hexColor) {
    const txt = scene.add.text(x, y, message, {
        fontFamily: 'Courier New',
        fontSize: '10px',
        fontStyle: 'bold',
        color: hexColor,
        stroke: '#141013',
        strokeThickness: 3
    }).setOrigin(0.5).setDepth(60);

    scene.tweens.add({
        targets: txt,
        y: y - 18,
        alpha: 0,
        duration: 850,
        onComplete: () => txt.destroy()
    });
}

export function triggerGameOver(scene) {
    state.gameOver = true;
    scene.player.setVelocity(0, 0);
    scene.player.setTint(0x666666);

    ui.gameOverBox.setVisible(true);
    ui.gameOverText.setVisible(true);
    ui.gameOverText.setText(
        `=== FIN DE LA EXPEDICIÓN ===\n\n` +
        `Islas Superadas: ${state.room - 1}\n` +
        `Puntuación Final: ${state.score}\n\n` +
        `Presiona [ R ] para reiniciar`
    );
}