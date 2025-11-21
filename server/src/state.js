const state = {
    players: {},
    bullets: [],
    enemies: [],
    events: [],
    zones: [],
    frameCount: 0,
    wave: 1,
    bossActive: false,
    currentBoss: null,
    enemiesSpawnedInWave: 0,
    waveCompleted: false,
    waveTimer: 0,
    globalTimeScale: 1.0
};

export default state;

