import state from './state.js';
import { MAP_WIDTH, MAP_HEIGHT, MECH_CLASSES, BOSS_TYPES, ENEMY_TYPES } from './constants.js';
import { getSafeSpawn } from './utils.js';
import { useAbility } from './abilities.js';
import { checkCollisions } from './collisions.js';
import { createEnemy } from './enemies.js';
import { killEnemy } from './combat.js';

export function spawnPlayer(id, className, name) {
    const template = MECH_CLASSES[className];
    const pos = getSafeSpawn();
    
    state.players[id] = {
        id: id,
        name: name.substring(0, 15),
        x: pos.x, y: pos.y,
        class: className,
        ...template,
        maxHp: template.hp,
        bulletSize: 5,
        lifesteal: 0, regen: 0, ricochet: template.ricochet || false, execute: false, thorns: false, frost: false, homing: template.homing || false, gambler: template.gambler || false,
        pierce: template.pierce || 0, cluster: false, adrenaline: false, dodgeChance: 0,
        acid: template.acid || false,
        critChance: 0, damageReduction: 0, knockback: 0, bossKiller: false, staticAura: false,
        closeDmg: false, farDmg: false, tesla: template.tesla || false, ramDmg: false, turret: false, chargedShot: false, nova: false, shotCount: 0, xpMult: 1,
        rocket: template.rocket || false, boomerang: template.boomerang || false, fortressTimer: 0, headshotActive: false,
        angle: 0, turretAngle: 0,
        score: 0, kills: 0, level: 1, xp: 0, 
        nextLevel: 100,
        cooldownTimer: 0,
        shootCooldown: 0,
        shieldActive: true,
        dashTime: 0,
        stimTimer: 0, // New: Stim buff
        prismTimer: 0, // New: Beamer Prism
        unstoppableTimer: 0, // New: Juggernaut buff
        fearTimer: 0, // New: Shade Fear effect
        invisible: false,
        pendingLevelUp: false,
        rageMode: false,
        input: {}
    };
    setTimeout(() => { if(state.players[id]) state.players[id].shieldActive = false; }, 3000);
}

export function handleInput(p, input) {
    if (p.pendingLevelUp) { p.input = { ...input, shooting: false }; return; }
    p.input = input;
    p.turretAngle = Math.atan2(input.mouseY - p.y + (input.camY||0), input.mouseX - p.x + (input.camX||0));
}

function spawnRandomEnemy() {
    const angle = Math.random() * Math.PI * 2;
    const dist = 1500;
    const x = MAP_WIDTH/2 + Math.cos(angle)*dist;
    const y = MAP_HEIGHT/2 + Math.sin(angle)*dist;
    const r = Math.random();
    let type = 'DRONE';
    if (state.wave > 1 && r > 0.6) type = 'SWARMER';
    if (state.wave > 2 && r > 0.8) type = 'KAMIKAZE';
    if (state.wave > 3 && r > 0.9) type = 'GUNNER';
    if (state.wave > 4 && r > 0.95) type = 'TANK';
    if (state.wave > 5 && r > 0.97) type = 'ORBITER';
    if (state.wave > 6 && r > 0.98) type = 'STALKER';
    if (state.wave > 7 && r > 0.99) type = 'ARTILLERY';
    
    if (state.wave > 4 && r > 0.92 && r <= 0.94) type = 'SPLITTER';
    if (state.wave > 6 && r > 0.94 && r <= 0.96) type = 'MENDER';
    if (state.wave > 8 && r > 0.96 && r <= 0.98) type = 'RAILGUNNER';
    if (state.wave > 10 && r > 0.98 && r <= 0.99) type = 'HUNTER';
    if (state.wave > 12 && r > 0.99) type = 'NOVA';

    state.enemies.push(createEnemy(type, x, y));
}

