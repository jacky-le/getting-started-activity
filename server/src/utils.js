import { MAP_WIDTH, MAP_HEIGHT } from './constants.js';
import state from './state.js';

export function getSafeSpawn() {
    for(let i=0; i<10; i++) {
        let x = Math.random() * (MAP_WIDTH - 200) + 100;
        let y = Math.random() * (MAP_HEIGHT - 200) + 100;
        let safe = true;
        for(let e of state.enemies) {
            if (Math.hypot(e.x - x, e.y - y) < 400) { safe = false; break; }
        }
        if (safe) return {x, y};
    }
    return { x: MAP_WIDTH/2, y: MAP_HEIGHT/2 };
}

