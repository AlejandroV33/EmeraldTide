function makeTex(scene, key, w, h, drawFn) {
    if (scene.textures.exists(key)) return;
    const canvasTex = scene.textures.createCanvas(key, w, h);
    const ctx = canvasTex.getContext();
    ctx.imageSmoothingEnabled = false;
    drawFn(ctx, w, h);
    canvasTex.refresh();
}

function px(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
}

export function generateDetailedPixelArt(scene) {
    const OUT = '#141013';

    // 1. Terreno: Agua, Arena, Césped y Acantilado
    makeTex(scene, 'water_tile', 32, 32, (ctx) => {
        px(ctx, 0, 0, 32, 32, '#2868c8');
        px(ctx, 0, 0, 32, 16, '#3074d8');
        px(ctx, 3, 6, 8, 2, '#68b8ff');
        px(ctx, 5, 5, 4, 1, '#d8f4ff');
        px(ctx, 18, 20, 9, 2, '#68b8ff');
        px(ctx, 20, 19, 5, 1, '#d8f4ff');
    });

    makeTex(scene, 'sand_tile', 32, 32, (ctx) => {
        px(ctx, 0, 0, 32, 32, '#f0d288');
        px(ctx, 4, 4, 4, 3, '#dfb868');
        px(ctx, 20, 18, 5, 3, '#dfb868');
        px(ctx, 15, 8, 2, 2, '#fff0b8');
        px(ctx, 6, 18, 2, 2, '#fff0b8');
    });

    makeTex(scene, 'grass_tile', 32, 32, (ctx) => {
        px(ctx, 0, 0, 32, 32, '#50a828');
        px(ctx, 2, 2, 12, 10, '#5cb830');
        px(ctx, 18, 16, 12, 12, '#5cb830');
        const blades = [[4, 8], [14, 5], [24, 10], [8, 22], [20, 25], [26, 18]];
        blades.forEach(([bx, by]) => {
            px(ctx, bx, by, 1, 4, '#388018');
            px(ctx, bx + 2, by + 1, 1, 3, '#388018');
            px(ctx, bx + 1, by - 1, 1, 4, '#78d840');
        });
    });

    makeTex(scene, 'cliff_tile', 16, 16, (ctx) => {
        px(ctx, 0, 0, 16, 16, OUT);
        const rocks = [[1, 1, 6, 6], [8, 1, 7, 6], [1, 8, 7, 7], [9, 8, 6, 7]];
        rocks.forEach(([rx, ry, rw, rh]) => {
            px(ctx, rx, ry, rw, rh, '#784418');
            px(ctx, rx + 1, ry + 1, rw - 2, rh - 2, '#b87428');
            px(ctx, rx + 1, ry + 1, rw - 3, 2, '#f0b848');
        });
        px(ctx, 0, 0, 16, 3, '#388018');
        px(ctx, 0, 0, 16, 2, '#68c838');
    });

    // 2. Naturaleza: Flores, Arbustos, Estanques, Árboles y Rocas
    const makeFlower = (key, petalCol, centerCol) => {
        makeTex(scene, key, 12, 12, (ctx) => {
            px(ctx, 3, 5, 6, 5, '#287018');
            px(ctx, 3, 2, 6, 6, OUT);
            px(ctx, 2, 3, 8, 4, OUT);
            px(ctx, 3, 3, 6, 4, petalCol);
            px(ctx, 4, 2, 4, 6, petalCol);
            px(ctx, 5, 4, 2, 2, centerCol);
        });
    };
    makeFlower('flower_pink', '#ff68a8', '#ffe858');
    makeFlower('flower_yellow', '#ffe048', '#e86820');
    makeFlower('flower_blue', '#68b8ff', '#fff898');

    makeTex(scene, 'spiral_bush', 24, 24, (ctx) => {
        px(ctx, 3, 18, 18, 5, 'rgba(0,0,0,0.28)');
        px(ctx, 3, 4, 18, 17, OUT);
        px(ctx, 2, 6, 20, 13, OUT);
        px(ctx, 4, 5, 16, 15, '#489830');
        px(ctx, 3, 7, 18, 11, '#68b848');
        px(ctx, 5, 6, 14, 10, '#88d868');
        px(ctx, 9, 9, 6, 1, '#489830');
        px(ctx, 14, 9, 1, 5, '#489830');
        px(ctx, 8, 14, 7, 1, '#489830');
    });

    makeTex(scene, 'tide_pool', 52, 40, (ctx) => {
        px(ctx, 6, 6, 40, 28, OUT);
        px(ctx, 4, 10, 44, 20, OUT);
        px(ctx, 7, 7, 38, 26, '#88d8ff');
        px(ctx, 9, 9, 34, 22, '#2878d8');
        px(ctx, 22, 22, 6, 4, '#58c838');
        const reeds = [[10, 2], [15, 4], [38, 3], [42, 6]];
        reeds.forEach(([rx, ry]) => {
            px(ctx, rx, ry, 4, 16, OUT);
            px(ctx, rx + 1, ry + 7, 2, 10, '#58a828');
            px(ctx, rx + 1, ry + 1, 2, 6, '#884818');
        });
    });

    makeTex(scene, 'palm_tree', 48, 56, (ctx) => {
        px(ctx, 8, 44, 32, 10, 'rgba(0,0,0,0.32)');
        px(ctx, 15, 32, 18, 18, OUT);
        px(ctx, 17, 34, 14, 15, '#683818');
        px(ctx, 19, 34, 6, 14, '#905020');
        px(ctx, 6, 6, 36, 30, OUT);
        px(ctx, 4, 10, 40, 22, OUT);
        px(ctx, 10, 3, 28, 34, OUT);
        px(ctx, 6, 11, 36, 23, '#1e6018');
        px(ctx, 7, 8, 34, 22, '#389828');
        px(ctx, 9, 8, 30, 15, '#60c038');
        px(ctx, 12, 7, 10, 8, '#88e050');
        px(ctx, 25, 7, 10, 8, '#88e050');
        px(ctx, 18, 5, 12, 6, '#a8f068');
    });

    makeTex(scene, 'coral_rock', 32, 30, (ctx) => {
        px(ctx, 3, 22, 26, 6, 'rgba(0,0,0,0.3)');
        px(ctx, 3, 6, 26, 20, OUT);
        px(ctx, 5, 4, 22, 22, OUT);
        px(ctx, 5, 7, 22, 17, '#586878');
        px(ctx, 6, 6, 20, 14, '#788898');
        px(ctx, 8, 6, 14, 7, '#a8b8c8');
        px(ctx, 7, 5, 12, 4, '#50b830');
        px(ctx, 20, 12, 5, 5, '#ff5898');
    });

    // 3. Jugador y Arma en Mano
    const drawPlayerFrame = (ctx, stepOffset) => {
        const yOff = stepOffset === 1 ? -1 : 0;
        px(ctx, 5, 2 + yOff, 14, 19, OUT);
        px(ctx, 4, 4 + yOff, 16, 15, OUT);
        px(ctx, 5, 3 + yOff, 14, 9, '#784018');
        px(ctx, 6, 3 + yOff, 12, 6, '#a86024');
        px(ctx, 8, 3 + yOff, 8, 3, '#d88838');
        px(ctx, 7, 2 + yOff, 4, 2, '#ff3868');
        px(ctx, 7, 7 + yOff, 10, 6, '#ffe0b0');
        px(ctx, 8, 8 + yOff, 2, 3, OUT);
        px(ctx, 14, 8 + yOff, 2, 3, OUT);
        px(ctx, 8, 8 + yOff, 1, 1, '#ffffff');
        px(ctx, 14, 8 + yOff, 1, 1, '#ffffff');
        px(ctx, 6, 13 + yOff, 12, 6, '#1878d8');
        px(ctx, 7, 13 + yOff, 10, 5, '#38a0ff');
        px(ctx, 9, 14 + yOff, 6, 4, '#ffe058');
        const lY = stepOffset === 1 ? 19 : 20;
        const rY = stepOffset === 1 ? 20 : 19;
        px(ctx, 6, lY, 5, 3, OUT);
        px(ctx, 13, rY, 5, 3, OUT);
    };
    makeTex(scene, 'player_0', 24, 24, (ctx) => drawPlayerFrame(ctx, 0));
    makeTex(scene, 'player_1', 24, 24, (ctx) => drawPlayerFrame(ctx, 1));

    makeTex(scene, 'held_sword', 18, 10, (ctx) => {
        px(ctx, 1, 2, 16, 6, OUT);
        px(ctx, 2, 3, 4, 4, '#b87028');
        px(ctx, 5, 1, 3, 8, '#ffe058');
        px(ctx, 8, 3, 8, 4, '#88f0ff');
        px(ctx, 8, 3, 7, 2, '#ffffff');
    });

    // 4. Enemigos (Cangrejo, Jabalí, Tótem, Gólem)
    const drawCrab = (ctx, bodyCol, hiCol, frame) => {
        const legOff = frame === 1 ? 1 : 0;
        px(ctx, 3, 5, 18, 13, OUT);
        px(ctx, 1, 9 + legOff, 22, 3, OUT);
        px(ctx, 1, 14 - legOff, 22, 3, OUT);
        px(ctx, 4, 6, 16, 11, bodyCol);
        px(ctx, 6, 7, 12, 6, hiCol);
        px(ctx, 1, 2, 6, 6, OUT);
        px(ctx, 17, 2, 6, 6, OUT);
        px(ctx, 2, 3, 4, 4, hiCol);
        px(ctx, 18, 3, 4, 4, hiCol);
        px(ctx, 8, 4, 2, 3, '#ffffff');
        px(ctx, 14, 4, 2, 3, '#ffffff');
    };
    makeTex(scene, 'enemy_crab_0', 24, 22, (ctx) => drawCrab(ctx, '#d83830', '#ff7858', 0));
    makeTex(scene, 'enemy_crab_1', 24, 22, (ctx) => drawCrab(ctx, '#d83830', '#ff7858', 1));
    makeTex(scene, 'enemy_crab_shiny_0', 24, 22, (ctx) => drawCrab(ctx, '#2098f8', '#78f0ff', 0));
    makeTex(scene, 'enemy_crab_shiny_1', 24, 22, (ctx) => drawCrab(ctx, '#2098f8', '#78f0ff', 1));

    const drawBoar = (ctx, furCol, maskCol, frame) => {
        const yOff = frame === 1 ? -1 : 0;
        px(ctx, 2, 3 + yOff, 20, 18, OUT);
        px(ctx, 4, 4 + yOff, 16, 16, furCol);
        px(ctx, 5, 5 + yOff, 14, 13, OUT);
        px(ctx, 6, 6 + yOff, 12, 11, maskCol);
        px(ctx, 7, 7 + yOff, 10, 2, '#58f8d8');
        px(ctx, 8, 11 + yOff, 2, 2, '#ffe838');
        px(ctx, 14, 11 + yOff, 2, 2, '#ffe838');
        px(ctx, 3, 14 + yOff, 2, 3, '#ffffff');
        px(ctx, 19, 14 + yOff, 2, 3, '#ffffff');
    };
    makeTex(scene, 'enemy_boar_0', 24, 24, (ctx) => drawBoar(ctx, '#683818', '#c86828', 0));
    makeTex(scene, 'enemy_boar_1', 24, 24, (ctx) => drawBoar(ctx, '#683818', '#c86828', 1));
    makeTex(scene, 'enemy_boar_shiny_0', 24, 24, (ctx) => drawBoar(ctx, '#7828b8', '#f8b830', 0));
    makeTex(scene, 'enemy_boar_shiny_1', 24, 24, (ctx) => drawBoar(ctx, '#7828b8', '#f8b830', 1));

    const drawTotem = (ctx, stoneCol, wingCol, frame) => {
        const wingY = frame === 1 ? 6 : 8;
        px(ctx, 1, wingY, 22, 6, OUT);
        px(ctx, 2, wingY + 1, 20, 4, wingCol);
        px(ctx, 5, 2, 14, 24, OUT);
        px(ctx, 6, 3, 12, 22, stoneCol);
        px(ctx, 8, 7, 2, 2, '#ff3878');
        px(ctx, 14, 7, 2, 2, '#ff3878');
        px(ctx, 9, 15, 6, 3, '#58f8e8');
    };
    makeTex(scene, 'enemy_totem_0', 24, 28, (ctx) => drawTotem(ctx, '#487078', '#ff78a8', 0));
    makeTex(scene, 'enemy_totem_1', 24, 28, (ctx) => drawTotem(ctx, '#487078', '#ff78a8', 1));
    makeTex(scene, 'enemy_totem_shiny_0', 24, 28, (ctx) => drawTotem(ctx, '#d8a830', '#58f8ff', 0));
    makeTex(scene, 'enemy_totem_shiny_1', 24, 28, (ctx) => drawTotem(ctx, '#d8a830', '#58f8ff', 1));

    makeTex(scene, 'enemy_golem_0', 40, 40, (ctx) => {
        px(ctx, 5, 3, 30, 34, OUT);
        px(ctx, 1, 7, 38, 18, OUT);
        px(ctx, 7, 5, 26, 30, '#486878');
        px(ctx, 3, 9, 6, 14, '#ff5888');
        px(ctx, 31, 9, 6, 14, '#ff5888');
        px(ctx, 15, 18, 10, 8, '#58ffff');
        px(ctx, 12, 11, 4, 2, '#ffe848');
        px(ctx, 24, 11, 4, 2, '#ffe848');
    });
    makeTex(scene, 'enemy_golem_1', 40, 40, (ctx) => {
        px(ctx, 5, 4, 30, 34, OUT);
        px(ctx, 1, 9, 38, 18, OUT);
        px(ctx, 7, 6, 26, 30, '#486878');
        px(ctx, 3, 11, 6, 14, '#ff5888');
        px(ctx, 31, 11, 6, 14, '#ff5888');
        px(ctx, 15, 19, 10, 8, '#ffffff');
    });

    // 5. Santuario Tiki, Mariposas y Proyectiles
    makeTex(scene, 'tiki_altar', 44, 46, (ctx) => {
        px(ctx, 4, 38, 36, 6, 'rgba(0,0,0,0.35)');
        px(ctx, 6, 18, 32, 24, OUT);
        px(ctx, 8, 20, 28, 20, '#b87830');
        px(ctx, 10, 22, 24, 16, '#df9e48');
        px(ctx, 16, 26, 12, 14, OUT);
        px(ctx, 18, 28, 8, 12, '#ffe838');
        px(ctx, 2, 4, 40, 18, OUT);
        px(ctx, 4, 6, 36, 14, '#d82860');
        px(ctx, 6, 8, 32, 8, '#ff4880');
        px(ctx, 4, 6, 5, 14, '#f8c838');
        px(ctx, 35, 6, 5, 14, '#f8c838');
    });

    const makeButterfly = (key, wingCol, hiCol) => {
        makeTex(scene, key + '_0', 12, 10, (ctx) => {
            px(ctx, 1, 1, 4, 8, OUT);
            px(ctx, 7, 1, 4, 8, OUT);
            px(ctx, 5, 2, 2, 6, OUT);
            px(ctx, 2, 2, 3, 4, hiCol);
            px(ctx, 7, 2, 3, 4, hiCol);
            px(ctx, 2, 6, 3, 2, wingCol);
            px(ctx, 7, 6, 3, 2, wingCol);
        });
        makeTex(scene, key + '_1', 12, 10, (ctx) => {
            px(ctx, 3, 2, 6, 6, OUT);
            px(ctx, 4, 3, 2, 4, hiCol);
            px(ctx, 6, 3, 2, 4, hiCol);
        });
    };
    makeButterfly('bfly_pink', '#ff58a8', '#ffb8e0');
    makeButterfly('bfly_purple', '#9848f8', '#d898ff');
    makeButterfly('bfly_yellow', '#f8b820', '#fff078');

    makeTex(scene, 'bullet_player', 10, 10, (ctx) => {
        px(ctx, 1, 1, 8, 8, OUT);
        px(ctx, 2, 2, 6, 6, '#58e8ff');
        px(ctx, 3, 3, 4, 4, '#ffffff');
    });
    makeTex(scene, 'bullet_parry', 12, 12, (ctx) => {
        px(ctx, 1, 1, 10, 10, OUT);
        px(ctx, 2, 2, 8, 8, '#ff2888');
        px(ctx, 3, 3, 6, 6, '#ff98d0');
        px(ctx, 4, 4, 3, 3, '#ffffff');
    });
    makeTex(scene, 'bullet_dark', 12, 12, (ctx) => {
        px(ctx, 1, 1, 10, 10, OUT);
        px(ctx, 2, 2, 8, 8, '#481868');
        px(ctx, 3, 3, 6, 6, '#b838ff');
    });

    makeTex(scene, 'parry_arc', 40, 40, (ctx) => {
        ctx.strokeStyle = OUT;
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.arc(20, 20, 15, -Math.PI * 0.45, Math.PI * 0.45);
        ctx.stroke();
        ctx.strokeStyle = '#58ffff';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(20, 20, 15, -Math.PI * 0.42, Math.PI * 0.42);
        ctx.stroke();
    });

    // 6. HUD Corazones, Ranuras Octogonales e Iconos de Armas
    const drawHeart = (ctx, fillCol, hiCol) => {
        px(ctx, 1, 1, 4, 2, OUT);
        px(ctx, 6, 1, 4, 2, OUT);
        px(ctx, 0, 2, 11, 4, OUT);
        px(ctx, 1, 6, 9, 2, OUT);
        px(ctx, 2, 8, 7, 1, OUT);
        px(ctx, 3, 9, 5, 1, OUT);
        px(ctx, 4, 10, 3, 1, OUT);
        px(ctx, 5, 11, 1, 1, OUT);
        px(ctx, 2, 2, 2, 1, fillCol);
        px(ctx, 7, 2, 2, 1, fillCol);
        px(ctx, 1, 3, 9, 3, fillCol);
        px(ctx, 2, 6, 7, 2, fillCol);
        px(ctx, 3, 8, 5, 1, fillCol);
        px(ctx, 4, 9, 3, 1, fillCol);
        px(ctx, 5, 10, 1, 1, fillCol);
        if (hiCol) px(ctx, 2, 3, 2, 2, hiCol);
    };
    makeTex(scene, 'heart_full', 11, 12, (ctx) => drawHeart(ctx, '#e82828', '#ff9898'));
    makeTex(scene, 'heart_empty', 11, 12, (ctx) => drawHeart(ctx, '#382828', null));

    makeTex(scene, 'hud_slot', 28, 28, (ctx) => {
        px(ctx, 4, 0, 20, 28, OUT);
        px(ctx, 0, 4, 28, 20, OUT);
        px(ctx, 2, 2, 24, 24, OUT);
        px(ctx, 4, 2, 20, 24, '#a88840');
        px(ctx, 2, 4, 24, 20, '#a88840');
        px(ctx, 5, 4, 18, 20, '#584422');
        px(ctx, 4, 5, 20, 18, '#584422');
    });

    makeTex(scene, 'icon_sword', 16, 16, (ctx) => {
        px(ctx, 2, 11, 4, 3, '#ffe048');
        px(ctx, 5, 8, 3, 3, '#ffe048');
        px(ctx, 7, 5, 3, 3, '#88f0ff');
        px(ctx, 10, 2, 4, 4, '#ffffff');
    });
    makeTex(scene, 'icon_bow', 16, 16, (ctx) => {
        px(ctx, 4, 2, 8, 2, '#d88838');
        px(ctx, 10, 4, 2, 8, '#d88838');
        px(ctx, 4, 12, 8, 2, '#d88838');
        px(ctx, 3, 7, 10, 2, '#78ff68');
    });
    makeTex(scene, 'icon_bomb', 16, 16, (ctx) => {
        px(ctx, 4, 5, 8, 8, OUT);
        px(ctx, 5, 6, 6, 6, '#384050');
        px(ctx, 7, 2, 3, 3, '#ffe048');
    });

    // 7. ICONOS EXCLUSIVOS DE LAS 6 MEJORAS (16x16 Pixel Art)
    // Espejo Prisma (Cian/Cristal)
    makeTex(scene, 'icon_upg_mirror', 16, 16, (ctx) => {
        px(ctx, 3, 1, 10, 14, OUT);
        px(ctx, 2, 3, 12, 10, OUT);
        px(ctx, 4, 2, 8, 12, '#48d8ff');
        px(ctx, 5, 3, 6, 10, '#a8ffff');
        px(ctx, 6, 4, 2, 5, '#ffffff');
        px(ctx, 1, 7, 3, 2, '#ffe858');
        px(ctx, 12, 4, 3, 2, '#ff68b8');
        px(ctx, 12, 10, 3, 2, '#ff68b8');
    });

    // Onda de Marea (Ola turquesa + espuma)
    makeTex(scene, 'icon_upg_tideWave', 16, 16, (ctx) => {
        px(ctx, 1, 4, 14, 10, OUT);
        px(ctx, 2, 8, 12, 5, '#1868d8');
        px(ctx, 3, 5, 10, 5, '#38b0ff');
        px(ctx, 4, 3, 7, 3, '#ffffff');
        px(ctx, 10, 5, 3, 2, '#ffffff');
    });

    // Botas Aladas (Bota dorada con ala blanca)
    makeTex(scene, 'icon_upg_lightFeet', 16, 16, (ctx) => {
        px(ctx, 3, 3, 10, 11, OUT);
        px(ctx, 4, 4, 5, 8, '#e89028');
        px(ctx, 4, 10, 9, 3, '#ffe048');
        px(ctx, 8, 3, 6, 5, '#ffffff');
        px(ctx, 10, 2, 4, 3, '#a8f8ff');
    });

    // Furia Tropical (Rayo de fuego amarillo/naranja)
    makeTex(scene, 'icon_upg_tropicalFury', 16, 16, (ctx) => {
        px(ctx, 4, 1, 9, 14, OUT);
        px(ctx, 7, 2, 5, 5, '#ff5828');
        px(ctx, 4, 6, 8, 4, '#ffa828');
        px(ctx, 5, 7, 6, 7, '#fff048');
        px(ctx, 7, 7, 3, 3, '#ffffff');
    });

    // Eco Rebote (Esfera esmeralda rebotando)
    makeTex(scene, 'icon_upg_bounce', 16, 16, (ctx) => {
        px(ctx, 1, 2, 3, 12, '#a8b8c8');
        px(ctx, 4, 7, 4, 3, '#58ff78');
        px(ctx, 7, 4, 4, 3, '#58ff78');
        px(ctx, 9, 9, 5, 5, OUT);
        px(ctx, 10, 10, 3, 3, '#a8ff68');
    });

    // Coral Afilado (Daga de coral carmesí)
    makeTex(scene, 'icon_upg_damageUp', 16, 16, (ctx) => {
        px(ctx, 2, 2, 12, 12, OUT);
        px(ctx, 9, 2, 5, 5, '#ff2868');
        px(ctx, 6, 5, 5, 5, '#ff5898');
        px(ctx, 8, 4, 3, 3, '#ffffff');
        px(ctx, 3, 10, 4, 4, '#ffe048');
    });

    makeTex(scene, 'crosshair', 14, 14, (ctx) => {
        px(ctx, 6, 0, 2, 4, OUT);
        px(ctx, 6, 10, 2, 4, OUT);
        px(ctx, 0, 6, 4, 2, OUT);
        px(ctx, 10, 6, 4, 2, OUT);
        px(ctx, 6, 1, 2, 2, '#ffffff');
        px(ctx, 6, 11, 2, 2, '#ffffff');
        px(ctx, 1, 6, 2, 2, '#ffffff');
        px(ctx, 11, 6, 2, 2, '#ffffff');
        px(ctx, 6, 6, 2, 2, '#ff3868');
    });

    makeTex(scene, 'shadow', 18, 8, (ctx) => {
        px(ctx, 2, 1, 14, 6, 'rgba(0, 0, 0, 0.35)');
    });

    makeTex(scene, 'pixel_part', 5, 5, (ctx) => {
        px(ctx, 0, 0, 5, 5, OUT);
        px(ctx, 1, 1, 3, 3, '#ffffff');
    });
}