function manageWaves() {
    if (state.waveCompleted) {
        if (state.enemies.length === 0) {
            state.waveTimer++;
            if (state.waveTimer > 180) { 
                state.wave++; state.enemiesSpawnedInWave = 0; state.waveCompleted = false; state.waveTimer = 0;
                state.events.push({type: 'WARN', msg: `WAVE ${state.wave} INITIATED`});
            }
        }
        return;
    }
    if (state.wave % 5 === 0) {
        if (!state.bossActive) {
            state.bossActive = true;
            let minIdx = 0, maxIdx = 2;
            if (state.wave >= 10) { minIdx = 2; maxIdx = 5; }
            if (state.wave >= 15) { minIdx = 5; maxIdx = 7; }
            if (state.wave >= 20) { minIdx = 7; maxIdx = 9; }
            
            const idx = Math.floor(Math.random() * (maxIdx - minIdx + 1)) + minIdx;
            const bossTemplate = BOSS_TYPES[Math.min(idx, BOSS_TYPES.length - 1)];
            state.currentBoss = bossTemplate;
            
            state.enemies.push(createEnemy('BOSS', MAP_WIDTH/2, -200));
            state.events.push({type: 'WARN', msg: `WARNING: ${state.currentBoss.name} DETECTED`});
        }
        return;
    }
    const totalEnemiesForWave = 20 + (state.wave * 5);
    const maxConcurrent = 15 + state.wave;
    if (state.enemiesSpawnedInWave >= totalEnemiesForWave && state.enemies.length === 0) {
        state.waveCompleted = true; state.events.push({type: 'WARN', msg: `WAVE COMPLETE`}); return;
    }
    if (state.enemiesSpawnedInWave < totalEnemiesForWave && state.enemies.length < maxConcurrent) {
        if (Math.random() < 0.03 + (state.wave * 0.005)) { spawnRandomEnemy(); state.enemiesSpawnedInWave++; }
    }
}

