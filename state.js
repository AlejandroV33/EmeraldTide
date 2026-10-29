export const CAMERA_ZOOM = 2.0;
export const VIEW_LEFT = 400 - (800 / 2) / CAMERA_ZOOM; // 200
export const VIEW_TOP = 300 - (600 / 2) / CAMERA_ZOOM;  // 150
export const VIEW_W = 800 / CAMERA_ZOOM;                // 400
export const VIEW_H = 600 / CAMERA_ZOOM;                // 300

export const WORLD_W = 960;
export const WORLD_H = 760;
export const ISLAND_RECT = { x: 140, y: 120, w: 680, h: 520 };
export const GRASS_RECT = { x: 184, y: 164, w: 592, h: 432 };

export const WEAPONS = [
    {
        name: 'Espada Bláster',
        icon: 'icon_sword',
        fireRate: 220,
        speed: 440,
        damage: 28,
        count: 1,
        spread: 0.05,
        color: 0x88ffff
    },
    {
        name: 'Arco Coralino',
        icon: 'icon_bow',
        fireRate: 115,
        speed: 540,
        damage: 15,
        count: 1,
        spread: 0.12,
        color: 0x98ff78
    },
    {
        name: 'Cañón de Coco',
        icon: 'icon_bomb',
        fireRate: 540,
        speed: 360,
        damage: 19,
        count: 5,
        spread: 0.44,
        color: 0xffd068
    }
];

export const UPGRADE_POOL = [
    {
        key: 'mirror',
        title: 'Espejo Prisma',
        desc: 'Parry divide proyectiles reflejados.',
        icon: 'icon_upg_mirror'
    },
    {
        key: 'tideWave',
        title: 'Onda de Marea',
        desc: 'Parry cura vida y crea onda de agua.',
        icon: 'icon_upg_tideWave'
    },
    {
        key: 'lightFeet',
        title: 'Botas Aladas',
        desc: '+15% velocidad e ignora charcos.',
        icon: 'icon_upg_lightFeet'
    },
    {
        key: 'tropicalFury',
        title: 'Furia Tropical',
        desc: '+25% cadencia tras hacer Parry.',
        icon: 'icon_upg_tropicalFury'
    },
    {
        key: 'bounce',
        title: 'Eco Rebote',
        desc: 'Tus disparos rebotan en obstáculos.',
        icon: 'icon_upg_bounce'
    },
    {
        key: 'damageUp',
        title: 'Coral Afilado',
        desc: '+25% daño con todas las armas.',
        icon: 'icon_upg_damageUp'
    }
];

export let state = {};

export function resetGameState() {
    state = {
        hp: 100,
        maxHp: 100,
        room: 1,
        score: 0,
        weaponIndex: 0,
        lastFired: 0,
        aimMode: 'mouse', // 'mouse' o 'keyboard' (I, J, K, L)
        aimAngle: 0,
        lastMouseX: 0,
        lastMouseY: 0,
        isParrying: false,
        parryWindowEnd: 0,
        parryCooldownEnd: 0,
        furyEnd: 0,
        invulnEnd: 0,
        footstepTimer: 0,
        animTimer: 0,
        animFrame: 0,
        roomCleared: false,
        upgradeChosen: false,
        choosingUpgrade: false,
        upgradeStep: 'pick', // 'pick' o 'replace'
        pendingUpgrade: null,
        transitioning: false,
        gameOver: false,
        // Máximo 3 mejoras activas: cada ranura guarda { key, title, desc, icon, level } o null
        equippedUpgrades: [null, null, null]
    };
}

// Devuelve el nivel actual de una mejora si está equipada en una de las 3 ranuras
export function getUpgradeLevel(key) {
    const found = state.equippedUpgrades.find(u => u && u.key === key);
    return found ? found.level : 0;
}