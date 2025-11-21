import state from './state.js';
import { MAP_WIDTH, MAP_HEIGHT } from './constants.js';
import { killEnemy } from './combat.js';

export function checkCollisions(io) {
    for (let i = state.bullets.length - 1; i >= 0; i--) {
        let b = state.bullets[i];
        if (b.owner === 'enemy') {
            for (let id in state.players) {
                let p = state.players[id];
                if (p.hp > 0 && !p.pendingLevelUp && Math.hypot(b.x - p.x, b.y - p.y) < p.size + b.size) {
                    if(!p.shieldActive) {
                        if (p.dodgeChance > 0 && Math.random() < p.dodgeChance) {
                            state.events.push({type: 'TEXT', msg: 'DODGE', x: p.x, y: p.y - 20, color: '#fff'});
                        } else {
                            // Orbital Block
                            if (p.orbital) {
                                // Chance to block based on angle? 
                                // Simplified: 30% chance to block incoming projectile
                                if (Math.random() < 0.3) {
                                    state.events.push({type: 'TEXT', msg: 'BLOCKED', x: p.x, y: p.y - 20, color: '#aaaaff'});
                                    state.bullets.splice(i, 1);
                                    break;
                                }
                            }
                            p.hp -= b.dmg;
                            if (p.hp <= 0 && p.phoenix) {
                                p.hp = p.maxHp * 0.5;
                                p.phoenix = false; // One time use
                                state.events.push({type: 'TEXT', msg: 'PHOENIX!', x: p.x, y: p.y - 40, color: '#ff5500', size: 30});
                                state.events.push({type: 'EXPLOSION', x: p.x, y: p.y, size: 200, color: '#ff5500'});
                                state.enemies.forEach(near => {
                                    if(Math.hypot(near.x - p.x, near.y - p.y) < 200) {
                                        near.hp -= 100;
                                        const ang = Math.atan2(near.y - p.y, near.x - p.x);
                                        near.x += Math.cos(ang) * 150; near.y += Math.sin(ang) * 150;
                                    }
                                });
                            }
                        }
                    }
                    state.bullets.splice(i, 1);
                    break;
                }
            }
        } else {
            let hit = false;
            for (let j = state.enemies.length - 1; j >= 0; j--) {
                let e = state.enemies[j];
                if (Math.hypot(b.x - e.x, b.y - e.y) < e.size + b.size) {
                    let dmg = b.dmg;
                    if (state.players[b.owner] && state.players[b.owner].execute && e.hp < e.maxHp * 0.3) dmg *= 2;
                    if (e.markedTimer > 0) dmg *= 1.5;
                    if (state.players[b.owner] && state.players[b.owner].bossKiller && (e.type === 'BOSS' || e.isMiniboss)) dmg *= 1.5;
                    if (state.players[b.owner] && state.players[b.owner].frost) e.slowed = true;
                    if (b.wither) e.withered = true; // Needs handling in enemy update or damage calc
                    if (b.confuse && Math.random() < 0.2) e.confusedTimer = 120; 

                    if (state.players[b.owner] && state.players[b.owner].knockback > 0) {
                        const ang = Math.atan2(e.y - b.y, e.x - b.x);
                        e.x += Math.cos(ang) * state.players[b.owner].knockback;
                        e.y += Math.sin(ang) * state.players[b.owner].knockback;
                    }
                    if (state.players[b.owner] && state.players[b.owner].closeDmg && Math.hypot(b.x - state.players[b.owner].x, b.y - state.players[b.owner].y) < 400) dmg *= 1.25;
                    if (state.players[b.owner] && state.players[b.owner].farDmg && Math.hypot(b.x - state.players[b.owner].x, b.y - state.players[b.owner].y) > 700) dmg *= 1.25;
                    
                    if (state.players[b.owner] && state.players[b.owner].tesla && Math.random() < 0.2) {
                         state.enemies.forEach(near => {
                             if(near !== e && Math.hypot(near.x - e.x, near.y - e.y) < 200) {
                                 near.hp -= dmg * 0.5;
                                 state.events.push({type: 'HIT', x: near.x, y: near.y, val: Math.floor(dmg*0.5), color: '#00ffff'});
                             }
                         });
                    }

                    if (b.acid) {
                        e.acidTimer = 300; // 5 seconds
                        e.acidStacks = Math.min(10, e.acidStacks + 1);
                    }
                    
                    e.hp -= dmg;
                    state.events.push({type: 'HIT', x: e.x, y: e.y, val: Math.floor(dmg)});
                    hit = true;
                    
                    if (b.rocket) {
                        state.events.push({type: 'EXPLOSION', x: b.x, y: b.y, size: 80});
                        state.events.push({type: 'SHAKE', size: 10}); // Screen shake
                        state.enemies.forEach(near => {
                            if(near !== e && Math.hypot(near.x - b.x, near.y - b.y) < 80) {
                                near.hp -= dmg * 0.8;
                                state.events.push({type: 'HIT', x: near.x, y: near.y, val: Math.floor(dmg*0.8)});
                            }
                        });
                    }

                    if (b.cluster) {
                         state.events.push({type: 'EXPLOSION', x: b.x, y: b.y, size: 30});
                         state.events.push({type: 'SHAKE', size: 5});
                         state.enemies.forEach(near => {
                             if(near !== e && Math.hypot(near.x - b.x, near.y - b.y) < 100) {
                                 near.hp -= dmg * 0.5;
                                 state.events.push({type: 'HIT', x: near.x, y: near.y, val: Math.floor(dmg*0.5)});
                             }
                         });
                    }
                    
                    if (b.nuke) {
                        state.events.push({type: 'EXPLOSION', x: b.x, y: b.y, size: 250, color: '#ff0000'});
                        state.events.push({type: 'SHAKE', size: 50});
                        if(b.owner === 'enemy') {
                             for(let pid in state.players) {
                                 const p = state.players[pid];
                                 if(Math.hypot(p.x - b.x, p.y - b.y) < 250) {
                                     p.hp -= b.dmg;
                                     state.events.push({type: 'HIT', x: p.x, y: p.y, val: b.dmg, color: '#ff0000'});
                                 }
                             }
                        }
                    }

                    if (e.hp <= 0) killEnemy(j, b.owner, io);
                    break;
                }
            }
            if (hit) {
                 if (b.ricochet) { b.ricochet = false; b.vx *= -1; b.vy *= -1; } 
                 else if (b.pierce > 0) { b.pierce--; } // Pierce logic
                 else if (b.nuke) { /* Nuke explodes on contact, handled above */ }
                 else if (b.minion) { b.life -= 100; if(b.life <= 0) state.bullets.splice(i, 1); }
                 else if (!state.players[b.owner] || (state.players[b.owner].class !== 'SNIPER' && state.players[b.owner].class !== 'WARDEN' && state.players[b.owner].class !== 'BARD')) state.bullets.splice(i, 1);
            }
            
            if (b.nuke && b.life <= 1 && !hit) {
                 state.events.push({type: 'EXPLOSION', x: b.x, y: b.y, size: 250, color: '#ff0000'});
                 for(let pid in state.players) {
                     const p = state.players[pid];
                     if(Math.hypot(p.x - b.x, p.y - b.y) < 250) {
                         p.hp -= b.dmg;
                         state.events.push({type: 'HIT', x: p.x, y: p.y, val: b.dmg, color: '#ff0000'});
                     }
                 }
                 state.bullets.splice(i, 1);
            }
        }
    }
    for (let i = state.enemies.length - 1; i >= 0; i--) {
        let e = state.enemies[i];
        let killed = false;
        for (let id in state.players) {
            let p = state.players[id];
            if (p.hp > 0 && !p.pendingLevelUp && Math.hypot(e.x - p.x, e.y - p.y) < e.size + p.size) {
                if (p.thorns) { e.hp -= 5; state.events.push({type: 'HIT', x: e.x, y: e.y, val: 5}); }
                if (p.dashTime > 0) { 
                    let dashDmg = 20;
                    if(p.ramDmg) dashDmg = 150;
                    e.hp -= dashDmg; 
                    state.events.push({type: 'HIT', x: e.x, y: e.y, val: dashDmg}); 
                }
                if (p.unstoppableTimer > 0) { e.hp -= 50; state.events.push({type: 'HIT', x: e.x, y: e.y, val: 50}); }
                if (e.hp <= 0) { killEnemy(i, id, io); killed = true; break; }
                
                if (!p.shieldActive) {
                     if (p.dodgeChance > 0 && Math.random() < p.dodgeChance) {
                         state.events.push({type: 'TEXT', msg: 'DODGE', x: p.x, y: p.y - 20, color: '#fff'});
                     } else {
                         let dmg = 1;
                         for(let z of state.zones) {
                             if(z.type === 'SANCTUARY' && Math.hypot(p.x - z.x, p.y - z.y) < z.size) {
                                 dmg *= 0.5; 
                             }
                         }
                         if (p.unstoppableTimer > 0) dmg = 0; 
                         if (p.damageReduction > 0) dmg *= (1 - p.damageReduction);
                         p.hp -= dmg;
                         
                         if (p.hp <= 0 && p.phoenix) {
                            p.hp = p.maxHp * 0.5;
                            p.phoenix = false;
                            state.events.push({type: 'TEXT', msg: 'PHOENIX!', x: p.x, y: p.y - 40, color: '#ff5500', size: 30});
                            state.events.push({type: 'EXPLOSION', x: p.x, y: p.y, size: 200, color: '#ff5500'});
                         }

                         if (p.nova) {
                             if (!p.novaCooldown) p.novaCooldown = 0;
                             if (state.frameCount > p.novaCooldown) {
                                 state.events.push({type: 'EXPLOSION', x: p.x, y: p.y, size: 200, color: '#ffffff'});
                                 state.enemies.forEach(near => {
                                     if(Math.hypot(near.x - p.x, near.y - p.y) < 200) {
                                         const ang = Math.atan2(near.y - p.y, near.x - p.x);
                                         near.x += Math.cos(ang) * 100; near.y += Math.sin(ang) * 100;
                                         near.hp -= 50;
                                     }
                                 });
                                 p.novaCooldown = state.frameCount + 300; 
                             }
                         }
                     }
                }
                
                if (e.type === 'KAMIKAZE' || e.type === 'SWARMER') {
                    if(!p.shieldActive && p.unstoppableTimer <= 0) p.hp -= (e.type==='SWARMER'?5:20);
                    state.events.push({type: 'EXPLOSION', x: e.x, y: e.y, size: e.size*2});
                    e.hp = 0; killEnemy(i, null, io); killed = true; break;
                }
            }
        }
        if(killed) continue;
    }
}