export function update(io) {
    state.frameCount++;

    // 1. Players
    for (let id in state.players) {
        const p = state.players[id];
        if (p.hp <= 0) continue;

        if (state.frameCount % 60 === 0 && p.regen > 0) p.hp = Math.min(p.maxHp, p.hp + p.regen);
        if (p.cooldownTimer > 0) p.cooldownTimer--;
        if (p.shootCooldown > 0) p.shootCooldown--;
        if (p.invisible && p.cooldownTimer < p.abilityCd - 180) p.invisible = false;
        if (p.rageMode && p.cooldownTimer < p.abilityCd - 300) p.rageMode = false;
        if (p.fortressTimer > 0) p.fortressTimer--;
        if (p.stimTimer > 0) p.stimTimer--;
        if (p.prismTimer > 0) p.prismTimer--;
        if (p.unstoppableTimer > 0) p.unstoppableTimer--;
        
        let speed = p.speed;
        if (p.fortressTimer > 0) speed = 0;
        if (p.dashTime > 0) { speed *= 4; p.dashTime--; p.shieldActive = true; }
        else if (p.class === 'LANCER' && p.cooldownTimer > p.abilityCd - 10) { p.shieldActive = false; }
        if (p.invisible) speed *= 1.3;
        if (p.rageMode) speed *= 1.5;
        if (p.stimTimer > 0) speed *= 1.5;
        if (p.unstoppableTimer > 0) speed *= 1.5;

        // ORBITAL logic
        if (p.orbital) {
            if (!p.orbitalAngle) p.orbitalAngle = 0;
            p.orbitalAngle += 0.05;
            // We'll render/check this in collision or client, but for now let's just make it a visual/damaging aura for simplicity in server state
            // Actually, let's make it a physical object in bullets for proper collision?
            // Nah, let's check collision here:
            const ox = p.x + Math.cos(p.orbitalAngle) * 60;
            const oy = p.y + Math.sin(p.orbitalAngle) * 60;
            // Draw effect? We can push a visual bullet that updates every frame or just rely on client prediction (client doesn't know about orbital yet)
            // Let's push a "visual only" bullet or just handle collision.
            // For blocking shots, check in collision.js. For damaging enemies:
            if (state.frameCount % 10 === 0) {
                state.enemies.forEach(e => {
                    if (Math.hypot(e.x - ox, e.y - oy) < 30) {
                        e.hp -= 10;
                        state.events.push({type: 'HIT', x: e.x, y: e.y, val: 10, color: '#aaaaff'});
                    }
                });
                // Visual marker
                state.events.push({type: 'EFFECT', name: 'BLINK', x: ox, y: oy, silent: true}); // Reuse blink effect for visual
            }
        }

        if (p.magnetic) {
             state.bullets.forEach(b => {
                 if (b.owner === 'enemy' && Math.hypot(b.x - p.x, b.y - p.y) < 200) {
                     b.vx *= 0.9;
                     b.vy *= 0.9;
                 }
             });
        }

        if (p.staticAura && state.frameCount % 60 === 0) {
             state.enemies.forEach(e => {
                 if (Math.hypot(e.x - p.x, e.y - p.y) < 250) {
                     e.hp -= 20;
                     state.events.push({type: 'HIT', x: e.x, y: e.y, val: 20, color: '#00ffff'});
                     state.events.push({type: 'EFFECT', name: 'EMP', x: e.x, y: e.y}); 
                 }
             });
        }
        if (p.turret && state.frameCount % 60 === 0) {
            let target = null, minDist = 500;
            for(let j=0; j<state.enemies.length; j++) {
                const d = Math.hypot(state.enemies[j].x - p.x, state.enemies[j].y - p.y);
                if (d < minDist) { minDist = d; target = state.enemies[j]; }
            }
            if(target) {
                const a = Math.atan2(target.y - p.y, target.x - p.x);
                state.bullets.push({ x: p.x, y: p.y, vx: Math.cos(a) * 12, vy: Math.sin(a) * 12, dmg: p.damage * 0.5, owner: p.id, life: 50, color: '#aaaaff', size: 4 });
            }
        }

        if (p.input.space && p.cooldownTimer <= 0) useAbility(p, io);

        let dx = 0, dy = 0;
        if (p.input.up) dy = -1;
        if (p.input.down) dy = 1;
        if (p.input.left) dx = -1;
        if (p.input.right) dx = 1;

        const isMoving = dx !== 0 || dy !== 0;

        if (isMoving) {
            const len = Math.hypot(dx, dy);
            p.x += (dx/len) * speed;
            p.y += (dy/len) * speed;
            p.angle = Math.atan2(dy, dx);
        }
        p.x = Math.max(0, Math.min(MAP_WIDTH, p.x));
        p.y = Math.max(0, Math.min(MAP_HEIGHT, p.y));

        let currentFireRate = p.fireRate;
        if (p.adrenaline) {
            const missingHpPct = 1 - (p.hp / p.maxHp);
            currentFireRate = Math.max(2, p.fireRate * (1 - (missingHpPct * 0.5))); // Up to 50% faster
        }
        if (p.runngun && isMoving) currentFireRate *= 0.7; // 30% faster fire rate
        if (p.focus) {
            if (p.input.shooting) p.focusStacks = Math.min(20, (p.focusStacks || 0) + 1);
            else p.focusStacks = 0;
        }

        if (p.rageMode) currentFireRate *= 0.5; // Double fire rate in rage
        if (p.fortressTimer > 0) currentFireRate *= 0.25; // Quadruple fire rate in fortress
        if (p.stimTimer > 0) currentFireRate *= 0.6; // Faster fire rate
        if (p.prismTimer > 0) currentFireRate *= 0.5; // Faster fire rate for Prism
        if (p.class === 'GAMBLER' && Math.random() < 0.1) currentFireRate *= 0.5; // Random rapid bursts

        if (p.input.shooting && p.shootCooldown <= 0 && p.dashTime <= 0 && !p.invisible) {
            p.shootCooldown = currentFireRate;
            let count = p.bulletCount;
            let spreadVal = p.spread;
            if (p.prismTimer > 0) { count = 3; spreadVal = 0.2; }
            
            if (p.focus && p.focusStacks > 0) {
                spreadVal = Math.max(0, spreadVal * (1 - p.focusStacks * 0.05)); // Reduce spread up to 100%
            }

            for(let i=0; i<count; i++) {
                const spread = (Math.random() - 0.5) * spreadVal;
                let dmg = p.damage;
                if (p.stationary && !isMoving) dmg *= 1.5;
                if (p.gambler) dmg *= (0.5 + Math.random() * 2.5);
                if (p.rageMode) dmg *= 1.5;
                if (p.stimTimer > 0) dmg *= 1.2;
                if (p.unstoppableTimer > 0) dmg *= 1.5;
                if (p.headshotActive) { dmg *= 5; p.headshotActive = false; state.events.push({type: 'TEXT', msg: 'HEADSHOT!', x: p.x, y: p.y - 30, color: '#ff00ff'}); }
                if (p.critChance > 0 && Math.random() < p.critChance) { dmg *= 2; }
                if (p.chargedShot) {
                    p.shotCount++;
                    if(p.shotCount % 5 === 0) { dmg *= 2; state.events.push({type: 'TEXT', msg: 'CHARGE!', x: p.x, y: p.y - 30, color: '#00ffff'}); }
                }

                state.bullets.push({
                    x: p.x, y: p.y,
                    vx: Math.cos(p.turretAngle + spread) * p.bulletSpeed,
                    vy: Math.sin(p.turretAngle + spread) * p.bulletSpeed,
                    dmg: dmg, owner: p.id,
                    life: p.bulletLife || 60,
                    color: p.class === 'PYRO' ? '#ffaa00' : (p.frost ? '#00ffff' : (p.acid ? '#00ff00' : p.color)),
                    size: p.class === 'PYRO' ? 6 : p.bulletSize,
                    ricochet: p.ricochet, homing: p.homing, sentry: false,
                    pierce: p.pierce || 0, cluster: p.cluster,
                    acid: p.acid, rocket: p.rocket, boomerang: p.boomerang,
                    growing: p.growingShot, wither: p.wither, confuse: p.confuse
                });
            }
        }
        
        if (p.pendingLevelUp) {
             state.enemies.forEach(e => {
                if (Math.hypot(e.x - p.x, e.y - p.y) < 300) {
                    const a = Math.atan2(e.y - p.y, e.x - p.x);
                    e.x += Math.cos(a) * 10; e.y += Math.sin(a) * 10;
                }
             });
        }
    }

    // 2. Bullets
    for (let i = state.bullets.length - 1; i >= 0; i--) {
        let b = state.bullets[i];
        if (b.homing && b.owner !== 'enemy') {
            let target = null, minDist = 400;
            for(let j=0; j<state.enemies.length; j++) {
                const d = Math.hypot(state.enemies[j].x - b.x, state.enemies[j].y - b.y);
                if (d < minDist) { minDist = d; target = state.enemies[j]; }
            }
            if (target) {
                const angleTo = Math.atan2(target.y - b.y, target.x - b.x);
                b.vx += Math.cos(angleTo) * 2; b.vy += Math.sin(angleTo) * 2;
                const speed = Math.hypot(b.vx, b.vy);
                if(speed > 0) { b.vx = (b.vx/speed)*20; b.vy = (b.vy/speed)*20; }
            }
        }
        
        if (b.sentry) {
            b.x += b.vx; b.y += b.vy; b.vx *= 0.9; b.vy *= 0.9; b.life--;
            if (state.frameCount % 10 === 0) {
                let target = null, minDist = 400;
                for(let j=0; j<state.enemies.length; j++) {
                    const d = Math.hypot(state.enemies[j].x - b.x, state.enemies[j].y - b.y);
                    if (d < minDist) { minDist = d; target = state.enemies[j]; }
                }
                if (target) {
                    const a = Math.atan2(target.y - b.y, target.x - b.x);
                    state.bullets.push({x:b.x, y:b.y, vx:Math.cos(a)*15, vy:Math.sin(a)*15, dmg:10, owner:b.owner, life:40, color:'#aaff00', size:4});
                }
            }
        } else if (b.boomerang) {
            if (!b.returnState) {
                 b.x += b.vx; b.y += b.vy; b.life--;
                 if(b.life < 30) { // Start returning
                     b.returnState = true;
                 }
            } else {
                const p = state.players[b.owner];
                if(p) {
                    const a = Math.atan2(p.y - b.y, p.x - b.x);
                    b.vx += Math.cos(a) * 2; b.vy += Math.sin(a) * 2;
                    const speed = Math.hypot(b.vx, b.vy);
                    if(speed > 20) { b.vx = (b.vx/speed)*20; b.vy = (b.vy/speed)*20; }
                    b.x += b.vx; b.y += b.vy;
                    if(Math.hypot(p.x - b.x, p.y - b.y) < 30) state.bullets.splice(i, 1);
                } else { state.bullets.splice(i, 1); }
            }
        } else {
            b.x += b.vx; b.y += b.vy; b.life--;
        }

        if (b.growing) {
            b.size += 0.2;
            b.dmg += 0.5;
        }

        if (b.ricochet) {
            if (b.x <= 0 || b.x >= MAP_WIDTH) { b.vx *= -1; b.ricochet = false; }
            if (b.y <= 0 || b.y >= MAP_HEIGHT) { b.vy *= -1; b.ricochet = false; }
        }
        if (b.life <= 0 || b.x < 0 || b.x > MAP_WIDTH || b.y < 0 || b.y > MAP_HEIGHT) state.bullets.splice(i, 1);
    }
    
    // 2.5 Zones
    for (let i = state.zones.length - 1; i >= 0; i--) {
        let z = state.zones[i];
        z.life--;
        if (z.life <= 0) { state.zones.splice(i, 1); continue; }
        
        if (z.type === 'SANCTUARY') {
             for(let pid in state.players) {
                 const p = state.players[pid];
                 if(Math.hypot(p.x - z.x, p.y - z.y) < z.size) {
                     if(state.frameCount % 60 === 0) { p.hp = Math.min(p.maxHp, p.hp + 5); state.events.push({type: 'TEXT', msg: '+5', x: p.x, y: p.y-20, color: '#00ff00', size: 12}); }
                 }
             }
        } else if (z.type === 'TURRET') {
             if(state.frameCount % 20 === 0) { // Fire every 20 frames
                 let target = null, minDist = 600;
                 for(let j=0; j<state.enemies.length; j++) {
                     const d = Math.hypot(state.enemies[j].x - z.x, state.enemies[j].y - z.y);
                     if (d < minDist) { minDist = d; target = state.enemies[j]; }
                 }
                 if(target) {
                     const a = Math.atan2(target.y - z.y, target.x - z.x);
                     state.bullets.push({ x: z.x, y: z.y, vx: Math.cos(a) * 20, vy: Math.sin(a) * 20, dmg: 20, owner: z.owner, life: 60, color: '#3388ff', size: 6, tesla: true });
                 }
             }
        } else if (z.type === 'LAVA') {
             for(let pid in state.players) {
                 const p = state.players[pid];
                 if(Math.hypot(p.x - z.x, p.y - z.y) < z.size) {
                     if(state.frameCount % 30 === 0) { 
                        p.hp -= 10; 
                        state.events.push({type: 'HIT', x: p.x, y: p.y, val: 10, color: '#ff4500'}); 
                     }
                 }
             }
        } else if (z.type === 'STORM') {
             if (z.life === 10) { // Strike at last moment
                 state.events.push({type: 'EXPLOSION', x: z.x, y: z.y, size: z.size, color: '#00ffff'});
                 for(let pid in state.players) {
                     const p = state.players[pid];
                     if(Math.hypot(p.x - z.x, p.y - z.y) < z.size) {
                         p.hp -= 50;
                         state.events.push({type: 'HIT', x: p.x, y: p.y, val: 50, color: '#00ffff'});
                     }
                 }
             }
        } else if (z.type === 'MINE') {
             for(let j=state.enemies.length-1; j>=0; j--) {
                 const e = state.enemies[j];
                 if(Math.hypot(e.x - z.x, e.y - z.y) < 40) {
                     e.hp -= 100; // Mine damage
                     state.events.push({type: 'EXPLOSION', x: z.x, y: z.y, size: 60});
                     state.events.push({type: 'HIT', x: e.x, y: e.y, val: 100});
                     if(e.hp <= 0) killEnemy(j, z.owner, io); 
                     z.life = 0;
                     break;
                 }
             }
        } else if (z.type === 'BLACKHOLE') {
            state.enemies.forEach(e => {
                const dist = Math.hypot(e.x - z.x, e.y - z.y);
                if (dist < 400 && dist > 20) {
                    const a = Math.atan2(z.y - e.y, z.x - e.x);
                    e.x += Math.cos(a) * 5; e.y += Math.sin(a) * 5;
                }
            });
        } else if (z.type === 'TOTEM') {
            if (z.subType === 'HEAL') {
                 if(state.frameCount % 60 === 0) {
                     for(let pid in state.players) {
                         const p = state.players[pid];
                         if(Math.hypot(p.x - z.x, p.y - z.y) < z.size) {
                             p.hp = Math.min(p.maxHp, p.hp + 10);
                             state.events.push({type: 'TEXT', msg: '+10', x: p.x, y: p.y-20, color: '#00ff00', size: 12});
                         }
                     }
                 }
            } else if (z.subType === 'LAVA') {
                 if(state.frameCount % 30 === 0) {
                     state.enemies.forEach(e => {
                         if(Math.hypot(e.x - z.x, e.y - z.y) < z.size) {
                             e.hp -= 20;
                             state.events.push({type: 'HIT', x: e.x, y: e.y, val: 20, color: '#ff4500'});
                         }
                     });
                 }
            } else if (z.subType === 'STATIC') {
                 if(state.frameCount % 20 === 0) {
                     state.enemies.forEach(e => {
                         if(Math.hypot(e.x - z.x, e.y - z.y) < z.size) {
                             e.hp -= 10;
                             state.events.push({type: 'HIT', x: e.x, y: e.y, val: 10, color: '#ffff00'});
                             e.freezeTimer = 10;
                         }
                     });
                 }
            }
        }
    }

    manageWaves();

    // 4. Enemy AI
    if (state.globalTimeScale > 0) {
        state.enemies.forEach(e => {
            if (e.freezeTimer > 0) { e.freezeTimer--; return; }
            if (e.acidTimer > 0) { 
                e.acidTimer--; 
                if(state.frameCount % 30 === 0) {
                    const dmg = e.acidStacks * 2;
                    e.hp -= dmg;
                    state.events.push({type: 'HIT', x: e.x, y: e.y, val: dmg, color: '#00ff00'});
                }
            }
            if (e.markedTimer > 0) e.markedTimer--;
            if (e.fearTimer > 0) {
                e.fearTimer--;
                // Run away from nearest player
                let target = null, minDist = Infinity;
                for (let id in state.players) {
                    const p = state.players[id];
                    const d = Math.hypot(e.x - p.x, e.y - p.y);
                    if (d < minDist) { minDist = d; target = p; }
                }
                if(target) {
                    const a = Math.atan2(e.y - target.y, e.x - target.x);
                    e.x += Math.cos(a) * e.speed * 1.2;
                    e.y += Math.sin(a) * e.speed * 1.2;
                    return; // Skip normal AI
                }
            }

            state.enemies.forEach(other => {
                if (e !== other) {
                    const dist = Math.hypot(e.x - other.x, e.y - other.y);
                    if (dist < e.size + other.size) {
                        const pushAngle = Math.atan2(e.y - other.y, e.x - other.x);
                        e.x += Math.cos(pushAngle); e.y += Math.sin(pushAngle);
                    }
                }
            });

            let target = null, minDist = Infinity;
            
            // Check for Decoys first
            for (let z of state.zones) {
                if (z.type === 'DECOY') {
                    const d = Math.hypot(e.x - z.x, e.y - z.y);
                    if (d < minDist) { minDist = d; target = z; }
                }
            }

            if (!target) {
                for (let id in state.players) {
                    const p = state.players[id];
                    if (p.hp > 0 && !p.invisible) {
                        const d = Math.hypot(e.x - p.x, e.y - p.y);
                        if (d < minDist) { minDist = d; target = p; }
                    }
                }
            }

            if (target) {
                const angle = Math.atan2(target.y - e.y, target.x - e.x);
                let speed = e.slowed ? e.speed * 0.5 : e.speed;
                e.slowed = false;
                
                if (e.confusedTimer > 0) {
                    e.confusedTimer--;
                    // Move randomly
                    e.x += (Math.random()-0.5) * speed * 2;
                    e.y += (Math.random()-0.5) * speed * 2;
                    return; // Skip normal AI
                }

                if (e.type === 'BOSS') {
                    if (e.behavior === 'SPIN_SHOOT') {
                         e.x += Math.cos(angle) * speed; e.y += Math.sin(angle) * speed; e.angle += 0.05;
                         if (state.frameCount % 10 === 0) for(let k=0; k<6; k++) state.bullets.push({x: e.x, y: e.y, vx: Math.cos(e.angle + (Math.PI/3 * k))*8, vy: Math.sin(e.angle + (Math.PI/3 * k))*8, dmg: 15, owner: 'enemy', life: 100, color: 'red', size: 8});
                    } else if (e.behavior === 'SUMMON') {
                        e.x += Math.cos(angle) * speed; e.y += Math.sin(angle) * speed;
                        if (state.frameCount % 180 === 0) for(let k=0; k<4; k++) state.enemies.push(createEnemy('SWARMER', e.x, e.y));
                    } else if (e.behavior === 'SUCK') {
                        for(let pid in state.players) {
                            const p = state.players[pid];
                            if(Math.hypot(e.x-p.x, e.y-p.y) < 800) { const pullA = Math.atan2(e.y-p.y, e.x-p.x); p.x += Math.cos(pullA)*2; p.y += Math.sin(pullA)*2; }
                        }
                        e.x += Math.cos(angle) * 1; e.y += Math.sin(angle) * 1;
                        if (state.frameCount % 60 === 0) for(let k=0; k<12; k++) state.bullets.push({x: e.x, y: e.y, vx: Math.cos(Math.random() * Math.PI*2)*5, vy: Math.sin(Math.random() * Math.PI*2)*5, dmg: 20, owner: 'enemy', life: 150, color: '#aa00aa', size: 10});
                    } else if (e.behavior === 'ALL') {
                         e.x += Math.cos(angle) * speed; e.y += Math.sin(angle) * speed;
                         if(state.frameCount % 120 === 0) for(let k=0; k<8; k++) state.bullets.push({x: e.x, y: e.y, vx: Math.cos(e.angle + (Math.PI/4 * k))*8, vy: Math.sin(e.angle + (Math.PI/4 * k))*8, dmg: 20, owner: 'enemy', life: 100, color: 'white', size: 10});
                         if(state.frameCount % 300 === 0) state.enemies.push(createEnemy('TANK', e.x, e.y));
                    } else if (e.behavior === 'LASER') {
                         e.x += Math.cos(angle) * (speed*0.5); e.y += Math.sin(angle) * (speed*0.5);
                         if (state.frameCount % 200 === 0) {
                            // Giant laser shot
                            const la = Math.atan2(target.y - e.y, target.x - e.x);
                             state.bullets.push({x: e.x, y: e.y, vx: Math.cos(la)*25, vy: Math.sin(la)*25, dmg: 50, owner: 'enemy', life: 80, color: '#ff0000', size: 50});
                         }
                    } else if (e.behavior === 'TELEPORT_ASSAULT') {
                         e.shootTimer++;
                         if (e.shootTimer > 120) {
                             e.x = target.x + (Math.random()-0.5)*300; 
                             e.y = target.y + (Math.random()-0.5)*300;
                             state.events.push({type: 'EFFECT', name: 'BLINK', x: e.x, y: e.y});
                             for(let k=0; k<8; k++) {
                                 const la = (Math.PI * 2 / 8) * k;
                                 state.bullets.push({x: e.x, y: e.y, vx: Math.cos(la)*12, vy: Math.sin(la)*12, dmg: 25, owner: 'enemy', life: 60, color: '#444', size: 10});
                             }
                             e.shootTimer = 0;
                         }
                    } else if (e.behavior === 'FIRE_TRAIL') {
                        e.x += Math.cos(angle) * (speed * 1.5); e.y += Math.sin(angle) * (speed * 1.5);
                        if (state.frameCount % 10 === 0) {
                            state.zones.push({type: 'LAVA', x: e.x, y: e.y, life: 300, size: 40, color: '#ff4500', owner: 'enemy'});
                        }
                    } else if (e.behavior === 'ELITE_SUMMON') {
                        e.x += Math.cos(angle) * speed; e.y += Math.sin(angle) * speed;
                        if (state.frameCount % 300 === 0) {
                            const minion = createEnemy(Math.random()>0.5 ? 'TANK' : 'GUNNER', e.x + (Math.random()-0.5)*100, e.y + (Math.random()-0.5)*100);
                            minion.isMiniboss = true; minion.hp *= 2; minion.size *= 1.2;
                            state.enemies.push(minion);
                        }
                    } else if (e.behavior === 'LIGHTNING_STORM') {
                        e.x += Math.cos(angle) * speed; e.y += Math.sin(angle) * speed;
                        if (state.frameCount % 60 === 0) {
                            for(let pid in state.players) {
                                const p = state.players[pid];
                                const sx = p.x + (Math.random()-0.5)*400;
                                const sy = p.y + (Math.random()-0.5)*400;
                                state.zones.push({type: 'STORM', x: sx, y: sy, life: 60, size: 50, color: '#00ffff', owner: 'enemy'});
                            }
                        }
                    } else if (e.behavior === 'NUKE') {
                        e.x += Math.cos(angle) * (speed * 0.3); e.y += Math.sin(angle) * (speed * 0.3);
                        if (state.frameCount % 300 === 0) {
                             const la = Math.atan2(target.y - e.y, target.x - e.x);
                             state.bullets.push({x: e.x, y: e.y, vx: Math.cos(la)*4, vy: Math.sin(la)*4, dmg: 200, owner: 'enemy', life: 300, color: '#000', size: 40, nuke: true});
                        }
                    }
                } else {
                    if (e.ai === 'ORBIT') {
                        let ally = state.enemies.find(other => other !== e && other.type !== 'ORBITER' && Math.hypot(e.x-other.x, e.y-other.y) < 600);
                        if (ally) { e.angle += 0.05; e.x = ally.x + Math.cos(e.angle + e.id) * 150; e.y = ally.y + Math.sin(e.angle + e.id) * 150; }
                        else { e.x += Math.cos(angle) * speed; e.y += Math.sin(angle) * speed; }
                    } else if (e.ai === 'KITE') {
                        if (minDist > 500) { e.x += Math.cos(angle) * speed; e.y += Math.sin(angle) * speed; }
                        else if (minDist < 300) { e.x -= Math.cos(angle) * speed; e.y -= Math.sin(angle) * speed; }
                        e.shootTimer++;
                        if (e.shootTimer > 100) { state.bullets.push({ x: e.x, y: e.y, vx: Math.cos(angle) * 8, vy: Math.sin(angle) * 8, dmg: 12, owner: 'enemy', life: 100, color: '#aa00ff', size: 6 }); e.shootTimer = 0; }
                    } else if (e.ai === 'TELEPORT') {
                        e.shootTimer++;
                        if (e.shootTimer > 180) {
                            // Teleport behind target
                            e.x = target.x - Math.cos(target.angle)*150;
                            e.y = target.y - Math.sin(target.angle)*150;
                            state.events.push({type: 'EFFECT', name: 'BLINK', x: e.x, y: e.y});
                            e.shootTimer = 0;
                        } else {
                            e.x += Math.cos(angle) * speed; e.y += Math.sin(angle) * speed;
                        }
                    } else if (e.ai === 'MORTAR') {
                        if (minDist > 600) { e.x += Math.cos(angle) * speed; e.y += Math.sin(angle) * speed; }
                        e.shootTimer++;
                        if (e.shootTimer > 240) {
                             state.bullets.push({ x: e.x, y: e.y, vx: Math.cos(angle) * 10, vy: Math.sin(angle) * 10, dmg: 30, owner: 'enemy', life: 60, color: '#dd5500', size: 15 }); 
                             e.shootTimer = 0;
                        }
                    } else if (e.ai === 'HEALER') {
                        let hurtAlly = state.enemies.find(other => other !== e && other.hp < other.maxHp);
                        if (hurtAlly) {
                             const ha = Math.atan2(hurtAlly.y - e.y, hurtAlly.x - e.x);
                             if (Math.hypot(hurtAlly.x - e.x, hurtAlly.y - e.y) < 150) {
                                 if (state.frameCount % 30 === 0) {
                                     hurtAlly.hp = Math.min(hurtAlly.maxHp, hurtAlly.hp + 20);
                                     state.events.push({type: 'EFFECT', name: 'HEAL', x: hurtAlly.x, y: hurtAlly.y});
                                 }
                             } else {
                                 e.x += Math.cos(ha) * speed; e.y += Math.sin(ha) * speed;
                             }
                        } else {
                            // Default to chase if no one hurt
                            e.x += Math.cos(angle) * speed; e.y += Math.sin(angle) * speed;
                        }
                    } else if (e.ai === 'SNIPER') {
                        if (minDist < 800) {
                             e.shootTimer++;
                             if (e.shootTimer > 120) { // 2s to aim
                                 if(e.shootTimer === 121) {
                                     // Warning line or flash?
                                     state.events.push({type: 'TEXT', msg: '!', x: e.x, y: e.y - 30, color: 'red'});
                                 }
                                 if (e.shootTimer > 180) { // Fire
                                     state.bullets.push({ x: e.x, y: e.y, vx: Math.cos(angle) * 25, vy: Math.sin(angle) * 25, dmg: 60, owner: 'enemy', life: 60, color: '#ff0055', size: 8 }); 
                                     e.shootTimer = 0;
                                 }
                             } else {
                                 // Track while aiming
                                 e.angle = angle;
                             }
                        } else {
                            e.x += Math.cos(angle) * speed; e.y += Math.sin(angle) * speed; e.shootTimer = 0;
                        }
                    } else if (e.ai === 'STEALTH') {
                        if (minDist > 300) {
                            e.invisible = true; // New prop needed on client to render semi-transparent or not at all
                            e.x += Math.cos(angle) * speed; e.y += Math.sin(angle) * speed;
                        } else {
                            e.invisible = false;
                            e.x += Math.cos(angle) * (speed * 1.5); e.y += Math.sin(angle) * (speed * 1.5); // Rush when close
                        }
                    } else {
                        e.x += Math.cos(angle) * speed; e.y += Math.sin(angle) * speed; e.angle = angle;
                    }
                }
            }
        });
    } else {
        // Time is stopped, increment counter to resume
        state.globalTimeScale += 0.005; 
        if(state.globalTimeScale > 1) state.globalTimeScale = 1;
    }

    checkCollisions(io);
}

