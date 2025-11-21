import state from './state.js';
import { killEnemy } from './combat.js';

export function useAbility(p, io) {
    p.cooldownTimer = p.abilityCd;
    if (p.class === 'SCOUT') {
        p.x += Math.cos(p.turretAngle) * 300; p.y += Math.sin(p.turretAngle) * 300;
        state.events.push({type: 'EFFECT', name: 'BLINK', x: p.x, y: p.y});
    } else if (p.class === 'HEAVY') {
        p.fortressTimer = 300; // 5s stationary
        state.events.push({type: 'TEXT', msg: 'FORTRESS MODE', x: p.x, y: p.y - 40, color: '#ffaa00'});
    } else if (p.class === 'SNIPER') {
        p.headshotActive = true;
        state.events.push({type: 'TEXT', msg: 'CALIBRATED', x: p.x, y: p.y - 30, color: '#ff00ff'});
    } else if (p.class === 'ASSAULT') {
        for(let i=0; i<16; i++) { const spread = (Math.random() - 0.5) * 1.2; state.bullets.push({ x: p.x, y: p.y, vx: Math.cos(p.turretAngle + spread) * 20, vy: Math.sin(p.turretAngle + spread) * 20, dmg: p.damage * 1.5, owner: p.id, life: 30, color: '#00ff00', size: 4 }); }
    } else if (p.class === 'ENGINEER') {
        state.zones.push({type: 'TURRET', x: p.x, y: p.y, life: 900, size: 15, color: '#3388ff', owner: p.id});
        state.events.push({type: 'TEXT', msg: 'SENTRY DEPLOYED', x: p.x, y: p.y - 30, color: '#3388ff'});
    } else if (p.class === 'PYRO') {
        for(let i=0; i<30; i++) { const a = (Math.PI * 2 / 30) * i; state.bullets.push({ x: p.x, y: p.y, vx: Math.cos(a) * 10, vy: Math.sin(a) * 10, dmg: p.damage * 2, owner: p.id, life: 20, color: '#ff4500', size: 8 }); }
    } else if (p.class === 'LANCER') {
        p.dashTime = 15;
    } else if (p.class === 'GHOST') {
        // Soul Reap: Dmg all nearby enemies + heal
        let hitCount = 0;
        state.enemies.forEach(e => {
             if (Math.hypot(e.x - p.x, e.y - p.y) < 300) {
                 e.hp -= 50;
                 hitCount++;
                 state.events.push({type: 'HIT', x: e.x, y: e.y, val: 50, color: '#dddddd'});
             }
        });
        p.hp = Math.min(p.maxHp, p.hp + (hitCount * 10));
        state.events.push({type: 'EFFECT', name: 'SLAM', x: p.x, y: p.y}); // Reusing slam effect for visual
        if(hitCount > 0) state.events.push({type: 'TEXT', msg: `REAP +${hitCount*10}`, x: p.x, y: p.y-20, color: '#fff'});
    } else if (p.class === 'TITAN') {
        state.events.push({type: 'EFFECT', name: 'SLAM', x: p.x, y: p.y});
        state.enemies.forEach(e => { if (Math.hypot(e.x - p.x, e.y - p.y) < 250) { e.hp -= 50; state.events.push({type: 'HIT', x: e.x, y: e.y, val: 50}); const a = Math.atan2(e.y-p.y, e.x-p.x); e.x += Math.cos(a)*100; e.y += Math.sin(a)*100; } });
        for (let i = state.enemies.length - 1; i >= 0; i--) { if(state.enemies[i].hp <= 0) killEnemy(i, p.id, io); }
    } else if (p.class === 'SUMMONER') {
        for(let i=0; i<3; i++) { const a = (Math.PI * 2 / 3) * i; state.bullets.push({ x: p.x + Math.cos(a)*50, y: p.y + Math.sin(a)*50, vx: Math.cos(a)*2, vy: Math.sin(a)*2, dmg: 10, owner: p.id, life: 600, color: '#aaff00', size: 10, sentry: true }); }
    } else if (p.class === 'BERSERKER') {
        p.rageMode = true;
        state.events.push({type: 'TEXT', msg: 'RAGE!', x: p.x, y: p.y - 40, color: '#ff0000'});
    } else if (p.class === 'CHRONOS') {
        state.globalTimeScale = -1; // Stop enemies
        state.events.push({type: 'WARN', msg: 'TIME STOPPED'});
    } else if (p.class === 'ALCHEMIST') {
        p.stimTimer = 300;
        state.events.push({type: 'EFFECT', name: 'STIM', x: p.x, y: p.y});
        for (let id in state.players) { 
            const ally = state.players[id]; 
            if (id !== p.id && Math.hypot(ally.x - p.x, ally.y - p.y) < 400) { 
                ally.stimTimer = 300; 
                state.events.push({type: 'EFFECT', name: 'STIM', x: ally.x, y: ally.y}); 
            } 
        }
    } else if (p.class === 'WARDEN') {
        state.zones.push({type: 'SANCTUARY', x: p.x, y: p.y, life: 600, size: 180, color: '#00ff88'});
    } else if (p.class === 'BARD') {
        state.enemies.forEach(e => {
            const d = Math.hypot(e.x - p.x, e.y - p.y);
            if (d < 500) {
                const a = Math.atan2(e.y - p.y, e.x - p.x);
                e.x += Math.cos(a) * 200; e.y += Math.sin(a) * 200; // Knockback
                e.freezeTimer = 60; // Stun
            }
        });
        for (let id in state.players) {
             const ally = state.players[id];
             if (Math.hypot(ally.x - p.x, ally.y - p.y) < 600) {
                 ally.hp = Math.min(ally.maxHp, ally.hp + 50);
                 state.events.push({type: 'EFFECT', name: 'HEAL', x: ally.x, y: ally.y});
             }
        }
        state.events.push({type: 'EFFECT', name: 'ANTHEM', x: p.x, y: p.y});
    } else if (p.class === 'SHADE') {
        state.enemies.forEach(e => {
            if (Math.hypot(e.x - p.x, e.y - p.y) < 500) {
                e.fearTimer = 180; // 3 seconds of fear
            }
        });
        state.events.push({type: 'EFFECT', name: 'FEAR', x: p.x, y: p.y});
    } else if (p.class === 'JUGGERNAUT') {
        p.unstoppableTimer = 300; // 5 seconds
        state.events.push({type: 'TEXT', msg: 'UNSTOPPABLE!', x: p.x, y: p.y - 40, color: '#8b4513'});
    } else if (p.class === 'ARCANIST') {
        // Spawn black hole in front of player
        const tx = p.x + Math.cos(p.turretAngle) * 400;
        const ty = p.y + Math.sin(p.turretAngle) * 400;
        state.zones.push({type: 'BLACKHOLE', x: tx, y: ty, life: 180, size: 20, color: '#000', owner: p.id});
    } else if (p.class === 'GAMBLER') {
        const roll = Math.random();
        if (roll < 0.25) {
            p.hp = Math.min(p.maxHp, p.hp + 100);
            state.events.push({type: 'TEXT', msg: 'JACKPOT! HEAL', x: p.x, y: p.y, color: '#ffd700'});
        } else if (roll < 0.5) {
            p.damage *= 2;
            setTimeout(() => p.damage /= 2, 10000);
            state.events.push({type: 'TEXT', msg: 'JACKPOT! DMG', x: p.x, y: p.y, color: '#ffd700'});
        } else if (roll < 0.75) {
            // Nuke
            state.enemies.forEach(e => { if(Math.hypot(e.x-p.x, e.y-p.y) < 800) { e.hp -= 200; state.events.push({type:'HIT', x:e.x, y:e.y, val:200}); }});
            state.events.push({type: 'EXPLOSION', x: p.x, y: p.y, size: 800});
            state.events.push({type: 'TEXT', msg: 'JACKPOT! NUKE', x: p.x, y: p.y, color: '#ffd700'});
        } else {
            p.score += 1000;
            state.events.push({type: 'TEXT', msg: 'JACKPOT! $$$', x: p.x, y: p.y, color: '#ffd700'});
        }
    } else if (p.class === 'TRAPPER') {
        state.zones.push({type: 'MINE', x: p.x, y: p.y, life: 3600, size: 30, color: '#2e8b57', owner: p.id});
        state.events.push({type: 'TEXT', msg: 'MINE SET', x: p.x, y: p.y, color: '#2e8b57'});
    } else if (p.class === 'NINJA') {
        p.invisible = true;
        state.zones.push({type: 'DECOY', x: p.x, y: p.y, life: 300, size: 20, color: '#555', owner: p.id});
        state.events.push({type: 'EFFECT', name: 'SMOKE', x: p.x, y: p.y});
    } else if (p.class === 'DRUID') {
        state.enemies.forEach(e => {
            if (Math.hypot(e.x - p.x, e.y - p.y) < 400) {
                e.freezeTimer = 180; // Root
                state.events.push({type: 'TEXT', msg: 'ROOTED', x: e.x, y: e.y - 20, color: '#228b22'});
            }
        });
        state.events.push({type: 'EFFECT', name: 'ROOTS', x: p.x, y: p.y});
    } else if (p.class === 'VOLT') {
        state.events.push({type: 'EFFECT', name: 'EMP', x: p.x, y: p.y}); // Visual
        state.enemies.forEach(e => {
            if (Math.hypot(e.x - p.x, e.y - p.y) < 600) {
                e.hp -= 40;
                e.freezeTimer = 30; // Micro stun
                state.events.push({type: 'HIT', x: e.x, y: e.y, val: 40, color: '#ffd700'});
            }
        });
    } else if (p.class === 'COMMANDER') {
        for(let i=0; i<5; i++) {
            setTimeout(() => {
                const rx = p.x + (Math.random() - 0.5) * 600;
                const ry = p.y + (Math.random() - 0.5) * 600;
                state.zones.push({type: 'MINE', x: rx, y: ry, life: 10, size: 100, color: '#ff4500', owner: p.id}); // Instant mine basically
            }, i * 200);
        }
        state.events.push({type: 'TEXT', msg: 'AIRSTRIKE!', x: p.x, y: p.y - 40, color: '#ff4500'});
    } else if (p.class === 'HUNTRESS') {
        state.enemies.forEach(e => {
            if(Math.hypot(e.x - p.x, e.y - p.y) < 600) {
                e.markedTimer = 600; // 10s mark
                state.events.push({type: 'TEXT', msg: 'MARKED', x: e.x, y: e.y - 30, color: '#8b0000'});
            }
        });
        state.events.push({type: 'EFFECT', name: 'MARK', x: p.x, y: p.y});
    } else if (p.class === 'NECROMANCER') {
         // Spawn 3 minions
         for(let i=0; i<3; i++) {
             const a = (Math.PI * 2 / 3) * i;
             state.bullets.push({ x: p.x + Math.cos(a)*40, y: p.y + Math.sin(a)*40, vx: 0, vy: 0, dmg: 15, owner: p.id, life: 900, color: '#555', size: 8, homing: true, minion: true });
         }
         state.events.push({type: 'TEXT', msg: 'ARISE', x: p.x, y: p.y - 40, color: '#222'});
    } else if (p.class === 'BEAMER') {
         p.prismTimer = 300; // 5s
         state.events.push({type: 'TEXT', msg: 'PRISM CORE', x: p.x, y: p.y - 40, color: '#00ffff'});
    } else if (p.class === 'GUNSLINGER') {
         state.enemies.forEach(e => {
             // Check if on screen (approx) - let's just check range 1000
             if(Math.hypot(e.x - p.x, e.y - p.y) < 1000) {
                 state.bullets.push({ x: p.x, y: p.y, vx: 0, vy: 0, dmg: p.damage * 2, owner: p.id, life: 60, color: '#8B4513', size: 6, homing: true }); 
                 // Instant travel logic?
                 // Actually, let's spawn a bullet that moves VERY fast towards them
                 const ang = Math.atan2(e.y - p.y, e.x - p.x);
                 state.bullets[state.bullets.length-1].vx = Math.cos(ang) * 40;
                 state.bullets[state.bullets.length-1].vy = Math.sin(ang) * 40;
                 state.events.push({type: 'TEXT', msg: 'BANG', x: p.x, y: p.y - 20, color: '#8B4513'});
             }
         });
         state.events.push({type: 'TEXT', msg: 'DEAD EYE', x: p.x, y: p.y - 40, color: '#8B4513'});
    } else if (p.class === 'SHAMAN') {
         const types = ['HEAL', 'LAVA', 'STATIC'];
         const type = types[Math.floor(Math.random() * types.length)];
         let color = '#00ff00';
         if(type === 'LAVA') color = '#ff4500';
         if(type === 'STATIC') color = '#ffff00';
         
         state.zones.push({type: 'TOTEM', subType: type, x: p.x, y: p.y, life: 600, size: 100, color: color, owner: p.id});
         state.events.push({type: 'TEXT', msg: `${type} TOTEM`, x: p.x, y: p.y - 30, color: color});
    } else if (p.class === 'PLAGUE') {
         let count = 0;
         state.enemies.forEach(e => {
             if(e.acidStacks > 0) {
                 e.hp -= e.acidStacks * 30;
                 state.events.push({type: 'HIT', x: e.x, y: e.y, val: e.acidStacks * 30, color: '#808000'});
                 state.events.push({type: 'EXPLOSION', x: e.x, y: e.y, size: 40, color: '#808000'});
                 count++;
             }
         });
         state.events.push({type: 'TEXT', msg: 'OUTBREAK', x: p.x, y: p.y - 40, color: '#808000'});
    } else if (p.class === 'RONIN') {
        for(let i=0; i<10; i++) {
            const angle = Math.random() * Math.PI * 2;
            state.bullets.push({ x: p.x, y: p.y, vx: Math.cos(angle) * 25, vy: Math.sin(angle) * 25, dmg: p.damage * 1.5, owner: p.id, life: 10, color: '#DC143C', size: 20, pierce: 5 });
        }
        state.events.push({type: 'TEXT', msg: 'OMNISLASH', x: p.x, y: p.y - 30, color: '#DC143C'});
    } else if (p.class === 'HIVE') {
        for(let i=0; i<8; i++) {
            const angle = (Math.PI * 2 / 8) * i;
            state.bullets.push({ x: p.x, y: p.y, vx: Math.cos(angle) * 10, vy: Math.sin(angle) * 10, dmg: 10, owner: p.id, life: 300, color: '#DAA520', size: 6, homing: true });
        }
        state.events.push({type: 'TEXT', msg: 'SWARM', x: p.x, y: p.y - 30, color: '#DAA520'});
    } else if (p.class === 'GRAVITY') {
        state.events.push({type: 'EFFECT', name: 'SLAM', x: p.x, y: p.y});
        state.enemies.forEach(e => {
            const dist = Math.hypot(e.x - p.x, e.y - p.y);
            if (dist < 500) {
                const angle = Math.atan2(e.y - p.y, e.x - p.x);
                e.x += Math.cos(angle) * 250;
                e.y += Math.sin(angle) * 250;
                e.hp -= 30;
                state.events.push({type: 'HIT', x: e.x, y: e.y, val: 30, color: '#4B0082'});
            }
        });
        state.events.push({type: 'TEXT', msg: 'REPULSE', x: p.x, y: p.y - 30, color: '#4B0082'});
    } else if (p.class === 'MARINE') {
        const tx = p.x + Math.cos(p.turretAngle) * 400;
        const ty = p.y + Math.sin(p.turretAngle) * 400;
        state.events.push({type: 'EXPLOSION', x: tx, y: ty, size: 200, color: '#556B2F'});
        state.enemies.forEach(e => {
            if (Math.hypot(e.x - tx, e.y - ty) < 200) {
                e.hp -= 150;
                state.events.push({type: 'HIT', x: e.x, y: e.y, val: 150, color: '#556B2F'});
            }
        });
        state.events.push({type: 'TEXT', msg: 'NUKE GRENADE', x: p.x, y: p.y - 30, color: '#556B2F'});
    } else if (p.class === 'PIRATE') {
        const angle = p.turretAngle;
        state.bullets.push({ x: p.x, y: p.y, vx: Math.cos(angle) * 15, vy: Math.sin(angle) * 15, dmg: 100, owner: p.id, life: 180, color: '#800000', size: 30, ricochet: true, pierce: 10 });
        state.events.push({type: 'TEXT', msg: 'CANNONBALL', x: p.x, y: p.y - 30, color: '#800000'});
    }
}

