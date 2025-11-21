import { ENEMY_TYPES, MAP_WIDTH, MAP_HEIGHT } from './constants.js';
import state from './state.js';

export function createEnemy(typeKey, x, y) {
    const template = ENEMY_TYPES[typeKey] || ENEMY_TYPES['DRONE'];
    const isBoss = typeKey === 'BOSS';
    
    let e = {
        id: Math.random(),
        x: x, y: y,
        type: typeKey,
        hp: template.hp * (1 + (state.wave * 0.15)),
        maxHp: template.hp * (1 + (state.wave * 0.15)),
        size: template.size || 20,
        speed: template.speed,
        angle: 0, freezeTimer: 0, acidTimer: 0, acidStacks: 0, fearTimer: 0, markedTimer: 0, gravityTimer: 0, ai: template.ai, shootTimer: 0, color: template.color,
        slowed: false,
        isMiniboss: false,
        state: 0 // for simple state machines
    };

    if (isBoss) {
        const bossTemplate = state.currentBoss;
        e.hp = bossTemplate.hp * (1 + (state.wave * 0.5));
        e.maxHp = e.hp;
        e.size = bossTemplate.size;
        e.behavior = bossTemplate.behavior;
        e.color = bossTemplate.color;
        e.speed = 2;
    } else {
        const chance = Math.min(0.2, 0.01 + (state.wave * 0.005));
        if (Math.random() < chance) {
            e.isMiniboss = true;
            e.hp *= 2.5;
            e.maxHp *= 2.5;
            e.size *= 1.5;
            e.score = (e.score || 10) * 5;
        }
    }
    return e;
}

