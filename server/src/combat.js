import state from './state.js';
import { ENEMY_TYPES, UPGRADES } from './constants.js';
import { createEnemy } from './enemies.js';

export function checkLevelUp(p, io) {
    if (p.xp >= p.nextLevel) {
        p.level++; p.xp = 0; p.nextLevel = Math.floor(p.nextLevel * 1.3);
        p.pendingLevelUp = true;
        
        // Generate 3 unique options
        const options = [];
        const pool = [...UPGRADES];
        for(let i=0; i<3; i++) {
            if(pool.length === 0) break;
            const idx = Math.floor(Math.random() * pool.length);
            options.push(pool[idx]);
            pool.splice(idx, 1);
        }
        
        io.to(p.id).emit('levelUpOptions', options);
    }
}

export function killEnemy(index, killerId, io) {
    const e = state.enemies[index];
    if (!e) return;

    // Calculate Rewards
    const score = e.type === 'BOSS' ? 5000 : (ENEMY_TYPES[e.type] ? ENEMY_TYPES[e.type].score : 10) * (e.isMiniboss ? 5 : 1);
    const xp = e.type === 'BOSS' ? 2000 : score;

    // 1. Give Score/Lifesteal to Killer
    if (killerId && state.players[killerId]) {
        const p = state.players[killerId];
        p.score += score;
        p.kills = (p.kills || 0) + 1;
        if(p.lifesteal) p.hp = Math.min(p.maxHp, p.hp + p.lifesteal);
        
        if (p.corpseExplosion && Math.random() < 0.4) {
             state.events.push({type: 'EXPLOSION', x: e.x, y: e.y, size: 60, color: '#550000'});
             state.enemies.forEach(near => {
                 if (near !== e && Math.hypot(near.x - e.x, near.y - e.y) < 100) {
                     near.hp -= p.damage * 3;
                     state.events.push({type: 'HIT', x: near.x, y: near.y, val: Math.floor(p.damage * 3)});
                 }
             });
        }

        if (p.necromancy && Math.random() < 0.3) {
             state.bullets.push({x: e.x, y: e.y, vx: 0, vy: 0, dmg: 15, owner: p.id, life: 600, color: '#555', size: 8, homing: true, minion: true});
             state.events.push({type: 'TEXT', msg: 'RISE', x: e.x, y: e.y, color: '#555', size: 12});
        }
    }

    // 2. Distribute XP to ALL players
    for (let id in state.players) {
        const p = state.players[id];
        p.xp += xp;
        checkLevelUp(p, io);
    }

    state.events.push({type: 'EXPLOSION', x: e.x, y: e.y, size: e.size});
    if (e.type === 'BOSS') { 
        state.bossActive = false; 
        state.waveCompleted = true; 
        state.events.push({type: 'WARN', msg: `BOSS DEFEATED`}); 
    }
    
    if (e.type === 'SPLITTER') {
         state.enemies.push(createEnemy('MITE', e.x + 10, e.y + 10));
         state.enemies.push(createEnemy('MITE', e.x - 10, e.y - 10));
    }
    if (e.type === 'NOVA') {
        state.events.push({type: 'EXPLOSION', x: e.x, y: e.y, size: 150, color: '#ff9900'});
        for(let pid in state.players) {
            const p = state.players[pid];
            if(Math.hypot(p.x - e.x, p.y - e.y) < 150) {
                p.hp -= 40;
                state.events.push({type: 'HIT', x: p.x, y: p.y, val: 40});
            }
        }
    }

    state.enemies.splice(index, 1);
}

